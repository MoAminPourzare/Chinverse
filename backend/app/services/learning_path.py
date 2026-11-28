"""A stable, account-specific path built from the published lesson catalog.

HSK is the main curriculum. Other educational subjects are a fallback until
HSK is published. Beginner exploration videos alternate with curriculum
lessons, following the profile design. Nothing is synthesized for empty slots.
"""

import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import conflict, not_found

EDUCATIONAL_DOMAINS = ("hsk", "pronunciation", "characters", "grammar", "practical", "synonyms", "idioms", "classical")


def _number(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return default


def _level(row: Any) -> int:
    metadata = row["course_metadata"] or {}
    match = re.search(r"hsk[- ]?(\d)", row["slug"], flags=re.I)
    difficulty = str(row.get("course_level") or "").strip().lower()
    default_level = int(match[1]) if match else {"intermediate": 3, "advanced": 5, "متوسط": 3, "پیشرفته": 5}.get(difficulty, 1)
    return max(1, min(6, _number(metadata.get("hsk_level"), default_level)))


def _order(row: Any) -> tuple:
    metadata = row["lesson_metadata"] or {}
    # Upper volumes precede lower volumes; lexical order would reverse them.
    part = 1 if row["slug"].endswith("-xia") else 0
    return (
        _level(row), part, row["course_id"], row["section_order"], row["section_id"],
        _number(metadata.get("lesson_index"), row["lesson_id"]), row["lesson_id"],
    )


def build_learning_path(rows: list[Any], completed_ids: set[int]) -> dict[str, Any]:
    hsk = [row for row in rows if row["domain"] == "hsk"]
    curriculum = sorted(hsk or [row for row in rows if row["domain"] in EDUCATIONAL_DOMAINS], key=_order)
    recommendations = sorted([row for row in rows if row["domain"] not in EDUCATIONAL_DOMAINS], key=_order)
    ordered = []
    for row in curriculum:
        ordered.append((row, "lesson"))
        # Never push an explicitly advanced video into a beginner's path.
        recommended = next((item for item in recommendations if _level(item) <= _level(row)), None)
        if recommended is not None:
            recommendations.remove(recommended)
            ordered.append((recommended, "explore"))

    steps = []
    blocked = False
    completed_count = 0
    next_lesson_id = None
    for row, kind in ordered:
        if blocked:
            state = "locked"
        elif row["lesson_id"] in completed_ids:
            state = "completed"
            completed_count += 1
        else:
            state = "current"
            next_lesson_id = row["lesson_id"]
            blocked = True
        metadata = row["lesson_metadata"] or {}
        summary = metadata.get("summary") or metadata.get("subtitle") or ""
        steps.append({
            "lesson_id": row["lesson_id"], "course_id": row["course_id"],
            "course_title": row["course_title"], "domain": row["domain"],
            "title": row["title"], "summary": summary if isinstance(summary, str) else "",
            "duration_minutes": row["duration_minutes"] or 0,
            "cover_url": f"/api/v1/media/public-images/{row['cover_media_id']}" if row["cover_media_id"] else None,
            "kind": kind, "state": state,
        })
    return {"steps": steps, "completed_count": completed_count, "total_count": len(steps), "next_lesson_id": next_lesson_id}


async def get_learning_path(db: AsyncSession, *, user_id: int) -> dict[str, Any]:
    catalog = await db.execute(text("""
        SELECT l.id AS lesson_id, l.course_id, l.section_id, l.title, l.duration_minutes,
               l.metadata_json AS lesson_metadata, c.title AS course_title, c.slug,
               c.metadata_json AS course_metadata, c.level AS course_level, s.order_index AS section_order,
               sub.slug AS domain, COALESCE(poster.id, cover.id) AS cover_media_id
        FROM lessons l
        JOIN courses c ON c.id = l.course_id AND c.status = 'published'
        JOIN course_sections s ON s.id = l.section_id AND s.course_id = c.id
        JOIN subcategories sub ON sub.id = c.subcategory_id
        JOIN media_assets m ON m.id = l.media_id
          AND m.status = 'published' AND m.license_status = 'approved' AND m.media_type = 'video'
        LEFT JOIN media_assets cover ON cover.id = c.cover_media_id
          AND cover.status = 'published' AND cover.license_status = 'approved' AND cover.media_type = 'image'
        LEFT JOIN media_assets poster ON poster.id = l.poster_media_id
          AND poster.status = 'published' AND poster.license_status = 'approved' AND poster.media_type = 'image'
        WHERE l.status = 'published'
        ORDER BY c.id, s.order_index, s.id, l.id
    """))
    completed = await db.execute(text("""
        SELECT lesson_id FROM user_lesson_watch_progress
        WHERE user_id = :user_id
        GROUP BY lesson_id HAVING BOOL_OR(completed)
    """), {"user_id": user_id})
    return build_learning_path(list(catalog.mappings().all()), {row[0] for row in completed.all()})


async def require_learning_path_access(db: AsyncSession, *, user_id: int, lesson_id: int) -> None:
    path = await get_learning_path(db, user_id=user_id)
    step = next((step for step in path["steps"] if step["lesson_id"] == lesson_id), None)
    if step is None:
        raise not_found("Learning path lesson")
    if step["state"] == "locked":
        raise conflict("Watch the previous learning path step before opening this lesson")
