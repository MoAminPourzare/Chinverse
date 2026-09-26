"""Fail-closed database contract for Phase 6 payment lifecycle tables."""

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
REQUIRED_COLUMNS = {
    "subscription_orders": {
        "id",
        "user_id",
        "plan_id",
        "amount",
        "currency",
        "status",
        "provider",
        "provider_reference",
        "checkout_url",
        "paid_at",
        "closed_at",
        "failure_code",
    },
    "user_subscriptions": {
        "source_order_id",
        "revoked_at",
        "revocation_reason",
    },
    "payment_webhook_events": {"provider_created_at"},
    "payment_ledger_entries": {
        "id",
        "event_id",
        "order_id",
        "user_id",
        "subscription_id",
        "action",
        "amount",
        "currency",
        "provider_reference",
        "created_at",
        "updated_at",
    },
}
REQUIRED_TABLES = set(REQUIRED_COLUMNS)
REQUIRED_INDEXES = {
    "uq_subscription_orders_provider_reference",
    "uq_user_subscriptions_source_order",
    "uq_payment_ledger_event",
    "ix_payment_ledger_order_created",
    "ix_payment_ledger_user_created",
}
REQUIRED_CHECK_CONSTRAINTS = {
    "ck_subscription_orders_status",
    "ck_payment_ledger_action",
}
REQUIRED_FOREIGN_KEY_DELETE_RULES = {
    ("user_subscriptions", "source_order_id"): "SET NULL",
    ("payment_ledger_entries", "event_id"): "CASCADE",
    ("payment_ledger_entries", "order_id"): "CASCADE",
    ("payment_ledger_entries", "user_id"): "CASCADE",
    ("payment_ledger_entries", "subscription_id"): "SET NULL",
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
    if missing_tables := REQUIRED_TABLES - tables:
        raise RuntimeError(f"Phase 6 tables are missing: {sorted(missing_tables)}")
    missing_columns = {
        table: sorted(required - columns_by_table.get(table, set()))
        for table, required in REQUIRED_COLUMNS.items()
        if required - columns_by_table.get(table, set())
    }
    if missing_columns:
        raise RuntimeError(f"Phase 6 columns are missing: {missing_columns}")
    if missing_indexes := REQUIRED_INDEXES - indexes:
        raise RuntimeError(f"Phase 6 indexes are missing: {sorted(missing_indexes)}")
    if missing_checks := REQUIRED_CHECK_CONSTRAINTS - check_constraints:
        raise RuntimeError(f"Phase 6 check constraints are missing: {sorted(missing_checks)}")
    invalid_delete_rules = {
        f"{table}.{column}": {
            "expected": expected,
            "found": foreign_key_delete_rules.get((table, column)),
        }
        for (table, column), expected in REQUIRED_FOREIGN_KEY_DELETE_RULES.items()
        if foreign_key_delete_rules.get((table, column)) != expected
    }
    if invalid_delete_rules:
        raise RuntimeError(f"Phase 6 foreign-key delete rules are invalid: {invalid_delete_rules}")
    return {
        "alembic_head": head,
        "tables": sorted(REQUIRED_TABLES),
        "required_columns": {table: sorted(columns) for table, columns in REQUIRED_COLUMNS.items()},
        "required_indexes": sorted(REQUIRED_INDEXES),
        "required_check_constraints": sorted(REQUIRED_CHECK_CONSTRAINTS),
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
