"""add phase seven chat indexes, event relay and presence leases

Revision ID: e7c4a9b2d6f1
Revises: b5e7c9d1f3a2
Create Date: 2026-08-21 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e7c4a9b2d6f1"
down_revision: Union[str, None] = "b5e7c9d1f3a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_messages_sender_receiver_id_desc",
        "messages",
        ["sender_id", "receiver_id", sa.text("id DESC")],
        unique=False,
    )
    op.create_index(
        "ix_messages_receiver_sender_id_desc",
        "messages",
        ["receiver_id", "sender_id", sa.text("id DESC")],
        unique=False,
    )
    op.create_index(
        "ix_messages_unread_receiver_sender_id",
        "messages",
        ["receiver_id", "sender_id", "id"],
        unique=False,
        postgresql_where=sa.text("is_read = false"),
    )

    op.create_table(
        "chat_realtime_events",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("source_instance_id", sa.String(length=64), nullable=False),
        sa.Column("recipient_user_id", sa.BigInteger(), nullable=False),
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["recipient_user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # PostgreSQL sequences allocate values outside transaction visibility. Without
    # serialization transaction A can reserve id=10, transaction B can reserve and
    # commit id=11, and a relay can advance past 11 before 10 becomes visible. A
    # statement-level BEFORE trigger takes a transaction-scoped advisory lock before
    # the row default (nextval) is evaluated, making event ids follow commit order.
    op.execute(
        """
        CREATE FUNCTION chat_realtime_events_serialize_insert()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            PERFORM pg_catalog.pg_advisory_xact_lock(1128812118, 7);
            RETURN NULL;
        END;
        $$
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_chat_realtime_events_serialize_insert
        BEFORE INSERT ON chat_realtime_events
        FOR EACH STATEMENT
        EXECUTE FUNCTION chat_realtime_events_serialize_insert()
        """
    )
    op.create_index(
        "ix_chat_realtime_events_recipient_id",
        "chat_realtime_events",
        ["recipient_user_id", "id"],
        unique=False,
    )
    op.create_index(
        "ix_chat_realtime_events_expires",
        "chat_realtime_events",
        ["expires_at"],
        unique=False,
    )

    op.create_table(
        "chat_presence_leases",
        sa.Column("instance_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("instance_id", "user_id"),
    )
    op.create_index(
        "ix_chat_presence_user_expires",
        "chat_presence_leases",
        ["user_id", "expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_chat_presence_expires",
        "chat_presence_leases",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_chat_presence_expires", table_name="chat_presence_leases")
    op.drop_index("ix_chat_presence_user_expires", table_name="chat_presence_leases")
    op.drop_table("chat_presence_leases")

    op.drop_index("ix_chat_realtime_events_expires", table_name="chat_realtime_events")
    op.drop_index("ix_chat_realtime_events_recipient_id", table_name="chat_realtime_events")
    op.execute(
        "DROP TRIGGER trg_chat_realtime_events_serialize_insert "
        "ON chat_realtime_events"
    )
    op.execute("DROP FUNCTION chat_realtime_events_serialize_insert()")
    op.drop_table("chat_realtime_events")

    op.drop_index("ix_messages_unread_receiver_sender_id", table_name="messages")
    op.drop_index("ix_messages_receiver_sender_id_desc", table_name="messages")
    op.drop_index("ix_messages_sender_receiver_id_desc", table_name="messages")
