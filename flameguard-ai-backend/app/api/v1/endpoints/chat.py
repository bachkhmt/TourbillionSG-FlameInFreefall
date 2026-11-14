from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute

from app.api.dependencies import get_scenarios
from app.integrations.chat import UnavailableProvider, bounded
from app.schemas.api.chat import (
    AdvisorOutput,
    ChatReadiness,
    ChatSourceOutput,
    Exchange,
    MessagePage,
    Question,
    SessionInput,
    SessionOutput,
)
from app.schemas.api.scenarios import PILLARS, EvaluationRequest
from app.services.advisor import evidence_gaps, require_evaluation_scope
from app.services.chat import ChatService, validate_citations
from app.services.scenarios import ScenarioService


class ChatRoute(APIRoute):
    def get_route_handler(self):
        original = super().get_route_handler()

        async def handler(request):
            try:
                response = await original(request)
                response.headers["Cache-Control"] = "no-store"
                return response
            except HTTPException as exc:
                exc.headers = {**(exc.headers or {}), "Cache-Control": "no-store"}
                raise
            except RequestValidationError:
                raise
            except Exception:
                raise HTTPException(
                    503, "Chat service unavailable", headers={"Cache-Control": "no-store"}
                ) from None

        return handler


router = APIRouter(
    tags=["chat", "advisor"],
    route_class=ChatRoute,
    responses={
        404: {"description": "Session or investigation unavailable"},
        409: {"description": "Scientific evidence changed"},
        502: {"description": "Invalid provider response or citation"},
        503: {"description": "Runtime storage or scientific collection unavailable"},
    },
)


def service(request: Request):
    return ChatService(request.app)


@router.get("/chat/readiness", response_model=ChatReadiness)
async def readiness(chat: Annotated[ChatService, Depends(service)]):
    """Reports whether a send can succeed; reasons are codes, never configuration details."""

    def not_ready(reason):
        return ChatReadiness(state="not_ready", mode="none", reasons=(reason,))

    if isinstance(chat.provider, UnavailableProvider):
        return not_ready("PROVIDER_UNAVAILABLE")
    if chat.runtime is None:
        return not_ready("RUNTIME_STORAGE_UNAVAILABLE")
    retrieval = callable(getattr(chat.provider, "retrieve", None))
    try:
        snapshot = await chat.snapshot(corpus=retrieval)
        async with chat.runtime.session_factory() as session, session.begin():
            await chat.writer(session, snapshot.oid)
    except Exception:
        return not_ready("CHAT_CONFIGURATION_UNAVAILABLE")
    version = getattr(chat.provider, "version", None)
    if retrieval:
        corpus = snapshot.corpus
        if corpus is None or not corpus.passages:
            return not_ready("CORPUS_POLICY_UNAVAILABLE")
        return ChatReadiness(
            state="ready",
            mode="retrieval_only",
            provider_version=version,
            corpus_version=corpus.fingerprint,
            source_revision=corpus.source_revision,
            passages=len(corpus.passages),
            review_status="unreviewed",
        )
    synthetic = snapshot.config.get("origin") == "synthetic"
    return ChatReadiness(
        state="ready",
        mode="provider",
        provider_version=version,
        review_status="unreviewed" if synthetic else "unknown",
    )


@router.get("/chat/sources/{source_document_id}", response_model=ChatSourceOutput)
async def cited_source(
    source_document_id: UUID,
    corpus_version: Annotated[str, Query(pattern=r"^[a-f0-9]{64}$")],
    locator: Annotated[str, Query(min_length=1, max_length=2000)],
    chat: Annotated[ChatService, Depends(service)],
):
    """Metadata of an admitted cited passage; 409 when the citation is from another corpus."""
    corpus = (await chat.snapshot(corpus=True)).corpus
    if corpus is None:
        raise HTTPException(404, "Citation source unavailable")
    if corpus_version != corpus.fingerprint:
        raise HTTPException(409, "Citation belongs to another corpus revision")
    if not any(
        p.source_document_id == source_document_id and p.locator == locator for p in corpus.passages
    ):
        raise HTTPException(404, "Citation source unavailable")
    entry = corpus.sources[str(source_document_id)]
    url = entry["sourceUrl"]
    return ChatSourceOutput(
        source_document_id=source_document_id,
        locator=locator,
        corpus_version=corpus_version,
        filename=entry["filename"],
        source_url=url if url.startswith("https://") else None,
        sha256=entry["sha256"],
        license=entry["license"],
        title=entry["title"],
    )


@router.post("/chat/sessions", response_model=SessionOutput, status_code=201)
async def create_session(value: SessionInput, chat: Annotated[ChatService, Depends(service)]):
    return await chat.create(value)


@router.get("/chat/sessions/{identity}", response_model=SessionOutput)
async def get_session(identity: UUID, chat: Annotated[ChatService, Depends(service)]):
    return await chat.get(identity)


@router.get("/chat/sessions/{identity}/messages", response_model=MessagePage)
async def history(
    identity: UUID,
    chat: Annotated[ChatService, Depends(service)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    return await chat.history(identity, offset, limit)


@router.post("/chat/sessions/{identity}/messages", response_model=Exchange, status_code=201)
async def send(identity: UUID, value: Question, chat: Annotated[ChatService, Depends(service)]):
    return await chat.send(identity, value.question)


@router.post("/advisor/assessments", response_model=AdvisorOutput)
async def advise(
    value: EvaluationRequest,
    chat: Annotated[ChatService, Depends(service)],
    scenarios: Annotated[ScenarioService, Depends(get_scenarios)],
):
    evaluation = await scenarios.evaluate(value)
    config, sources, _ = await chat.context()
    require_evaluation_scope(evaluation, config)
    groups = {g.pillar: g for g in evaluation.pillar_evidence.groups or ()}
    answers = {}
    gaps = {}
    for pillar in PILLARS:
        group = groups.get(pillar)
        evidence = {
            "group": group.model_dump(mode="json") if group else None,
            "pagination": evaluation.pillar_evidence.page.model_dump(mode="json")
            if evaluation.pillar_evidence.page
            else None,
            "reason_codes": evaluation.pillar_evidence.reason_codes,
            "scope": evaluation.scope.model_dump(mode="json"),
        }
        answer = await bounded(
            chat.provider.advise(evaluation.scenario.model_dump(mode="json"), evidence),
            chat.settings.chat_timeout_seconds,
        )
        allowed = tuple(
            c
            for c in sources
            if group
            and any(
                c.source_document_id == i.document.source_document_id
                and c.source_locator == i.source_locator
                and c.source_excerpt == i.source_excerpt
                and c.test_run_id == i.test_run_id
                for i in group.items
            )
        )
        validate_citations(answer, allowed, config["origin"] == "synthetic")
        answers[pillar] = answer
        gaps[pillar] = evidence_gaps(evaluation.pillar_evidence, group, answer)
    current, _, _ = await chat.context()
    require_evaluation_scope(evaluation, current)
    return AdvisorOutput(
        pillars=answers, gaps=gaps, context=evaluation.context.model_dump(mode="json")
    )
