"""add user notifications

Revision ID: d4e8f2a6c1b9
Revises: b7d4e2f1a9c6
"""

from typing import Sequence, Union

from alembic import op


revision: str = "d4e8f2a6c1b9"
down_revision: Union[str, None] = "b7d4e2f1a9c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS keeps existing local databases compatible with the old
    # runtime-created table while making fresh deployments deterministic.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_notifications (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
            type VARCHAR(40) NOT NULL,
            title VARCHAR(180) NOT NULL,
            body TEXT NULL,
            target_url VARCHAR(500) NULL,
            metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
            is_read BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_notifications_user_created
        ON user_notifications (user_id, created_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_notifications_user_unread
        ON user_notifications (user_id, is_read)
        """
    )


def downgrade() -> None:
    # The table is owned by the earlier f4b8c2d9a1e0 revision. This revision
    # only backfilled deployments where runtime DDL had not created it.
    pass
