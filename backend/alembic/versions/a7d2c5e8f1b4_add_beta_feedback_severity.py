"""Add operational severity to closed-beta feedback.

Revision ID: a7d2c5e8f1b4
Revises: f8a1b2c3d4e5
"""

from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7d2c5e8f1b4"
down_revision: Union[str, None] = "f8a1b2c3d4e5"
branch_labels: Union[str, list[str], None] = None
depends_on: Union[str, list[str], None] = None


def upgrade() -> None:
    op.add_column(
        "beta_feedback",
        sa.Column(
            "severity",
            sa.String(length=16),
            server_default=sa.text("'unclassified'"),
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_beta_feedback_severity",
        "beta_feedback",
        "severity IN ('unclassified', 'P0', 'P1', 'P2', 'P3')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_beta_feedback_severity",
        "beta_feedback",
        type_="check",
    )
    op.drop_column("beta_feedback", "severity")
