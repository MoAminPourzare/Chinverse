"""Retain the historical revision without user-specific data mutations.

Revision ID: b7d4e2f1a9c6
Revises: 9c3d1e7a5b20
"""

from typing import Sequence, Union

revision: str = "b7d4e2f1a9c6"
down_revision: Union[str, None] = "9c3d1e7a5b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This revision used to contain one-off edits for named test accounts.
    # Those values are runtime data and must not be embedded in source control.
    pass


def downgrade() -> None:
    # User-facing names should not be changed back during a schema downgrade.
    pass
