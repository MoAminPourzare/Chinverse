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
REQUIRED_TABLES = {"subtitle_tracks", "subtitle_cues", "media_access_audit_events"}
REQUIRED_COLUMNS = {
    "courses": {"status", "revision", "cover_media_id", "published_at", "published_by_id"},
    "lessons": {"status", "revision", "poster_media_id", "published_at", "published_by_id"},
    "media_assets": {
        "status",
        "revision",
        "supersedes_id",
        "playback_type",
        "checksum_sha256",
        "source_name",
        "source_url",
        "rights_holder",
        "license_type",
        "license_url",
        "license_status",
        "license_notes",
        "license_reviewed_at",
        "license_reviewed_by_id",
        "published_at",
        "published_by_id",
    },
    "subtitle_tracks": {
        "lesson_id",
        "language",
        "format",
        "revision",
        "supersedes_id",
        "status",
        "quality_status",
        "quality_score",
        "quality_report",
        "checksum_sha256",
        "source_name",
        "published_at",
        "published_by_id",
    },
    "subtitle_cues": {
        "track_id",
        "cue_index",
        "timestamp_start",
        "timestamp_end",
        "zh_text",
        "pinyin",
        "target_text",
        "highlighted_words",
    },
    "media_access_audit_events": {
        "media_id",
        "lesson_id",
        "user_id",
        "action",
        "outcome",
        "reason",
        "token_expires_at",
        "metadata_json",
    },
}
REQUIRED_INDEXES = {
    "ix_courses_public_catalog",
    "ix_courses_cover_media_id",
    "ix_lessons_public_course",
    "ix_lessons_poster_media_id",
    "ix_media_assets_status_license",
    "ix_media_assets_supersedes_revision",
    "ix_subtitle_tracks_lesson_status",
    "uq_subtitle_tracks_one_published_language",
    "ix_subtitle_cues_track_time",
    "ix_media_access_audit_events_media_created",
    "ix_media_access_audit_events_user_created",
    "ix_media_access_audit_events_outcome_created",
}
REQUIRED_CHECK_CONSTRAINTS = {
    "ck_courses_publication_status",
    "ck_courses_revision_positive",
    "ck_lessons_publication_status",
    "ck_lessons_revision_positive",
    "ck_media_assets_publication_status",
    "ck_media_assets_license_status",
    "ck_media_assets_playback_type",
    "ck_media_assets_revision_positive",
    "ck_media_assets_checksum_sha256",
    "ck_subtitle_tracks_revision_positive",
    "ck_subtitle_tracks_status",
    "ck_subtitle_tracks_quality_status",
    "ck_subtitle_tracks_checksum_sha256",
    "ck_subtitle_cues_index_nonnegative",
    "ck_subtitle_cues_start_nonnegative",
    "ck_subtitle_cues_end_after_start",
    "ck_media_access_audit_events_outcome",
}
REQUIRED_FOREIGN_KEY_DELETE_RULES = {
    ("courses", "cover_media_id"): "SET NULL",
    ("courses", "published_by_id"): "SET NULL",
    ("lessons", "poster_media_id"): "SET NULL",
    ("lessons", "published_by_id"): "SET NULL",
    ("media_assets", "supersedes_id"): "SET NULL",
    ("media_assets", "license_reviewed_by_id"): "SET NULL",
    ("media_assets", "published_by_id"): "SET NULL",
    ("subtitle_tracks", "lesson_id"): "CASCADE",
    ("subtitle_tracks", "supersedes_id"): "SET NULL",
    ("subtitle_tracks", "published_by_id"): "SET NULL",
    ("subtitle_cues", "track_id"): "CASCADE",
    ("media_access_audit_events", "media_id"): "SET NULL",
    ("media_access_audit_events", "lesson_id"): "SET NULL",
    ("media_access_audit_events", "user_id"): "SET NULL",
}


async def verify() -> dict[str, object]:
    database_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
    connection = await asyncpg.connect(database_url)
    try:
        head = await connection.fetchval("SELECT version_num FROM alembic_version")
        tables = {
            row["table_name"]
            for row in await connection.fetch(
                """
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        }
        columns_by_table: dict[str, set[str]] = {}
        for table_name in REQUIRED_COLUMNS:
            columns_by_table[table_name] = {
                row["column_name"]
                for row in await connection.fetch(
                    """
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                    """,
                    table_name,
                )
            }
        indexes = {
            row["indexname"]
            for row in await connection.fetch(
                """
                SELECT indexname FROM pg_catalog.pg_indexes
                WHERE schemaname = 'public'
                """
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
                WHERE tc.table_schema = 'public'
                  AND tc.constraint_type = 'FOREIGN KEY'
                """
            )
        }
    finally:
        await connection.close()

    if head != EXPECTED_HEAD:
        raise RuntimeError(f"Expected Alembic head {EXPECTED_HEAD}, found {head}")
    missing_tables = REQUIRED_TABLES - tables
    if missing_tables:
        raise RuntimeError(f"Phase 5 tables are missing: {sorted(missing_tables)}")
    missing_columns = {
        table: sorted(columns - columns_by_table.get(table, set()))
        for table, columns in REQUIRED_COLUMNS.items()
        if columns - columns_by_table.get(table, set())
    }
    if missing_columns:
        raise RuntimeError(f"Phase 5 columns are missing: {missing_columns}")
    missing_indexes = REQUIRED_INDEXES - indexes
    if missing_indexes:
        raise RuntimeError(f"Phase 5 indexes are missing: {sorted(missing_indexes)}")
    missing_checks = REQUIRED_CHECK_CONSTRAINTS - check_constraints
    if missing_checks:
        raise RuntimeError(f"Phase 5 check constraints are missing: {sorted(missing_checks)}")
    invalid_delete_rules = {
        f"{table}.{column}": {
            "expected": expected,
            "found": foreign_key_delete_rules.get((table, column)),
        }
        for (table, column), expected in REQUIRED_FOREIGN_KEY_DELETE_RULES.items()
        if foreign_key_delete_rules.get((table, column)) != expected
    }
    if invalid_delete_rules:
        raise RuntimeError(f"Phase 5 foreign-key delete rules are invalid: {invalid_delete_rules}")

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
