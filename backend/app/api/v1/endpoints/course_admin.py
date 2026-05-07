from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.course import Course, CourseSection, Lesson, Subcategory
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
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/courses", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
async def create_course(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
    course_in: schemas.CourseCreate,
) -> Any:
    """
    Create a course with the minimum data needed for the explore/watch flow.
    """
    _ = current_user

    subcategory = await db.get(Subcategory, course_in.subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    existing = await db.execute(select(Course).where(Course.slug == course_in.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Course slug already exists")

    course = Course(
        subcategory_id=course_in.subcategory_id,
        title=course_in.title,
        slug=course_in.slug,
        description=course_in.description,
        cover_image_url=course_in.cover_image_url,
        level=course_in.level,
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
) -> Any:
    """
    Add a section to an existing course.
    """
    _ = current_user

    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    section = CourseSection(
        course_id=course_id,
        title=section_in.title,
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
) -> Any:
    """
    Add a lesson to an existing section.
    """
    _ = current_user

    section = await db.get(CourseSection, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    if not lesson_in.video_url:
        raise HTTPException(status_code=400, detail="video_url is required")

    lesson = Lesson(
        course_id=section.course_id,
        section_id=section_id,
        title=lesson_in.title,
        video_url=lesson_in.video_url,
        duration_minutes=lesson_in.duration_minutes,
        is_free=lesson_in.is_free,
        metadata_json=lesson_in.metadata_json,
    )
    db.add(lesson)
    await db.commit()
    return await _load_course(db, section.course_id)
