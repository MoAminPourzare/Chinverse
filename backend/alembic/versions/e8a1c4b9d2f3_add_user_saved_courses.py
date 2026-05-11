"""add user saved courses

Revision ID: e8a1c4b9d2f3
Revises: c6d9f5a7e2c1
Create Date: 2026-05-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8a1c4b9d2f3"
down_revision: Union[str, None] = "c6d9f5a7e2c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_saved_courses",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("course_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_user_saved_courses_user_course"),
    )
    op.create_index(op.f("ix_user_saved_courses_id"), "user_saved_courses", ["id"], unique=False)
    op.create_index(op.f("ix_user_saved_courses_user_id"), "user_saved_courses", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_saved_courses_course_id"), "user_saved_courses", ["course_id"], unique=False)
    op.create_index(
        "ix_user_saved_courses_user_created",
        "user_saved_courses",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_user_saved_courses_user_created", table_name="user_saved_courses")
    op.drop_index(op.f("ix_user_saved_courses_course_id"), table_name="user_saved_courses")
    op.drop_index(op.f("ix_user_saved_courses_user_id"), table_name="user_saved_courses")
    op.drop_index(op.f("ix_user_saved_courses_id"), table_name="user_saved_courses")
    op.drop_table("user_saved_courses")
