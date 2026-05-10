from collections import deque
from threading import Lock
import time

from fastapi import Request

from app.api.errors import too_many_requests
from app.core.config import settings


_BUCKETS: dict[str, deque[float]] = {}
_LOCK = Lock()


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip() or "unknown"

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def rate_limiter(
    name: str,
    *,
    max_requests: int,
    window_seconds: int,
):
    async def dependency(request: Request) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return

        now = time.monotonic()
        key = f"{name}:{_client_ip(request)}"

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

    return dependency


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
