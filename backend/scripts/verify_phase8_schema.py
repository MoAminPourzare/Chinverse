"""Fail-closed database contract for Phase 8 beta/payment tables."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
import sys

import asyncpg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from scripts.schema_verification import repository_alembic_head  # noqa: E402


EXPECTED_HEAD = repository_alembic_head()
REQUIRED_TABLES = {"beta_invites", "beta_feedback", "payment_webhook_events"}
REQUIRED_COLUMNS = {
    "beta_invites": {
        "id",
        "code_hash",
        "email_hash",
        "status",
        "expires_at",
        "redeemed_at",
        "redeemed_by_user_id",
        "issued_by_user_id",
        "created_at",
        "updated_at",
    },
    "beta_feedback": {
        "id",
        "user_id",
        "kind",
        "rating",
        "message",
        "steps_to_reproduce",
        "route",
        "release_sha",
        "client_metadata",
        "status",
        "triage_note",
        "reviewed_at",
        "reviewed_by_user_id",
        "created_at",
        "updated_at",
    },
    "payment_webhook_events": {
        "id",
        "provider",
        "event_id",
        "event_type",
        "order_id",
        "payload_hash",
        "status",
        "processed_at",
        "error_code",
        "created_at",
        "updated_at",
    },
}
REQUIRED_INDEXES = {
    "uq_beta_invites_code_hash",
    "ix_beta_invites_email_status",
    "ix_beta_invites_expires_status",
    "ix_beta_feedback_status_created",
    "ix_beta_feedback_user_created",
    "ix_beta_feedback_release_created",
    "uq_payment_webhook_provider_event",
    "ix_payment_webhook_events_order_created",
}
REQUIRED_CHECK_CONSTRAINTS = {
    "ck_beta_invites_status",
    "ck_beta_feedback_rating",
    "ck_beta_feedback_status",
}
REQUIRED_FOREIGN_KEY_DELETE_RULES = {
    ("beta_invites", "redeemed_by_user_id"): "SET NULL",
    ("beta_invites", "issued_by_user_id"): "SET NULL",
    ("beta_feedback", "user_id"): "CASCADE",
    ("beta_feedback", "reviewed_by_user_id"): "SET NULL",
    ("payment_webhook_events", "order_id"): "SET NULL",
}


async def verify() -> dict[str, object]:
    database_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
    connection = await asyncpg.connect(database_url)
    try:
        head = await connection.fetchval("SELECT version_num FROM alembic_version")
        tables = {
            row["table_name"]
            for row in await connection.fetch(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            )
        }
        columns_by_table = {
            table: {
                row["column_name"]
                for row in await connection.fetch(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                    """,
                    table,
                )
            }
            for table in REQUIRED_COLUMNS
        }
        indexes = {
            row["indexname"]
            for row in await connection.fetch(
                "SELECT indexname FROM pg_catalog.pg_indexes WHERE schemaname = 'public'"
            )
        }
        check_constraints = {
            row["constraint_name"]
            for row in await connection.fetch(
                """
                SELECT constraint_name FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND constraint_type = 'CHECK'
                """
            )
        }
        foreign_key_delete_rules = {
            (row["table_name"], row["column_name"]): row["delete_rule"]
            for row in await connection.fetch(
                """
                SELECT tc.table_name, kcu.column_name, rc.delete_rule
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON kcu.constraint_schema = tc.constraint_schema
                 AND kcu.constraint_name = tc.constraint_name
                 AND kcu.table_schema = tc.table_schema
                 AND kcu.table_name = tc.table_name
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_schema = tc.constraint_schema
                 AND rc.constraint_name = tc.constraint_name
                WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
                """
            )
        }
    finally:
        await connection.close()

    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    missing_tables = REQUIRED_TABLES - tables
    if missing_tables:
        raise RuntimeError(f"Phase 8 tables are missing: {sorted(missing_tables)}")
    missing_columns = {
        table: sorted(required - columns_by_table.get(table, set()))
        for table, required in REQUIRED_COLUMNS.items()
        if required - columns_by_table.get(table, set())
    }
    if missing_columns:
        raise RuntimeError(f"Phase 8 columns are missing: {missing_columns}")
    missing_indexes = REQUIRED_INDEXES - indexes
    if missing_indexes:
        raise RuntimeError(f"Phase 8 indexes are missing: {sorted(missing_indexes)}")
    missing_checks = REQUIRED_CHECK_CONSTRAINTS - check_constraints
    if missing_checks:
        raise RuntimeError(f"Phase 8 check constraints are missing: {sorted(missing_checks)}")
    invalid_delete_rules = {
        f"{table}.{column}": {
            "expected": expected,
            "found": foreign_key_delete_rules.get((table, column)),
        }
        for (table, column), expected in REQUIRED_FOREIGN_KEY_DELETE_RULES.items()
        if foreign_key_delete_rules.get((table, column)) != expected
    }
    if invalid_delete_rules:
        raise RuntimeError(f"Phase 8 foreign-key delete rules are invalid: {invalid_delete_rules}")

    return {
        "alembic_head": head,
        "tables": sorted(REQUIRED_TABLES),
        "required_columns": {table: sorted(columns) for table, columns in REQUIRED_COLUMNS.items()},
        "required_indexes": sorted(REQUIRED_INDEXES),
        "required_check_constraints": sorted(REQUIRED_CHECK_CONSTRAINTS),
        "required_foreign_key_delete_rules": {
            f"{table}.{column}": rule
            for (table, column), rule in sorted(REQUIRED_FOREIGN_KEY_DELETE_RULES.items())
        },
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
