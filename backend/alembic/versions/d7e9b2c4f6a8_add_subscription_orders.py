"""add subscription orders

Revision ID: d7e9b2c4f6a8
Revises: c2f7a8d4e9b1
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "d7e9b2c4f6a8"
down_revision: Union[str, None] = "c2f7a8d4e9b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO subscription_plans (
            id,
            name,
            duration_months,
            price,
            is_active,
            updated_at
        )
        VALUES
            (1001, 'اشتراک سالانه چین ورس', 12, 1980000, TRUE, now()),
            (1002, 'اشتراک سه ماهه چین ورس', 3, 630000, TRUE, now()),
            (1003, 'اشتراک یک ماهه چین ورس', 1, 240000, TRUE, now())
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            duration_months = EXCLUDED.duration_months,
            price = EXCLUDED.price,
            is_active = TRUE,
            updated_at = now()
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS subscription_orders (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
            amount DOUBLE PRECISION NOT NULL,
            currency VARCHAR(16) NOT NULL DEFAULT 'IRT',
            status VARCHAR(32) NOT NULL DEFAULT 'created',
            provider VARCHAR(64),
            provider_reference VARCHAR(255),
            checkout_url TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_subscription_orders_user_created
        ON subscription_orders (user_id, created_at DESC)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_subscriptions_user_status_end
        ON user_subscriptions (user_id, status, end_date DESC)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_user_subscriptions_user_status_end")
    op.execute("DROP INDEX IF EXISTS ix_subscription_orders_user_created")
    op.execute("DROP TABLE IF EXISTS subscription_orders")
    # Never delete a plan that has become part of durable subscription
    # history. A full downgrade to base will later drop both legacy tables;
    # a one-revision downgrade must preserve referenced data instead of
    # deleting user subscriptions or failing on the foreign key.
    op.execute(
        """
        DELETE FROM subscription_plans AS plan
        WHERE plan.id IN (1001, 1002, 1003)
          AND NOT EXISTS (
              SELECT 1
              FROM user_subscriptions AS subscription
              WHERE subscription.plan_id = plan.id
          )
        """
    )
