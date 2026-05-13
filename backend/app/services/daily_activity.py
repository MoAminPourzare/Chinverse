from __future__ import annotations

from datetime import date, datetime, timedelta
from math import ceil
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

APP_TIMEZONE = "Asia/Tehran"


def today_local() -> date:
    try:
        return datetime.now(ZoneInfo(APP_TIMEZONE)).date()
    except Exception:
        return datetime.utcnow().date()


async def ensure_daily_activity_storage(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            ALTER TABLE study_sessions
            ADD COLUMN IF NOT EXISTS watched_seconds INTEGER NOT NULL DEFAULT 0
            """
        )
    )
    await db.execute(
        text(
            """
            ALTER TABLE study_sessions
            ADD COLUMN IF NOT EXISTS reviewed_words_count INTEGER NOT NULL DEFAULT 0
            """
        )
    )
    await db.execute(
        text(
            """
            UPDATE study_sessions
            SET watched_seconds = GREATEST(watched_seconds, minutes * 60)
            WHERE watched_seconds = 0 AND minutes > 0
            """
        )
    )
    await db.execute(
        text(
            """
            WITH grouped AS (
                SELECT
                    user_id,
                    date,
                    MIN(id) AS keep_id,
                    SUM(minutes) AS total_minutes,
                    SUM(learned_words_count) AS total_learned_words,
                    SUM(watched_seconds) AS total_watched_seconds,
                    SUM(reviewed_words_count) AS total_reviewed_words
                FROM study_sessions
                GROUP BY user_id, date
                HAVING COUNT(*) > 1
            )
            UPDATE study_sessions s
            SET
                minutes = grouped.total_minutes,
                learned_words_count = grouped.total_learned_words,
                watched_seconds = grouped.total_watched_seconds,
                reviewed_words_count = grouped.total_reviewed_words,
                updated_at = now()
            FROM grouped
            WHERE s.id = grouped.keep_id
            """
        )
    )
    await db.execute(
        text(
            """
            DELETE FROM study_sessions s
            USING study_sessions keep
            WHERE
                s.user_id = keep.user_id
                AND s.date = keep.date
                AND s.id > keep.id
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS uq_study_sessions_user_date
            ON study_sessions (user_id, date)
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_lesson_watch_progress (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                watched_seconds INTEGER NOT NULL DEFAULT 0,
                last_position_seconds INTEGER NOT NULL DEFAULT 0,
                completed BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT uq_user_lesson_watch_progress_day UNIQUE (user_id, lesson_id, date)
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_lesson_watch_progress_user_date
            ON user_lesson_watch_progress (user_id, date)
            """
        )
    )


async def record_video_watch(
    db: AsyncSession,
    *,
    user_id: int,
    lesson_id: int,
    seconds_delta: int,
    position_seconds: int = 0,
    duration_seconds: int = 0,
) -> dict[str, Any]:
    await ensure_daily_activity_storage(db)
    safe_delta = max(0, min(int(seconds_delta), 300))
    activity_date = today_local()
    if safe_delta <= 0:
        return await get_today_activity(db, user_id=user_id)

    completed = bool(duration_seconds > 0 and position_seconds >= max(duration_seconds - 20, duration_seconds * 0.9))
    await db.execute(
        text(
            """
            INSERT INTO user_lesson_watch_progress (
                user_id, lesson_id, date, watched_seconds, last_position_seconds, completed
            )
            VALUES (
                :user_id, :lesson_id, :activity_date, :seconds_delta, :position_seconds, :completed
            )
            ON CONFLICT (user_id, lesson_id, date)
            DO UPDATE SET
                watched_seconds = user_lesson_watch_progress.watched_seconds + EXCLUDED.watched_seconds,
                last_position_seconds = GREATEST(
                    user_lesson_watch_progress.last_position_seconds,
                    EXCLUDED.last_position_seconds
                ),
                completed = user_lesson_watch_progress.completed OR EXCLUDED.completed,
                updated_at = now()
            """
        ),
        {
            "user_id": user_id,
            "lesson_id": lesson_id,
            "activity_date": activity_date,
            "seconds_delta": safe_delta,
            "position_seconds": max(0, int(position_seconds)),
            "completed": completed,
        },
    )
    await _increment_study_session(
        db,
        user_id=user_id,
        activity_date=activity_date,
        watched_seconds_delta=safe_delta,
        learned_words_delta=0,
        reviewed_words_delta=0,
    )
    await refresh_user_streak(db, user_id=user_id)
    await db.commit()
    return await get_today_activity(db, user_id=user_id)


async def record_words_learned(
    db: AsyncSession,
    *,
    user_id: int,
    count: int = 1,
    commit: bool = True,
) -> None:
    await ensure_daily_activity_storage(db)
    activity_date = today_local()
    safe_count = max(0, min(int(count), 100))
    if safe_count <= 0:
        return
    await _increment_study_session(
        db,
        user_id=user_id,
        activity_date=activity_date,
        watched_seconds_delta=0,
        learned_words_delta=safe_count,
        reviewed_words_delta=safe_count,
    )
    await refresh_user_streak(db, user_id=user_id)
    if commit:
        await db.commit()


async def _increment_study_session(
    db: AsyncSession,
    *,
    user_id: int,
    activity_date: date,
    watched_seconds_delta: int,
    learned_words_delta: int,
    reviewed_words_delta: int,
) -> None:
    await db.execute(
        text(
            """
            INSERT INTO study_sessions (
                user_id,
                date,
                minutes,
                learned_words_count,
                watched_seconds,
                reviewed_words_count
            )
            VALUES (
                :user_id,
                :activity_date,
                CEIL(:watched_seconds_delta / 60.0)::integer,
                :learned_words_delta,
                :watched_seconds_delta,
                :reviewed_words_delta
            )
            ON CONFLICT (user_id, date)
            DO UPDATE SET
                watched_seconds = study_sessions.watched_seconds + EXCLUDED.watched_seconds,
                learned_words_count = study_sessions.learned_words_count + EXCLUDED.learned_words_count,
                reviewed_words_count = study_sessions.reviewed_words_count + EXCLUDED.reviewed_words_count,
                minutes = CEIL((study_sessions.watched_seconds + EXCLUDED.watched_seconds) / 60.0)::integer,
                updated_at = now()
            """
        ),
        {
            "user_id": user_id,
            "activity_date": activity_date,
            "watched_seconds_delta": max(0, watched_seconds_delta),
            "learned_words_delta": max(0, learned_words_delta),
            "reviewed_words_delta": max(0, reviewed_words_delta),
        },
    )


async def get_today_activity(db: AsyncSession, *, user_id: int) -> dict[str, Any]:
    await ensure_daily_activity_storage(db)
    activity_date = today_local()
    result = await db.execute(
        text(
            """
            SELECT
                COALESCE(minutes, 0) AS minutes,
                COALESCE(watched_seconds, 0) AS watched_seconds,
                COALESCE(learned_words_count, 0) AS learned_words_count,
                COALESCE(reviewed_words_count, 0) AS reviewed_words_count
            FROM study_sessions
            WHERE user_id = :user_id AND date = :activity_date
            """
        ),
        {"user_id": user_id, "activity_date": activity_date},
    )
    row = result.mappings().one_or_none()
    if not row:
        return {
            "date": activity_date.isoformat(),
            "minutes": 0,
            "watched_seconds": 0,
            "learned_words_count": 0,
            "reviewed_words_count": 0,
            "is_active": False,
        }
    return {
        "date": activity_date.isoformat(),
        "minutes": int(row["minutes"] or 0),
        "watched_seconds": int(row["watched_seconds"] or 0),
        "learned_words_count": int(row["learned_words_count"] or 0),
        "reviewed_words_count": int(row["reviewed_words_count"] or 0),
        "is_active": _is_active(row),
    }


async def get_activity_summary(db: AsyncSession, *, user_id: int, days: int = 42) -> dict[str, Any]:
    await ensure_daily_activity_storage(db)
    resolved_days = max(7, min(days, 370))
    today = today_local()
    start_date = today - timedelta(days=resolved_days - 1)

    rows_result = await db.execute(
        text(
            """
            SELECT
                date,
                COALESCE(minutes, 0) AS minutes,
                COALESCE(watched_seconds, 0) AS watched_seconds,
                COALESCE(learned_words_count, 0) AS learned_words_count,
                COALESCE(reviewed_words_count, 0) AS reviewed_words_count
            FROM study_sessions
            WHERE user_id = :user_id AND date BETWEEN :start_date AND :today
            ORDER BY date ASC
            """
        ),
        {"user_id": user_id, "start_date": start_date, "today": today},
    )
    rows_by_date = {row["date"]: row for row in rows_result.mappings().all()}

    calendar = []
    for offset in range(resolved_days):
        current_date = start_date + timedelta(days=offset)
        row = rows_by_date.get(current_date)
        minutes = int(row["minutes"] or 0) if row else 0
        watched_seconds = int(row["watched_seconds"] or 0) if row else 0
        learned_words = int(row["learned_words_count"] or 0) if row else 0
        reviewed_words = int(row["reviewed_words_count"] or 0) if row else 0
        active = watched_seconds > 0 or learned_words > 0
        calendar.append(
            {
                "date": current_date.isoformat(),
                "minutes": minutes,
                "watched_seconds": watched_seconds,
                "learned_words_count": learned_words,
                "reviewed_words_count": reviewed_words,
                "is_active": active,
                "intensity": _activity_intensity(minutes, learned_words),
            }
        )

    total_result = await db.execute(
        text(
            """
            SELECT
                COALESCE(SUM(minutes), 0) AS total_minutes,
                COALESCE(SUM(watched_seconds), 0) AS total_watched_seconds,
                COALESCE(SUM(learned_words_count), 0) AS total_learned_words,
                COALESCE(SUM(reviewed_words_count), 0) AS total_reviewed_words,
                COUNT(*) FILTER (WHERE watched_seconds > 0 OR learned_words_count > 0) AS active_days
            FROM study_sessions
            WHERE user_id = :user_id
            """
        ),
        {"user_id": user_id},
    )
    totals = total_result.mappings().one()

    streak = await refresh_user_streak(db, user_id=user_id, commit=False)
    today_activity = await get_today_activity(db, user_id=user_id)
    learning_stats = await _learning_stats(db, user_id=user_id)
    await db.commit()

    recent = calendar[-7:]
    weekly_minutes_max = max([day["minutes"] for day in recent] + [1])
    weekly_words_max = max([day["learned_words_count"] for day in recent] + [1])

    return {
        "today": today_activity,
        "streak": streak,
        "totals": {
            "minutes": int(totals["total_minutes"] or 0),
            "watched_seconds": int(totals["total_watched_seconds"] or 0),
            "learned_words_count": int(totals["total_learned_words"] or 0),
            "reviewed_words_count": int(totals["total_reviewed_words"] or 0),
            "active_days": int(totals["active_days"] or 0),
        },
        "calendar": calendar,
        "weekly_chart": [
            {
                **day,
                "minutes_ratio": day["minutes"] / weekly_minutes_max,
                "words_ratio": day["learned_words_count"] / weekly_words_max,
            }
            for day in recent
        ],
        "learning": learning_stats,
    }


async def refresh_user_streak(
    db: AsyncSession,
    *,
    user_id: int,
    commit: bool = True,
) -> dict[str, int | str | None]:
    await ensure_daily_activity_storage(db)
    result = await db.execute(
        text(
            """
            SELECT date
            FROM study_sessions
            WHERE user_id = :user_id AND (watched_seconds > 0 OR learned_words_count > 0)
            ORDER BY date ASC
            """
        ),
        {"user_id": user_id},
    )
    active_dates = [row[0] for row in result.all()]
    active_set = set(active_dates)
    today = today_local()

    current = 0
    cursor = today if today in active_set else today - timedelta(days=1)
    while cursor in active_set:
        current += 1
        cursor -= timedelta(days=1)

    longest = 0
    running = 0
    previous: date | None = None
    for active_date in active_dates:
        if previous and active_date == previous + timedelta(days=1):
            running += 1
        else:
            running = 1
        longest = max(longest, running)
        previous = active_date

    await db.execute(
        text(
            """
            INSERT INTO user_streaks (user_id, current_streak_days, longest_streak_days)
            VALUES (:user_id, :current, :longest)
            ON CONFLICT (user_id)
            DO UPDATE SET
                current_streak_days = EXCLUDED.current_streak_days,
                longest_streak_days = GREATEST(user_streaks.longest_streak_days, EXCLUDED.longest_streak_days),
                updated_at = now()
            """
        ),
        {"user_id": user_id, "current": current, "longest": longest},
    )
    if commit:
        await db.commit()

    return {
        "current_days": current,
        "longest_days": longest,
        "last_active_date": max(active_dates).isoformat() if active_dates else None,
    }


async def _learning_stats(db: AsyncSession, *, user_id: int) -> dict[str, int]:
    due_result = await db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM user_flashcards
            WHERE user_id = :user_id AND next_review_at <= now()
            """
        ),
        {"user_id": user_id},
    )
    mastered_result = await db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM user_flashcards
            WHERE user_id = :user_id AND box_number >= 5
            """
        ),
        {"user_id": user_id},
    )
    total_result = await db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM user_flashcards
            WHERE user_id = :user_id
            """
        ),
        {"user_id": user_id},
    )
    return {
        "due_flashcards": int(due_result.scalar() or 0),
        "mastered_words": int(mastered_result.scalar() or 0),
        "total_flashcards": int(total_result.scalar() or 0),
    }


def _is_active(row: Any) -> bool:
    return int(row["watched_seconds"] or 0) > 0 or int(row["learned_words_count"] or 0) > 0


def _activity_intensity(minutes: int, learned_words: int) -> int:
    score = minutes + learned_words * 2
    if score <= 0:
        return 0
    if score < 5:
        return 1
    if score < 15:
        return 2
    if score < 30:
        return 3
    return 4
