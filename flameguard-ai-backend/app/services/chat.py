import asyncio
import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select, text

from app.integrations.chat import (
    HISTORY_CHARACTERS,
    HISTORY_MESSAGES,
    MESSAGE_CHARACTERS,
    ConversationMessage,
    CorpusPassage,
    RagRequest,
    bounded,
    select_provider,
)
from app.models import ClaimSource, EvidenceClaim, Investigation, SourceDocument, TestRun
from app.repositories.chat import ChatRepository
from app.repositories.corpus import chunk_rows
from app.schemas.api.chat import (
    Answer,
    Citation,
    Exchange,
    MessageOutput,
    MessagePage,
    SessionOutput,
)
from app.schemas.api.scenarios import EvidenceContext
from app.services.collection import admit_collection, collection_context
from app.services.corpus_policy import CorpusPolicyError, admit_passages, load_corpus_policy
from app.services.scenario_interpretation import fingerprint
from app.services.unit_of_work import read_unit_of_work

ENVELOPE = "flameguard_chat_v1"
MAX_ALLOWED_SOURCES = 50
# Standalone numbers (not parts of identifiers such as D0 or 20CAL13) and citation markers.
NUMBER = re.compile(r"(?<![\w.,])\d+(?:[.,]\d+)*(?!\w)")
CITATION_MARKER = re.compile(r"\[\d+\]")


@dataclass(frozen=True)
class ChatCorpus:
    """Admitted real corpus for one snapshot (ADR-0005)."""

    passages: tuple[CorpusPassage, ...]
    fingerprint: str
    source_revision: str
    sources: dict
    study_slugs: tuple[str, ...]


@dataclass(frozen=True)
class ChatSnapshot:
    config: dict
    sources: tuple[Citation, ...]
    oid: int
    corpus: ChatCorpus | None


def eligible(row):
    if row is None or row.created_at + timedelta(hours=24) <= datetime.now(UTC):
        raise HTTPException(404, "Session unavailable")
    return row


def session_output(row):
    return SessionOutput(
        id=row.id,
        investigation_id=row.investigation_id,
        title=row.title,
        created_at=row.created_at,
        expires_at=row.created_at + timedelta(hours=24),
    )


def validate_citations(answer, allowed, synthetic, real_corpus=False):
    if answer.origin == "synthetic" and answer.review_status != "unreviewed":
        raise HTTPException(502, "Invalid synthetic review label")
    if answer.origin == "real" and (not real_corpus or answer.review_status != "unreviewed"):
        raise HTTPException(502, "Unsupported provider evidence origin")
    if synthetic and answer.origin != "synthetic" and answer.citations:
        raise HTTPException(502, "Unsupported provider evidence origin")
    if real_corpus and answer.citations and answer.origin != "real":
        raise HTTPException(502, "Unsupported provider evidence origin")
    if answer.state != "answered" and answer.citations:
        raise HTTPException(502, "Invalid provider citations")
    if any(c not in allowed for c in answer.citations):
        raise HTTPException(502, "Invalid provider citations")
    if answer.state == "answered" and not answer.citations:
        raise HTTPException(502, "Answer requires evidence")


def verify_hits(hits, passages) -> tuple[Citation, ...]:
    """Backend check of provider retrieval: each hit is a verbatim slice of an admitted chunk."""
    by_location = {}
    for passage in passages:
        by_location.setdefault((passage.source_document_id, passage.locator), []).append(passage)
    verified = []
    try:
        for hit in hits:
            citation = Citation.model_validate(hit)
            excerpt = citation.source_excerpt
            candidates = by_location.get((citation.source_document_id, citation.source_locator))
            if (
                not candidates
                or not excerpt
                or citation.test_run_id is not None
                or not any(excerpt in passage.text for passage in candidates)
            ):
                raise ValueError
            if citation not in verified:
                verified.append(citation)
    except (TypeError, ValueError, ValidationError):
        raise HTTPException(502, "Invalid retrieval result") from None
    if len(verified) > MAX_ALLOWED_SOURCES:
        raise HTTPException(502, "Invalid retrieval result")
    return tuple(verified)


def validate_real_answer(answer, corpus_version):
    """Grounding rule for real-origin answers: same corpus, named provider, quoted numbers."""
    if answer.origin != "real":
        return
    if answer.corpus_version != corpus_version or not (answer.provider_version or "").strip():
        raise HTTPException(502, "Invalid provider provenance")
    evidence = " ".join(c.source_excerpt or "" for c in answer.citations)
    for number in NUMBER.findall(CITATION_MARKER.sub(" ", answer.text)):
        if number not in evidence:
            raise HTTPException(502, "Answer contains unsupported values")


