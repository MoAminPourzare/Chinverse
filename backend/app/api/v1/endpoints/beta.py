"""Closed-beta status, invitation redemption and tester feedback endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.core.config import resolve_release_sha, settings
from app.core.phase8 import EMAIL_RE
from app.models.phase8 import BetaFeedback, BetaInvite
from app.models.security import LegalAcceptance
from app.models.user import User
from app.services.auth_security import add_audit_event, utc_now
from app.services.phase8_beta import (
    FEEDBACK_STATUSES,
    beta_decision,
    issue_beta_invite,
    revoke_beta_invite,
    redeem_beta_invite,
    submit_beta_feedback,
    accept_beta_consent,
    beta_consent_accepted,
)


router = APIRouter(prefix="/beta", tags=["beta"])
admin_router = APIRouter(prefix="/admin/beta", tags=["beta-admin"])


class BetaStatusOut(BaseModel):
    enabled: bool
    eligible: bool
    reason: str
    cohort: str
    feedback_enabled: bool
    consent_required: bool
    consent_accepted: bool
    consent_version: str


class BetaInviteRedeemIn(BaseModel):
    code: str = Field(min_length=16, max_length=80)

    @field_validator("code", mode="before")
    @classmethod
    def strip_code(cls, value: str) -> str:
        return str(value).strip()


class BetaInviteRedeemOut(BetaStatusOut):
    pass


class BetaConsentIn(BaseModel):
    version: str = Field(min_length=1, max_length=32)

    @field_validator("version", mode="before")
    @classmethod
    def strip_version(cls, value: Any) -> str:
        return str(value).strip()


class BetaFeedbackIn(BaseModel):
    kind: Literal["bug", "feedback", "feature_request", "other"]
    message: str = Field(min_length=10, max_length=5000)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    steps_to_reproduce: Optional[str] = Field(default=None, max_length=8000)
    route: Optional[str] = Field(default=None, max_length=200)
    client_metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("message", "steps_to_reproduce", "route", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> Any:
        if value is None:
            return None
        return str(value).strip()


class BetaFeedbackOut(BaseModel):
    id: int
    kind: str
    rating: Optional[int]
    message: str
    steps_to_reproduce: Optional[str]
    route: Optional[str]
    release_sha: str
    client_metadata: dict[str, Any]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BetaFeedbackAdminOut(BetaFeedbackOut):
    user_id: int
    severity: Literal["unclassified", "P0", "P1", "P2", "P3"]
    triage_note: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_by_user_id: Optional[int]


class BetaFeedbackUpdateIn(BaseModel):
    status: Literal["open", "triaged", "resolved", "dismissed"]
    severity: Optional[Literal["unclassified", "P0", "P1", "P2", "P3"]] = None
    triage_note: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("triage_note", mode="before")
    @classmethod
    def strip_note(cls, value: Any) -> Any:
        if value is None:
            return None
        return str(value).strip() or None


class BetaInviteIssueIn(BaseModel):
    email: Optional[str] = Field(default=None, max_length=254)
    ttl_days: Optional[int] = Field(default=None, ge=1, le=90)

    @field_validator("email", mode="before")
    @classmethod
    def strip_email(cls, value: Any) -> Any:
        if value is None:
            return None
        normalized = str(value).strip().casefold() or None
        if normalized and not EMAIL_RE.fullmatch(normalized):
            raise ValueError("email must be a valid address")
        return normalized


class BetaInviteIssueOut(BaseModel):
    invite_id: int
    code: str
    expires_at: datetime
    # This is intentionally explicit: the raw code is returned once and is not
    # available from a later GET or log.
    raw_code_disclosure: Literal["once"] = "once"


class BetaInviteRevokeOut(BaseModel):
    invite_id: int
    status: Literal["issued", "redeemed", "revoked", "expired"]


class BetaInviteAdminOut(BaseModel):
    """Safe invite projection for the operational beta dashboard."""

    invite_id: int
    status: Literal["issued", "redeemed", "revoked", "expired"]
    has_email_binding: bool
    expires_at: datetime
    redeemed_at: Optional[datetime]
    created_at: datetime


class BetaSummaryOut(BaseModel):
    """PII-free snapshot used by the daily beta/support check-in."""

    enabled: bool
    invite_required: bool
    rollout_percent: int
    consent_version: str
    release_sha: str
    invite_counts: dict[str, int]
    feedback_counts: dict[str, int]
    unresolved_severity_counts: dict[str, int]
    consent_count: int
    invite_total: int
    feedback_total: int
    open_feedback_count: int
    open_p0_p1_count: int
    generated_at: datetime


def _status_payload(decision, *, consent_accepted: bool) -> dict[str, Any]:
    return {
        "enabled": decision.enabled,
        "eligible": decision.eligible,
        "reason": decision.reason,
        "cohort": decision.cohort,
        "feedback_enabled": decision.enabled and decision.eligible and consent_accepted,
        "consent_required": decision.enabled and decision.eligible and not consent_accepted,
        "consent_accepted": consent_accepted,
        "consent_version": settings.BETA_CONSENT_VERSION,
    }


@router.get("/status", response_model=BetaStatusOut)
async def beta_status(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    decision = await beta_decision(db, current_user)
    return _status_payload(
        decision, consent_accepted=await beta_consent_accepted(db, current_user)
    )


@router.post(
    "/invites/redeem",
    response_model=BetaInviteRedeemOut,
    dependencies=[Depends(write_rate_limit)],
)
async def beta_redeem_invite(
    payload: BetaInviteRedeemIn,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    decision = await redeem_beta_invite(
        db, code=payload.code, user=current_user, request=request
    )
    return _status_payload(
        decision, consent_accepted=await beta_consent_accepted(db, current_user)
    )


@router.post(
    "/consent",
    response_model=BetaStatusOut,
    dependencies=[Depends(write_rate_limit)],
)
async def beta_consent(
    payload: BetaConsentIn,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    await accept_beta_consent(
        db,
        user=current_user,
        version=payload.version,
        request=request,
    )
    decision = await beta_decision(db, current_user)
    return _status_payload(decision, consent_accepted=True)


@router.post(
    "/feedback",
    response_model=BetaFeedbackOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def beta_feedback(
    payload: BetaFeedbackIn,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> BetaFeedback:
    return await submit_beta_feedback(
        db,
        user=current_user,
        request=request,
        kind=payload.kind,
        message=payload.message,
        rating=payload.rating,
        steps_to_reproduce=payload.steps_to_reproduce,
        route=payload.route,
        client_metadata=payload.client_metadata,
    )


@admin_router.post(
    "/invites",
    response_model=BetaInviteIssueOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_issue_beta_invite(
    payload: BetaInviteIssueIn,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> dict[str, Any]:
    invite, code = await issue_beta_invite(
        db,
        email=payload.email,
        issued_by_user_id=current_user.id,
        request=request,
        ttl_days=payload.ttl_days,
    )
    return {"invite_id": invite.id, "code": code, "expires_at": invite.expires_at}


@admin_router.post(
    "/invites/{invite_id}/revoke",
    response_model=BetaInviteRevokeOut,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_revoke_beta_invite(
    invite_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> dict[str, Any]:
    invite = await revoke_beta_invite(
        db,
        invite_id=invite_id,
        revoked_by_user_id=current_user.id,
        request=request,
    )
    return {"invite_id": invite.id, "status": invite.status}


@admin_router.get("/invites", response_model=list[BetaInviteAdminOut])
async def admin_list_beta_invites(
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> list[dict[str, Any]]:
    """List invite lifecycle state without exposing codes or PII."""

    result = await db.execute(
        select(BetaInvite)
        .order_by(desc(BetaInvite.created_at), desc(BetaInvite.id))
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    return [
        {
            "invite_id": invite.id,
            "status": invite.status,
            "has_email_binding": invite.email_hash is not None,
            "expires_at": invite.expires_at,
            "redeemed_at": invite.redeemed_at,
            "created_at": invite.created_at,
        }
        for invite in result.scalars().all()
    ]


@admin_router.get("/summary", response_model=BetaSummaryOut)
async def admin_beta_summary(
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin_user),
) -> dict[str, Any]:
    """Return the PII-free daily closed-beta operational snapshot."""

    invite_rows = await db.execute(
        select(BetaInvite.status, func.count(BetaInvite.id)).group_by(BetaInvite.status)
    )
    feedback_rows = await db.execute(
        select(BetaFeedback.status, func.count(BetaFeedback.id)).group_by(
            BetaFeedback.status
        )
    )
    unresolved_severity_rows = await db.execute(
        select(BetaFeedback.severity, func.count(BetaFeedback.id))
        .where(BetaFeedback.status.in_(("open", "triaged")))
        .group_by(BetaFeedback.severity)
    )
    consent_count = int(
        await db.scalar(
            select(func.count(LegalAcceptance.id)).where(
                LegalAcceptance.document_type == "beta",
                LegalAcceptance.document_version == settings.BETA_CONSENT_VERSION,
            )
        )
        or 0
    )
    invite_counts = {str(status): int(count) for status, count in invite_rows.all()}
    feedback_counts = {str(status): int(count) for status, count in feedback_rows.all()}
    unresolved_severity_counts = {
        str(severity): int(count) for severity, count in unresolved_severity_rows.all()
    }
    feedback_total = sum(feedback_counts.values())
    return {
        "enabled": settings.FEATURE_BETA_ENABLED,
        "invite_required": settings.BETA_INVITE_REQUIRED,
        "rollout_percent": settings.BETA_ROLLOUT_PERCENT,
        "consent_version": settings.BETA_CONSENT_VERSION,
        "release_sha": resolve_release_sha(settings.RELEASE_SHA),
        "invite_counts": invite_counts,
        "feedback_counts": feedback_counts,
        "unresolved_severity_counts": unresolved_severity_counts,
        "consent_count": consent_count,
        "invite_total": sum(invite_counts.values()),
        "feedback_total": feedback_total,
        "open_feedback_count": feedback_counts.get("open", 0),
        "open_p0_p1_count": unresolved_severity_counts.get(
            "P0", 0
        ) + unresolved_severity_counts.get("P1", 0),
        "generated_at": utc_now(),
    }


@admin_router.get("/feedback", response_model=list[BetaFeedbackAdminOut])
async def admin_list_beta_feedback(
    feedback_status: Optional[str] = Query(default=None, alias="status"),
    db: AsyncSession = Depends(deps.get_db),
    _current_user: User = Depends(deps.get_current_admin_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> list[BetaFeedback]:
    if feedback_status and feedback_status not in FEEDBACK_STATUSES:
        raise bad_request("Feedback status is invalid")
    query = select(BetaFeedback)
    if feedback_status:
        query = query.where(BetaFeedback.status == feedback_status)
    result = await db.execute(
        query.order_by(desc(BetaFeedback.created_at), desc(BetaFeedback.id))
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    return list(result.scalars().all())


@admin_router.patch(
    "/feedback/{feedback_id}",
    response_model=BetaFeedbackAdminOut,
    dependencies=[Depends(write_rate_limit)],
)
async def admin_update_beta_feedback(
    feedback_id: int,
    payload: BetaFeedbackUpdateIn,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> BetaFeedback:
    feedback = await db.scalar(
        select(BetaFeedback).where(BetaFeedback.id == feedback_id).with_for_update()
    )
    if not feedback:
        raise not_found("Beta feedback")
    feedback.status = payload.status
    if payload.severity is not None:
        feedback.severity = payload.severity
    feedback.triage_note = payload.triage_note
    feedback.reviewed_at = utc_now()
    feedback.reviewed_by_user_id = current_user.id
    await add_audit_event(
        db,
        event_type="beta.feedback_triaged",
        request=request,
        actor_user_id=current_user.id,
        subject=str(feedback.id),
        details={
            "status": payload.status,
            "severity": payload.severity,
            "has_note": bool(payload.triage_note),
        },
    )
    await db.commit()
    await db.refresh(feedback)
    return feedback
