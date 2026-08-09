from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

import asyncpg


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402


EXPECTED_HEAD = "a2c4e6f8b1d3"
REQUIRED_COLUMNS = {"admin_reply", "responded_by", "responded_at"}
REQUIRED_INDEXES = {
    "ix_support_tickets_responded_by",
    "ix_support_tickets_status_created_at",
}
REQUIRED_FOREIGN_KEY = "fk_support_tickets_responded_by_users"


async def verify() -> dict[str, object]:
    database_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1,
    )
    connection = await asyncpg.connect(database_url)
    try:
        head = await connection.fetchval("SELECT version_num FROM alembic_version")
        columns = {
            row["column_name"]
            for row in await connection.fetch(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'support_tickets'
                """
            )
        }
        indexes = {
            row["indexname"]
            for row in await connection.fetch(
                """
                SELECT indexname
                FROM pg_catalog.pg_indexes
                WHERE schemaname = 'public' AND tablename = 'support_tickets'
                """
            )
        }
        foreign_key = await connection.fetchval(
            """
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conname = $1
            """,
            REQUIRED_FOREIGN_KEY,
        )
    finally:
        await connection.close()

    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    missing_columns = REQUIRED_COLUMNS - columns
    if missing_columns:
        raise RuntimeError(f"Support columns are missing: {sorted(missing_columns)}")
    missing_indexes = REQUIRED_INDEXES - indexes
    if missing_indexes:
        raise RuntimeError(f"Support indexes are missing: {sorted(missing_indexes)}")
    if not foreign_key or "ON DELETE SET NULL" not in foreign_key:
        raise RuntimeError("Support responder foreign key is missing ON DELETE SET NULL")

    return {
        "alembic_head": head,
        "support_columns": sorted(REQUIRED_COLUMNS),
        "support_indexes": sorted(REQUIRED_INDEXES),
        "responder_foreign_key": REQUIRED_FOREIGN_KEY,
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
