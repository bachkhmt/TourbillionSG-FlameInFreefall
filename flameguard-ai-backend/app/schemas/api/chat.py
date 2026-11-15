from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChatInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @field_validator("*", mode="before")
    @classmethod
    def reject_nul(cls, value):
        if isinstance(value, str) and "\x00" in value:
            raise ValueError("NUL characters are unsupported")
        return value


class SessionInput(ChatInput):
    investigation_id: UUID | None = None
    title: str | None = Field(default=None, max_length=200)


class Question(ChatInput):
    question: str = Field(min_length=1, max_length=4000, pattern=r"\S")
    # Optional answer-framing language; omitted/null keeps per-question detection.
    language: Literal["en", "vi"] | None = None


class SessionOutput(BaseModel):
    id: UUID
    investigation_id: UUID | None
    title: str | None
    created_at: datetime
    expires_at: datetime
    privacy: str = (
        "Public research demo. Session ID holders can access history for 24 hours. "
        "Rows are retained pending operator cleanup."
    )


class Citation(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    source_document_id: UUID
    source_locator: str = Field(min_length=1, max_length=2000)
    source_excerpt: str | None = None
    test_run_id: UUID | None = None


class Answer(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)
    state: Literal["answered", "abstained", "unavailable", "timeout"]
    text: str
    origin: Literal["synthetic", "unknown", "real"] = "unknown"
    review_status: Literal["unreviewed", "unknown"] = "unknown"
    provider_version: str | None = None
    model_version: str | None = None
    corpus_version: str | None = None
    citations: tuple[Citation, ...] = Field(default=(), max_length=50)


class MessageOutput(BaseModel):
    id: UUID
    role: str
    created_at: datetime
    answer: Answer


class MessagePage(BaseModel):
    items: list[MessageOutput]
    offset: int
    limit: int


class Exchange(BaseModel):
    user: MessageOutput
    assistant: MessageOutput


class AdvisorOutput(BaseModel):
    pillars: dict[str, Answer]
    gaps: dict[str, tuple[str, ...]]
    context: dict


class ChatReadiness(BaseModel):
    """Whether sending can currently succeed, without exposing configuration details."""

    state: Literal["ready", "not_ready"]
    mode: Literal["retrieval_only", "provider", "none"]
    provider_version: str | None = None
    corpus_version: str | None = None
    source_revision: str | None = None
    passages: int | None = None
    review_status: Literal["unreviewed", "unknown"] = "unknown"
    reasons: tuple[str, ...] = ()


class ChatSourceOutput(BaseModel):
    """Registry metadata of an admitted cited passage, pinned to one corpus version."""

    source_document_id: UUID
    locator: str
    corpus_version: str
    filename: str
    source_url: str | None = Field(description="Original file link; only https URLs are returned")
    sha256: str
    license: str
    title: str
    investigation_id: UUID | None = None
    source_scope: Literal["investigation", "challenge"] = "investigation"
    review_status: Literal["unreviewed"] = "unreviewed"


class ChallengeResourceOutput(BaseModel):
    source_document_id: UUID
    resource_id: str
    title: str
    source_url: str
    source_scope: Literal["challenge"] = "challenge"
    investigation_id: None = None
    license: str
    status: str
    indexed: bool


class ChallengeResourcePage(BaseModel):
    corpus_version: str
    items: list[ChallengeResourceOutput]
