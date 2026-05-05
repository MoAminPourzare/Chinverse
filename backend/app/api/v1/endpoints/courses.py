from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.course import Course, CourseSection, Lesson, Category, Subcategory
from app.schemas import course as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Course])
async def read_courses(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_slug: str = None,
    subcategory_slug: str = None,
) -> Any:
    """
    Retrieve courses.

    category_slug filters top-level categories such as "chinese-learning".
    subcategory_slug filters explore sections such as "series" or "grammar".
    For older frontend calls, category_slug also accepts subcategory slugs.
    """
    query = select(Course).options(
        selectinload(Course.sections).selectinload(CourseSection.lessons)
    )

    if category_slug or subcategory_slug:
        query = query.join(Course.subcategory).join(Subcategory.category)

    if category_slug:
        query = query.where(
            or_(
                Category.slug == category_slug,
                Subcategory.slug == category_slug,
            )
        )

    if subcategory_slug:
        query = query.where(Subcategory.slug == subcategory_slug)
    
    result = await db.execute(query.order_by(Course.id).offset(skip).limit(limit))
    courses = result.scalars().all()
    return courses

@router.get("/by-slug/{slug}", response_model=schemas.Course)
async def read_course_by_slug(
    *,
    db: AsyncSession = Depends(deps.get_db),
    slug: str,
) -> Any:
    """
    Get course by slug.
    """
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.sections).selectinload(CourseSection.lessons)
        )
        .where(Course.slug == slug)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{id}", response_model=schemas.Course)
async def read_course(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get course by ID.
    """
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.sections).selectinload(CourseSection.lessons)
        )
        .where(Course.id == id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{id}/lessons", response_model=List[schemas.Lesson])
async def read_course_lessons(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lessons for a course.
    """
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.sections).selectinload(CourseSection.lessons)
        )
        .where(Course.id == id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Return all lessons from all sections, flattened
    lessons = []
    for section in sorted(course.sections, key=lambda item: item.order_index):
        lessons.extend(section.lessons)
    
    return sorted(lessons, key=lambda item: item.id)

@router.get("/lessons/{id}", response_model=schemas.Lesson)
async def read_lesson(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lesson by ID.
    """
    lesson = await db.get(Lesson, id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
