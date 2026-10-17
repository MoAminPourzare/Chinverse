"""Closed-beta access, feedback persistence and payment callback primitives."""

from __future__ import annotations

from datetime import timedelta
import hashlib
from typing import Any, Mapping

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import bad_request, forbidden, not_found
from app.core.config import resolve_release_sha, settings
from app.core.phase8 import (
    BetaDecision,
    evaluate_beta_access,
    generate_invite_code,
    hash_invite_code,
    normalize_email,
    normalize_invite_code,
    parse_email_allowlist,
    verify_webhook_signature,
)
from app.models.phase8 import BetaFeedback, BetaInvite, PaymentWebhookEvent
from app.models.security import LegalAcceptance
from app.models.user import User
from app.services.auth_security import add_audit_event, request_fingerprints, utc_now


CLIENT_METADATA_KEYS = {
    "platform",
    "browser",
    "browser_version",
    "os",
    "os_version",
    "screen_width",
    "screen_height",
    "standalone",
    "network",
    "locale",
    "timezone",
}
FEEDBACK_KINDS = {"bug", "feedback", "feature_request", "other"}
FEEDBACK_STATUSES = {"open", "triaged", "resolved", "dismissed"}


def _invite_secret() -> str:
    return settings.BETA_INVITE_HASH_SECRET.strip()


def _email_hash(email: str | None) -> str | None:
    normalized = normalize_email(email)
    secret = _invite_secret()
    if not normalized or not secret:
        return None
    return hashlib.sha256(f"{secret}:{normalized}".encode("utf-8")).hexdigest()


def sanitize_client_metadata(value: Mapping[str, Any] | None) -> dict[str, Any]:
    """Keep only bounded diagnostics; never store arbitrary client JSON."""

    if not isinstance(value, Mapping):
        return {}
    sanitized: dict[str, Any] = {}
    for key in CLIENT_METADATA_KEYS:
        raw = value.get(key)
        if isinstance(raw, bool):
            sanitized[key] = raw
        elif isinstance(raw, int) and not isinstance(raw, bool):
            sanitized[key] = max(-100_000, min(raw, 100_000))
        elif isinstance(raw, str):
            text = raw.strip()
            if text:
                sanitized[key] = text[:120]
    return sanitized


async def beta_decision(db: AsyncSession, user: User) -> BetaDecision:
    """Evaluate settings plus a currently redeemed, unexpired invite."""

    if not settings.FEATURE_BETA_ENABLED:
        return evaluate_beta_access(
            enabled=False,
            invite_required=settings.BETA_INVITE_REQUIRED,
            email=user.email,
            subject=user.id,
        )

    now = utc_now()
    invite = await db.scalar(
        select(BetaInvite.id)
        .where(
            BetaInvite.redeemed_by_user_id == user.id,
            BetaInvite.status == "redeemed",
            BetaInvite.expires_at > now,
        )
        .limit(1)
    )
    return evaluate_beta_access(
        enabled=settings.FEATURE_BETA_ENABLED,
        invite_required=settings.BETA_INVITE_REQUIRED,
        email=user.email,
        subject=user.id,
        allowlist=parse_email_allowlist(settings.BETA_ALLOWED_EMAILS),
        rollout_percent=settings.BETA_ROLLOUT_PERCENT,
        invite_redeemed=invite is not None,
    )


async def beta_consent_accepted(db: AsyncSession, user: User) -> bool:
    """Return whether the user accepted the exact active beta terms version."""

    if not settings.FEATURE_BETA_ENABLED:
        return False
    acceptance_id = await db.scalar(
        select(LegalAcceptance.id)
        .where(
            LegalAcceptance.user_id == user.id,
            LegalAcceptance.document_type == "beta",
            LegalAcceptance.document_version == settings.BETA_CONSENT_VERSION,
        )
        .limit(1)
    )
    return acceptance_id is not None


async def accept_beta_consent(
    db: AsyncSession,
    *,
    user: User,
    version: str,
    request: Request,
) -> bool:
    if not settings.FEATURE_BETA_ENABLED:
        raise forbidden("Closed beta is not enabled")
    normalized_version = version.strip()
    if normalized_version != settings.BETA_CONSENT_VERSION:
        raise bad_request("Beta consent version is not current")
    decision = await beta_decision(db, user)
    if not decision.eligible:
        raise forbidden("Beta consent is available only to eligible testers")

    ip_hash, user_agent_hash = request_fingerprints(request)
    acceptance_insert = await db.execute(
        pg_insert(LegalAcceptance)
        .values(
            user_id=user.id,
            document_type="beta",
            document_version=normalized_version,
            accepted_at=utc_now(),
            ip_hash=ip_hash,
            user_agent_hash=user_agent_hash,
        )
        .on_conflict_do_nothing(
            index_elements=["user_id", "document_type", "document_version"]
        )
        .returning(LegalAcceptance.id)
    )
    if acceptance_insert.scalar_one_or_none() is None:
        await db.commit()
        return True
    await add_audit_event(
        db,
        event_type="beta.consent_accepted",
        request=request,
        actor_user_id=user.id,
        subject=normalized_version,
        details={"document_type": "beta"},
    )
    await db.commit()
    return True


