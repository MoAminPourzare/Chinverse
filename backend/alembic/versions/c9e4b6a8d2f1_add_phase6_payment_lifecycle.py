"""add phase six payment lifecycle and entitlement ledger

Revision ID: c9e4b6a8d2f1
Revises: a7d2c5e8f1b4
"""

from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9e4b6a8d2f1"
down_revision: Union[str, None] = "a7d2c5e8f1b4"
branch_labels: Union[str, list[str], None] = None
depends_on: Union[str, list[str], None] = None


def upgrade() -> None:
    op.add_column(
        "subscription_orders",
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscription_orders",
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscription_orders",
        sa.Column("failure_code", sa.String(length=80), nullable=True),
    )
    op.create_unique_constraint(
        "uq_subscription_orders_provider_reference",
        "subscription_orders",
        ["provider", "provider_reference"],
    )
    op.create_check_constraint(
        "ck_subscription_orders_status",
        "subscription_orders",
        "status IN ('created', 'provider_pending', 'pending', 'paid', "
        "'failed', 'cancelled', 'refunded', 'chargeback')",
    )

    op.add_column(
        "user_subscriptions",
        sa.Column("source_order_id", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "user_subscriptions",
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "user_subscriptions",
        sa.Column("revocation_reason", sa.String(length=80), nullable=True),
    )
    op.create_foreign_key(
        "fk_user_subscriptions_source_order",
        "user_subscriptions",
        "subscription_orders",
        ["source_order_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_unique_constraint(
        "uq_user_subscriptions_source_order",
        "user_subscriptions",
        ["source_order_id"],
    )

    op.add_column(
        "payment_webhook_events",
        sa.Column("provider_created_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "payment_ledger_entries",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("subscription_id", sa.BigInteger(), nullable=True),
        sa.Column("action", sa.String(length=24), nullable=False),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=16), nullable=False),
        sa.Column("provider_reference", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "action IN ('grant', 'renew', 'refund', 'chargeback', 'reject')",
            name="ck_payment_ledger_action",
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["payment_webhook_events.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["subscription_orders.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["user_subscriptions.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", name="uq_payment_ledger_event"),
    )
    op.create_index(
        "ix_payment_ledger_order_created",
        "payment_ledger_entries",
        ["order_id", "created_at"],
    )
    op.create_index(
        "ix_payment_ledger_user_created",
        "payment_ledger_entries",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_payment_ledger_user_created", table_name="payment_ledger_entries")
    op.drop_index("ix_payment_ledger_order_created", table_name="payment_ledger_entries")
    op.drop_table("payment_ledger_entries")

    op.drop_column("payment_webhook_events", "provider_created_at")

    op.drop_constraint(
        "uq_user_subscriptions_source_order",
        "user_subscriptions",
        type_="unique",
    )
    op.drop_constraint(
        "fk_user_subscriptions_source_order",
        "user_subscriptions",
        type_="foreignkey",
    )
    op.drop_column("user_subscriptions", "revocation_reason")
    op.drop_column("user_subscriptions", "revoked_at")
    op.drop_column("user_subscriptions", "source_order_id")

    op.drop_constraint(
        "ck_subscription_orders_status",
        "subscription_orders",
        type_="check",
    )
    op.drop_constraint(
        "uq_subscription_orders_provider_reference",
        "subscription_orders",
        type_="unique",
    )
    op.drop_column("subscription_orders", "failure_code")
    op.drop_column("subscription_orders", "closed_at")
    op.drop_column("subscription_orders", "paid_at")
