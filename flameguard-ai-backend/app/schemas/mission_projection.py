from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PublicProjection(BaseModel):
    """Explicit core contract, preserving source-specific scientific metadata."""

    model_config = ConfigDict(extra="allow", allow_inf_nan=False)


class ScenarioInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    revision: str | None = None
    oxygenPct: float = Field(default=21, ge=0, le=100)
    oxygenBasis: Literal["volume_percent", "mole_percent"] = "volume_percent"
    pressurePsi: float = Field(default=14.7, gt=0, le=100)
    gravityG: float = Field(default=0, ge=0, le=1)
    airflowCmS: float = Field(default=5, ge=0, le=100)
    material: str = Field(default="PMMA", min_length=1, max_length=100)
    pillar: Literal["all", "prevention", "detection", "suppression"] = "all"
    missionContext: Literal["custom", "iss", "spacecraft", "lunar", "mars", "rover"] = "custom"


class SourceRead(PublicProjection):
    id: str
    investigationId: str
    filename: str
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    fileVersion: int
    studyVersion: int
    sourceUrl: str
    license: str
    kind: str
    byteCount: int
    status: str
    doi: str | None = None
    contentType: str | None = None


class ObservationRead(PublicProjection):
    name: str
    raw: str
    value: float | None
    unit: str | None
    originalUnit: str
    sourceId: str
    locator: str
    status: str
