from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.services.daily_activity import get_activity_summary, record_video_watch

router = APIRouter()


class VideoProgressRequest(BaseModel):
    lesson_id: int = Field(gt=0)
    seconds_delta: int = Field(gt=0, le=300)
    position_seconds: int = Field(default=0, ge=0)
    duration_seconds: int = Field(default=0, ge=0)


@router.get("/summary")
async def daily_activity_summary(
    days: int = Query(default=370, ge=7, le=370),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    return await get_activity_summary(db, user_id=current_user.id, days=days)


@router.post("/video-progress")
async def video_progress(
    payload: VideoProgressRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> dict[str, Any]:
    return await record_video_watch(
        db,
        user_id=current_user.id,
        lesson_id=payload.lesson_id,
        seconds_delta=payload.seconds_delta,
        position_seconds=payload.position_seconds,
        duration_seconds=payload.duration_seconds,
    )
