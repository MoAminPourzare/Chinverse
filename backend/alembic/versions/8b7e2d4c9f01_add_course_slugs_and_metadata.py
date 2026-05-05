"""add course slugs and metadata

Revision ID: 8b7e2d4c9f01
Revises: 385a1fb4bfc5
Create Date: 2026-05-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8b7e2d4c9f01"
down_revision: Union[str, None] = "385a1fb4bfc5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("subcategories", sa.Column("slug", sa.String(), nullable=True))
    op.add_column("courses", sa.Column("slug", sa.String(), nullable=True))
    op.add_column(
        "courses",
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )

    op.execute(
        """
        UPDATE subcategories
        SET slug = CASE lower(name)
            WHEN 'hsk' THEN 'hsk'
            WHEN 'pronunciation' THEN 'pronunciation'
            WHEN 'grammar' THEN 'grammar'
            WHEN 'movies & series' THEN 'movies'
            WHEN 'cooking' THEN 'cooking'
            WHEN 'reality shows' THEN 'reality'
            ELSE COALESCE(
                NULLIF(
                    trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
                    ''
                ),
                'subcategory'
            ) || '-' || id
        END
        WHERE slug IS NULL
        """
    )
    op.execute(
        """
        UPDATE courses
        SET slug = COALESCE(
            NULLIF(
                trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')),
                ''
            ),
            'course'
        ) || '-' || id
        WHERE slug IS NULL
        """
    )

    op.alter_column("subcategories", "slug", existing_type=sa.String(), nullable=False)
    op.alter_column("courses", "slug", existing_type=sa.String(), nullable=False)

    op.create_index(op.f("ix_subcategories_slug"), "subcategories", ["slug"], unique=True)
    op.create_index(op.f("ix_courses_slug"), "courses", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_courses_slug"), table_name="courses")
    op.drop_index(op.f("ix_subcategories_slug"), table_name="subcategories")
    op.drop_column("courses", "metadata_json")
    op.drop_column("courses", "slug")
    op.drop_column("subcategories", "slug")
