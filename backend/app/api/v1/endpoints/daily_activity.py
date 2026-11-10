from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.errors import forbidden, not_found
from app.models.course import Course, Lesson, PublicationStatus
from app.models.media import MediaAsset, MediaLicenseStatus, MediaPublicationStatus
from app.services.media_workflow import lesson_entitlement
from app.models.user import User
from app.services.daily_activity import get_activity_summary, record_video_watch

router = APIRouter()


class VideoProgressRequest(BaseModel):
    lesson_id: int = Field(gt=0)
    seconds_delta: int = Field(ge=0, le=300)
    study_seconds_delta: int | None = Field(default=None, ge=0, le=300)
    position_seconds: int = Field(default=0, ge=0, le=86400)
    duration_seconds: int = Field(default=0, ge=0, le=86400)


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
    lesson = await db.get(Lesson, payload.lesson_id)
    course = await db.get(Course, lesson.course_id) if lesson else None
    asset = await db.get(MediaAsset, lesson.media_id) if lesson and lesson.media_id else None
    if (not lesson or not course or not asset
            or lesson.status != PublicationStatus.PUBLISHED
            or course.status != PublicationStatus.PUBLISHED
            or asset.status != MediaPublicationStatus.PUBLISHED
            or asset.license_status != MediaLicenseStatus.APPROVED
            or asset.media_type != "video"):
        raise not_found("Published lesson")
    _, granted, _, _ = await lesson_entitlement(db, lesson, current_user.id)
    if not granted:
        raise forbidden("This lesson is not available for your account")
    # Registered media metadata is authoritative. Legacy assets may only have
    # a duration on the lesson; the browser is the last fallback.
    duration = round(asset.duration_seconds or (lesson.duration_minutes or 0) * 60 or payload.duration_seconds)
    return await record_video_watch(
        db,
        user_id=current_user.id,
        lesson_id=payload.lesson_id,
        seconds_delta=payload.seconds_delta,
        study_seconds_delta=payload.study_seconds_delta,
        position_seconds=payload.position_seconds,
        duration_seconds=duration,
    )
