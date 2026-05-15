"""add content engagements

Revision ID: a4c8e2f6b9d1
Revises: f1a2b3c4d5e6
Create Date: 2026-05-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "a4c8e2f6b9d1"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS content_likes (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_type VARCHAR(40) NOT NULL,
            target_id BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_content_like_user_target UNIQUE (user_id, target_type, target_id)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_likes_id ON content_likes (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_likes_user_id ON content_likes (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_likes_target ON content_likes (target_type, target_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS content_comments (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_type VARCHAR(40) NOT NULL,
            target_id BIGINT NOT NULL,
            parent_id BIGINT REFERENCES content_comments(id) ON DELETE SET NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_id ON content_comments (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_user_id ON content_comments (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_parent_id ON content_comments (parent_id)")
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_content_comments_target_created
        ON content_comments (target_type, target_id, created_at)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_content_comments_target_created")
    op.execute("DROP INDEX IF EXISTS ix_content_comments_parent_id")
    op.execute("DROP INDEX IF EXISTS ix_content_comments_user_id")
    op.execute("DROP INDEX IF EXISTS ix_content_comments_id")
    op.execute("DROP TABLE IF EXISTS content_comments")
    op.execute("DROP INDEX IF EXISTS ix_content_likes_target")
    op.execute("DROP INDEX IF EXISTS ix_content_likes_user_id")
    op.execute("DROP INDEX IF EXISTS ix_content_likes_id")
    op.execute("DROP TABLE IF EXISTS content_likes")
