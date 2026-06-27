"""expand hsk dictionary schema

Revision ID: 6f2a9c1d4e8b
Revises: f9c1e4d2a8b7
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f2a9c1d4e8b"
down_revision: Union[str, None] = "f9c1e4d2a8b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("dictionary_words", sa.Column("hsk_level", sa.Integer(), nullable=True))
    op.add_column("dictionary_words", sa.Column("source", sa.String(), server_default="manual", nullable=False))
    op.add_column("dictionary_words", sa.Column("source_word_id", sa.String(), nullable=True))
    op.add_column("dictionary_words", sa.Column("status", sa.String(), server_default="published", nullable=False))
    op.add_column("dictionary_words", sa.Column("notes", sa.Text(), nullable=True))
    op.create_index(op.f("ix_dictionary_words_hsk_level"), "dictionary_words", ["hsk_level"], unique=False)
    op.create_index(op.f("ix_dictionary_words_source_word_id"), "dictionary_words", ["source_word_id"], unique=False)

    op.add_column("word_definitions", sa.Column("sense_order", sa.Integer(), server_default="1", nullable=False))
    op.add_column("word_definitions", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("word_collocations", sa.Column("sense_order", sa.Integer(), server_default="1", nullable=False))
    op.add_column("word_examples", sa.Column("sense_order", sa.Integer(), server_default="1", nullable=False))

    op.alter_column("dictionary_words", "source", server_default=None)
    op.alter_column("dictionary_words", "status", server_default=None)
    op.alter_column("word_definitions", "sense_order", server_default=None)
    op.alter_column("word_collocations", "sense_order", server_default=None)
    op.alter_column("word_examples", "sense_order", server_default=None)


def downgrade() -> None:
    op.drop_column("word_examples", "sense_order")
    op.drop_column("word_collocations", "sense_order")
    op.drop_column("word_definitions", "notes")
    op.drop_column("word_definitions", "sense_order")

    op.drop_index(op.f("ix_dictionary_words_source_word_id"), table_name="dictionary_words")
    op.drop_index(op.f("ix_dictionary_words_hsk_level"), table_name="dictionary_words")
    op.drop_column("dictionary_words", "notes")
    op.drop_column("dictionary_words", "status")
    op.drop_column("dictionary_words", "source_word_id")
    op.drop_column("dictionary_words", "source")
    op.drop_column("dictionary_words", "hsk_level")
