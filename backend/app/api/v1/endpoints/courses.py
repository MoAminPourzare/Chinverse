from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.models.course import Course, CourseSection, Lesson, Category, Subcategory
from app.schemas import course as schemas

router = APIRouter()


@router.get("/taxonomy", response_model=List[schemas.CategorySummary])
async def read_course_taxonomy(
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Return categories and subcategories for simple content management screens.
    """
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.subcategories))
        .order_by(Category.name)
    )
    return result.scalars().unique().all()

@router.get("/", response_model=List[schemas.Course])
async def read_courses(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=100)),
    category_slug: Optional[str] = None,
    subcategory_slug: Optional[str] = None,
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
                func.lower(Category.slug) == category_slug.lower(),
                func.lower(Subcategory.slug) == category_slug.lower(),
            )
        )

    if subcategory_slug:
        query = query.where(func.lower(Subcategory.slug) == subcategory_slug.lower())
    
    result = await db.execute(
        query.order_by(Course.id).offset(pagination.skip).limit(pagination.limit)
    )
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
        .where(func.lower(Course.slug) == slug.lower())
    )
    course = result.scalar_one_or_none()
    if not course:
        raise not_found("Course")
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
        raise not_found("Course")
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
        raise not_found("Course")
    
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
        raise not_found("Lesson")
    return lesson
