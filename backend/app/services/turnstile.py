from fastapi import HTTPException, status
import httpx

from app.api.errors import forbidden
from app.core.config import settings


async def verify_turnstile(
    *,
    token: str | None,
    remote_ip: str | None,
    expected_action: str,
) -> None:
    if not settings.TURNSTILE_ENABLED:
        return
    if not token:
        raise forbidden("Human verification is required")
    if len(token) > 2048:
        raise forbidden("Human verification failed")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                settings.TURNSTILE_VERIFY_URL,
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token,
                    "remoteip": remote_ip or "",
                },
            )
            response.raise_for_status()
            result = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Human verification is temporarily unavailable",
        ) from exc

    action = result.get("action")
    hostname = str(result.get("hostname") or "").lower()
    hostname_valid = not settings.TURNSTILE_HOSTNAMES or hostname in set(
        settings.TURNSTILE_HOSTNAMES
    )
    if not result.get("success") or action != expected_action or not hostname_valid:
        raise forbidden("Human verification failed")
