"""Add personal catalog bookmarks without publishing media.

Revision ID: a3b6d9e2f5c8
Revises: c9e4b6a8d2f1
"""
from alembic import op
import sqlalchemy as sa

revision = "a3b6d9e2f5c8"
down_revision = "c9e4b6a8d2f1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_saved_collections",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("domain", sa.String(40), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "domain", "slug"),
    )
    op.create_index("ix_user_saved_collections_user_created", "user_saved_collections", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_user_saved_collections_user_created", table_name="user_saved_collections")
    op.drop_table("user_saved_collections")
