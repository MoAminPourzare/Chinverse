"""add user notifications

Revision ID: f4b8c2d9a1e0
Revises: e8a1c4b9d2f3
Create Date: 2026-05-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f4b8c2d9a1e0"
down_revision: Union[str, None] = "e8a1c4b9d2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "user_notifications" not in inspector.get_table_names():
        op.create_table(
            "user_notifications",
            sa.Column("id", sa.BigInteger(), nullable=False),
            sa.Column("user_id", sa.BigInteger(), nullable=False),
            sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
            sa.Column("type", sa.String(length=40), nullable=False),
            sa.Column("title", sa.String(length=180), nullable=False),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("target_url", sa.String(length=500), nullable=True),
            sa.Column(
                "metadata_json",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'{}'::jsonb"),
                nullable=False,
            ),
            sa.Column("is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    op.execute("CREATE INDEX IF NOT EXISTS ix_user_notifications_id ON user_notifications (id)")
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_notifications_user_created
        ON user_notifications (user_id, created_at)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_notifications_user_unread
        ON user_notifications (user_id, is_read)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_user_notifications_user_unread", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_created", table_name="user_notifications")
    op.drop_index(op.f("ix_user_notifications_id"), table_name="user_notifications")
    op.drop_table("user_notifications")
