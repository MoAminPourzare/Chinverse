"""Transactional payment event processing and entitlement reconciliation."""

from __future__ import annotations

import calendar
from datetime import UTC, date, datetime, timedelta
import hashlib
from typing import Any, Mapping

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import bad_request, forbidden
from app.core.config import settings
from app.core.phase8 import verify_timestamped_webhook_signature
from app.models.operational import SubscriptionOrder
from app.models.phase8 import PaymentLedgerEntry, PaymentWebhookEvent
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, UserSubscription
from app.services.auth_security import add_audit_event, utc_now


SUPPORTED_PAYMENT_EVENTS = {
    "payment.succeeded",
    "payment.refunded",
    "payment.chargeback",
}
TERMINAL_ORDER_STATUSES = {"paid", "refunded", "chargeback", "cancelled", "failed"}


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


def _positive_int(value: Any, *, field: str) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise bad_request(f"Payment webhook {field} is malformed") from exc
    if parsed <= 0:
        raise bad_request(f"Payment webhook {field} is malformed")
    return parsed


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + max(months, 1)
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _parse_timestamp(value: str | None) -> tuple[int, datetime]:
    try:
        timestamp = int((value or "").strip())
        provider_time = datetime.fromtimestamp(timestamp, UTC)
    except (ValueError, OSError, OverflowError) as exc:
        raise forbidden("Payment webhook timestamp is invalid") from exc
    now = datetime.now(UTC)
    tolerance = settings.PAYMENT_WEBHOOK_TOLERANCE_SECONDS
    if abs((now - provider_time).total_seconds()) > tolerance:
        raise forbidden("Payment webhook timestamp is outside the allowed window")
    return timestamp, provider_time


async def _reject_event(
    db: AsyncSession,
    event: PaymentWebhookEvent,
    *,
    error_code: str,
    request: Request,
) -> None:
    event.status = "rejected"
    event.error_code = error_code[:80]
    event.processed_at = utc_now()
    await add_audit_event(
        db,
        event_type="payment.webhook_rejected",
        request=request,
        subject=event.event_id,
        details={"provider": event.provider, "error_code": event.error_code},
    )
    await db.commit()


async def _grant_entitlement(
    db: AsyncSession,
    *,
    order: SubscriptionOrder,
) -> tuple[UserSubscription, str]:
    existing = await db.scalar(
        select(UserSubscription)
        .where(UserSubscription.source_order_id == order.id)
        .with_for_update()
    )
    if existing is not None:
        return existing, "grant" if existing.start_date <= date.today() else "renew"

    plan = await db.scalar(
        select(SubscriptionPlan)
        .where(SubscriptionPlan.id == order.plan_id, SubscriptionPlan.is_active.is_(True))
        .with_for_update()
    )
    if plan is None:
        raise ValueError("plan_not_found")

    today = date.today()
    latest = await db.scalar(
        select(UserSubscription)
        .where(
            UserSubscription.user_id == order.user_id,
            UserSubscription.status == SubscriptionStatus.ACTIVE,
            UserSubscription.end_date >= today,
        )
        .order_by(UserSubscription.end_date.desc())
        .limit(1)
        .with_for_update()
    )
    start_date = today if latest is None else latest.end_date + timedelta(days=1)
    end_date = _add_months(start_date, int(plan.duration_months)) - timedelta(days=1)
    subscription = UserSubscription(
        user_id=order.user_id,
        plan_id=order.plan_id,
        start_date=start_date,
        end_date=end_date,
        status=SubscriptionStatus.ACTIVE,
        source_order_id=order.id,
    )
    db.add(subscription)
    await db.flush()
    return subscription, "grant" if latest is None else "renew"


async def _revoke_entitlement(
    db: AsyncSession,
    *,
    order: SubscriptionOrder,
    reason: str,
) -> UserSubscription:
    subscription = await db.scalar(
        select(UserSubscription)
        .where(UserSubscription.source_order_id == order.id)
        .with_for_update()
    )
    if subscription is None:
        raise ValueError("entitlement_not_found")
    subscription.status = (
        SubscriptionStatus.REFUNDED
        if reason == "refund"
        else SubscriptionStatus.CHARGEBACK
    )
    subscription.revoked_at = utc_now()
    subscription.revocation_reason = reason
    return subscription


