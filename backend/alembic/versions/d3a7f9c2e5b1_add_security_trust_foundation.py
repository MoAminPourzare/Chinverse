"""add security and trust foundation

Revision ID: d3a7f9c2e5b1
Revises: c8f1e2a4d6b9
Create Date: 2026-07-29 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3a7f9c2e5b1"
down_revision: Union[str, None] = "c8f1e2a4d6b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=20),
            server_default="user",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "mfa_enabled",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column("mfa_secret_ciphertext", sa.Text(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("mfa_pending_secret_ciphertext", sa.Text(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("mfa_last_used_step", sa.BigInteger(), nullable=True),
    )
    op.create_index("ix_users_role", "users", ["role"], unique=False)
    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('user', 'moderator', 'admin')",
    )
    op.execute(
        """
        UPDATE users
        SET email_verified_at = COALESCE(updated_at, created_at, now()),
            phone_verified_at = COALESCE(updated_at, created_at, now())
        WHERE is_verified = true
        """
    )

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent_hash", sa.String(length=64), nullable=True),
        sa.Column("mfa_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_auth_sessions_refresh_token_hash",
        "auth_sessions",
        ["refresh_token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_auth_sessions_user_id",
        "auth_sessions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_auth_sessions_expires_at",
        "auth_sessions",
        ["expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_auth_sessions_user_active",
        "auth_sessions",
        ["user_id", "revoked_at", "expires_at"],
        unique=False,
    )

    op.create_table(
        "auth_challenges",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("destination_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_auth_challenges_token_hash",
        "auth_challenges",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_auth_challenges_user_id",
        "auth_challenges",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_auth_challenges_expires_at",
        "auth_challenges",
        ["expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_auth_challenges_user_purpose_active",
        "auth_challenges",
        ["user_id", "purpose", "consumed_at", "expires_at"],
        unique=False,
    )

    op.create_table(
        "mfa_backup_codes",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_hash"),
    )
    op.create_index(
        "ix_mfa_backup_codes_user_id",
        "mfa_backup_codes",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_mfa_backup_codes_user_unused",
        "mfa_backup_codes",
        ["user_id", "used_at"],
        unique=False,
    )

    op.create_table(
        "rate_limit_buckets",
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_index(
        "ix_rate_limit_buckets_expires_at",
        "rate_limit_buckets",
        ["expires_at"],
        unique=False,
    )

    op.create_table(
        "security_audit_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("subject", sa.String(length=160), nullable=True),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent_hash", sa.String(length=64), nullable=True),
        sa.Column("details_json", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_security_audit_events_actor_user_id",
        "security_audit_events",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_security_audit_events_actor_created",
        "security_audit_events",
        ["actor_user_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_security_audit_events_event_created",
        "security_audit_events",
        ["event_type", "created_at"],
        unique=False,
    )

    op.create_table(
        "legal_acceptances",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("document_type", sa.String(length=32), nullable=False),
        sa.Column("document_version", sa.String(length=32), nullable=False),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent_hash", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "document_type",
            "document_version",
            name="uq_legal_acceptances_user_document_version",
        ),
    )
    op.create_index(
        "ix_legal_acceptances_user_id",
        "legal_acceptances",
        ["user_id"],
    )
    op.create_index(
        "ix_legal_acceptances_user_accepted",
        "legal_acceptances",
        ["user_id", "accepted_at"],
    )

    op.create_table(
        "user_blocks",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("blocker_id", sa.BigInteger(), nullable=False),
        sa.Column("blocked_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("blocker_id <> blocked_id", name="ck_user_blocks_not_self"),
        sa.ForeignKeyConstraint(["blocked_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["blocker_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "blocker_id",
            "blocked_id",
            name="uq_user_blocks_pair",
        ),
    )
    op.create_index("ix_user_blocks_blocked_id", "user_blocks", ["blocked_id"])
    op.create_index("ix_user_blocks_blocker_id", "user_blocks", ["blocker_id"])

    op.create_table(
        "content_reports",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("reporter_id", sa.BigInteger(), nullable=True),
        sa.Column("target_type", sa.String(length=40), nullable=False),
        sa.Column("target_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(length=40), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=24), server_default="open", nullable=False),
        sa.Column("assigned_to", sa.BigInteger(), nullable=True),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('open', 'reviewing', 'resolved', 'dismissed')",
            name="ck_content_reports_status",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_to"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["reporter_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_content_reports_reporter_id",
        "content_reports",
        ["reporter_id"],
    )
    op.create_index("ix_content_reports_status", "content_reports", ["status"])
    op.create_index(
        "ix_content_reports_status_created",
        "content_reports",
        ["status", "created_at"],
    )
    op.create_index(
        "ix_content_reports_target",
        "content_reports",
        ["target_type", "target_id"],
    )
    op.create_index(
        "uq_content_reports_active_report",
        "content_reports",
        ["reporter_id", "target_type", "target_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('open', 'reviewing')"),
    )

    op.create_table(
        "moderation_actions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("report_id", sa.BigInteger(), nullable=True),
        sa.Column("moderator_id", sa.BigInteger(), nullable=True),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("target_type", sa.String(length=40), nullable=False),
        sa.Column("target_id", sa.BigInteger(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["moderator_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["report_id"],
            ["content_reports.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_moderation_actions_moderator_id",
        "moderation_actions",
        ["moderator_id"],
    )
    op.create_index(
        "ix_moderation_actions_report_id",
        "moderation_actions",
        ["report_id"],
    )
    op.create_index(
        "ix_moderation_actions_target",
        "moderation_actions",
        ["target_type", "target_id"],
    )


def downgrade() -> None:
    op.drop_table("moderation_actions")
    op.drop_table("content_reports")
    op.drop_table("user_blocks")
    op.drop_table("legal_acceptances")
    op.drop_table("security_audit_events")
    op.drop_table("rate_limit_buckets")
    op.drop_table("mfa_backup_codes")
    op.drop_table("auth_challenges")
    op.drop_table("auth_sessions")

    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "mfa_pending_secret_ciphertext")
    op.drop_column("users", "mfa_last_used_step")
    op.drop_column("users", "mfa_secret_ciphertext")
    op.drop_column("users", "mfa_enabled")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "phone_verified_at")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "role")
