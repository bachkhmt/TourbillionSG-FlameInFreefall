from typing import Annotated
from uuid import UUID

from app.api.v1.endpoints.chat import ChatRoute
from app.api.v1.endpoints.chat import service as upstream_chat_service
from app.core.config import Settings
from app.integrations.chat import UnavailableProvider
from app.main import create_app as upstream_create_app
from app.services.chat import ChatService
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError

from .provider import VERSION
from .service import RealNasaChatService


def create_app(settings: Settings | None = None):
    application = upstream_create_app(settings)
    prefix = application.state.settings.api_v1_prefix
    router = APIRouter(prefix=prefix, tags=["nasa-chat"], route_class=ChatRoute)

    def service(request: Request):
        return RealNasaChatService(request.app)

    def chat_dependency(request: Request):
        if request.url.path == f"{prefix}/advisor/assessments":
            return ChatService(request.app, provider=UnavailableProvider())
        return service(request)

    application.dependency_overrides[upstream_chat_service] = chat_dependency

    @application.exception_handler(RequestValidationError)
    async def invalid_request(request, exc):
        response = await request_validation_exception_handler(request, exc)
        if request.url.path.startswith(f"{prefix}/chat/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @router.get("/chat/readiness")
    async def readiness(request: Request):
        chat = service(request)
        try:
            chat.require_runtime()
            corpus = await chat.read_context()
            async with chat.runtime.session_factory() as session, session.begin():
                await chat.writer(session, corpus.oid)
            if not corpus.passages:
                raise HTTPException(503, "Chat corpus empty")
            return {
                "state": "ready",
                "mode": "retrieval_only",
                "providerVersion": VERSION,
                "corpusVersion": corpus.config["nasaChatFingerprint"],
                "sourceRevision": corpus.registry["sourceRevision"],
                "passages": len(corpus.passages),
                "reviewStatus": "unreviewed",
                "reasons": [],
            }
        except Exception:
            return {
                "state": "not_ready",
                "mode": "retrieval_only",
                "reasons": ["CHAT_CONFIGURATION_UNAVAILABLE"],
            }

    @router.get("/chat/sources/{source_id}")
    async def cited_source(
        request: Request,
        source_id: UUID,
        corpus_version: Annotated[str, Query(pattern=r"^[a-f0-9]{64}$")],
        locator: Annotated[str, Query(min_length=1, max_length=2000)],
    ):
        corpus = await service(request).read_context()
        if corpus_version != corpus.config["nasaChatFingerprint"]:
            raise HTTPException(409, "Citation belongs to another corpus revision")
        if not any(p.source_id == source_id and p.locator == locator for p in corpus.passages):
            raise HTTPException(404, "Citation source unavailable")
        source = corpus.registry["sources"][str(source_id)]
        return {
            **source,
            "sourceId": str(source_id),
            "locator": locator,
            "corpusVersion": corpus_version,
            "reviewStatus": "unreviewed",
        }

    application.include_router(router)
    return application
