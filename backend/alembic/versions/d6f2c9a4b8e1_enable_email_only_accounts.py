"""Allow email-only accounts while preserving data from existing accounts."""

from alembic import op
import sqlalchemy as sa


revision = "d6f2c9a4b8e1"
down_revision = "b3e8d1f6a9c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Older releases still map these columns. Stop requiring new phone values
    # while keeping a compatible schema during a staged rollout.
    op.alter_column("users", "phone", existing_type=sa.String(), nullable=True)
    op.execute(
        "UPDATE users SET is_verified = true "
        "WHERE email_verified_at IS NOT NULL AND is_verified IS DISTINCT FROM true"
    )


def downgrade() -> None:
    # PostgreSQL refuses this change if email-only accounts have been created.
    op.alter_column("users", "phone", existing_type=sa.String(), nullable=False)
