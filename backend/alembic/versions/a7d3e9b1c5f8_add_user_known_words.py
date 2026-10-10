"""Persist explicit known vocabulary without adding review cards."""
from alembic import op
import sqlalchemy as sa

revision = "a7d3e9b1c5f8"
down_revision = "e4a7b1c9d2f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_known_words",
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("word_id", sa.BigInteger(), sa.ForeignKey("dictionary_words.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("user_known_words")