async def issue_beta_invite(
    db: AsyncSession,
    *,
    email: str | None,
    issued_by_user_id: int,
    request: Request,
    ttl_days: int | None = None,
) -> tuple[BetaInvite, str]:
    secret = _invite_secret()
    if len(secret) < 32:
        raise forbidden("Beta invite issuance is not configured")

    code = generate_invite_code()
    digest = hash_invite_code(code, secret)
    if not digest:
        raise bad_request("Could not create beta invite")
    bounded_ttl = max(1, min(int(ttl_days or settings.BETA_INVITE_TTL_DAYS), 90))
    invite = BetaInvite(
        code_hash=digest,
        email_hash=_email_hash(email),
        expires_at=utc_now() + timedelta(days=bounded_ttl),
        issued_by_user_id=issued_by_user_id,
    )
    db.add(invite)
    await db.flush()
    await add_audit_event(
        db,
        event_type="beta.invite_issued",
        request=request,
        actor_user_id=issued_by_user_id,
        subject=str(invite.id),
        details={"has_email_binding": bool(invite.email_hash), "ttl_days": bounded_ttl},
    )
    await db.commit()
    await db.refresh(invite)
    return invite, code


async def revoke_beta_invite(
    db: AsyncSession,
    *,
    invite_id: int,
    revoked_by_user_id: int,
    request: Request,
) -> BetaInvite:
    """Revoke an issued/redeemed invite without exposing its raw code.

    Revocation is idempotent.  An already expired invite remains ``expired``
    for audit accuracy, while an issued or redeemed invite becomes unusable
    immediately.  Eligibility is re-evaluated from the invite status on every
    beta request, so no cache invalidation or user notification is required.
    """

    invite = await db.scalar(
        select(BetaInvite).where(BetaInvite.id == invite_id).with_for_update()
    )
    if invite is None:
        raise not_found("Beta invite")

    previous_status = invite.status
    if previous_status in {"issued", "redeemed"}:
        invite.status = "revoked"
        await add_audit_event(
            db,
            event_type="beta.invite_revoked",
            request=request,
            actor_user_id=revoked_by_user_id,
            subject=str(invite.id),
            details={"previous_status": previous_status},
        )
        await db.commit()
        await db.refresh(invite)
        return invite

    # Repeating a revoke on an already terminal invite is safe and does not
    # create noisy audit rows or resurrect an expired code.
    await db.commit()
    return invite


async def redeem_beta_invite(
    db: AsyncSession,
    *,
    code: str,
    user: User,
    request: Request,
) -> BetaDecision:
    if not settings.FEATURE_BETA_ENABLED:
        raise forbidden("Closed beta is not enabled")
    secret = _invite_secret()
    normalized = normalize_invite_code(code)
    digest = hash_invite_code(normalized, secret) if secret else ""
    if not digest or len(normalized) < 16:
        raise bad_request("Beta invite is invalid or expired")

    invite = await db.scalar(
        select(BetaInvite)
        .where(BetaInvite.code_hash == digest)
        .with_for_update()
    )
    now = utc_now()
    if not invite or invite.status != "issued" or invite.expires_at <= now:
        if invite and invite.status == "issued" and invite.expires_at <= now:
            invite.status = "expired"
            await db.commit()
        raise bad_request("Beta invite is invalid or expired")
    expected_email_hash = _email_hash(user.email)
    if invite.email_hash and invite.email_hash != expected_email_hash:
        # Do not reveal whether a code exists for another address.
        raise bad_request("Beta invite is invalid or expired")

    invite.status = "redeemed"
    invite.redeemed_at = now
    invite.redeemed_by_user_id = user.id
    await add_audit_event(
        db,
        event_type="beta.invite_redeemed",
        request=request,
        actor_user_id=user.id,
        subject=str(invite.id),
    )
    await db.commit()
    return await beta_decision(db, user)


