from collections import deque
from datetime import UTC, datetime
import math
import secrets
from threading import Lock
import time

from fastapi import HTTPException, Request, status
from sqlalchemy import text

from app.api.errors import too_many_requests
from app.core import security
from app.core.config import settings
from app.core.request import client_ip
from app.db.session import SessionLocal


_BUCKETS: dict[str, deque[float]] = {}
_LOCK = Lock()


def _client_ip(request: Request) -> str:
    return client_ip(request)


async def enforce_rate_limit(
    request: Request,
    *,
    name: str,
    max_requests: int,
    window_seconds: int,
    discriminator: str | None = None,
) -> None:
    if not settings.RATE_LIMIT_ENABLED:
        return

    identity = discriminator or _client_ip(request)
    key = security.hash_secret(f"{name}:{identity}")
    if settings.RATE_LIMIT_BACKEND == "database":
        await _database_rate_limit(
            key=key,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )
        return

    now = time.monotonic()
    with _LOCK:
        bucket = _BUCKETS.setdefault(key, deque())
        while bucket and now - bucket[0] >= window_seconds:
            bucket.popleft()

        if len(bucket) >= max_requests:
            retry_after = int(window_seconds - (now - bucket[0]))
            raise too_many_requests(retry_after)

        bucket.append(now)

        if len(_BUCKETS) > 10000:
            stale_keys = [
                bucket_key
                for bucket_key, timestamps in _BUCKETS.items()
                if not timestamps or now - timestamps[-1] >= window_seconds
            ]
            for bucket_key in stale_keys[:1000]:
                _BUCKETS.pop(bucket_key, None)


def rate_limiter(
    name: str,
    *,
    max_requests: int,
    window_seconds: int,
):
    async def dependency(request: Request) -> None:
        await enforce_rate_limit(
            request,
            name=name,
            max_requests=max_requests,
            window_seconds=window_seconds,
        )

    return dependency


async def _database_rate_limit(
    *,
    key: str,
    max_requests: int,
    window_seconds: int,
) -> None:
    try:
        async with SessionLocal() as session:
            result = await session.execute(
                text(
                    """
                    INSERT INTO rate_limit_buckets AS bucket (
                        key,
                        request_count,
                        window_started_at,
                        expires_at
                    )
                    VALUES (
                        :key,
                        1,
                        now(),
                        now() + CAST(:window_seconds AS INTEGER) * INTERVAL '1 second'
                    )
                    ON CONFLICT (key) DO UPDATE SET
                        request_count = CASE
                            WHEN bucket.expires_at <= now() THEN 1
                            ELSE bucket.request_count + 1
                        END,
                        window_started_at = CASE
                            WHEN bucket.expires_at <= now() THEN now()
                            ELSE bucket.window_started_at
                        END,
                        expires_at = CASE
                            WHEN bucket.expires_at <= now()
                            THEN now() + CAST(:window_seconds AS INTEGER) * INTERVAL '1 second'
                            ELSE bucket.expires_at
                        END
                    RETURNING request_count, expires_at
                    """
                ),
                {
                    "key": key,
                    "window_seconds": window_seconds,
                },
            )
            row = result.one()
            if secrets.randbelow(100) == 0:
                await session.execute(
                    text(
                        """
                        DELETE FROM rate_limit_buckets
                        WHERE key IN (
                            SELECT key
                            FROM rate_limit_buckets
                            WHERE expires_at < now() - INTERVAL '1 hour'
                            LIMIT 1000
                        )
                        """
                    )
                )
            await session.commit()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Request protection is temporarily unavailable",
        ) from exc

    if int(row.request_count) > max_requests:
        now = datetime.now(UTC)
        retry_after = max(
            1,
            math.ceil((row.expires_at - now).total_seconds()),
        )
        raise too_many_requests(retry_after)


auth_login_rate_limit = rate_limiter(
    "auth-login",
    max_requests=settings.RATE_LIMIT_AUTH_REQUESTS,
    window_seconds=settings.RATE_LIMIT_AUTH_WINDOW_SECONDS,
)

auth_signup_rate_limit = rate_limiter(
    "auth-signup",
    max_requests=settings.RATE_LIMIT_AUTH_REQUESTS,
    window_seconds=settings.RATE_LIMIT_AUTH_WINDOW_SECONDS,
)

auth_challenge_rate_limit = rate_limiter(
    "auth-challenge",
    max_requests=settings.RATE_LIMIT_AUTH_CHALLENGE_REQUESTS,
    window_seconds=settings.RATE_LIMIT_AUTH_CHALLENGE_WINDOW_SECONDS,
)

write_rate_limit = rate_limiter(
    "write",
    max_requests=settings.RATE_LIMIT_WRITE_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WRITE_WINDOW_SECONDS,
)

upload_rate_limit = rate_limiter(
    "upload",
    max_requests=settings.RATE_LIMIT_UPLOAD_REQUESTS,
    window_seconds=settings.RATE_LIMIT_UPLOAD_WINDOW_SECONDS,
)
