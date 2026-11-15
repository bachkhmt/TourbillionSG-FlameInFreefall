from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.api.dependencies import get_catalog, get_descriptive
from app.api.phase4_route import Phase4Route
from app.schemas.api import models as dto
from app.schemas.api.descriptive import Descriptive, DescriptiveQuery, StudyOverview
from app.schemas.api.queries import CatalogQuery, PageQuery
from app.services.catalog import CatalogService
from app.services.descriptive import DescriptiveService

router = APIRouter(route_class=Phase4Route, tags=["phase4"])
ERRORS = {n: {"model": dto.Error} for n in (404, 422, 503, 500)}


@router.get(
    "/catalog/capabilities",
    response_model=dto.Capabilities,
    responses=ERRORS,
    operation_id="getCatalogCapabilities",
)
async def getCatalogCapabilities(service: Annotated[CatalogService, Depends(get_catalog)]):
    return service.capabilities()


@router.get(
    "/investigations",
    response_model=dto.InvestigationPage,
    responses=ERRORS,
    operation_id="listInvestigations",
)
async def listInvestigations(
    query: Annotated[CatalogQuery, Query()],
    service: Annotated[CatalogService, Depends(get_catalog)],
):
    return await service.investigations(query)


@router.get(
    "/investigations/by-slug/{slug}",
    response_model=dto.InvestigationDetail,
    responses=ERRORS,
    operation_id="getInvestigationBySlug",
)
async def getInvestigationBySlug(
    slug: str, service: Annotated[CatalogService, Depends(get_catalog)]
):
    return await service.by_slug(slug)


@router.get(
    "/investigations/{investigationId}",
    response_model=dto.InvestigationDetail,
    responses=ERRORS,
    operation_id="getInvestigation",
)
async def getInvestigation(
    investigationId: UUID, service: Annotated[CatalogService, Depends(get_catalog)]
):
    return await service.detail(investigationId)


@router.get(
    "/investigations/{investigationId}/tags",
    response_model=dto.TagPage,
    responses=ERRORS,
    operation_id="listInvestigationTags",
)
async def listInvestigationTags(
    investigationId: UUID,
    query: Annotated[PageQuery, Query()],
    service: Annotated[CatalogService, Depends(get_catalog)],
):
    return await service.tags(investigationId, query)


@router.get(
    "/catalog/descriptive",
    response_model=Descriptive,
    responses=ERRORS,
    operation_id="getCatalogDescriptive",
)
async def getCatalogDescriptive(
    query: Annotated[DescriptiveQuery, Query()],
    service: Annotated[DescriptiveService, Depends(get_descriptive)],
):
    return await service.descriptive(query)


@router.get(
    "/investigations/{investigationId}/overview",
    response_model=StudyOverview,
    responses=ERRORS,
    operation_id="getInvestigationOverview",
)
async def getInvestigationOverview(
    investigationId: UUID,
    request: Request,
    service: Annotated[DescriptiveService, Depends(get_descriptive)],
):
    return await service.overview(investigationId, request.app.state.settings)
