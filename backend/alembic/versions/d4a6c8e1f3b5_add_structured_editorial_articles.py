"""Add stable article identifiers and structured reading content."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d4a6c8e1f3b5"
down_revision = "a3b6d9e2f5c8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("slug", sa.String(160), nullable=True))
    op.add_column("articles", sa.Column("document_json", postgresql.JSONB(), nullable=True))
    op.create_unique_constraint("uq_articles_slug", "articles", ["slug"])


def downgrade() -> None:
    op.drop_constraint("uq_articles_slug", "articles", type_="unique")
    op.drop_column("articles", "document_json")
    op.drop_column("articles", "slug")
