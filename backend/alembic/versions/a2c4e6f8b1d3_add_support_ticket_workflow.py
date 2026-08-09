"""add support ticket workflow

Revision ID: a2c4e6f8b1d3
Revises: d3a7f9c2e5b1
Create Date: 2026-08-09 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2c4e6f8b1d3"
down_revision: Union[str, None] = "d3a7f9c2e5b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("support_tickets", sa.Column("admin_reply", sa.Text(), nullable=True))
    op.add_column(
        "support_tickets",
        sa.Column("responded_by", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "support_tickets",
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_support_tickets_responded_by_users",
        "support_tickets",
        "users",
        ["responded_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_support_tickets_responded_by",
        "support_tickets",
        ["responded_by"],
        unique=False,
    )
    op.create_index(
        "ix_support_tickets_status_created_at",
        "support_tickets",
        ["status", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_support_tickets_status_created_at", table_name="support_tickets")
    op.drop_index("ix_support_tickets_responded_by", table_name="support_tickets")
    op.drop_constraint(
        "fk_support_tickets_responded_by_users",
        "support_tickets",
        type_="foreignkey",
    )
    op.drop_column("support_tickets", "responded_at")
    op.drop_column("support_tickets", "responded_by")
    op.drop_column("support_tickets", "admin_reply")
