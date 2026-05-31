"""add dictionary ai drafts

Revision ID: e2b7c9d4a6f1
Revises: a4c8e2f6b9d1
Create Date: 2026-05-31 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e2b7c9d4a6f1"
down_revision: Union[str, None] = "a4c8e2f6b9d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "dictionary_ai_drafts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("batch_id", sa.String(), nullable=False),
        sa.Column("source_word", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("prompt_context", sa.Text(), nullable=True),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("suggested_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_dictionary_ai_drafts_id"), "dictionary_ai_drafts", ["id"], unique=False)
    op.create_index(op.f("ix_dictionary_ai_drafts_batch_id"), "dictionary_ai_drafts", ["batch_id"], unique=False)
    op.create_index(op.f("ix_dictionary_ai_drafts_source_word"), "dictionary_ai_drafts", ["source_word"], unique=False)
    op.create_index(op.f("ix_dictionary_ai_drafts_status"), "dictionary_ai_drafts", ["status"], unique=False)
    op.create_index(op.f("ix_dictionary_ai_drafts_reviewed_by_user_id"), "dictionary_ai_drafts", ["reviewed_by_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dictionary_ai_drafts_reviewed_by_user_id"), table_name="dictionary_ai_drafts")
    op.drop_index(op.f("ix_dictionary_ai_drafts_status"), table_name="dictionary_ai_drafts")
    op.drop_index(op.f("ix_dictionary_ai_drafts_source_word"), table_name="dictionary_ai_drafts")
    op.drop_index(op.f("ix_dictionary_ai_drafts_batch_id"), table_name="dictionary_ai_drafts")
    op.drop_index(op.f("ix_dictionary_ai_drafts_id"), table_name="dictionary_ai_drafts")
    op.drop_table("dictionary_ai_drafts")
