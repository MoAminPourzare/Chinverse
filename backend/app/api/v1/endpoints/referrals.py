from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.rate_limit import write_rate_limit
from app.models.user import User
from app.services.referrals import (
    apply_referral_code,
    get_referral_dashboard,
    get_referrer_id_by_code,
    normalize_referral_code,
)

router = APIRouter()


class ReferralApplyRequest(BaseModel):
    code: str = Field(min_length=4, max_length=32)


@router.get("/me")
async def get_my_referrals(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    return await get_referral_dashboard(db, user_id=current_user.id)


@router.post("/apply")
async def apply_referral(
    payload: ReferralApplyRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> dict[str, Any]:
    return await apply_referral_code(
        db,
        referred_user_id=current_user.id,
        code=payload.code,
    )


@router.get("/validate/{code}")
async def validate_referral_code(
    code: str,
    db: AsyncSession = Depends(deps.get_db),
) -> dict[str, Any]:
    normalized = normalize_referral_code(code)
    referrer_user_id = await get_referrer_id_by_code(db, code=normalized)
    return {"valid": referrer_user_id is not None, "code": normalized}
