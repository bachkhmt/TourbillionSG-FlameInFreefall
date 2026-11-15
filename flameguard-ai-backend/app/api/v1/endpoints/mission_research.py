from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.concurrency import run_in_threadpool

from app.api.dependencies import get_read_context
from app.api.phase4_route import Phase4Route
from app.schemas.mission_research import ResearchBriefInput, ResearchBriefRead
from app.services.errors import Phase4Error
from app.services.mission_release import load_mission_release
from app.services.mission_research import build_research_brief

router = APIRouter(prefix="/mission", tags=["mission"], route_class=Phase4Route)


@router.post("/research", response_model=ResearchBriefRead)
async def research(
    body: ResearchBriefInput,
    request: Request,
    value: Annotated[tuple, Depends(get_read_context)],
):
    settings = request.app.state.settings
    config = request.state.phase4_config
    release = await run_in_threadpool(
        load_mission_release, settings.catalog_collection_manifest, config
    )
    if body.revision and body.revision != release["revision"]:
        raise Phase4Error("COLLECTION_CHANGED", 409)
    return await run_in_threadpool(build_research_brief, release, body)
