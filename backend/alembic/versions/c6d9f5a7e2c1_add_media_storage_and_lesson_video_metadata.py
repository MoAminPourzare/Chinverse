"""add media storage and lesson video metadata

Revision ID: c6d9f5a7e2c1
Revises: b0a8f1c2d3e4
Create Date: 2026-05-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c6d9f5a7e2c1"
down_revision: Union[str, None] = "b0a8f1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "media_assets",
        sa.Column(
            "storage_provider",
            sa.String(),
            nullable=False,
            server_default=sa.text("'local'"),
        ),
    )
    op.add_column("media_assets", sa.Column("storage_key", sa.String(), nullable=True))
    op.add_column("media_assets", sa.Column("mime_type", sa.String(), nullable=True))
    op.add_column("media_assets", sa.Column("file_size_bytes", sa.BigInteger(), nullable=True))
    op.add_column("media_assets", sa.Column("duration_seconds", sa.Float(), nullable=True))
    op.add_column("media_assets", sa.Column("width", sa.Integer(), nullable=True))
    op.add_column("media_assets", sa.Column("height", sa.Integer(), nullable=True))
    op.add_column(
        "media_assets",
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )

    op.execute(
        """
        UPDATE media_assets
        SET storage_key = COALESCE(
            NULLIF(
                concat(
                    COALESCE(NULLIF(ltrim(file_url, '/'), ''), 'legacy-media'),
                    '-',
                    id
                ),
                ''
            ),
            concat('legacy-media-', id)
        )
        WHERE storage_key IS NULL
        """
    )

    op.alter_column("media_assets", "storage_key", existing_type=sa.String(), nullable=False)
    op.create_index(op.f("ix_media_assets_storage_key"), "media_assets", ["storage_key"], unique=True)

    op.add_column(
        "lessons",
        sa.Column("thumbnail_url", sa.String(), nullable=True),
    )
    op.add_column(
        "lessons",
        sa.Column("media_id", sa.BigInteger(), nullable=True),
    )
    op.create_index(op.f("ix_lessons_media_id"), "lessons", ["media_id"], unique=False)
    op.create_foreign_key(
        "fk_lessons_media_id_media_assets",
        "lessons",
        "media_assets",
        ["media_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_lessons_media_id_media_assets", "lessons", type_="foreignkey")
    op.drop_index(op.f("ix_lessons_media_id"), table_name="lessons")
    op.drop_column("lessons", "media_id")
    op.drop_column("lessons", "thumbnail_url")

    op.drop_index(op.f("ix_media_assets_storage_key"), table_name="media_assets")
    op.drop_column("media_assets", "metadata_json")
    op.drop_column("media_assets", "height")
    op.drop_column("media_assets", "width")
    op.drop_column("media_assets", "duration_seconds")
    op.drop_column("media_assets", "file_size_bytes")
    op.drop_column("media_assets", "mime_type")
    op.drop_column("media_assets", "storage_key")
    op.drop_column("media_assets", "storage_provider")
