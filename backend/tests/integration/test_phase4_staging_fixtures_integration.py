import json
import secrets
from urllib.parse import unquote, urlsplit
from uuid import uuid4

import asyncpg
import pytest

from app.core.config import settings
from scripts.phase4_staging_fixtures import (
    PASSWORD_CONTEXT,
    FixtureSafetyError,
    build_fixture_accounts,
    cleanup_fixtures,
    create_fixtures,
)


pytestmark = pytest.mark.integration


def isolated_test_database_url() -> str:
    """Fail before connecting unless pytest targets the disposable local DB."""
    database_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1,
    )
    parsed = urlsplit(database_url)
    if settings.ENVIRONMENT != "test":
        raise AssertionError("Fixture integration requires ENVIRONMENT=test.")
    if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise AssertionError("Fixture integration requires a loopback PostgreSQL host.")
    if unquote(parsed.username or "") != "chinverse_test":
        raise AssertionError("Fixture integration requires the chinverse_test role.")
    if unquote(parsed.path.lstrip("/")) != "chinverse_test":
        raise AssertionError("Fixture integration requires the chinverse_test database.")
    if parsed.password is None:
        raise AssertionError("Fixture integration requires an authenticated test connection.")
    return database_url


def runtime_password(label: str) -> str:
    return f"Phase four {label}! Aa9 {secrets.token_urlsafe(32)}"


async def create_sentinel_user(
    connection: asyncpg.Connection,
    *,
    email: str,
    phone: str,
) -> int:
    user_id = await connection.fetchval(
        """
        INSERT INTO users (
            email,
            phone,
            password_hash,
            is_verified,
            status,
            role,
            email_verified_at,
            phone_verified_at,
            password_changed_at,
            failed_login_attempts,
            mfa_enabled
        )
        VALUES ($1, $2, $3, true, 'active', 'user', now(), now(), now(), 0, false)
        RETURNING id
        """,
        email,
        phone,
        PASSWORD_CONTEXT.hash(runtime_password("sentinel")),
    )
    await connection.execute(
        """
        INSERT INTO user_profiles (user_id, display_name, profile_truth_confirmed)
        VALUES ($1, 'Sentinel Ordinary User', true)
        """,
        user_id,
    )
    return int(user_id)


async def insert_live_like_graph(
    connection: asyncpg.Connection,
    *,
    fixture_ids: dict[str, int],
) -> dict[str, object]:
    user_1 = fixture_ids["user_1"]
    user_2 = fixture_ids["user_2"]
    moderator = fixture_ids["moderator"]
    admin = fixture_ids["admin"]

    question_id = await connection.fetchval(
        """
        INSERT INTO forum_questions (author_user_id, title, body, status)
        VALUES ($1, 'Phase 4 removed question', 'Synthetic moderation target', 'open')
        RETURNING id
        """,
        user_1,
    )
    # Match the live remove workflow: its polymorphic target is already gone.
    await connection.execute("DELETE FROM forum_questions WHERE id = $1", question_id)
    report_id = await connection.fetchval(
        """
        INSERT INTO content_reports (
            reporter_id, target_type, target_id, reason, status,
            assigned_to, resolution, resolved_at
        )
        VALUES ($1, 'question', $2, 'spam', 'resolved', $3, 'remove', now())
        RETURNING id
        """,
        user_2,
        question_id,
        moderator,
    )
    moderation_action_id = await connection.fetchval(
        """
        INSERT INTO moderation_actions (
            report_id, moderator_id, action, target_type, target_id, notes
        )
        VALUES ($1, $2, 'remove', 'question', $3, 'Phase 4 live-like removal')
        RETURNING id
        """,
        report_id,
        moderator,
        question_id,
    )
    support_ticket_id = await connection.fetchval(
        """
        INSERT INTO support_tickets (
            user_id, message, status, admin_reply, responded_by, responded_at
        )
        VALUES ($1, 'Synthetic Phase 4 support request', 'closed',
                'Synthetic Phase 4 support response', $2, now())
        RETURNING id
        """,
        user_1,
        admin,
    )
    message_id = await connection.fetchval(
        """
        INSERT INTO messages (sender_id, receiver_id, content, is_read)
        VALUES ($1, $2, 'Synthetic Phase 4 chat message', true)
        RETURNING id
        """,
        user_1,
        user_2,
    )
    message_notification_id = await connection.fetchval(
        """
        INSERT INTO user_notifications (
            user_id, actor_user_id, type, title, body,
            target_url, metadata_json, is_read
        )
        VALUES ($1, $2, 'message', 'Synthetic chat notification', NULL,
                '/chat', $3::jsonb, false)
        RETURNING id
        """,
        user_2,
        user_1,
        json.dumps({"message_id": message_id}),
    )
    support_notification_id = await connection.fetchval(
        """
        INSERT INTO user_notifications (
            user_id, actor_user_id, type, title, body,
            target_url, metadata_json, is_read
        )
        VALUES ($1, $2, 'system', 'Synthetic support notification', NULL,
                '/support', $3::jsonb, false)
        RETURNING id
        """,
        user_1,
        admin,
        json.dumps({"ticket_id": support_ticket_id}),
    )
    return {
        "question_id": int(question_id),
        "report_id": int(report_id),
        "moderation_action_id": int(moderation_action_id),
        "support_ticket_id": int(support_ticket_id),
        "message_id": int(message_id),
        "notification_ids": [
            int(message_notification_id),
            int(support_notification_id),
        ],
    }


