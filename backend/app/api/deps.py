from typing import Generator
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.errors import forbidden, unauthorized
from app.core.config import settings
from app.models.user import User, UserStatus
from app.schemas.token import TokenPayload
from app.db.session import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

async def get_db() -> Generator:
    async with SessionLocal() as session:
        yield session

async def get_current_user(
    session: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        user_id = int(token_data.sub)
    except (JWTError, ValidationError, TypeError, ValueError):
        raise unauthorized()
    
    result = await session.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise unauthorized("User account no longer exists")
    if user.status != UserStatus.ACTIVE:
        raise forbidden("Inactive user")
    return user


def _get_admin_emails() -> set[str]:
    return {
        email.strip().lower()
        for email in settings.ADMIN_EMAILS.split(",")
        if email.strip()
    }


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    admin_emails = _get_admin_emails()
    if not admin_emails:
        raise forbidden("Admin access is not configured")

    if current_user.email.lower() not in admin_emails:
        raise forbidden()

    return current_user
