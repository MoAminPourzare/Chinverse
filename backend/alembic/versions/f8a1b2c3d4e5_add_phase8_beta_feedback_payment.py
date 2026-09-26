"""add phase eight closed-beta, feedback and payment idempotency tables

Revision ID: f8a1b2c3d4e5
Revises: e7c4a9b2d6f1
Create Date: 2026-08-24 00:00:00.000000

The tables are intentionally inert until their feature flags/provider secrets
are configured.  Invite codes are stored as HMAC digests only.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f8a1b2c3d4e5"
down_revision: Union[str, None] = "e7c4a9b2d6f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "beta_invites",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("email_hash", sa.String(length=64), nullable=True),
        sa.Column(
            "status", sa.String(length=20), server_default=sa.text("'issued'"), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("redeemed_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("issued_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('issued', 'redeemed', 'revoked', 'expired')", name="ck_beta_invites_status"),
        sa.ForeignKeyConstraint(["redeemed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["issued_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_hash", name="uq_beta_invites_code_hash"),
    )
    op.create_index("ix_beta_invites_email_status", "beta_invites", ["email_hash", "status"])
    op.create_index("ix_beta_invites_expires_status", "beta_invites", ["expires_at", "status"])

    op.create_table(
        "beta_feedback",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("steps_to_reproduce", sa.Text(), nullable=True),
        sa.Column("route", sa.String(length=200), nullable=True),
        sa.Column("release_sha", sa.String(length=64), nullable=False),
        sa.Column(
            "client_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), server_default=sa.text("'open'"), nullable=False),
        sa.Column("triage_note", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="ck_beta_feedback_rating"),
        sa.CheckConstraint("status IN ('open', 'triaged', 'resolved', 'dismissed')", name="ck_beta_feedback_status"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_beta_feedback_status_created", "beta_feedback", ["status", "created_at"])
    op.create_index("ix_beta_feedback_user_created", "beta_feedback", ["user_id", "created_at"])
    op.create_index("ix_beta_feedback_release_created", "beta_feedback", ["release_sha", "created_at"])

    op.create_table(
        "payment_webhook_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("order_id", sa.BigInteger(), nullable=True),
        sa.Column("payload_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'received'"), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["subscription_orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "event_id", name="uq_payment_webhook_provider_event"),
    )
    op.create_index("ix_payment_webhook_events_order_created", "payment_webhook_events", ["order_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_payment_webhook_events_order_created", table_name="payment_webhook_events")
    op.drop_table("payment_webhook_events")
    op.drop_index("ix_beta_feedback_release_created", table_name="beta_feedback")
    op.drop_index("ix_beta_feedback_user_created", table_name="beta_feedback")
    op.drop_index("ix_beta_feedback_status_created", table_name="beta_feedback")
    op.drop_table("beta_feedback")
    op.drop_index("ix_beta_invites_expires_status", table_name="beta_invites")
    op.drop_index("ix_beta_invites_email_status", table_name="beta_invites")
    op.drop_table("beta_invites")
