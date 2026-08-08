from datetime import UTC, datetime, timedelta
import json
import secrets
from typing import Any
from urllib.parse import urlencode
from uuid import UUID, uuid4

from fastapi import Request, Response
import httpx
from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import unauthorized
from app.core import security
from app.core.config import settings
from app.core.request import client_ip
from app.models.security import (
    AuthChallenge,
    AuthSession,
    MfaBackupCode,
    SecurityAuditEvent,
)
from app.models.user import User, UserRole


def utc_now() -> datetime:
    return datetime.now(UTC)


def role_value(user: User) -> str:
    return user.role.value if isinstance(user.role, UserRole) else str(user.role)


def request_fingerprints(request: Request) -> tuple[str | None, str | None]:
    ip = client_ip(request)
    user_agent = request.headers.get("user-agent")
    return (
        security.hash_request_fingerprint(ip),
        security.hash_request_fingerprint(user_agent),
    )


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path="/",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path="/",
    )


def token_response(
    user: User,
    session: AuthSession,
    *,
    mfa_verified: bool,
) -> dict[str, object]:
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return {
        "access_token": security.create_access_token(
            user.id,
            session_id=session.id,
            role=role_value(user),
            mfa_verified=mfa_verified,
        ),
        "token_type": "bearer",
        "expires_in": expires_in,
        "mfa_verified": mfa_verified,
        "requires_verification": not user.is_verified,
    }


async def create_session(
    db: AsyncSession,
    *,
    user: User,
    request: Request,
    mfa_verified: bool,
) -> tuple[AuthSession, str]:
    now = utc_now()
    session_id = str(uuid4())
    refresh_token = f"{session_id}.{security.generate_opaque_token()}"
    ip_hash, user_agent_hash = request_fingerprints(request)
    session = AuthSession(
        id=session_id,
        user_id=user.id,
        refresh_token_hash=security.hash_secret(refresh_token),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        last_used_at=now,
        ip_hash=ip_hash,
        user_agent_hash=user_agent_hash,
        mfa_verified_at=now if mfa_verified else None,
    )
    db.add(session)
    await db.flush()
    return session, refresh_token


async def rotate_session(
    db: AsyncSession,
    *,
    refresh_token: str,
    request: Request,
) -> tuple[User, AuthSession, str]:
    now = utc_now()
    session_id = _session_id_from_refresh_token(refresh_token)
    if not session_id:
        raise unauthorized("Session is invalid or expired")
    token_hash = security.hash_secret(refresh_token)
    result = await db.execute(
        select(AuthSession, User)
        .join(User, User.id == AuthSession.user_id)
        .where(AuthSession.id == session_id)
        .with_for_update()
    )
    row = result.one_or_none()
    if not row:
        raise unauthorized("Session is invalid or expired")

    session, user = row
    if not secrets.compare_digest(session.refresh_token_hash, token_hash):
        session.revoked_at = now
        await db.commit()
        raise unauthorized("Session is invalid or expired")
    if session.revoked_at or session.expires_at <= now:
        raise unauthorized("Session is invalid or expired")

    _, user_agent_hash = request_fingerprints(request)
    if (
        session.user_agent_hash
        and user_agent_hash
        and not secrets.compare_digest(session.user_agent_hash, user_agent_hash)
    ):
        session.revoked_at = now
        await db.commit()
        raise unauthorized("Session fingerprint changed")

    rotated_token = f"{session.id}.{security.generate_opaque_token()}"
    session.refresh_token_hash = security.hash_secret(rotated_token)
    session.last_used_at = now
    await db.flush()
    return user, session, rotated_token


async def revoke_refresh_session(
    db: AsyncSession,
    *,
    refresh_token: str | None,
) -> None:
    if not refresh_token:
        return
    session_id = _session_id_from_refresh_token(refresh_token)
    if not session_id:
        return
    await db.execute(
        update(AuthSession)
        .where(
            AuthSession.id == session_id,
            AuthSession.refresh_token_hash == security.hash_secret(refresh_token),
            AuthSession.revoked_at.is_(None),
        )
        .values(revoked_at=utc_now())
    )


def _session_id_from_refresh_token(refresh_token: str) -> str | None:
    candidate, separator, _secret = refresh_token.partition(".")
    if not separator:
        return None
    try:
        return str(UUID(candidate))
    except ValueError:
        return None


async def revoke_user_sessions(
    db: AsyncSession,
    *,
    user_id: int,
    except_session_id: str | None = None,
) -> None:
    query = update(AuthSession).where(
        AuthSession.user_id == user_id,
        AuthSession.revoked_at.is_(None),
    )
    if except_session_id:
        query = query.where(AuthSession.id != except_session_id)
    await db.execute(query.values(revoked_at=utc_now()))


async def create_challenge(
    db: AsyncSession,
    *,
    user: User,
    purpose: str,
    destination: str,
    ttl_minutes: int,
    numeric: bool = False,
) -> str:
    now = utc_now()
    await db.execute(
        update(AuthChallenge)
        .where(
            AuthChallenge.user_id == user.id,
            AuthChallenge.purpose == purpose,
            AuthChallenge.consumed_at.is_(None),
        )
        .values(consumed_at=now)
    )
    token = (
        f"{secrets.randbelow(1_000_000):06d}"
        if numeric
        else security.generate_opaque_token(32)
    )
    db.add(
        AuthChallenge(
            id=str(uuid4()),
            user_id=user.id,
            purpose=purpose,
            token_hash=security.hash_secret(token),
            destination_hash=security.hash_secret(destination.strip().lower()),
            expires_at=now + timedelta(minutes=ttl_minutes),
            attempts=0,
        )
    )
    await db.flush()
    return token


