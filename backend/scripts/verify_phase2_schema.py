from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

import asyncpg


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402


EXPECTED_HEAD = "c8f1e2a4d6b9"
REQUIRED_TABLES = {
    "study_sessions",
    "subscription_orders",
    "subscription_plans",
    "user_flashcards",
    "user_lesson_watch_progress",
    "user_notifications",
    "user_referral_codes",
    "user_referrals",
    "user_saved_courses",
    "user_subscriptions",
}
REMOVED_TABLES = {
    "consultation_requests",
    "course_reviews",
    "leitner_cards",
    "services",
    "user_streaks",
}
EXPECTED_PLAN_IDS = {1001, 1002, 1003}


async def verify() -> dict[str, object]:
    database_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1,
    )
    connection = await asyncpg.connect(database_url)
    try:
        head = await connection.fetchval("SELECT version_num FROM alembic_version")
        tables = {
            row["tablename"]
            for row in await connection.fetch(
                """
                SELECT tablename
                FROM pg_catalog.pg_tables
                WHERE schemaname = 'public'
                """
            )
        }
        plan_ids = {
            int(row["id"])
            for row in await connection.fetch(
                "SELECT id FROM subscription_plans WHERE id = ANY($1::bigint[])",
                list(EXPECTED_PLAN_IDS),
            )
        }
    finally:
        await connection.close()

    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    missing = REQUIRED_TABLES - tables
    if missing:
        raise RuntimeError(f"Required tables are missing: {sorted(missing)}")
    remaining = REMOVED_TABLES & tables
    if remaining:
        raise RuntimeError(f"Legacy tables still exist: {sorted(remaining)}")
    if plan_ids != EXPECTED_PLAN_IDS:
        raise RuntimeError(f"Default subscription plans are incomplete: {sorted(plan_ids)}")

    return {
        "alembic_head": head,
        "required_tables": len(REQUIRED_TABLES),
        "removed_tables": len(REMOVED_TABLES),
        "default_subscription_plans": sorted(plan_ids),
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
