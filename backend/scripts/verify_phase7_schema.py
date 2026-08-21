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
REQUIRED_TABLES = {"chat_realtime_events", "chat_presence_leases"}
REQUIRED_COLUMNS = {
    "chat_realtime_events": {
        "id",
        "source_instance_id",
        "recipient_user_id",
        "event_type",
        "payload_json",
        "expires_at",
        "created_at",
        "updated_at",
    },
    "chat_presence_leases": {"instance_id", "user_id", "expires_at"},
}
REQUIRED_INDEXES = {
    "ix_messages_sender_receiver_id_desc",
    "ix_messages_receiver_sender_id_desc",
    "ix_messages_unread_receiver_sender_id",
    "ix_chat_realtime_events_recipient_id",
    "ix_chat_realtime_events_expires",
    "ix_chat_presence_user_expires",
    "ix_chat_presence_expires",
}
REQUIRED_CASCADE_FOREIGN_KEYS = {
    ("chat_realtime_events", "recipient_user_id"),
    ("chat_presence_leases", "user_id"),
}
COMMIT_ORDER_TRIGGER = "trg_chat_realtime_events_serialize_insert"
COMMIT_ORDER_FUNCTION = "chat_realtime_events_serialize_insert"


def _plan_node_types(plan: dict) -> set[str]:
    node_types = {str(plan.get("Node Type", ""))}
    for child in plan.get("Plans", []):
        node_types.update(_plan_node_types(child))
    return {node for node in node_types if node}


async def verify() -> dict[str, object]:
    database_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
    connection = await asyncpg.connect(database_url)
    try:
        head = await connection.fetchval("SELECT version_num FROM alembic_version")
        tables = {
            row["table_name"]
            for row in await connection.fetch(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        }
        columns_by_table = {
            table_name: {
                row["column_name"]
                for row in await connection.fetch(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                    """,
                    table_name,
                )
            }
            for table_name in REQUIRED_COLUMNS
        }
        indexes = {
            row["indexname"]
            for row in await connection.fetch(
                """
                SELECT indexname
                FROM pg_catalog.pg_indexes
                WHERE schemaname = 'public'
                """
            )
        }
        cascade_foreign_keys = {
            (row["table_name"], row["column_name"])
            for row in await connection.fetch(
                """
                SELECT tc.table_name, kcu.column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON kcu.constraint_schema = tc.constraint_schema
                 AND kcu.constraint_name = tc.constraint_name
                 AND kcu.table_name = tc.table_name
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_schema = tc.constraint_schema
                 AND rc.constraint_name = tc.constraint_name
                WHERE tc.table_schema = 'public'
                  AND tc.constraint_type = 'FOREIGN KEY'
                  AND rc.delete_rule = 'CASCADE'
                """
            )
        }
        commit_order_trigger = await connection.fetchrow(
            """
            SELECT
                trigger.tgname AS trigger_name,
                procedure.proname AS function_name,
                (trigger.tgtype & 2) <> 0 AS fires_before,
                (trigger.tgtype & 4) <> 0 AS fires_on_insert,
                (trigger.tgtype & 1) = 0 AS statement_level,
                pg_get_functiondef(procedure.oid) AS function_definition
            FROM pg_catalog.pg_trigger AS trigger
            JOIN pg_catalog.pg_class AS relation
              ON relation.oid = trigger.tgrelid
            JOIN pg_catalog.pg_namespace AS namespace
              ON namespace.oid = relation.relnamespace
            JOIN pg_catalog.pg_proc AS procedure
              ON procedure.oid = trigger.tgfoid
            WHERE namespace.nspname = 'public'
              AND relation.relname = 'chat_realtime_events'
              AND trigger.tgname = $1
              AND NOT trigger.tgisinternal
            """,
            COMMIT_ORDER_TRIGGER,
        )
        plan_rows = await connection.fetch(
            """
            EXPLAIN (FORMAT JSON)
            WITH directional AS (
                SELECT id, receiver_id AS partner_id
                FROM messages WHERE sender_id = 0
                UNION ALL
                SELECT id, sender_id AS partner_id
                FROM messages WHERE receiver_id = 0
            )
            SELECT DISTINCT ON (partner_id) id, partner_id
            FROM directional
            ORDER BY partner_id, id DESC
            """
        )
        raw_plan = plan_rows[0][0]
        decoded_plan = json.loads(raw_plan) if isinstance(raw_plan, str) else raw_plan
        plan = decoded_plan[0]["Plan"]
        plan_node_types = _plan_node_types(plan)
    finally:
        await connection.close()

    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    missing_tables = REQUIRED_TABLES - tables
    if missing_tables:
        raise RuntimeError(f"Phase 7 tables are missing: {sorted(missing_tables)}")
    missing_columns = {
        table: sorted(required - columns_by_table.get(table, set()))
        for table, required in REQUIRED_COLUMNS.items()
        if required - columns_by_table.get(table, set())
    }
    if missing_columns:
        raise RuntimeError(f"Phase 7 columns are missing: {missing_columns}")
    missing_indexes = REQUIRED_INDEXES - indexes
    if missing_indexes:
        raise RuntimeError(f"Phase 7 indexes are missing: {sorted(missing_indexes)}")
    missing_foreign_keys = REQUIRED_CASCADE_FOREIGN_KEYS - cascade_foreign_keys
    if missing_foreign_keys:
        raise RuntimeError(
            f"Phase 7 cascade foreign keys are missing: {sorted(missing_foreign_keys)}"
        )
    if (
        commit_order_trigger is None
        or commit_order_trigger["function_name"] != COMMIT_ORDER_FUNCTION
        or not commit_order_trigger["fires_before"]
        or not commit_order_trigger["fires_on_insert"]
        or not commit_order_trigger["statement_level"]
        or "pg_advisory_xact_lock" not in commit_order_trigger["function_definition"]
    ):
        raise RuntimeError(
            "Phase 7 commit-order serialization trigger is missing or malformed"
        )
    if "Unique" not in plan_node_types or not (
        {"Append", "Merge Append"} & plan_node_types
    ):
        raise RuntimeError(
            "Phase 7 conversation query plan is missing its directional append/unique structure"
        )

    return {
        "alembic_head": head,
        "tables": sorted(REQUIRED_TABLES),
        "required_columns": {
            table: sorted(columns) for table, columns in REQUIRED_COLUMNS.items()
        },
        "required_indexes": sorted(REQUIRED_INDEXES),
        "cascade_foreign_keys": [
            f"{table}.{column}" for table, column in sorted(REQUIRED_CASCADE_FOREIGN_KEYS)
        ],
        "commit_order_trigger": COMMIT_ORDER_TRIGGER,
        "conversation_plan_nodes": sorted(plan_node_types),
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), sort_keys=True))