async def accept_payment_webhook(
    db: AsyncSession,
    *,
    provider: str,
    raw_body: bytes,
    signature: str | None,
    timestamp: str | None,
    payload: Mapping[str, Any],
    request: Request,
) -> dict[str, Any]:
    """Verify, ledger and apply one provider event exactly once."""

    configured_provider = settings.PAYMENT_PROVIDER
    if configured_provider != "generic_hmac" or provider != configured_provider:
        raise forbidden("Payment provider is not configured")

    timestamp_value, provider_time = _parse_timestamp(timestamp)
    if not verify_timestamped_webhook_signature(
        raw_body,
        signature,
        settings.PAYMENT_WEBHOOK_SECRET,
        timestamp_value,
    ):
        raise forbidden("Payment webhook signature is invalid")

    event_id = str(_payload_value(payload, "id", "event_id") or "").strip()
    event_type = str(_payload_value(payload, "type", "event_type") or "").strip().lower()
    if not event_id or len(event_id) > 255 or event_type not in SUPPORTED_PAYMENT_EVENTS:
        raise bad_request("Payment webhook event is malformed or unsupported")
    order_id = _positive_int(
        _payload_value(payload, "order_id", "subscription_order_id"),
        field="order id",
    )
    amount = _positive_int(_payload_value(payload, "amount"), field="amount")
    currency = str(_payload_value(payload, "currency") or "").strip().upper()
    if currency not in {"IRT", "IRR"}:
        raise bad_request("Payment webhook currency is malformed")
    provider_reference = str(
        _payload_value(payload, "provider_reference", "trans_id", "authority", "reference")
        or ""
    ).strip()
    if not provider_reference or len(provider_reference) > 255:
        raise bad_request("Payment webhook provider reference is malformed")

    payload_hash = hashlib.sha256(raw_body).hexdigest()
    inserted = await db.execute(
        pg_insert(PaymentWebhookEvent)
        .values(
            provider=provider,
            event_id=event_id,
            event_type=event_type,
            order_id=order_id,
            payload_hash=payload_hash,
            provider_created_at=provider_time,
        )
        .on_conflict_do_nothing(index_elements=["provider", "event_id"])
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
            await db.rollback()
            raise bad_request("Payment webhook event id was reused with a different payload")
        duplicate_status = event.status
        await db.rollback()
        return {
            "accepted": duplicate_status == "processed",
            "duplicate": True,
            "event_id": event_id,
            "status": duplicate_status,
        }

    order = await db.scalar(
        select(SubscriptionOrder)
        .where(SubscriptionOrder.id == order_id)
        .with_for_update()
    )
    if order is None:
        await _reject_event(db, event, error_code="order_not_found", request=request)
        raise bad_request("Payment webhook order was not found")

    expected_amount = int(round(float(order.amount)))
    if order.provider != provider:
        await _reject_event(db, event, error_code="provider_mismatch", request=request)
        raise bad_request("Payment webhook provider does not match the order")
    if expected_amount != amount or order.currency.upper() != currency:
        await _reject_event(db, event, error_code="amount_currency_mismatch", request=request)
        raise bad_request("Payment webhook amount or currency does not match the order")
    if order.provider_reference and order.provider_reference != provider_reference:
        await _reject_event(db, event, error_code="provider_reference_mismatch", request=request)
        raise bad_request("Payment webhook reference does not match the order")

    now = utc_now()
    subscription: UserSubscription | None = None
    action: str | None = None
    try:
        if event_type == "payment.succeeded":
            if order.status in TERMINAL_ORDER_STATUSES:
                raise ValueError("order_terminal")
            subscription, action = await _grant_entitlement(db, order=order)
            order.status = "paid"
            order.paid_at = order.paid_at or now
            order.provider_reference = provider_reference
            order.failure_code = None
        else:
            terminal_status = "refunded" if event_type == "payment.refunded" else "chargeback"
            if order.status not in {"paid", terminal_status}:
                raise ValueError("order_not_paid")
            subscription = await _revoke_entitlement(
                db,
                order=order,
                reason="refund" if terminal_status == "refunded" else "chargeback",
            )
            order.status = terminal_status
            order.closed_at = now
            order.provider_reference = provider_reference
            action = "refund" if terminal_status == "refunded" else "chargeback"
    except ValueError as exc:
        await _reject_event(db, event, error_code=str(exc), request=request)
        raise bad_request("Payment event failed entitlement validation") from exc

    event.status = "processed"
    event.processed_at = now
    event.error_code = None
    if action is not None and subscription is not None:
        db.add(
            PaymentLedgerEntry(
                event_id=event.id,
                order_id=order.id,
                user_id=order.user_id,
                subscription_id=subscription.id,
                action=action,
                amount=amount,
                currency=currency,
                provider_reference=provider_reference,
            )
        )
    await add_audit_event(
        db,
        event_type=(
            "payment.refunded"
            if action == "refund"
            else f"payment.{action or 'processed'}"
        ),
        request=request,
        subject=str(order.id),
        details={
            "provider": provider,
            "event_id": event_id,
            "event_type": event_type,
            "currency": currency,
        },
    )
    await db.commit()
    return {
        "accepted": True,
        "duplicate": False,
        "event_id": event_id,
        "status": event.status,
        # Keep the public response aligned with the provider event name while
        # the append-only ledger uses the shorter ``refund`` action.
        "entitlement_action": "refunded" if action == "refund" else action,
        "subscription_id": int(subscription.id) if subscription is not None else None,
    }


async def reconcile_payment_ledger(db: AsyncSession) -> dict[str, Any]:
    """Return aggregate, PII-free anomalies for the daily operations check."""

    paid_without_entitlement = int(
        await db.scalar(
            select(func.count(SubscriptionOrder.id))
            .outerjoin(
                UserSubscription,
                UserSubscription.source_order_id == SubscriptionOrder.id,
            )
            .where(
                SubscriptionOrder.status == "paid",
                UserSubscription.id.is_(None),
            )
        )
        or 0
    )
    revoked_still_active = int(
        await db.scalar(
            select(func.count(SubscriptionOrder.id))
            .join(
                UserSubscription,
                UserSubscription.source_order_id == SubscriptionOrder.id,
            )
            .where(
                SubscriptionOrder.status.in_(["refunded", "chargeback"]),
                UserSubscription.status == SubscriptionStatus.ACTIVE,
            )
        )
        or 0
    )
    stale_received_events = int(
        await db.scalar(
            select(func.count(PaymentWebhookEvent.id)).where(
                PaymentWebhookEvent.status == "received",
                PaymentWebhookEvent.created_at
                < utc_now() - timedelta(seconds=settings.PAYMENT_WEBHOOK_TOLERANCE_SECONDS),
            )
        )
        or 0
    )
    anomalies = {
        "paid_without_entitlement": paid_without_entitlement,
        "revoked_still_active": revoked_still_active,
        "stale_received_events": stale_received_events,
    }
    return {
        "healthy": all(value == 0 for value in anomalies.values()),
        "anomalies": anomalies,
    }
