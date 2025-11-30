from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User, UserProfile
from app.schemas import user as schemas

router = APIRouter()

@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me/profile", response_model=schemas.User)
async def update_user_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: schemas.UserProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update current user profile.
    """
    # Check if profile exists
    if not current_user.profile:
        # Create new profile
        profile = UserProfile(user_id=current_user.id, **profile_in.model_dump(exclude_unset=True))
        db.add(profile)
    else:
        # Update existing profile
        profile = current_user.profile
        update_data = profile_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        db.add(profile)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
