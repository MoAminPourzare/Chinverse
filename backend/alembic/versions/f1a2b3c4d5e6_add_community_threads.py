"""add community threads

Revision ID: f1a2b3c4d5e6
Revises: d7e9b2c4f6a8
Create Date: 2026-05-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "d7e9b2c4f6a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE forum_answers
        ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES forum_answers(id)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_forum_answers_parent_id
        ON forum_answers (parent_id)
        """
    )
    op.execute(
        """
        ALTER TABLE articles
        ADD COLUMN IF NOT EXISTS author_user_id BIGINT REFERENCES users(id)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_articles_author_user_id
        ON articles (author_user_id)
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS article_comments (
            id BIGSERIAL PRIMARY KEY,
            article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            author_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            parent_id BIGINT REFERENCES article_comments(id) ON DELETE CASCADE,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_article_comments_id ON article_comments (id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_article_comments_article_id ON article_comments (article_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_article_comments_author_user_id ON article_comments (author_user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_article_comments_parent_id ON article_comments (parent_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_article_comments_parent_id")
    op.execute("DROP INDEX IF EXISTS ix_article_comments_author_user_id")
    op.execute("DROP INDEX IF EXISTS ix_article_comments_article_id")
    op.execute("DROP INDEX IF EXISTS ix_article_comments_id")
    op.execute("DROP TABLE IF EXISTS article_comments")
    op.execute("DROP INDEX IF EXISTS ix_articles_author_user_id")
    op.execute("ALTER TABLE articles DROP COLUMN IF EXISTS author_user_id")
    op.execute("DROP INDEX IF EXISTS ix_forum_answers_parent_id")
    op.execute("ALTER TABLE forum_answers DROP COLUMN IF EXISTS parent_id")
