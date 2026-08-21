from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from weakref import WeakKeyDictionary

from sqlalchemy import text

from app.core.config import settings
from app.core.observability import record_dependency_health
from app.core.storage import probe_storage
from app.db.session import SessionLocal


logger = logging.getLogger(__name__)
_readiness_cache: tuple[float, dict[str, str]] | None = None
_readiness_locks: WeakKeyDictionary[
    asyncio.AbstractEventLoop,
    asyncio.Lock,
] = WeakKeyDictionary()


async def _check_database() -> None:
    async with SessionLocal() as session:
        await session.execute(text("SELECT 1"))


async def _bounded_check(
    name: str,
    check: Callable[[], Awaitable[None]],
) -> tuple[str, bool]:
    started_at = time.perf_counter()
    try:
        async with asyncio.timeout(settings.HEALTHCHECK_TIMEOUT_SECONDS):
            await check()
    except Exception:
        record_dependency_health(name, False)
        logger.exception(
            "Dependency readiness check failed",
            extra={
                "event": "dependency.health",
                "dependency": name,
                "outcome": "failed",
                "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
            },
        )
        return name, False

    record_dependency_health(name, True)
    logger.info(
        "Dependency readiness check passed",
        extra={
            "event": "dependency.health",
            "dependency": name,
            "outcome": "ok",
            "duration_ms": round((time.perf_counter() - started_at) * 1000, 3),
        },
    )
    return name, True


def reset_readiness_cache() -> None:
    global _readiness_cache
    _readiness_cache = None
    _readiness_locks.clear()


async def _fresh_readiness_checks() -> dict[str, str]:
    results = await asyncio.gather(
        _bounded_check("database", _check_database),
        _bounded_check("storage", probe_storage),
    )
    return {name: "ok" if healthy else "failed" for name, healthy in results}


async def readiness_checks() -> dict[str, str]:
    """Return a short-lived single-flight result for the public readiness route.

    The storage probe deliberately performs a real write/read/delete cycle. A
    process-local cache prevents an unauthenticated request burst from being
    amplified into provider operations while keeping outage detection bounded.
    """

    global _readiness_cache
    now = time.monotonic()
    if _readiness_cache and now < _readiness_cache[0]:
        return dict(_readiness_cache[1])

    loop = asyncio.get_running_loop()
    lock = _readiness_locks.setdefault(loop, asyncio.Lock())
    async with lock:
        now = time.monotonic()
        if _readiness_cache and now < _readiness_cache[0]:
            return dict(_readiness_cache[1])
        checks = await _fresh_readiness_checks()
        _readiness_cache = (
            time.monotonic() + settings.HEALTHCHECK_CACHE_TTL_SECONDS,
            checks,
        )
        return dict(checks)
