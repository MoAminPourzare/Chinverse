"""
Non-destructive database health check.

Run from the backend folder:
    python check_db.py

This does not create, update, truncate, or delete anything.
"""

import asyncio
import os
import sys
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import text

sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from seed_lms import SUBCATEGORIES, validate_seed_catalog


BACKEND_DIR = Path(__file__).resolve().parent

REQUIRED_TABLES = {
    "alembic_version",
    "categories",
    "subcategories",
    "courses",
    "course_sections",
    "lessons",
    "dictionary_words",
    "users",
    "user_profiles",
    "user_flashcards",
}

REQUIRED_COLUMNS = {
    "categories": {"id", "name", "slug"},
    "subcategories": {"id", "category_id", "name", "slug"},
    "courses": {"id", "subcategory_id", "title", "slug", "metadata_json"},
    "course_sections": {"id", "course_id", "title", "order_index", "metadata_json"},
    "lessons": {"id", "course_id", "section_id", "title", "video_url", "metadata_json"},
    "user_flashcards": {"id", "user_id", "word_id", "box_number", "next_review_at"},
}

COUNT_TABLES = [
    "categories",
    "subcategories",
    "courses",
    "course_sections",
    "lessons",
    "users",
    "dictionary_words",
]

ORPHAN_CHECKS = {
    "subcategories_without_category": """
        SELECT COUNT(*)
        FROM subcategories s
        LEFT JOIN categories c ON c.id = s.category_id
        WHERE c.id IS NULL
    """,
    "courses_without_subcategory": """
        SELECT COUNT(*)
        FROM courses c
        LEFT JOIN subcategories s ON s.id = c.subcategory_id
        WHERE s.id IS NULL
    """,
    "sections_without_course": """
        SELECT COUNT(*)
        FROM course_sections cs
        LEFT JOIN courses c ON c.id = cs.course_id
        WHERE c.id IS NULL
    """,
    "lessons_without_course_or_section": """
        SELECT COUNT(*)
        FROM lessons l
        LEFT JOIN courses c ON c.id = l.course_id
        LEFT JOIN course_sections cs ON cs.id = l.section_id
        WHERE c.id IS NULL OR cs.id IS NULL
    """,
}


def get_alembic_heads() -> list[str]:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    return list(script.get_heads())


async def fetch_scalar(session, sql: str, params: dict | None = None):
    result = await session.execute(text(sql), params or {})
    return result.scalar()


async def fetch_scalars(session, sql: str, params: dict | None = None) -> list:
    result = await session.execute(text(sql), params or {})
    return list(result.scalars().all())


async def check_database() -> int:
    failures = 0

    print("Checking seed catalog...")
    try:
        validate_seed_catalog()
        print("OK seed catalog is internally consistent.")
    except Exception as exc:
        print(f"FAIL seed catalog is invalid: {exc}")
        failures += 1

    async with SessionLocal() as session:
        print("\nChecking database connection...")
        value = await fetch_scalar(session, "SELECT 1")
        if value == 1:
            print("OK database connection works.")
        else:
            print("FAIL database connection returned an unexpected result.")
            failures += 1

        existing_tables = set(
            await fetch_scalars(
                session,
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """,
            )
        )

        print("\nChecking Alembic migration revision...")
        heads = get_alembic_heads()
        if "alembic_version" not in existing_tables:
            print("FAIL alembic_version table does not exist. Run migrations first.")
            failures += 1
        else:
            current_revisions = await fetch_scalars(session, "SELECT version_num FROM alembic_version")
            if not current_revisions:
                print("FAIL alembic_version table is empty.")
                failures += 1
            elif set(current_revisions) == set(heads):
                print(f"OK database is at Alembic head: {', '.join(heads)}")
            else:
                print(f"FAIL database revision is {current_revisions}, expected head {heads}")
                failures += 1

        print("\nChecking required tables...")
        missing_tables = sorted(REQUIRED_TABLES - existing_tables)
        if missing_tables:
            print("FAIL missing required tables: " + ", ".join(missing_tables))
            failures += 1
        else:
            print("OK all required tables exist.")

        print("\nChecking required columns...")
        for table_name, required_columns in REQUIRED_COLUMNS.items():
            if table_name not in existing_tables:
                continue

            existing_columns = set(
                await fetch_scalars(
                    session,
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = :table_name
                    """,
                    {"table_name": table_name},
                )
            )
            missing_columns = sorted(required_columns - existing_columns)
            if missing_columns:
                print(f"FAIL {table_name} missing columns: {', '.join(missing_columns)}")
                failures += 1
            else:
                print(f"OK {table_name} columns are ready.")

        print("\nChecking LMS seed coverage...")
        expected_subcategory_slugs = {
            item["slug"]
            for subcategory_items in SUBCATEGORIES.values()
            for item in subcategory_items
        }
        if "subcategories" in existing_tables:
            existing_subcategory_slugs = set(
                await fetch_scalars(session, "SELECT slug FROM subcategories")
            )
            missing_seed_slugs = sorted(expected_subcategory_slugs - existing_subcategory_slugs)
            if missing_seed_slugs:
                print("WARN seed data has not created these subcategories yet: " + ", ".join(missing_seed_slugs))
            else:
                print("OK expected LMS subcategories exist in the database.")

        print("\nCounting core records...")
        for table_name in COUNT_TABLES:
            if table_name in existing_tables:
                count = await fetch_scalar(session, f"SELECT COUNT(*) FROM {table_name}")
                print(f"{table_name}: {count}")

        print("\nChecking orphan LMS records...")
        for check_name, sql in ORPHAN_CHECKS.items():
            required = {
                "subcategories",
                "categories",
                "courses",
                "course_sections",
                "lessons",
            }
            if not required.issubset(existing_tables):
                continue

            count = await fetch_scalar(session, sql)
            if count:
                print(f"FAIL {check_name}: {count}")
                failures += 1
            else:
                print(f"OK {check_name}: 0")

    return failures


async def main() -> None:
    failures = await check_database()
    if failures:
        raise SystemExit(1)
    print("\nDatabase health check passed.")


if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
