"""Additive descriptive navigation contracts; no scientific matching scores."""

from typing import Literal
from uuid import UUID

from .models import ApiModel, Context
from .queries import SelectionQuery


class DescriptiveQuery(SelectionQuery):
    investigation_id: UUID | None = None


class CountBin(ApiModel):
    label: str
    count: int


class StudyCount(ApiModel):
    investigation_id: UUID
    psi_id: str
    slug: str | None
    title: str
    count: int


class ConditionPoint(ApiModel):
    run_id: UUID
    investigation_id: UUID
    slug: str | None
    oxygen_pct: str
    oxygen_basis: Literal["mole_percent", "volume_percent"]
    pressure_psi: str
    pressure_unit: Literal["psia"] = "psia"
    oxygen_meaning: Literal["chamber", "burner_oxidizer_stream", "unknown"]


class Descriptive(ApiModel):
    selection: dict[str, str]
    selection_semantics: str
    investigation_count: int
    record_count: int
    investigation_distribution: list[StudyCount]
    material_distribution: list[CountBin]
    gravity_distribution: list[CountBin]
    missing_material: int
    missing_gravity: int
    missing_oxygen: int
    missing_pressure: int
    oxygen_record_count: int
    incompatible_conditions: int
    condition_points: list[ConditionPoint]
    platforms: list[str]
    gravities: list[str]
    context: Context


class OverviewPassage(ApiModel):
    source_document_id: UUID
    source_url: str
    locator: str
    text: str
    section: Literal["objective", "approach", "researchImpacts", "catalog"]


class StudyOverview(ApiModel):
    investigation_id: UUID
    source_revision: str
    passages: list[OverviewPassage]
    context: Context
