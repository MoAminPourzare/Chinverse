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
    if not course_in.cover_media_id:
        raise bad_request("A registered cover media asset is required")
    cover_media = await db.get(MediaAsset, course_in.cover_media_id)
    if not cover_media:
        raise not_found("Cover media asset")
    if str(getattr(cover_media.media_type, "value", cover_media.media_type)) != MediaType.IMAGE.value:
        raise bad_request("Course cover media must be an image asset")
    cover_image_url = cover_media.file_url
    level = course_in.level.strip().lower()
    if not title or not slug or not description or not cover_image_url or not level:
        raise bad_request("Course fields and a registered cover media asset cannot be empty")

    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        raise conflict("Course slug already exists")

    course = Course(
        subcategory_id=course_in.subcategory_id,
        title=title,
        slug=slug,
        description=description,
        cover_image_url=cover_image_url,
        cover_media_id=course_in.cover_media_id,
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
    if not lesson_in.media_id:
        raise bad_request("A registered lesson media asset is required")
    media = await db.get(MediaAsset, lesson_in.media_id)
    if not media:
        raise not_found("Media asset")
    if str(getattr(media.media_type, "value", media.media_type)) != MediaType.VIDEO.value:
        raise bad_request("Lesson media must be a video asset")
    # Keep the legacy column populated for old internal tooling, but all
    # public playback goes through the signed media workflow.
    video_url = media.file_url
    if not lesson_title or not video_url:
        raise bad_request("Lesson title and a media reference are required")

    thumbnail_url = lesson_in.thumbnail_url
    if lesson_in.poster_media_id:
        poster = await db.get(MediaAsset, lesson_in.poster_media_id)
        if not poster:
            raise not_found("Poster media asset")
        if str(getattr(poster.media_type, "value", poster.media_type)) != MediaType.IMAGE.value:
            raise bad_request("Lesson poster must be an image asset")
        thumbnail_url = poster.file_url

    lesson = Lesson(
        course_id=section.course_id,
        section_id=section_id,
        title=lesson_title,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        poster_media_id=lesson_in.poster_media_id,
        duration_minutes=lesson_in.duration_minutes,
        is_free=lesson_in.is_free,
        media_id=lesson_in.media_id,
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
        private_object=True,
    )

    thumbnail_url = None
    stored_thumbnail = None
    try:
        if thumbnail_file and thumbnail_file.filename:
            stored_thumbnail = await save_thumbnail_upload(
                thumbnail_file,
                destination_dir=THUMBNAILS_DIR,
                public_url_prefix="/uploads/thumbnails",
                private_object=True,
            )
            thumbnail_url = stored_thumbnail.public_url

        poster_media = None
        if stored_thumbnail:
            poster_media = MediaAsset(
                user_id=current_user.id,
                media_type=MediaType.IMAGE,
                file_url=stored_thumbnail.public_url,
                storage_provider=settings.FILE_STORAGE_MODE,
                storage_key=stored_thumbnail.storage_key,
                mime_type=stored_thumbnail.content_type,
                file_size_bytes=stored_thumbnail.size_bytes,
                metadata_json={
                    "origin": "course_lesson_poster",
                    "course_id": course_id,
                    "section_id": section_id,
                },
            )
            db.add(poster_media)

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
            poster_media_id=poster_media.id if poster_media else None,
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
        await delete_public_file(stored_video.public_url)
        if thumbnail_url:
            await delete_public_file(thumbnail_url)
        raise
    return await _load_course(db, course_id)
