"""Normalize existing Latin display names to Persian.

Revision ID: b7d4e2f1a9c6
Revises: 9c3d1e7a5b20
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


revision: str = "b7d4e2f1a9c6"
down_revision: Union[str, None] = "9c3d1e7a5b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DISPLAY_NAME_UPDATES = (
    ("redacted-user@example.invalid", "ali", "علی"),
    ("redacted-user@example.invalid", "parsa", "پارسا"),
    ("redacted-user@example.invalid", "moamin", "مؤمن"),
    ("redacted-user@example.invalid", "karim", "کریم"),
    ("redacted-user@example.invalid", "jamal", "جمال"),
    ("redacted-user@example.invalid", "Nahid", "ناهید"),
    ("admin@chinverse.com", "Chinverse Admin", "مدیر چین‌ورس"),
)


def upgrade() -> None:
    connection = op.get_bind()
    for email, old_name, new_name in DISPLAY_NAME_UPDATES:
        connection.execute(
            text(
                """
                UPDATE user_profiles AS profile
                SET display_name = :new_name,
                    updated_at = now()
                FROM users AS app_user
                WHERE profile.user_id = app_user.id
                  AND lower(app_user.email) = lower(:email)
                  AND profile.display_name = :old_name
                """
            ),
            {"email": email, "old_name": old_name, "new_name": new_name},
        )


def downgrade() -> None:
    # User-facing names should not be changed back during a schema downgrade.
    pass
