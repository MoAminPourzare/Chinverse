from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.rate_limit import write_rate_limit
from app.models.user import User
from app.services.subscriptions import (
    create_subscription_checkout,
    get_subscription_overview,
)

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
