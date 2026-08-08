from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

import asyncpg


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402


EXPECTED_HEAD = "d3a7f9c2e5b1"
REQUIRED_TABLES = {
    "auth_challenges",
    "auth_sessions",
    "content_reports",
    "legal_acceptances",
    "mfa_backup_codes",
    "moderation_actions",
    "rate_limit_buckets",
    "security_audit_events",
    "user_blocks",
}
REQUIRED_USER_COLUMNS = {
    "email_verified_at",
    "failed_login_attempts",
    "locked_until",
    "mfa_enabled",
    "mfa_last_used_step",
    "mfa_pending_secret_ciphertext",
    "mfa_secret_ciphertext",
    "password_changed_at",
    "phone_verified_at",
    "role",
}
REQUIRED_INDEXES = {
    "ix_auth_sessions_user_active",
    "ix_content_reports_status_created",
    "ix_rate_limit_buckets_expires_at",
    "uq_content_reports_active_report",
}


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
                "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
            )
        }
        user_columns = {
            row["column_name"]
            for row in await connection.fetch(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'users'
                """
            )
        }
        indexes = {
            row["indexname"]: row["indexdef"]
            for row in await connection.fetch(
                """
                SELECT indexname, indexdef
                FROM pg_catalog.pg_indexes
                WHERE schemaname = 'public'
                """
            )
        }
        role_constraint = await connection.fetchval(
            """
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conname = 'ck_users_role'
            """
        )
    finally:
        await connection.close()

    missing_tables = REQUIRED_TABLES - tables
    missing_columns = REQUIRED_USER_COLUMNS - user_columns
    missing_indexes = REQUIRED_INDEXES - indexes.keys()
    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    if missing_tables:
        raise RuntimeError(f"Security tables are missing: {sorted(missing_tables)}")
    if missing_columns:
        raise RuntimeError(f"User security columns are missing: {sorted(missing_columns)}")
    if missing_indexes:
        raise RuntimeError(f"Security indexes are missing: {sorted(missing_indexes)}")
    if "WHERE" not in indexes["uq_content_reports_active_report"].upper():
        raise RuntimeError("The active-report uniqueness index is not partial")
    if not role_constraint or not all(role in role_constraint for role in ("user", "moderator", "admin")):
        raise RuntimeError("The user role check constraint is incomplete")

    return {
        "alembic_head": head,
        "required_tables": len(REQUIRED_TABLES),
        "required_user_columns": len(REQUIRED_USER_COLUMNS),
        "required_indexes": len(REQUIRED_INDEXES),
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
