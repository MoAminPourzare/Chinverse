"""drop dictionary ai drafts

Revision ID: f9c1e4d2a8b7
Revises: e2b7c9d4a6f1
Create Date: 2026-05-31 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "f9c1e4d2a8b7"
down_revision: Union[str, None] = "e2b7c9d4a6f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS dictionary_ai_drafts CASCADE")


def downgrade() -> None:
    pass
