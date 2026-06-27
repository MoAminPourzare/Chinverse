"""enforce dictionary word sense integrity

Revision ID: 9c3d1e7a5b20
Revises: 6f2a9c1d4e8b
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9c3d1e7a5b20"
down_revision: Union[str, None] = "6f2a9c1d4e8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ux_dictionary_words_chinese", "dictionary_words", ["chinese"], unique=True)
    op.create_index("ix_word_definitions_word_sense", "word_definitions", ["word_id", "sense_order"], unique=False)
    op.create_index("ix_word_examples_word_sense", "word_examples", ["word_id", "sense_order"], unique=False)
    op.create_index("ix_word_collocations_word_sense", "word_collocations", ["word_id", "sense_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_word_collocations_word_sense", table_name="word_collocations")
    op.drop_index("ix_word_examples_word_sense", table_name="word_examples")
    op.drop_index("ix_word_definitions_word_sense", table_name="word_definitions")
    op.drop_index("ux_dictionary_words_chinese", table_name="dictionary_words")
