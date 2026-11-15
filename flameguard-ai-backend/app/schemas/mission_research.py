"""Additive workspace contract; explicit targets never inherit scenario defaults."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.mission_projection import ObservationRead, SourceRead

WorkflowId = Literal["prevention", "detection", "suppression"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, str_strip_whitespace=True)


class BriefScenarioInput(StrictModel):
    oxygenPct: float = Field(ge=0, le=100)
    oxygenBasis: Literal["volume_percent", "mole_percent"]
    pressurePsi: float = Field(gt=0, le=100)
    gravityG: float = Field(ge=0, le=1)
    airflowCmS: float = Field(ge=0, le=100)
    material: str = Field(min_length=1, max_length=100)


class ResearchBriefInput(StrictModel):
    revision: str | None = Field(default=None, min_length=1, max_length=128)
    workflowId: WorkflowId
    question: str = Field(min_length=2, max_length=500)
    scenario: BriefScenarioInput | None = None


class BriefCitation(StrictModel):
    id: str
    source: SourceRead
    locator: str


class BriefPassage(StrictModel):
    text: str
    citationId: str
    kind: Literal["purpose", "context", "objective"]


class BriefDimension(StrictModel):
    dimension: Literal["oxygen", "pressure", "airflow", "gravity", "material"]
    status: Literal["match", "related", "mismatch", "unknown"]
    target: float | str
    observed: float | str | None
    unit: str | None = None
    basis: str | None = None
    tolerance: float | None = None
    reason: str
    citationId: str | None = None


class BriefObservation(ObservationRead):
    citationId: str


class BriefRecord(StrictModel):
    id: str
    externalRunKey: str
    citationId: str
    recordKind: str
    observations: list[BriefObservation]
    issues: list[str]


class BriefAvailability(StrictModel):
    records: int
    documents: int
    excludedRecords: int
    independentlyReviewedRecords: int | None


class BriefRow(StrictModel):
    investigationId: str
    code: str
    title: str
    purpose: WorkflowId
    selectionReason: str
    passages: list[BriefPassage]
    availability: BriefAvailability
    conditionStatus: Literal["not_requested", "no_records", "partial", "exact"]
    dimensions: list[BriefDimension]
    record: BriefRecord | None
    limitations: list[str]


class ResearchBriefRead(StrictModel):
    revision: str
    engineVersion: str
    workflowId: WorkflowId
    question: str
    scenario: BriefScenarioInput | None
    method: list[str]
    rows: list[BriefRow]
    citations: list[BriefCitation]
    limitations: list[str]
    nextSteps: list[str]
