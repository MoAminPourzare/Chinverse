from datetime import UTC, datetime
from typing import Generator
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import PyJWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.errors import forbidden, unauthorized
from app.core.config import settings
from app.models.security import AuthSession
from app.models.user import User, UserRole, UserStatus
from app.schemas.token import TokenPayload
from app.db.session import SessionLocal

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

async def get_db() -> Generator:
    async with SessionLocal() as session:
        yield session

async def get_current_session_user(
    session: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        user_id = int(token_data.sub)
        if token_data.type != "access" or not token_data.sid:
            raise ValueError("Invalid token type")
    except (PyJWTError, ValidationError, TypeError, ValueError):
        raise unauthorized()

    now = datetime.now(UTC)
    result = await session.execute(
        select(User, AuthSession)
        .join(AuthSession, AuthSession.user_id == User.id)
        .options(selectinload(User.profile))
        .where(
            User.id == user_id,
            AuthSession.id == token_data.sid,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        )
    )
    row = result.one_or_none()
    
    if not row:
        raise unauthorized("Session is invalid or expired")
    user, auth_session = row
    if user.status != UserStatus.ACTIVE:
        raise forbidden("Inactive user")
    user._auth_session_id = auth_session.id
    user._auth_mfa_verified = bool(
        token_data.mfa and auth_session.mfa_verified_at
    )
    return user


async def get_current_user(
    current_user: User = Depends(get_current_session_user),
) -> User:
    if settings.REQUIRE_VERIFIED_LOGIN and not current_user.is_verified:
        raise forbidden("Account verification is required")
    return current_user


def is_admin_user(user: User) -> bool:
    role = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    return role == UserRole.ADMIN.value


def is_moderator_user(user: User) -> bool:
    role = user.role.value if isinstance(user.role, UserRole) else str(user.role)
    return role in {UserRole.MODERATOR.value, UserRole.ADMIN.value} or is_admin_user(user)


async def get_current_admin_candidate(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_admin_user(current_user):
        raise forbidden()

    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_admin_candidate),
) -> User:
    if not current_user.mfa_enabled:
        raise forbidden("Admin MFA enrollment is required")
    if not getattr(current_user, "_auth_mfa_verified", False):
        raise forbidden("Admin MFA verification is required")
    return current_user


async def get_current_moderator_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not is_moderator_user(current_user):
        raise forbidden()
    if is_admin_user(current_user):
        if not current_user.mfa_enabled:
            raise forbidden("Admin MFA enrollment is required")
        if not getattr(current_user, "_auth_mfa_verified", False):
            raise forbidden("Admin MFA verification is required")
    return current_user
