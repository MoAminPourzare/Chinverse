from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.errors import bad_request
from app.api.rate_limit import write_rate_limit
from app.models.user import User
from app.services.subscriptions import (
    create_subscription_checkout,
    get_subscription_overview,
)
from app.services.phase8_beta import accept_payment_webhook

router = APIRouter()


class SubscriptionCheckoutRequest(BaseModel):
    plan_id: int = Field(gt=0)


@router.get("/me")
async def my_subscription_overview(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    return await get_subscription_overview(db, user_id=current_user.id)


@router.post("/checkout")
async def checkout_subscription(
    payload: SubscriptionCheckoutRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> dict[str, Any]:
    return await create_subscription_checkout(
        db,
        user_id=current_user.id,
        plan_id=payload.plan_id,
    )


@router.post("/webhook/{provider}")
async def payment_webhook(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
) -> dict[str, Any]:
    """Verify and ledger a provider callback exactly once.

    The generic HMAC boundary is deliberately inert until an approved provider
    adapter and secret are configured. It never grants an entitlement on its
    own, so a forged or misconfigured callback cannot open paid content.
    """

    raw_body = await request.body()
    try:
        payload = await request.json()
    except ValueError as exc:
        raise bad_request("Payment webhook payload is invalid JSON") from exc
    if not isinstance(payload, dict):
        raise bad_request("Payment webhook payload must be an object")
    signature = request.headers.get("x-payment-signature")
    return await accept_payment_webhook(
        db,
        provider=provider.strip().lower(),
        raw_body=raw_body,
        signature=signature,
        payload=payload,
        request=request,
    )
