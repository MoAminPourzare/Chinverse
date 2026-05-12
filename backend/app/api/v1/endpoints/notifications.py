from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.models.user import User
from app.services.notifications import (
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    unread_count,
)

router = APIRouter()


@router.get("", response_model=list[dict[str, Any]])
async def get_notifications(
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=30, max_limit=80)),
) -> list[dict[str, Any]]:
    return await list_notifications(
        db,
        user_id=current_user.id,
        skip=pagination.skip,
        limit=pagination.limit,
        unread_only=unread_only,
    )


@router.get("/latest", response_model=list[dict[str, Any]])
async def get_latest_notifications(
    after_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[dict[str, Any]]:
    return await list_notifications(
        db,
        user_id=current_user.id,
        skip=0,
        limit=6,
        after_id=after_id,
    )


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, int]:
    return {"count": await unread_count(db, user_id=current_user.id)}


@router.post("/{notification_id}/read")
async def read_notification(
    notification_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, bool]:
    updated = await mark_notification_read(
        db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
    if not updated:
        raise not_found("Notification")
    return {"ok": True}


@router.post("/read-all")
async def read_all_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, int]:
    return {"updated": await mark_all_notifications_read(db, user_id=current_user.id)}
