from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app import schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, UserProfile, UserStatus

router = APIRouter()

@router.post("/login/access-token", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Authenticate user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=schemas.User)
async def create_user_signup(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    result = await db.execute(select(User).where(User.phone == user_in.phone))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this phone number already exists in the system",
        )
        
    # Create user
    user = User(
        email=user_in.email,
        phone=user_in.phone,
        password_hash=security.get_password_hash(user_in.password),
        is_verified=False,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    await db.flush() # flush to get user.id
    
    # Create profile
    profile = UserProfile(
        user_id=user.id,
        display_name=user_in.display_name
    )
    db.add(profile)
    
    await db.commit()
    
    # FIX: Reload user with profile relationship eagerly loaded
    # This prevents MissingGreenlet error in async SQLAlchemy
    query = select(User).options(selectinload(User.profile)).where(User.id == user.id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    return user
