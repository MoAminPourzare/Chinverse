from typing import Any

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, conflict, not_found
from app.api.rate_limit import write_rate_limit
from app.models.course import Course, CourseSection, Lesson, Subcategory
from app.models.media import MediaAsset, MediaType
from app.core.config import settings
from app.core.paths import THUMBNAILS_DIR, VIDEOS_DIR
from app.core.storage import delete_public_file
from app.core.uploads import save_thumbnail_upload, save_video_upload
from app.schemas import course as schemas

router = APIRouter(prefix="/admin", tags=["course-admin"])


async def _load_course(db: AsyncSession, course_id: int) -> Course:
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.sections).selectinload(CourseSection.lessons))
        .where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise not_found("Course")
    return course


@router.post("/courses", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
    course_in: schemas.CourseCreate,
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Create a course with the minimum data needed for the explore/watch flow.
    """
    _ = current_user

    subcategory = await db.get(Subcategory, course_in.subcategory_id)
    if not subcategory:
        raise not_found("Subcategory")

    title = course_in.title.strip()
    slug = course_in.slug.strip().lower()
    description = course_in.description.strip()
    cover_image_url = course_in.cover_image_url.strip()
    level = course_in.level.strip().lower()
    if not title or not slug or not description or not cover_image_url or not level:
        raise bad_request("Course fields cannot be empty")

    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        raise conflict("Course slug already exists")

    course = Course(
        subcategory_id=course_in.subcategory_id,
        title=title,
        slug=slug,
        description=description,
        cover_image_url=cover_image_url,
        level=level,
        metadata_json=course_in.metadata_json,
    )
    db.add(course)
    await db.commit()
    return await _load_course(db, course.id)


@router.post("/courses/{course_id}/sections", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_course_section(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
    course_id: int,
    section_in: schemas.CourseSectionCreate,
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Add a section to an existing course.
    """
    _ = current_user

    course = await db.get(Course, course_id)
    if not course:
        raise not_found("Course")

    section_title = section_in.title.strip()
    if not section_title:
        raise bad_request("Section title cannot be empty")

    section = CourseSection(
        course_id=course_id,
        title=section_title,
        order_index=section_in.order_index,
        metadata_json=section_in.metadata_json,
    )
    db.add(section)
    await db.commit()
    return await _load_course(db, course_id)


@router.post("/sections/{section_id}/lessons", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
    section_id: int,
    lesson_in: schemas.LessonCreate,
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Add a lesson to an existing section.
    """
    _ = current_user

    section = await db.get(CourseSection, section_id)
    if not section:
        raise not_found("Section")

    lesson_title = lesson_in.title.strip()
    video_url = lesson_in.video_url.strip() if lesson_in.video_url else ""
    if not lesson_title or not video_url:
        raise bad_request("Lesson title and video_url are required")

    lesson = Lesson(
        course_id=section.course_id,
        section_id=section_id,
        title=lesson_title,
        video_url=video_url,
        duration_minutes=lesson_in.duration_minutes,
        is_free=lesson_in.is_free,
        metadata_json=lesson_in.metadata_json,
    )
    db.add(lesson)
    await db.commit()
    return await _load_course(db, section.course_id)


@router.post(
    "/courses/{course_id}/sections/{section_id}/lessons/upload",
    response_model=schemas.Course,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson_with_upload(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
    course_id: int,
    section_id: int,
    title: str = Form(..., min_length=1, max_length=180),
    duration_minutes: float = Form(0.0, ge=0),
    is_free: bool = Form(False),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile | None = File(None),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Upload a lesson video and create the lesson in one step.
    """
    _ = current_user

    course = await db.get(Course, course_id)
    if not course:
        raise not_found("Course")

    section = await db.get(CourseSection, section_id)
    if not section or section.course_id != course_id:
        raise not_found("Section")

    title = title.strip()
    if not title:
        raise bad_request("Lesson title cannot be empty")

    stored_video = await save_video_upload(
        video_file,
        destination_dir=VIDEOS_DIR,
        public_url_prefix="/uploads/videos",
    )

    thumbnail_url = None
    try:
        if thumbnail_file and thumbnail_file.filename:
            stored_thumbnail = await save_thumbnail_upload(
                thumbnail_file,
                destination_dir=THUMBNAILS_DIR,
                public_url_prefix="/uploads/thumbnails",
            )
            thumbnail_url = stored_thumbnail.public_url

        media = MediaAsset(
            user_id=current_user.id,
            media_type=MediaType.VIDEO,
            file_url=stored_video.public_url,
            thumbnail_url=thumbnail_url,
            storage_provider=settings.FILE_STORAGE_MODE,
            storage_key=stored_video.storage_key,
            mime_type=stored_video.content_type,
            file_size_bytes=stored_video.size_bytes,
            duration_seconds=duration_minutes * 60 if duration_minutes else None,
            metadata_json={
                "origin": "course_lesson",
                "course_id": course_id,
                "section_id": section_id,
            },
        )
        db.add(media)
        await db.flush()

        lesson = Lesson(
            course_id=course_id,
            section_id=section_id,
            title=title,
            video_url=stored_video.public_url,
            thumbnail_url=thumbnail_url,
            media_id=media.id,
            duration_minutes=duration_minutes,
            is_free=is_free,
            metadata_json={
                "storage_provider": settings.FILE_STORAGE_MODE,
                "storage_key": stored_video.storage_key,
                "mime_type": stored_video.content_type,
                "file_size_bytes": stored_video.size_bytes,
                "thumbnail_url": thumbnail_url,
            },
        )
        db.add(lesson)
        await db.commit()
    except Exception:
        await db.rollback()
        delete_public_file(stored_video.public_url)
        if thumbnail_url:
            delete_public_file(thumbnail_url)
        raise
    return await _load_course(db, course_id)
