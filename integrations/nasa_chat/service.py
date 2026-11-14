import asyncio
import json
import re
from dataclasses import dataclass

from app.integrations.chat import (
    HISTORY_CHARACTERS,
    HISTORY_MESSAGES,
    MESSAGE_CHARACTERS,
    ConversationMessage,
    RagRequest,
    UnavailableProvider,
    bounded,
)
from app.models import DocumentChunk, Investigation, SourceDocument
from app.repositories.chat import ChatRepository
from app.schemas.api.chat import Answer, Exchange
from app.schemas.api.scenarios import EvidenceContext
from app.services.chat import ENVELOPE, ChatService, eligible
from app.services.collection import admit_collection, collection_context
from app.services.scenario_interpretation import fingerprint
from app.services.unit_of_work import read_unit_of_work
from fastapi import HTTPException
from sqlalchemy import select, text

from .policy import VERSION, digest, load_policy
from .provider import VERSION as PROVIDER_VERSION
from .provider import ExtractiveProvider
from .retrieval import Passage, select_passages


@dataclass(frozen=True)
class Corpus:
    config: dict
    registry: dict
    oid: int
    passages: tuple[Passage, ...]
    study_slugs: tuple[str, ...]


class RealNasaChatService(ChatService):
    """Explicit opt-in real/extractive policy, outside the immutable remote source.

    The inherited provider stays unavailable for Advisor; only send uses the
    extractive adapter. No synthetic fallback or upstream validator monkeypatch.
    """

    def __init__(self, app):
        super().__init__(app, provider=UnavailableProvider())

    async def read_context(self, investigation=None):
        async with (
            self.app.state.database.session_factory() as session,
            read_unit_of_work(session),
        ):
            config, slugs = await admit_collection(session, self.settings, capture_content=True)
            if config.get("admissionVersion") != 2:
                raise HTTPException(503, "Runtime admission requires v2")
            registry, registry_hash = await asyncio.to_thread(
                load_policy, self.settings.catalog_collection_manifest, config
            )
            if investigation and await session.get(Investigation, investigation) is None:
                raise HTTPException(404, "Investigation unavailable")
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
            config["nasaChatFingerprint"] = fingerprint(
                {
                    "scientific": config["phase6CollectionFingerprint"],
                    "policyVersion": VERSION,
                    "registryHash": registry_hash,
                    "sourceRevision": registry["sourceRevision"],
                }
            )
            stmt = (
                select(DocumentChunk, SourceDocument)
                .join(
                    SourceDocument,
                    DocumentChunk.source_document_id == SourceDocument.id,
                )
                .order_by(DocumentChunk.id)
            )
            if investigation:
                stmt = stmt.where(SourceDocument.investigation_id == investigation)
            passages = []
            for chunk, source in (await session.execute(stmt)).all():
                registered = registry["sources"].get(str(source.id))
                expected = registry["chunks"].get(str(chunk.id))
                if registered is None:
                    continue
                if (
                    registered["license"] != "CC0-1.0"
                    or not re.fullmatch(r"[a-f0-9]{64}", registered["sha256"])
                    or source.ingestion_status != "source_checked"
                    or source.version != registered["version"]
                    or not source.version.endswith(f"/sha256:{registered['sha256']}")
                    or source.source_url != registered["sourceUrl"]
                    or str(source.investigation_id) != registered["investigationId"]
                ):
                    raise HTTPException(503, "Source registry conflicts with admitted data")
                if (
                    not expected
                    or expected["sourceId"] != str(source.id)
                    or expected["locator"] != chunk.source_locator
                    or expected["textSha256"] != digest(chunk.chunk_text.encode())
                ):
                    raise HTTPException(503, "Chunk registry conflicts with admitted data")
                passages.append(
                    Passage(
                        chunk.id,
                        source.id,
                        source.investigation_id,
                        registered["slug"],
                        registered["title"],
                        chunk.source_locator,
                        chunk.chunk_text,
                    )
                )
            oid = await session.scalar(
                text("SELECT oid FROM pg_database WHERE datname=current_database()")
            )
            return Corpus(config, registry, oid, tuple(passages), tuple(slugs.values()))

    async def context(self, investigation=None):
        corpus = await self.read_context(investigation)
        return corpus.config, (), corpus.oid

    async def send(self, identity, question):
        self.require_runtime()
        initial = await self.read_context()
        async with self.runtime.session_factory() as session, session.begin():
            await self.writer(session, initial.oid)
            await session.execute(text("SET LOCAL lock_timeout = '5s'"))
            repo = ChatRepository(session)
            await repo.lock(identity)
            info = eligible(await repo.session_row(identity))
            rows = await repo.recent(identity, HISTORY_MESSAGES + 1)
            truncated = len(rows) > HISTORY_MESSAGES
            history = []
            remaining = HISTORY_CHARACTERS
            for row in reversed(rows[-HISTORY_MESSAGES:]):
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
            corpus = await self.read_context(info.investigation_id)
            if corpus.oid != initial.oid:
                raise HTTPException(409, "Evidence database changed")
            hits = await asyncio.to_thread(
                select_passages,
                question,
                corpus.passages,
                tuple(m.text for m in history if m.role == "user"),
                corpus.study_slugs,
            )
            request = RagRequest(
                question=question,
                history=history,
                history_truncated=truncated,
                investigation_id=info.investigation_id,
                corpus_version=corpus.config["nasaChatFingerprint"],
                dataset_version=corpus.registry["sourceRevision"],
                collection_fingerprint=corpus.config["nasaChatFingerprint"],
                allowed_sources=tuple(h.citation for h in hits),
            )
            factory = getattr(self.app.state, "nasa_chat_provider_factory", ExtractiveProvider)
            try:
                answer = await bounded(
                    factory().answer(request), self.settings.chat_timeout_seconds
                )
            except Exception:
                raise HTTPException(502, "Evidence provider unavailable") from None
            if (
                answer.state == "timeout"
                and not answer.citations
                and answer.text == "Provider deadline exceeded."
            ):
                answer = Answer(
                    state="timeout",
                    text="Provider deadline exceeded.",
                    origin="real",
                    review_status="unreviewed",
                    provider_version=PROVIDER_VERSION,
                    corpus_version=request.corpus_version,
                )
            elif answer != await ExtractiveProvider().answer(request):
                raise HTTPException(502, "Invalid extractive response or citation")
            try:
                current = await self.read_context(info.investigation_id)
            except Exception:
                raise HTTPException(
                    409, "Evidence or rights policy changed during request"
                ) from None
            if (
                current.oid != corpus.oid
                or current.config["nasaChatFingerprint"] != corpus.config["nasaChatFingerprint"]
            ):
                raise HTTPException(409, "Evidence or rights policy changed during request")
            eligible(await repo.session_row(identity))
            user, assistant = await repo.exchange(
                identity,
                question,
                json.dumps({"format": ENVELOPE, "answer": answer.model_dump(mode="json")}),
            )
            await repo.add_citations(assistant.id, answer.citations)
            return Exchange(
                user=await self.project(repo, user),
                assistant=await self.project(repo, assistant),
            )