async def consume_challenge(
    db: AsyncSession,
    *,
    token: str,
    purpose: str,
) -> User:
    now = utc_now()
    result = await db.execute(
        select(AuthChallenge, User)
        .join(User, User.id == AuthChallenge.user_id)
        .where(
            AuthChallenge.token_hash == security.hash_secret(token.strip()),
            AuthChallenge.purpose == purpose,
        )
        .with_for_update()
    )
    row = result.one_or_none()
    if not row:
        raise unauthorized("Verification token is invalid or expired")

    challenge, user = row
    challenge.attempts += 1
    if (
        challenge.consumed_at
        or challenge.expires_at <= now
        or challenge.attempts > 8
    ):
        raise unauthorized("Verification token is invalid or expired")

    challenge.consumed_at = now
    return user


async def consume_user_challenge(
    db: AsyncSession,
    *,
    user_id: int,
    token: str,
    purpose: str,
) -> None:
    """Consume a short-lived challenge while persisting failed numeric attempts."""
    now = utc_now()
    result = await db.execute(
        select(AuthChallenge)
        .where(
            AuthChallenge.user_id == user_id,
            AuthChallenge.purpose == purpose,
            AuthChallenge.consumed_at.is_(None),
        )
        .order_by(AuthChallenge.created_at.desc())
        .with_for_update()
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise unauthorized("Verification token is invalid or expired")

    challenge.attempts += 1
    token_matches = secrets.compare_digest(
        challenge.token_hash,
        security.hash_secret(token.strip()),
    )
    if challenge.expires_at <= now or not token_matches or challenge.attempts > 8:
        if challenge.attempts >= 8 or challenge.expires_at <= now:
            challenge.consumed_at = now
        # Failure state must persist even though the caller returns a 401.
        await db.commit()
        raise unauthorized("Verification token is invalid or expired")

    challenge.consumed_at = now


async def dispatch_challenge(
    *,
    purpose: str,
    destination: str,
    token: str,
) -> None:
    if not settings.AUTH_DELIVERY_WEBHOOK_URL:
        return
    headers = {"Content-Type": "application/json"}
    if settings.AUTH_DELIVERY_WEBHOOK_SECRET:
        headers["Authorization"] = (
            f"Bearer {settings.AUTH_DELIVERY_WEBHOOK_SECRET}"
        )
    payload = {
        "purpose": purpose,
        "destination": destination,
        "token": token,
        "link": challenge_public_url(purpose=purpose, token=token),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            settings.AUTH_DELIVERY_WEBHOOK_URL,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()


def challenge_public_url(*, purpose: str, token: str) -> str | None:
    base_url = settings.AUTH_PUBLIC_APP_URL.rstrip("/")
    if purpose == "verify_email":
        return f"{base_url}/verify-account?{urlencode({'email_token': token})}"
    if purpose == "password_reset":
        return f"{base_url}/forgot-password?{urlencode({'token': token})}"
    return None


async def add_audit_event(
    db: AsyncSession,
    *,
    event_type: str,
    request: Request,
    actor_user_id: int | None = None,
    subject: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    ip_hash, user_agent_hash = request_fingerprints(request)
    db.add(
        SecurityAuditEvent(
            actor_user_id=actor_user_id,
            event_type=event_type,
            subject=subject,
            ip_hash=ip_hash,
            user_agent_hash=user_agent_hash,
            details_json=(
                json.dumps(details, ensure_ascii=True, sort_keys=True)
                if details
                else None
            ),
        )
    )


async def replace_backup_codes(
    db: AsyncSession,
    *,
    user_id: int,
) -> list[str]:
    await db.execute(delete(MfaBackupCode).where(MfaBackupCode.user_id == user_id))
    codes = [
        f"{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}"
        for _ in range(8)
    ]
    db.add_all(
        [
            MfaBackupCode(
                user_id=user_id,
                code_hash=security.hash_secret(code),
            )
            for code in codes
        ]
    )
    await db.flush()
    return codes


async def verify_mfa_code(
    db: AsyncSession,
    *,
    user: User,
    code: str,
) -> bool:
    secret = (
        security.decrypt_mfa_secret(user.mfa_secret_ciphertext)
        if user.mfa_secret_ciphertext
        else None
    )
    if secret:
        matched_counter = security.matching_totp_counter(secret, code)
        if matched_counter is not None:
            result = await db.execute(
                update(User)
                .where(
                    User.id == user.id,
                    or_(
                        User.mfa_last_used_step.is_(None),
                        User.mfa_last_used_step < matched_counter,
                    ),
                )
                .values(mfa_last_used_step=matched_counter)
                .returning(User.id)
            )
            if result.scalar_one_or_none() is not None:
                user.mfa_last_used_step = matched_counter
                return True

    backup_hash = security.hash_secret(code.strip().upper())
    result = await db.execute(
        select(MfaBackupCode)
        .where(
            MfaBackupCode.user_id == user.id,
            MfaBackupCode.code_hash == backup_hash,
            MfaBackupCode.used_at.is_(None),
        )
        .with_for_update()
    )
    backup = result.scalar_one_or_none()
    if not backup:
        return False
    backup.used_at = utc_now()
    return True
