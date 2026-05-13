"""add referrals

Revision ID: c2f7a8d4e9b1
Revises: a9d4e6f2b8c1
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "c2f7a8d4e9b1"
down_revision: Union[str, None] = "a9d4e6f2b8c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_referral_codes (
            user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(32) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_referral_codes_code
        ON user_referral_codes (code)
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_referrals (
            id BIGSERIAL PRIMARY KEY,
            referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            referral_code VARCHAR(32) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'joined',
            reward_status VARCHAR(32) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_user_referrals_referred_user UNIQUE (referred_user_id),
            CONSTRAINT ck_user_referrals_not_self CHECK (referrer_user_id <> referred_user_id)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_referrals_referrer_created
        ON user_referrals (referrer_user_id, created_at DESC)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_user_referrals_referrer_created")
    op.execute("DROP TABLE IF EXISTS user_referrals")
    op.execute("DROP INDEX IF EXISTS ix_user_referral_codes_code")
    op.execute("DROP TABLE IF EXISTS user_referral_codes")
