"""add daily activity tracking

Revision ID: a9d4e6f2b8c1
Revises: f4b8c2d9a1e0
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "a9d4e6f2b8c1"
down_revision: Union[str, None] = "f4b8c2d9a1e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE study_sessions
        ADD COLUMN IF NOT EXISTS watched_seconds INTEGER NOT NULL DEFAULT 0
        """
    )
    op.execute(
        """
        ALTER TABLE study_sessions
        ADD COLUMN IF NOT EXISTS reviewed_words_count INTEGER NOT NULL DEFAULT 0
        """
    )
    op.execute(
        """
        UPDATE study_sessions
        SET watched_seconds = GREATEST(watched_seconds, minutes * 60)
        WHERE watched_seconds = 0 AND minutes > 0
        """
    )
    op.execute(
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
    op.execute(
        """
        DELETE FROM study_sessions s
        USING study_sessions keep
        WHERE
            s.user_id = keep.user_id
            AND s.date = keep.date
            AND s.id > keep.id
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_study_sessions_user_date
        ON study_sessions (user_id, date)
        """
    )
    op.execute(
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
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_lesson_watch_progress_user_date
        ON user_lesson_watch_progress (user_id, date)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_user_lesson_watch_progress_user_date")
    op.execute("DROP TABLE IF EXISTS user_lesson_watch_progress")
    op.execute("DROP INDEX IF EXISTS uq_study_sessions_user_date")
    op.execute("ALTER TABLE study_sessions DROP COLUMN IF EXISTS reviewed_words_count")
    op.execute("ALTER TABLE study_sessions DROP COLUMN IF EXISTS watched_seconds")