class ChatService:
    def __init__(self, app, provider=None):
        self.app = app
        self.settings = app.state.settings
        self.runtime = app.state.runtime_database
        self.provider = provider if provider is not None else select_provider(app)

    def require_runtime(self):
        if self.runtime is None:
            raise HTTPException(503, "Runtime storage unavailable")

    async def context(self, investigation=None):
        snapshot = await self.snapshot(investigation)
        return snapshot.config, snapshot.sources, snapshot.oid

    async def snapshot(self, investigation=None, *, corpus=False) -> ChatSnapshot:
        """Admission, synthetic citation sources and (optionally) the real corpus, read in
        one REPEATABLE READ snapshot. Collections without corpusPolicy are unaffected."""
        async with self.app.state.database.session_factory() as session, read_unit_of_work(session):
            config, slugs = await admit_collection(session, self.settings, capture_content=True)
            config["phase6CollectionFingerprint"] = fingerprint(
                {
                    "version": 1,
                    "storedContent": config["phase5ContentHash"],
                    "context": EvidenceContext.model_validate(
                        collection_context(config)
                    ).model_dump(mode="json"),
                    "slugs": slugs,
                }
            )
            if config.get("admissionVersion") != 2:
                raise HTTPException(503, "Runtime admission requires v2")
            if investigation and await session.get(Investigation, investigation) is None:
                raise HTTPException(404, "Investigation unavailable")
            stmt = (
                select(ClaimSource, SourceDocument, EvidenceClaim, TestRun)
                .join(SourceDocument, ClaimSource.source_document_id == SourceDocument.id)
                .join(EvidenceClaim, ClaimSource.claim_id == EvidenceClaim.id)
                .outerjoin(TestRun, ClaimSource.test_run_id == TestRun.id)
                .order_by(ClaimSource.id)
            )
            if investigation:
                stmt = stmt.where(SourceDocument.investigation_id == investigation)
            # Only synthetic/unreviewed evidence is currently admitted. Real grounding
            # requires an accepted corpus/review policy before publication.
            citations = []
            if config["origin"] == "synthetic":
                rows = (await session.execute(stmt.limit(50))).all()
                for link, doc, _claim, run in rows:
                    if run is not None and run.investigation_id != doc.investigation_id:
                        continue
                    citations.append(
                        Citation(
                            source_document_id=doc.id,
                            source_locator=link.source_locator,
                            source_excerpt=link.source_excerpt,
                            test_run_id=link.test_run_id,
                        )
                    )
            admitted = None
            if corpus:
                admitted = await self.admitted_corpus(session, config, slugs, investigation)
            oid = await session.scalar(
                text("SELECT oid FROM pg_database WHERE datname=current_database()")
            )
            return ChatSnapshot(config, tuple(citations), oid, admitted)

    async def admitted_corpus(self, session, config, slugs, investigation):
        try:
            # Re-read and re-hash on every snapshot: the registry lives outside the database.
            policy = await asyncio.to_thread(
                load_corpus_policy, self.settings.catalog_collection_manifest, config
            )
            if policy is None:
                return None
            passages = admit_passages(await chunk_rows(session, investigation), policy)
        except CorpusPolicyError:
            raise HTTPException(503, "Source corpus policy unavailable") from None
        return ChatCorpus(
            passages=passages,
            fingerprint=fingerprint(
                {
                    "scientific": config["phase6CollectionFingerprint"],
                    "policyVersion": policy.version,
                    "registrySha256": policy.registry_sha256,
                    "sourceRevision": policy.source_revision,
                }
            ),
            source_revision=policy.source_revision,
            sources=policy.registry["sources"],
            study_slugs=tuple(sorted(set(slugs.values()))),
        )

    async def writer(self, session, oid):
        await self.runtime.validate(session)
        actual = await session.scalar(
            text("SELECT oid FROM pg_database WHERE datname=current_database()")
        )
        if actual != oid:
            raise HTTPException(503, "Runtime database identity mismatch")

    async def create(self, value):
        self.require_runtime()
        _, _, oid = await self.context(value.investigation_id)
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, oid)
            return session_output(await ChatRepository(session).add_session(value))

    async def get(self, identity):
        self.require_runtime()
        _, _, oid = await self.context()
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, oid)
            return session_output(eligible(await ChatRepository(session).session_row(identity)))

    async def project(self, repo, row):
        answer = Answer(state="answered", text=row.body)
        envelope = False
        if row.role == "assistant":
            try:
                value = json.loads(row.body)
            except ValueError:
                value = None
            if isinstance(value, dict) and value.get("format") == ENVELOPE:
                try:
                    answer = Answer.model_validate(value["answer"])
                    envelope = True
                except (ValueError, TypeError, KeyError):
                    raise HTTPException(500, "Stored response unavailable") from None
        saved = await repo.citations(row.id)
        if envelope:
            if sorted(
                (str(c.source_document_id), c.source_locator) for c in answer.citations
            ) != sorted((str(c.source_document_id), c.source_locator) for c in saved):
                raise HTTPException(500, "Stored citations unavailable")
        elif saved:
            answer = answer.model_copy(
                update={
                    "citations": tuple(
                        Citation(
                            source_document_id=c.source_document_id, source_locator=c.source_locator
                        )
                        for c in saved
                    )
                }
            )
        return MessageOutput(id=row.id, role=row.role, created_at=row.created_at, answer=answer)

    async def history(self, identity, offset, limit):
        self.require_runtime()
        _, _, oid = await self.context()
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, oid)
            repo = ChatRepository(session)
            eligible(await repo.session_row(identity))
            return MessagePage(
                items=[
                    await self.project(repo, r) for r in await repo.history(identity, offset, limit)
                ],
                offset=offset,
                limit=limit,
            )

    async def retrieve(self, retriever, question, history, corpus):
        """Run provider retrieval on detached passages under the chat deadline, then verify."""
        prior = tuple(m.text for m in history if m.role == "user")
        try:
            async with asyncio.timeout(self.settings.chat_timeout_seconds):
                hits = await asyncio.to_thread(
                    retriever, question, corpus.passages, prior, corpus.study_slugs
                )
        except TimeoutError:
            return None
        except Exception:
            raise HTTPException(502, "Retrieval unavailable") from None
        return verify_hits(hits, corpus.passages)

    async def send(self, identity, question):
        info = await self.get(identity)
        retriever = getattr(self.provider, "retrieve", None)
        retrieval = callable(retriever)
        snapshot = await self.snapshot(info.investigation_id, corpus=retrieval)
        config, context_sources, oid, corpus = (
            snapshot.config,
            snapshot.sources,
            snapshot.oid,
            snapshot.corpus,
        )
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, oid)
            repo = ChatRepository(session)
            eligible(await repo.session_row(identity))
            rows = await repo.recent(identity, HISTORY_MESSAGES + 1)
            truncated = len(rows) > HISTORY_MESSAGES
            rows = rows[-HISTORY_MESSAGES:]
            history = []
            remaining = HISTORY_CHARACTERS
            for row in reversed(rows):
                message = await self.project(repo, row)
                value = message.answer.text[: min(MESSAGE_CHARACTERS, remaining)]
                truncated = truncated or len(value) < len(message.answer.text)
                if not remaining:
                    break
                history.append(
                    ConversationMessage(
                        role=message.role,
                        text=value,
                        origin=message.answer.origin,
                        review_status=message.answer.review_status,
                    )
                )
                remaining -= len(value)
        history = tuple(reversed(history))
        real = corpus is not None
        sources = context_sources
        answer = None
        if real:
            # ADR-0005: only backend-verified retrieval hits become allowed sources.
            verified = await self.retrieve(retriever, question, history, corpus)
            if verified is None:
                answer = Answer(state="timeout", text="Provider deadline exceeded.")
            else:
                sources = verified
        elif retrieval:
            answer = Answer(
                state="unavailable",
                text="Source corpus is not configured for this collection.",
            )
        provider_request = RagRequest(
            question=question,
            history=history,
            history_truncated=truncated,
            investigation_id=info.investigation_id,
            corpus_version=corpus.fingerprint if real else config["phase5ContentHash"],
            dataset_version=corpus.source_revision if real else config["phase5DatasetVersion"],
            collection_fingerprint=(
                corpus.fingerprint if real else config["phase6CollectionFingerprint"]
            ),
            allowed_sources=sources,
        )
        if answer is None:
            try:
                answer = await bounded(
                    self.provider.answer(provider_request),
                    self.settings.chat_timeout_seconds,
                )
            except Exception:
                raise HTTPException(502, "Provider response unavailable") from None
        validate_citations(answer, sources, config["origin"] == "synthetic", real_corpus=real)
        if real:
            validate_real_answer(answer, corpus.fingerprint)
        current = await self.snapshot(info.investigation_id, corpus=real)
        if (
            current.config["phase6CollectionFingerprint"] != config["phase6CollectionFingerprint"]
            or current.sources != context_sources
            or (
                real
                and (current.corpus is None or current.corpus.fingerprint != corpus.fingerprint)
            )
        ):
            raise HTTPException(409, "Evidence changed during request")
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, oid)
            repo = ChatRepository(session)
            await repo.lock(identity)
            eligible(await repo.session_row(identity))
            user, assistant = await repo.exchange(
                identity,
                question,
                json.dumps({"format": ENVELOPE, "answer": answer.model_dump(mode="json")}),
            )
            await repo.add_citations(assistant.id, answer.citations)
            return Exchange(
                user=await self.project(repo, user), assistant=await self.project(repo, assistant)
            )
