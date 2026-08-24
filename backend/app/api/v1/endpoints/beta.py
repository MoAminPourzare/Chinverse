"""Closed-beta status, invitation redemption and tester feedback endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Query, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.core.config import settings
from app.core.phase8 import EMAIL_RE
from app.models.phase8 import BetaFeedback
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
    triage_note: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_by_user_id: Optional[int]


class BetaFeedbackUpdateIn(BaseModel):
    status: Literal["open", "triaged", "resolved", "dismissed"]
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
    feedback.triage_note = payload.triage_note
    feedback.reviewed_at = utc_now()
    feedback.reviewed_by_user_id = current_user.id
    await add_audit_event(
        db,
        event_type="beta.feedback_triaged",
        request=request,
        actor_user_id=current_user.id,
        subject=str(feedback.id),
        details={"status": payload.status, "has_note": bool(payload.triage_note)},
    )
    await db.commit()
    await db.refresh(feedback)
    return feedback
