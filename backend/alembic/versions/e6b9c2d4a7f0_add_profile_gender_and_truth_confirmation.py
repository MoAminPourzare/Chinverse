"""add profile gender and truth confirmation

Revision ID: e6b9c2d4a7f0
Revises: d4e8f2a6c1b9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e6b9c2d4a7f0"
down_revision: Union[str, None] = "d4e8f2a6c1b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_profiles", sa.Column("gender", sa.String(), nullable=True))
    op.add_column(
        "user_profiles",
        sa.Column(
            "profile_truth_confirmed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "profile_truth_confirmed")
    op.drop_column("user_profiles", "gender")
