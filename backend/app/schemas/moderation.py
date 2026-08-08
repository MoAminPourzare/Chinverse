from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_REPORT_TARGETS = {
    "user",
    "post",
    "comment",
    "question",
    "answer",
    "article",
    "article_comment",
    "gallery",
    "service",
    "message",
}
ALLOWED_REPORT_REASONS = {
    "spam",
    "harassment",
    "hate",
    "impersonation",
    "fraud",
    "privacy",
    "illegal",
    "other",
}


class BlockRead(BaseModel):
    blocked_user_id: int
    created_at: datetime


class ReportCreate(BaseModel):
    target_type: str = Field(min_length=1, max_length=40)
    target_id: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=40)
    details: str | None = Field(default=None, max_length=2000)

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_REPORT_TARGETS:
            raise ValueError("Unsupported report target")
        return normalized

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_REPORT_REASONS:
            raise ValueError("Unsupported report reason")
        return normalized


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int | None
    target_type: str
    target_id: int
    reason: str
    details: str | None
    status: str
    resolution: str | None
    assigned_to: int | None
    created_at: datetime
    resolved_at: datetime | None


class ModerationResolve(BaseModel):
    action: str = Field(min_length=1, max_length=40)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("action")
    @classmethod
    def validate_action(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"dismiss", "resolve", "warn", "remove", "suspend_user"}:
            raise ValueError("Unsupported moderation action")
        return normalized
