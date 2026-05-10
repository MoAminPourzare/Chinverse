from dataclasses import dataclass
from typing import Callable

from fastapi import Query

from app.core.config import settings


@dataclass(frozen=True)
class PaginationParams:
    skip: int
    limit: int


def pagination_params(
    *,
    default_limit: int | None = None,
    max_limit: int | None = None,
) -> Callable[..., PaginationParams]:
    resolved_default = default_limit or settings.API_DEFAULT_PAGE_SIZE
    resolved_max = max_limit or settings.API_MAX_PAGE_SIZE

    async def dependency(
        skip: int = Query(0, ge=0),
        limit: int = Query(resolved_default, ge=1, le=resolved_max),
    ) -> PaginationParams:
        return PaginationParams(skip=skip, limit=limit)

    return dependency