@pytest.mark.asyncio
async def test_phase4_fixture_cleanup_is_scoped_and_rolls_back_outer_transaction():
    run_id = f"roundtrip-{uuid4().hex[:12]}"
    accounts = build_fixture_accounts(run_id)
    passwords = {
        label: runtime_password(label)
        for label in ("user_1", "user_2", "moderator", "admin")
    }
    sentinel_suffix = uuid4().hex[:12]
    sentinel_email = f"phase4-sentinel-{sentinel_suffix}@example.com"
    sentinel_phone = f"09{int(sentinel_suffix, 16) % 1_000_000_000:09d}"

    connection = await asyncpg.connect(isolated_test_database_url())
    outer_transaction = connection.transaction(isolation="serializable")
    await outer_transaction.start()
    rolled_back_sentinel_count: int | None = None
    try:
        created = await create_fixtures(
            connection,
            accounts,
            passwords,
            apply=True,
        )
        assert created["state"] == "created"
        fixture_ids = {
            str(item["label"]): int(item["user_id"])
            for item in created["accounts"]
        }
        sentinel_id = await create_sentinel_user(
            connection,
            email=sentinel_email,
            phone=sentinel_phone,
        )

        dry_run = await cleanup_fixtures(connection, accounts, apply=False)
        assert dry_run["state"] == "present"
        assert {
            key: dry_run["inventory"][key]
            for key in (
                "media_assets",
                "profile_avatars",
                "gallery_items",
                "service_banners",
                "article_covers",
            )
        } == {
            "media_assets": 0,
            "profile_avatars": 0,
            "gallery_items": 0,
            "service_banners": 0,
            "article_covers": 0,
        }

        await connection.execute(
            "UPDATE user_profiles SET avatar_url = $1 WHERE user_id = $2",
            "https://storage.invalid/phase4-avatar.jpg",
            fixture_ids["user_1"],
        )
        with pytest.raises(FixtureSafetyError, match="storage-backed content"):
            await cleanup_fixtures(connection, accounts, apply=True)
        assert await connection.fetchval(
            "SELECT count(*) FROM users WHERE id = $1",
            fixture_ids["user_1"],
        ) == 1
        await connection.execute(
            "UPDATE user_profiles SET avatar_url = NULL WHERE user_id = $1",
            fixture_ids["user_1"],
        )

        cross_user_message_id = await connection.fetchval(
            """
            INSERT INTO messages (sender_id, receiver_id, content, is_read)
            VALUES ($1, $2, 'Out-of-scope sentinel edge', false)
            RETURNING id
            """,
            fixture_ids["user_1"],
            sentinel_id,
        )
        with pytest.raises(FixtureSafetyError, match="out-of-scope account"):
            await cleanup_fixtures(connection, accounts, apply=True)
        assert await connection.fetchval(
            "SELECT count(*) FROM messages WHERE id = $1",
            cross_user_message_id,
        ) == 1
        assert await connection.fetchval(
            "SELECT count(*) FROM users WHERE id = ANY($1::bigint[])",
            list(fixture_ids.values()),
        ) == 4
        await connection.execute(
            "DELETE FROM messages WHERE id = $1",
            cross_user_message_id,
        )

        graph = await insert_live_like_graph(connection, fixture_ids=fixture_ids)
        # A resolved remove report whose target is already gone is insufficient
        # without exact notification evidence tying it to this fixture graph.
        with pytest.raises(FixtureSafetyError, match="out-of-scope account or target"):
            await cleanup_fixtures(connection, accounts, apply=True)
        assert await connection.fetchval(
            "SELECT count(*) FROM content_reports WHERE id = $1",
            graph["report_id"],
        ) == 1

        removed_report_notification_id = await connection.fetchval(
            """
            INSERT INTO user_notifications (
                user_id, actor_user_id, type, title, body,
                target_url, metadata_json, is_read
            )
            VALUES ($1, NULL, 'moderation', 'Synthetic removal proof', NULL,
                    '/support', $2::jsonb, false)
            RETURNING id
            """,
            fixture_ids["user_1"],
            json.dumps({"report_id": graph["report_id"], "action": "remove"}),
        )
        graph["notification_ids"].append(int(removed_report_notification_id))

        verified_dry_run = await cleanup_fixtures(connection, accounts, apply=False)
        assert verified_dry_run["state"] == "present"
        cleaned = await cleanup_fixtures(connection, accounts, apply=True)
        assert cleaned["state"] == "deleted"
        assert cleaned["deleted_user_count"] == 4

        assert await connection.fetchval(
            "SELECT count(*) FROM content_reports WHERE id = $1",
            graph["report_id"],
        ) == 0
        assert await connection.fetchval(
            "SELECT count(*) FROM moderation_actions WHERE id = $1",
            graph["moderation_action_id"],
        ) == 0
        assert await connection.fetchval(
            "SELECT count(*) FROM support_tickets WHERE id = $1",
            graph["support_ticket_id"],
        ) == 0
        assert await connection.fetchval(
            "SELECT count(*) FROM messages WHERE id = $1",
            graph["message_id"],
        ) == 0
        assert await connection.fetchval(
            "SELECT count(*) FROM user_notifications WHERE id = ANY($1::bigint[])",
            graph["notification_ids"],
        ) == 0
        assert await connection.fetchval(
            "SELECT count(*) FROM users WHERE id = $1",
            sentinel_id,
        ) == 1

        idempotent = await cleanup_fixtures(connection, accounts, apply=True)
        assert idempotent["state"] == "absent"
    finally:
        try:
            await outer_transaction.rollback()
            # Prove that every test artifact was scoped to the caller-owned
            # transaction, even when a preceding assertion failed.
            rolled_back_sentinel_count = int(
                await connection.fetchval(
                    "SELECT count(*) FROM users WHERE lower(email) = $1",
                    sentinel_email,
                )
            )
        finally:
            # Closing is the final rollback backstop if the explicit rollback
            # itself ever fails because the connection changed state.
            await connection.close()

    assert rolled_back_sentinel_count == 0