async def submit_beta_feedback(
    db: AsyncSession,
    *,
    user: User,
    request: Request,
    kind: str,
    message: str,
    rating: int | None,
    steps_to_reproduce: str | None,
    route: str | None,
    client_metadata: Mapping[str, Any] | None,
) -> BetaFeedback:
    decision = await beta_decision(db, user)
    if not decision.eligible:
        raise forbidden("Beta feedback is available only to eligible testers")
    if not await beta_consent_accepted(db, user):
        raise forbidden("Beta consent is required before submitting feedback")

    normalized_kind = kind.strip().lower()
    if normalized_kind not in FEEDBACK_KINDS:
        raise bad_request("Feedback kind is invalid")
    normalized_message = message.strip()
    if not normalized_message:
        raise bad_request("Feedback message cannot be empty")
    if rating is not None and not 1 <= rating <= 5:
        raise bad_request("Feedback rating must be between 1 and 5")

    normalized_route = (route or "").strip() or None
    if normalized_route and (
        len(normalized_route) > 200
        or not normalized_route.startswith("/")
        or "\n" in normalized_route
    ):
        raise bad_request("Feedback route is invalid")

    feedback = BetaFeedback(
        user_id=user.id,
        kind=normalized_kind,
        rating=rating,
        message=normalized_message,
        steps_to_reproduce=(steps_to_reproduce or "").strip() or None,
        route=normalized_route,
        release_sha=resolve_release_sha(settings.RELEASE_SHA),
        client_metadata=sanitize_client_metadata(client_metadata),
    )
    db.add(feedback)
    await db.flush()
    await add_audit_event(
        db,
        event_type="beta.feedback_submitted",
        request=request,
        actor_user_id=user.id,
        subject=str(feedback.id),
        details={"kind": normalized_kind, "rating": rating, "route": normalized_route},
    )
    await db.commit()
    await db.refresh(feedback)
    return feedback


def _payload_value(payload: Mapping[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in payload:
            return payload[key]
    data = payload.get("data")
    if isinstance(data, Mapping):
        for key in keys:
            if key in data:
                return data[key]
    return None


async def accept_payment_webhook(
    db: AsyncSession,
    *,
    provider: str,
    raw_body: bytes,
    signature: str | None,
    payload: Mapping[str, Any],
    request: Request,
) -> dict[str, Any]:
    """Verify and ledger a generic signed callback exactly once.

    ``generic_hmac`` is a provider boundary, not a claim that a commercial
    gateway is configured. It can be enabled only after an operator supplies a
    real provider adapter and webhook secret. Unsupported providers fail closed.
    """

    configured_provider = settings.PAYMENT_PROVIDER
    if configured_provider != "generic_hmac" or provider != configured_provider:
        raise forbidden("Payment provider is not configured")
    if not verify_webhook_signature(raw_body, signature, settings.PAYMENT_WEBHOOK_SECRET):
        raise forbidden("Payment webhook signature is invalid")

    event_id = str(_payload_value(payload, "id", "event_id") or "").strip()
    event_type = str(_payload_value(payload, "type", "event_type") or "").strip().lower()
    if not event_id or len(event_id) > 255 or not event_type or len(event_type) > 80:
        raise bad_request("Payment webhook event is malformed")
    payload_hash = hashlib.sha256(raw_body).hexdigest()
    order_id_raw = _payload_value(payload, "order_id", "subscription_order_id")
    order_id: int | None = None
    if order_id_raw is not None:
        try:
            order_id = int(order_id_raw)
        except (TypeError, ValueError):
            raise bad_request("Payment webhook order id is malformed")
        if order_id <= 0:
            raise bad_request("Payment webhook order id is malformed")

    # Use the database uniqueness boundary, rather than a read-then-insert
    # check, so two concurrent deliveries cannot turn a valid retry into a
    # 500/duplicate entitlement path.
    inserted = await db.execute(
        pg_insert(PaymentWebhookEvent)
        .values(
            provider=provider,
            event_id=event_id,
            event_type=event_type,
            order_id=order_id,
            payload_hash=payload_hash,
        )
        .on_conflict_do_nothing(
            index_elements=["provider", "event_id"],
        )
        .returning(PaymentWebhookEvent.id)
    )
    inserted_id = inserted.scalar_one_or_none()
    event = await db.scalar(
        select(PaymentWebhookEvent)
        .where(
            PaymentWebhookEvent.provider == provider,
            PaymentWebhookEvent.event_id == event_id,
        )
        .with_for_update()
    )
    if event is None:  # pragma: no cover - defensive database invariant
        raise bad_request("Payment webhook event could not be recorded")
    if inserted_id is None:
        if event.payload_hash != payload_hash:
            # Reusing an event id with a different signed body is not an
            # idempotent retry; treat it as a provider/accounting incident.
            raise bad_request("Payment webhook event id was reused with a different payload")
        # AsyncSession.rollback() expires ORM instances. Capture the scalar
        # before rolling back so the idempotent retry path never attempts an
        # implicit async refresh outside SQLAlchemy's greenlet context.
        duplicate_status = event.status
        await db.rollback()
        return {"accepted": True, "duplicate": True, "event_id": event_id, "status": duplicate_status}

    await add_audit_event(
        db,
        event_type="payment.webhook_received",
        request=request,
        subject=event_id,
        details={"provider": provider, "event_type": event_type, "has_order": order_id is not None},
    )
    # The generic boundary intentionally does not mutate subscriptions. A
    # provider-specific adapter must validate amount/currency/order ownership
    # before calling the entitlement service. Keeping the event as `received`
    # makes retries visible and prevents forged callbacks from granting access.
    await db.commit()
    return {"accepted": True, "duplicate": False, "event_id": event_id, "status": event.status}
