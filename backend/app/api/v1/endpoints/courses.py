from typing import Any, List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import bindparam, or_, select, func, text
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.course import Course, CourseSection, Lesson, Category, Subcategory
from app.models.social import ContentLike
from app.schemas import course as schemas

router = APIRouter()


async def _ensure_saved_courses_storage(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_saved_courses (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT uq_user_saved_courses_user_course UNIQUE (user_id, course_id)
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_saved_courses_user_created
            ON user_saved_courses (user_id, created_at)
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_saved_courses_course_id
            ON user_saved_courses (course_id)
            """
        )
    )
    await db.commit()


async def _read_lessons_for_courses(
    db: AsyncSession,
    course_ids: list[int],
) -> dict[int, list[dict[str, Any]]]:
    if not course_ids:
        return {}

    stmt = text(
        """
        SELECT id, course_id, section_id, title, video_url, duration_minutes, is_free
        FROM lessons
        WHERE course_id IN :course_ids
        ORDER BY section_id, id
        """
    ).bindparams(bindparam("course_ids", expanding=True))
    result = await db.execute(stmt, {"course_ids": course_ids})

    lessons_by_section: dict[int, list[dict[str, Any]]] = {}
    for row in result.mappings().all():
        lesson = {
            "id": row["id"],
            "course_id": row["course_id"],
            "section_id": row["section_id"],
            "title": row["title"],
            "video_url": row["video_url"],
            "thumbnail_url": None,
            "duration_minutes": row["duration_minutes"] or 0,
            "media_id": None,
            "is_free": bool(row["is_free"]),
            "metadata_json": {},
        }
        lessons_by_section.setdefault(row["section_id"], []).append(lesson)

    return lessons_by_section


async def _read_course_like_counts(
    db: AsyncSession,
    course_ids: list[int],
) -> dict[int, int]:
    if not course_ids:
        return {}
    result = await db.execute(
        select(ContentLike.target_id, func.count(ContentLike.id))
        .where(ContentLike.target_type == "course", ContentLike.target_id.in_(course_ids))
        .group_by(ContentLike.target_id)
    )
    return {int(course_id): int(count or 0) for course_id, count in result.all()}


def _course_to_response(
    course: Course,
    lessons_by_section: dict[int, list[dict[str, Any]]],
    like_counts: dict[int, int] | None = None,
) -> dict[str, Any]:
    sections = sorted(course.sections or [], key=lambda item: (item.order_index, item.id))

    return {
        "id": course.id,
        "subcategory_id": course.subcategory_id,
        "subcategory_slug": course.subcategory.slug if course.subcategory else None,
        "title": course.title,
        "slug": course.slug,
        "description": course.description,
        "cover_image_url": course.cover_image_url,
        "level": course.level,
        "metadata_json": course.metadata_json or {},
        "likes_count": (like_counts or {}).get(course.id, 0),
        "sections": [
            {
                "id": section.id,
                "title": section.title,
                "order_index": section.order_index,
                "metadata_json": section.metadata_json or {},
                "lessons": lessons_by_section.get(section.id, []),
            }
            for section in sections
        ],
    }


def _raw_course_to_response(
    row: Any,
    lessons_by_section: dict[int, list[dict[str, Any]]],
    like_counts: dict[int, int] | None = None,
) -> dict[str, Any]:
    return {
        "id": row["id"],
        "subcategory_id": row["subcategory_id"],
        "subcategory_slug": row["subcategory_slug"],
        "title": row["title"],
        "slug": row["slug"],
        "description": row["description"],
        "cover_image_url": row["cover_image_url"],
        "level": row["level"],
        "metadata_json": row["metadata_json"] or {},
        "likes_count": (like_counts or {}).get(row["id"], 0),
        "sections": [
            {
                "id": section["id"],
                "title": section["title"],
                "order_index": section["order_index"],
                "metadata_json": section["metadata_json"] or {},
                "lessons": lessons_by_section.get(section["id"], []),
            }
            for section in row["sections"]
        ],
    }


async def _read_raw_courses_by_ids(
    db: AsyncSession,
    course_ids: list[int],
) -> list[dict[str, Any]]:
    if not course_ids:
        return []

    course_stmt = text(
        """
        SELECT c.id, c.subcategory_id, s.slug AS subcategory_slug, c.title, c.slug,
               c.description, c.cover_image_url, c.level, c.metadata_json
        FROM courses c
        LEFT JOIN subcategories s ON s.id = c.subcategory_id
        WHERE c.id IN :course_ids
        """
    ).bindparams(bindparam("course_ids", expanding=True))
    course_rows = (await db.execute(course_stmt, {"course_ids": course_ids})).mappings().all()

    section_stmt = text(
        """
        SELECT id, course_id, title, order_index
        FROM course_sections
        WHERE course_id IN :course_ids
        ORDER BY order_index, id
        """
    ).bindparams(bindparam("course_ids", expanding=True))
    section_rows = (await db.execute(section_stmt, {"course_ids": course_ids})).mappings().all()

    sections_by_course: dict[int, list[dict[str, Any]]] = {}
    for section in section_rows:
        section_data = dict(section)
        section_data["metadata_json"] = {}
        sections_by_course.setdefault(section["course_id"], []).append(section_data)

    order = {course_id: index for index, course_id in enumerate(course_ids)}
    rows = []
    for course in course_rows:
        row = dict(course)
        row["sections"] = sections_by_course.get(course["id"], [])
        rows.append(row)

    return sorted(rows, key=lambda item: order.get(item["id"], 0))


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
        selectinload(Course.subcategory),
        selectinload(Course.sections),
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
    course_ids = [course.id for course in courses]
    lessons_by_section = await _read_lessons_for_courses(db, course_ids)
    like_counts = await _read_course_like_counts(db, course_ids)
    return [_course_to_response(course, lessons_by_section, like_counts) for course in courses]

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
            selectinload(Course.subcategory),
            selectinload(Course.sections),
        )
        .where(func.lower(Course.slug) == slug.lower())
    )
    course = result.scalar_one_or_none()
    if not course:
        raise not_found("Course")
    lessons_by_section = await _read_lessons_for_courses(db, [course.id])
    like_counts = await _read_course_like_counts(db, [course.id])
    return _course_to_response(course, lessons_by_section, like_counts)


@router.get("/saved", response_model=List[schemas.Course])
async def read_saved_courses(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=100)),
) -> Any:
    """
    Return courses bookmarked by the current user.
    """
    await _ensure_saved_courses_storage(db)
    result = await db.execute(
        text(
            """
            SELECT course_id
            FROM user_saved_courses
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            OFFSET :skip
            LIMIT :limit
            """
        ),
        {
            "user_id": current_user.id,
            "skip": pagination.skip,
            "limit": pagination.limit,
        },
    )
    course_ids = [row["course_id"] for row in result.mappings().all()]
    courses = await _read_raw_courses_by_ids(db, course_ids)
    lessons_by_section = await _read_lessons_for_courses(db, course_ids)
    like_counts = await _read_course_like_counts(db, course_ids)
    return [_raw_course_to_response(course, lessons_by_section, like_counts) for course in courses]


@router.get("/{id}/saved", response_model=schemas.SavedCourseState)
async def read_saved_course_state(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    id: int,
) -> Any:
    await _ensure_saved_courses_storage(db)
    result = await db.execute(
        text(
            """
            SELECT 1
            FROM user_saved_courses
            WHERE user_id = :user_id AND course_id = :course_id
            LIMIT 1
            """
        ),
        {
            "user_id": current_user.id,
            "course_id": id,
        },
    )
    return {"saved": result.scalar_one_or_none() is not None}


@router.post(
    "/{id}/save",
    response_model=schemas.SavedCourseState,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(write_rate_limit)],
)
async def save_course_for_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    id: int,
) -> Any:
    await _ensure_saved_courses_storage(db)
    course_exists = await db.scalar(select(Course.id).where(Course.id == id))
    if not course_exists:
        raise not_found("Course")

    await db.execute(
        text(
            """
            INSERT INTO user_saved_courses (user_id, course_id, updated_at)
            VALUES (:user_id, :course_id, now())
            ON CONFLICT (user_id, course_id)
            DO UPDATE SET updated_at = now()
            """
        ),
        {
            "user_id": current_user.id,
            "course_id": id,
        },
    )
    await db.commit()

    return {"saved": True}


@router.delete(
    "/{id}/save",
    response_model=schemas.SavedCourseState,
    dependencies=[Depends(write_rate_limit)],
)
async def unsave_course_for_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    id: int,
) -> Any:
    await _ensure_saved_courses_storage(db)
    await db.execute(
        text(
            """
            DELETE FROM user_saved_courses
            WHERE user_id = :user_id AND course_id = :course_id
            """
        )
        ,
        {
            "user_id": current_user.id,
            "course_id": id,
        },
    )
    await db.commit()

    return {"saved": False}


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
            selectinload(Course.subcategory),
            selectinload(Course.sections),
        )
        .where(Course.id == id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise not_found("Course")
    lessons_by_section = await _read_lessons_for_courses(db, [course.id])
    like_counts = await _read_course_like_counts(db, [course.id])
    return _course_to_response(course, lessons_by_section, like_counts)

@router.get("/{id}/lessons", response_model=List[schemas.Lesson])
async def read_course_lessons(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lessons for a course.
    """
    course_exists = await db.scalar(select(Course.id).where(Course.id == id))
    if not course_exists:
        raise not_found("Course")

    lessons_by_section = await _read_lessons_for_courses(db, [id])
    lessons = [
        lesson
        for section_lessons in lessons_by_section.values()
        for lesson in section_lessons
    ]
    return sorted(lessons, key=lambda item: item["id"])

@router.get("/lessons/{id}", response_model=schemas.Lesson)
async def read_lesson(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lesson by ID.
    """
    result = await db.execute(
        text(
            """
            SELECT id, course_id, section_id, title, video_url, duration_minutes, is_free
            FROM lessons
            WHERE id = :id
            """
        ),
        {"id": id},
    )
    row = result.mappings().one_or_none()
    if not row:
        raise not_found("Lesson")
    return {
        "id": row["id"],
        "course_id": row["course_id"],
        "section_id": row["section_id"],
        "title": row["title"],
        "video_url": row["video_url"],
        "thumbnail_url": None,
        "duration_minutes": row["duration_minutes"] or 0,
        "media_id": None,
        "is_free": bool(row["is_free"]),
        "metadata_json": {},
    }
