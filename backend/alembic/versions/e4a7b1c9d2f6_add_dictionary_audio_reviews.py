"""Track generated pronunciations and exact recording approvals."""
from alembic import op
import sqlalchemy as sa

revision = "e4a7b1c9d2f6"
down_revision = "d4a6c8e1f3b5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("dictionary_words", sa.Column("audio_pinyin", sa.String(), nullable=True))
    op.create_table(
        "dictionary_audio",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("word_id", sa.BigInteger(), sa.ForeignKey("dictionary_words.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("bundle_sha256", sa.String(64), nullable=False),
        sa.Column("audio_url", sa.String(), nullable=False),
        sa.Column("pinyins", sa.JSON(), nullable=False),
        sa.Column("review_reasons", sa.JSON(), nullable=False),
        sa.Column("voice", sa.String(), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("approved_pinyin", sa.String(), nullable=True),
        sa.Column("reviewed_by", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('ready', 'pending', 'approved', 'rejected')", name="ck_dictionary_audio_status"),
    )
    op.create_index("ix_dictionary_audio_status", "dictionary_audio", ["status"])
    op.create_index("ix_dictionary_audio_bundle_sha256", "dictionary_audio", ["bundle_sha256"])


def downgrade() -> None:
    op.drop_table("dictionary_audio")
    op.drop_column("dictionary_words", "audio_pinyin")
