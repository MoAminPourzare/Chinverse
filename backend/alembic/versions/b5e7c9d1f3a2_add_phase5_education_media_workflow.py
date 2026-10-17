"""add phase five education and media workflow

Revision ID: b5e7c9d1f3a2
Revises: a2c4e6f8b1d3
Create Date: 2026-08-11 00:00:00.000000

Existing course, lesson, subtitle, and media records are deliberately migrated
to a fail-closed draft/pending state.  Publication must happen through the
review workflow after source, checksum, license, subtitle quality, and
entitlement requirements have been verified.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b5e7c9d1f3a2"
down_revision: Union[str, None] = "a2c4e6f8b1d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _publication_columns(table_name: str) -> None:
    op.add_column(
        table_name,
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'draft'")),
    )
    op.add_column(
        table_name,
        sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(table_name, sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(table_name, sa.Column("published_by_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f(f"ix_{table_name}_published_by_id"), table_name, ["published_by_id"], unique=False)
    op.create_foreign_key(
        f"fk_{table_name}_published_by_users",
        table_name,
        "users",
        ["published_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        f"ck_{table_name}_publication_status",
        table_name,
        "status IN ('draft', 'published', 'archived')",
    )
    op.create_check_constraint(f"ck_{table_name}_revision_positive", table_name, "revision >= 1")


def upgrade() -> None:
    _publication_columns("courses")
    op.add_column("courses", sa.Column("cover_media_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_courses_cover_media_id"), "courses", ["cover_media_id"], unique=False)
    op.create_foreign_key(
        "fk_courses_cover_media_media_assets",
        "courses",
        "media_assets",
        ["cover_media_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_courses_public_catalog",
        "courses",
        ["status", "subcategory_id", "id"],
        unique=False,
    )

    _publication_columns("lessons")
    op.add_column("lessons", sa.Column("poster_media_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_lessons_poster_media_id"), "lessons", ["poster_media_id"], unique=False)
    op.create_foreign_key(
        "fk_lessons_poster_media_media_assets",
        "lessons",
        "media_assets",
        ["poster_media_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_lessons_public_course",
        "lessons",
        ["status", "course_id", "section_id", "id"],
        unique=False,
    )

    op.add_column(
        "media_assets",
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'draft'")),
    )
    op.add_column(
        "media_assets",
        sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column("media_assets", sa.Column("supersedes_id", sa.BigInteger(), nullable=True))
    op.add_column(
        "media_assets",
        sa.Column("playback_type", sa.String(length=20), nullable=False, server_default=sa.text("'progressive'")),
    )
    op.add_column("media_assets", sa.Column("checksum_sha256", sa.String(length=64), nullable=True))
    op.add_column("media_assets", sa.Column("source_name", sa.String(length=255), nullable=True))
    op.add_column("media_assets", sa.Column("source_url", sa.String(length=1000), nullable=True))
    op.add_column("media_assets", sa.Column("rights_holder", sa.String(length=255), nullable=True))
    op.add_column("media_assets", sa.Column("license_type", sa.String(length=120), nullable=True))
    op.add_column("media_assets", sa.Column("license_url", sa.String(length=1000), nullable=True))
    op.add_column(
        "media_assets",
        sa.Column("license_status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
    )
    op.add_column("media_assets", sa.Column("license_notes", sa.Text(), nullable=True))
    op.add_column("media_assets", sa.Column("license_reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("media_assets", sa.Column("license_reviewed_by_id", sa.BigInteger(), nullable=True))
    op.add_column("media_assets", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("media_assets", sa.Column("published_by_id", sa.BigInteger(), nullable=True))
    op.create_index(op.f("ix_media_assets_supersedes_id"), "media_assets", ["supersedes_id"], unique=False)
    op.create_index(op.f("ix_media_assets_checksum_sha256"), "media_assets", ["checksum_sha256"], unique=False)
    op.create_index(
        op.f("ix_media_assets_license_reviewed_by_id"),
        "media_assets",
        ["license_reviewed_by_id"],
        unique=False,
    )
    op.create_index(op.f("ix_media_assets_published_by_id"), "media_assets", ["published_by_id"], unique=False)
    op.create_index("ix_media_assets_status_license", "media_assets", ["status", "license_status"], unique=False)
    op.create_index(
        "ix_media_assets_supersedes_revision",
        "media_assets",
        ["supersedes_id", "revision"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_media_assets_supersedes_media_assets",
        "media_assets",
        "media_assets",
        ["supersedes_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_media_assets_license_reviewed_by_users",
        "media_assets",
        "users",
        ["license_reviewed_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_media_assets_published_by_users",
        "media_assets",
        "users",
        ["published_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        "ck_media_assets_publication_status",
        "media_assets",
        "status IN ('draft', 'published', 'archived')",
    )
    op.create_check_constraint(
        "ck_media_assets_license_status",
        "media_assets",
        "license_status IN ('pending', 'approved', 'rejected')",
    )
    op.create_check_constraint(
        "ck_media_assets_playback_type",
        "media_assets",
        "playback_type IN ('hls', 'progressive')",
    )
    op.create_check_constraint("ck_media_assets_revision_positive", "media_assets", "revision >= 1")
    op.create_check_constraint(
        "ck_media_assets_checksum_sha256",
        "media_assets",
        "checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9a-f]{64}$'",
    )

    op.create_table(
        "subtitle_tracks",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("lesson_id", sa.BigInteger(), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=False),
        sa.Column("format", sa.String(length=20), nullable=False, server_default=sa.text("'json'")),
        sa.Column("revision", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("supersedes_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("quality_status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column(
            "quality_report",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("source_name", sa.String(length=255), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_by_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("revision >= 1", name="ck_subtitle_tracks_revision_positive"),
        sa.CheckConstraint("status IN ('draft', 'published', 'archived')", name="ck_subtitle_tracks_status"),
        sa.CheckConstraint(
            "quality_status IN ('pending', 'valid', 'invalid')",
            name="ck_subtitle_tracks_quality_status",
        ),
        sa.CheckConstraint(
            "checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9a-f]{64}$'",
            name="ck_subtitle_tracks_checksum_sha256",
        ),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["published_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["supersedes_id"], ["subtitle_tracks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lesson_id", "language", "revision", name="uq_subtitle_tracks_lesson_language_revision"),
    )
    op.create_index(op.f("ix_subtitle_tracks_id"), "subtitle_tracks", ["id"], unique=False)
    op.create_index(op.f("ix_subtitle_tracks_lesson_id"), "subtitle_tracks", ["lesson_id"], unique=False)
    op.create_index(op.f("ix_subtitle_tracks_supersedes_id"), "subtitle_tracks", ["supersedes_id"], unique=False)
    op.create_index(
        op.f("ix_subtitle_tracks_published_by_id"), "subtitle_tracks", ["published_by_id"], unique=False
    )
    op.create_index("ix_subtitle_tracks_lesson_status", "subtitle_tracks", ["lesson_id", "status"], unique=False)
    op.create_index(
        "uq_subtitle_tracks_one_published_language",
        "subtitle_tracks",
        ["lesson_id", "language"],
        unique=True,
        postgresql_where=sa.text("status = 'published'"),
    )

    op.create_table(
        "subtitle_cues",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("track_id", sa.BigInteger(), nullable=False),
        sa.Column("cue_index", sa.Integer(), nullable=False),
        sa.Column("timestamp_start", sa.Float(), nullable=False),
        sa.Column("timestamp_end", sa.Float(), nullable=False),
        sa.Column("zh_text", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("pinyin", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column("target_text", sa.Text(), nullable=False, server_default=sa.text("''")),
        sa.Column(
            "highlighted_words",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("cue_index >= 0", name="ck_subtitle_cues_index_nonnegative"),
        sa.CheckConstraint("timestamp_start >= 0", name="ck_subtitle_cues_start_nonnegative"),
        sa.CheckConstraint("timestamp_end > timestamp_start", name="ck_subtitle_cues_end_after_start"),
        sa.ForeignKeyConstraint(["track_id"], ["subtitle_tracks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("track_id", "cue_index", name="uq_subtitle_cues_track_index"),
    )
    op.create_index(op.f("ix_subtitle_cues_id"), "subtitle_cues", ["id"], unique=False)
    op.create_index(op.f("ix_subtitle_cues_track_id"), "subtitle_cues", ["track_id"], unique=False)
    op.create_index(
        "ix_subtitle_cues_track_time",
        "subtitle_cues",
        ["track_id", "timestamp_start", "timestamp_end"],
        unique=False,
    )

    # Preserve legacy subtitle rows as a draft revision without making them
    # public before the quality workflow has run.
    op.execute(
        """
        INSERT INTO subtitle_tracks (
            lesson_id, language, format, revision, status, quality_status,
            quality_report, source_name, created_at, updated_at
        )
        SELECT
            lesson_id,
            COALESCE(NULLIF(LEFT(LOWER(BTRIM(lang_code)), 20), ''), 'und'),
            'legacy',
            1,
            'draft',
            'pending',
            jsonb_build_object(
                'migrated_from', 'lesson_subtitles',
                'review_required', true,
                'normalized_timing_cues', COUNT(*) FILTER (
                    WHERE timestamp_start < 0
                       OR timestamp_end <= GREATEST(timestamp_start, 0.0)
                )
            ),
            'legacy-lesson-subtitles',
            MIN(created_at),
            MAX(updated_at)
        FROM lesson_subtitles
        GROUP BY lesson_id, COALESCE(NULLIF(LEFT(LOWER(BTRIM(lang_code)), 20), ''), 'und')
        """
    )
    op.execute(
        """
        INSERT INTO subtitle_cues (
            track_id, cue_index, timestamp_start, timestamp_end,
            zh_text, pinyin, target_text, highlighted_words, created_at, updated_at
        )
        SELECT
            track.id,
            ROW_NUMBER() OVER (
                PARTITION BY legacy.lesson_id,
                    COALESCE(NULLIF(LEFT(LOWER(BTRIM(legacy.lang_code)), 20), ''), 'und')
                ORDER BY legacy.timestamp_start, legacy.id
            ) - 1,
            -- The legacy table had no timing constraints.  Preserve every
            -- source row there, but normalize invalid timing in the new draft
            -- cue so an existing bad row cannot make the release migration
            -- fail.  The track stays pending and records how many cues need
            -- human review before publication.
            GREATEST(legacy.timestamp_start, 0.0),
            GREATEST(
                legacy.timestamp_end,
                GREATEST(legacy.timestamp_start, 0.0) + 0.001
            ),
            '',
            '',
            legacy.text,
            '[]'::jsonb,
            legacy.created_at,
            legacy.updated_at
        FROM lesson_subtitles AS legacy
        JOIN subtitle_tracks AS track
          ON track.lesson_id = legacy.lesson_id
         AND track.language = COALESCE(NULLIF(LEFT(LOWER(BTRIM(legacy.lang_code)), 20), ''), 'und')
         AND track.revision = 1
        """
    )

    op.create_table(
        "media_access_audit_events",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("media_id", sa.BigInteger(), nullable=True),
        sa.Column("lesson_id", sa.BigInteger(), nullable=True),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("outcome", sa.String(length=20), nullable=False),
        sa.Column("reason", sa.String(length=120), nullable=False),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("outcome IN ('granted', 'denied')", name="ck_media_access_audit_events_outcome"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["media_id"], ["media_assets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_media_access_audit_events_id"), "media_access_audit_events", ["id"], unique=False)
    op.create_index(
        "ix_media_access_audit_events_media_created",
        "media_access_audit_events",
        ["media_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_media_access_audit_events_user_created",
        "media_access_audit_events",
        ["user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_media_access_audit_events_outcome_created",
        "media_access_audit_events",
        ["outcome", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_media_access_audit_events_outcome_created", table_name="media_access_audit_events")
    op.drop_index("ix_media_access_audit_events_user_created", table_name="media_access_audit_events")
    op.drop_index("ix_media_access_audit_events_media_created", table_name="media_access_audit_events")
    op.drop_index(op.f("ix_media_access_audit_events_id"), table_name="media_access_audit_events")
    op.drop_table("media_access_audit_events")

    op.drop_index("ix_subtitle_cues_track_time", table_name="subtitle_cues")
    op.drop_index(op.f("ix_subtitle_cues_track_id"), table_name="subtitle_cues")
    op.drop_index(op.f("ix_subtitle_cues_id"), table_name="subtitle_cues")
    op.drop_table("subtitle_cues")

    op.drop_index("uq_subtitle_tracks_one_published_language", table_name="subtitle_tracks")
    op.drop_index("ix_subtitle_tracks_lesson_status", table_name="subtitle_tracks")
    op.drop_index(op.f("ix_subtitle_tracks_published_by_id"), table_name="subtitle_tracks")
    op.drop_index(op.f("ix_subtitle_tracks_supersedes_id"), table_name="subtitle_tracks")
    op.drop_index(op.f("ix_subtitle_tracks_lesson_id"), table_name="subtitle_tracks")
    op.drop_index(op.f("ix_subtitle_tracks_id"), table_name="subtitle_tracks")
    op.drop_table("subtitle_tracks")

    op.drop_constraint("ck_media_assets_checksum_sha256", "media_assets", type_="check")
    op.drop_constraint("ck_media_assets_revision_positive", "media_assets", type_="check")
    op.drop_constraint("ck_media_assets_playback_type", "media_assets", type_="check")
    op.drop_constraint("ck_media_assets_license_status", "media_assets", type_="check")
    op.drop_constraint("ck_media_assets_publication_status", "media_assets", type_="check")
    op.drop_constraint("fk_media_assets_published_by_users", "media_assets", type_="foreignkey")
    op.drop_constraint("fk_media_assets_license_reviewed_by_users", "media_assets", type_="foreignkey")
    op.drop_constraint("fk_media_assets_supersedes_media_assets", "media_assets", type_="foreignkey")
    op.drop_index("ix_media_assets_supersedes_revision", table_name="media_assets")
    op.drop_index("ix_media_assets_status_license", table_name="media_assets")
    op.drop_index(op.f("ix_media_assets_published_by_id"), table_name="media_assets")
    op.drop_index(op.f("ix_media_assets_license_reviewed_by_id"), table_name="media_assets")
    op.drop_index(op.f("ix_media_assets_checksum_sha256"), table_name="media_assets")
    op.drop_index(op.f("ix_media_assets_supersedes_id"), table_name="media_assets")
    for column in (
        "published_by_id",
        "published_at",
        "license_reviewed_by_id",
        "license_reviewed_at",
        "license_notes",
        "license_status",
        "license_url",
        "license_type",
        "rights_holder",
        "source_url",
        "source_name",
        "checksum_sha256",
        "playback_type",
        "supersedes_id",
        "revision",
        "status",
    ):
        op.drop_column("media_assets", column)

    op.drop_index("ix_lessons_public_course", table_name="lessons")
    op.drop_constraint("fk_lessons_poster_media_media_assets", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_poster_media_id"), table_name="lessons")
    op.drop_column("lessons", "poster_media_id")
    op.drop_constraint("ck_lessons_revision_positive", "lessons", type_="check")
    op.drop_constraint("ck_lessons_publication_status", "lessons", type_="check")
    op.drop_constraint("fk_lessons_published_by_users", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_published_by_id"), table_name="lessons")
    for column in ("published_by_id", "published_at", "revision", "status"):
        op.drop_column("lessons", column)

    op.drop_index("ix_courses_public_catalog", table_name="courses")
    op.drop_constraint("fk_courses_cover_media_media_assets", "courses", type_="foreignkey")
    op.drop_index(op.f("ix_courses_cover_media_id"), table_name="courses")
    op.drop_column("courses", "cover_media_id")
    op.drop_constraint("ck_courses_revision_positive", "courses", type_="check")
    op.drop_constraint("ck_courses_publication_status", "courses", type_="check")
    op.drop_constraint("fk_courses_published_by_users", "courses", type_="foreignkey")
    op.drop_index(op.f("ix_courses_published_by_id"), table_name="courses")
    for column in ("published_by_id", "published_at", "revision", "status"):
        op.drop_column("courses", column)
