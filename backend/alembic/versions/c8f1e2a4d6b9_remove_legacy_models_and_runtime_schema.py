"""remove legacy models and runtime-managed schema

Revision ID: c8f1e2a4d6b9
Revises: e6b9c2d4a7f0
Create Date: 2026-07-29 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8f1e2a4d6b9"
down_revision: Union[str, None] = "e6b9c2d4a7f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Preserve useful legacy service records in the active showcase model.
    op.execute(
        """
        INSERT INTO user_services (
            user_id,
            title,
            description,
            banner_url,
            price_label,
            created_at,
            updated_at
        )
        SELECT
            legacy.provider_user_id,
            legacy.title,
            legacy.description,
            NULL,
            legacy.base_price::text,
            legacy.created_at,
            legacy.updated_at
        FROM services AS legacy
        WHERE legacy.is_active = true
          AND NOT EXISTS (
              SELECT 1
              FROM user_services AS current
              WHERE current.user_id = legacy.provider_user_id
                AND current.title = legacy.title
                AND current.description = legacy.description
          )
        """
    )

    # Merge old Leitner progress into the model used by the current API.
    op.execute(
        """
        INSERT INTO user_flashcards (
            user_id,
            word_id,
            box_number,
            next_review_at,
            last_reviewed_at,
            created_at,
            updated_at
        )
        SELECT
            user_id,
            word_id,
            GREATEST(1, LEAST(5, box_index)),
            COALESCE(next_review_at::timestamp AT TIME ZONE 'Asia/Tehran', now()),
            last_review_at::timestamp AT TIME ZONE 'Asia/Tehran',
            created_at,
            updated_at
        FROM leitner_cards
        ON CONFLICT (user_id, word_id) DO UPDATE SET
            box_number = GREATEST(user_flashcards.box_number, EXCLUDED.box_number),
            next_review_at = LEAST(user_flashcards.next_review_at, EXCLUDED.next_review_at),
            last_reviewed_at = GREATEST(
                user_flashcards.last_reviewed_at,
                EXCLUDED.last_reviewed_at
            ),
            updated_at = GREATEST(user_flashcards.updated_at, EXCLUDED.updated_at)
        """
    )

    op.drop_table("consultation_requests")
    op.drop_table("services")
    op.drop_table("course_reviews")
    op.drop_table("user_streaks")
    op.drop_table("leitner_cards")


def downgrade() -> None:
    op.create_table(
        "services",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("provider_user_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("base_price", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
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
        sa.ForeignKeyConstraint(["provider_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_services_id"), "services", ["id"], unique=False)

    op.create_table(
        "leitner_cards",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("word_id", sa.BigInteger(), nullable=False),
        sa.Column("box_index", sa.Integer(), nullable=False),
        sa.Column("next_review_at", sa.Date(), nullable=True),
        sa.Column("last_review_at", sa.Date(), nullable=True),
        sa.Column("consecutive_correct_count", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["word_id"], ["dictionary_words.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "word_id", name="uq_leitner_user_word"),
    )
    op.create_index(
        op.f("ix_leitner_cards_id"),
        "leitner_cards",
        ["id"],
        unique=False,
    )

    op.create_table(
        "user_streaks",
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("current_streak_days", sa.Integer(), nullable=False),
        sa.Column("longest_streak_days", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "course_reviews",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("course_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_course_reviews_id"),
        "course_reviews",
        ["id"],
        unique=False,
    )

    op.create_table(
        "consultation_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("service_id", sa.BigInteger(), nullable=False),
        sa.Column("requester_user_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("initial_message", sa.Text(), nullable=False),
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
        sa.ForeignKeyConstraint(["requester_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_consultation_requests_id"),
        "consultation_requests",
        ["id"],
        unique=False,
    )

    # Restore indexes introduced by b0a8f1c2d3e4 so older downgrades can
    # remove them in the same state they originally created.
    op.create_index(
        "ix_leitner_cards_user_id",
        "leitner_cards",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_leitner_cards_word_id",
        "leitner_cards",
        ["word_id"],
        unique=False,
    )
    op.create_index(
        "ix_leitner_cards_user_next_review",
        "leitner_cards",
        ["user_id", "next_review_at"],
        unique=False,
    )
    op.create_index(
        "ix_course_reviews_course_id",
        "course_reviews",
        ["course_id"],
        unique=False,
    )
    op.create_index(
        "ix_course_reviews_user_id",
        "course_reviews",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_services_provider_user_id",
        "services",
        ["provider_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_consultation_requests_service_id",
        "consultation_requests",
        ["service_id"],
        unique=False,
    )
    op.create_index(
        "ix_consultation_requests_requester_user_id",
        "consultation_requests",
        ["requester_user_id"],
        unique=False,
    )
