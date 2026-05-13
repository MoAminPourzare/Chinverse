from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app import schemas
from app.api import deps
from app.api.errors import bad_request, conflict, forbidden, unauthorized
from app.api.rate_limit import auth_login_rate_limit, auth_signup_rate_limit
from app.core import security
from app.core.config import settings
from app.models.user import User, UserProfile, UserStatus
from app.services.referrals import apply_referral_code, ensure_referral_storage, get_or_create_referral_code, get_referrer_id_by_code

router = APIRouter()

@router.post("/login/access-token", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    _rate_limit: None = Depends(auth_login_rate_limit),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    email = form_data.username.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == email))
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise unauthorized("Incorrect email or password")
    
    if user.status != UserStatus.ACTIVE:
        raise forbidden("Inactive user")
        
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
    _rate_limit: None = Depends(auth_signup_rate_limit),
) -> Any:
    """
    Create new user without the need to be logged in
    """
    email = str(user_in.email).strip().lower()
    phone = user_in.phone.strip()
    display_name = user_in.display_name.strip()
    referral_code = user_in.referral_code
    if not phone or not display_name:
        raise bad_request("Phone and display name cannot be empty")

    if referral_code:
        await ensure_referral_storage(db)
        referrer_user_id = await get_referrer_id_by_code(db, code=referral_code)
        if not referrer_user_id:
            raise bad_request("Referral code is invalid")

    result = await db.execute(select(User).where(func.lower(User.email) == email))
    user = result.scalar_one_or_none()
    if user:
        raise conflict("The user with this email already exists in the system")
    
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if user:
        raise conflict("The user with this phone number already exists in the system")
        
    user = User(
        email=email,
        phone=phone,
        password_hash=security.get_password_hash(user_in.password),
        is_verified=False,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    await db.flush() # flush to get user.id
    
    # Create profile
    profile = UserProfile(
        user_id=user.id,
        display_name=display_name
    )
    db.add(profile)
    await get_or_create_referral_code(db, user_id=user.id, commit=False)
    if referral_code:
        await apply_referral_code(
            db,
            referred_user_id=user.id,
            code=referral_code,
            commit=False,
        )
    
    await db.commit()
    
    # FIX: Reload user with profile relationship eagerly loaded
    # This prevents MissingGreenlet error in async SQLAlchemy
    query = select(User).options(selectinload(User.profile)).where(User.id == user.id)
    result = await db.execute(query)
    user = result.scalars().first()
    
    return user
