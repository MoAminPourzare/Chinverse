"""Create or remove the four synthetic accounts used by the Phase 4 live smoke.

This is deliberately not a general-purpose user-management command.  It only
accepts the permanent Phase 4 Neon staging endpoint and the current audited
Alembic head.  The default mode is a read-only dry run; writes additionally
require ``--apply`` and an exact ``--confirm-run-id`` value.

Required environment variables for ``create`` (including dry runs):

* ``DATABASE_URL``
* ``CHINVERSE_PHASE4_RUN_ID`` (or ``--run-id``)
* ``CHINVERSE_PHASE4_USER_1_PASSWORD``
* ``CHINVERSE_PHASE4_USER_2_PASSWORD``
* ``CHINVERSE_PHASE4_MODERATOR_PASSWORD``
* ``CHINVERSE_PHASE4_ADMIN_PASSWORD``

Passwords and the database URL are never included in command output.
"""

from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import re
import ssl
import sys
from typing import Iterable, Mapping, Sequence
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import asyncpg
from passlib.context import CryptContext


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.legal import LEGAL_DOCUMENT_VERSIONS  # noqa: E402
from app.core.passwords import (  # noqa: E402
    password_contains_account_data,
    validate_new_password,
)


EXPECTED_ENDPOINT_ID = "ep-wild-band-atse2yoq"
EXPECTED_ALEMBIC_HEAD = "e7c4a9b2d6f1"
FIXTURE_EMAIL_DOMAIN = "example.com"
RUN_ID_PATTERN = re.compile(r"[a-z0-9](?:[a-z0-9-]{4,38}[a-z0-9])?")
ADVISORY_LOCK_NAME = "chinverse-phase4-staging-fixtures"

PASSWORD_ENVIRONMENTS = {
    "user_1": "CHINVERSE_PHASE4_USER_1_PASSWORD",
    "user_2": "CHINVERSE_PHASE4_USER_2_PASSWORD",
    "moderator": "CHINVERSE_PHASE4_MODERATOR_PASSWORD",
    "admin": "CHINVERSE_PHASE4_ADMIN_PASSWORD",
}

FIXTURE_ROLES = {
    "user_1": "user",
    "user_2": "user",
    "moderator": "moderator",
    "admin": "admin",
}

FIXTURE_DISPLAY_NAMES = {
    "user_1": "کاربر آزمایشی یک",
    "user_2": "کاربر آزمایشی دو",
    "moderator": "ناظر آزمایشی",
    "admin": "مدیر آزمایشی",
}

# Every FK that points directly at public.users(id) at EXPECTED_ALEMBIC_HEAD.
# Runtime verification makes schema drift fail closed before any mutation.
EXPECTED_USER_FOREIGN_KEYS = {
    ("article_comments", "author_user_id", "CASCADE"),
    ("articles", "author_user_id", "NO ACTION"),
    ("auth_challenges", "user_id", "CASCADE"),
    ("auth_sessions", "user_id", "CASCADE"),
    ("chat_presence_leases", "user_id", "CASCADE"),
    ("chat_realtime_events", "recipient_user_id", "CASCADE"),
    ("content_comments", "user_id", "CASCADE"),
    ("content_likes", "user_id", "CASCADE"),
    ("content_reports", "assigned_to", "SET NULL"),
    ("content_reports", "reporter_id", "SET NULL"),
    ("courses", "published_by_id", "SET NULL"),
    ("forum_answers", "author_user_id", "NO ACTION"),
    ("forum_questions", "author_user_id", "NO ACTION"),
    ("legal_acceptances", "user_id", "CASCADE"),
    ("lessons", "published_by_id", "SET NULL"),
    ("media_access_audit_events", "user_id", "SET NULL"),
    ("media_assets", "license_reviewed_by_id", "SET NULL"),
    ("media_assets", "published_by_id", "SET NULL"),
    ("media_assets", "user_id", "NO ACTION"),
    ("messages", "receiver_id", "NO ACTION"),
    ("messages", "sender_id", "NO ACTION"),
    ("mfa_backup_codes", "user_id", "CASCADE"),
    ("moderation_actions", "moderator_id", "SET NULL"),
    ("post_comments", "user_id", "NO ACTION"),
    ("post_likes", "user_id", "NO ACTION"),
    ("posts", "author_user_id", "NO ACTION"),
    ("security_audit_events", "actor_user_id", "SET NULL"),
    ("study_sessions", "user_id", "NO ACTION"),
    ("subscription_orders", "user_id", "CASCADE"),
    ("support_tickets", "responded_by", "SET NULL"),
    ("support_tickets", "user_id", "NO ACTION"),
    ("subtitle_tracks", "published_by_id", "SET NULL"),
    ("user_blocks", "blocked_id", "CASCADE"),
    ("user_blocks", "blocker_id", "CASCADE"),
    ("user_flashcards", "user_id", "NO ACTION"),
    ("user_follows", "followee_id", "NO ACTION"),
    ("user_follows", "follower_id", "NO ACTION"),
    ("user_gallery_items", "user_id", "NO ACTION"),
    ("user_language_settings", "user_id", "NO ACTION"),
    ("user_lesson_watch_progress", "user_id", "CASCADE"),
    ("user_notifications", "actor_user_id", "SET NULL"),
    ("user_notifications", "user_id", "CASCADE"),
    ("user_preferences", "user_id", "NO ACTION"),
    ("user_profiles", "user_id", "NO ACTION"),
    ("user_referral_codes", "user_id", "CASCADE"),
    ("user_referrals", "referred_user_id", "CASCADE"),
    ("user_referrals", "referrer_user_id", "CASCADE"),
    ("user_saved_courses", "user_id", "CASCADE"),
    ("user_services", "user_id", "NO ACTION"),
    ("user_social_links", "user_id", "NO ACTION"),
    ("user_subscriptions", "user_id", "NO ACTION"),
}

USER_FOREIGN_KEYS_SQL = """
    SELECT
        tc.table_name,
        kcu.column_name,
        rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON kcu.constraint_schema = tc.constraint_schema
     AND kcu.constraint_name = tc.constraint_name
     AND kcu.table_schema = tc.table_schema
     AND kcu.table_name = tc.table_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_schema = tc.constraint_schema
     AND rc.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_schema = rc.unique_constraint_schema
     AND ccu.constraint_name = rc.unique_constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
    ORDER BY tc.table_name, kcu.column_name
"""

PASSWORD_CONTEXT = CryptContext(
    schemes=["argon2", "bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)


class FixtureSafetyError(RuntimeError):
    """A fail-closed fixture safety check rejected the operation."""


@dataclass(frozen=True)
class FixtureAccount:
    label: str
    email: str
    phone: str
    role: str
    display_name: str


def operation_transaction(
    connection: asyncpg.Connection,
    *,
    apply: bool,
):
    """Use a savepoint when a caller already owns the outer transaction."""
    if connection.is_in_transaction():
        return connection.transaction()
    isolation = "serializable" if apply else "repeatable_read"
    return connection.transaction(isolation=isolation, readonly=not apply)


def normalize_run_id(raw_value: str) -> str:
    run_id = raw_value.strip().lower()
    if not RUN_ID_PATTERN.fullmatch(run_id):
        raise FixtureSafetyError(
            "Run id must be 6-40 lowercase ASCII letters, digits, or hyphens "
            "and cannot start or end with a hyphen."
        )
    return run_id


def build_fixture_accounts(run_id: str) -> tuple[FixtureAccount, ...]:
    accounts = []
    for label, role in FIXTURE_ROLES.items():
        phone_seed = hashlib.sha256(f"{run_id}:{label}".encode("ascii")).digest()
        phone_suffix = int.from_bytes(phone_seed[:8], "big") % 1_000_000_000
        accounts.append(
            FixtureAccount(
                label=label,
                email=f"phase4-{run_id}-{label.replace('_', '-')}@{FIXTURE_EMAIL_DOMAIN}",
                phone=f"09{phone_suffix:09d}",
                role=role,
                display_name=FIXTURE_DISPLAY_NAMES[label],
            )
        )

    emails = {account.email for account in accounts}
    phones = {account.phone for account in accounts}
    if len(emails) != len(accounts) or len(phones) != len(accounts):
        raise FixtureSafetyError("Run id produced duplicate fixture identities; use another run id.")
    return tuple(accounts)


def validate_and_normalize_database_url(raw_url: str) -> str:
    """Validate the staging endpoint/TLS settings and return an asyncpg DSN."""
    if not raw_url.strip():
        raise FixtureSafetyError("DATABASE_URL is required.")

    try:
        parsed = urlsplit(raw_url.strip())
        hostname = (parsed.hostname or "").lower()
        port = parsed.port
    except ValueError as exc:
        raise FixtureSafetyError("DATABASE_URL is not a valid PostgreSQL URL.") from exc

    if parsed.scheme not in {"postgres", "postgresql", "postgresql+asyncpg"}:
        raise FixtureSafetyError("DATABASE_URL must use PostgreSQL.")
    if not parsed.username or parsed.password is None or not hostname or not parsed.path.strip("/"):
        raise FixtureSafetyError("DATABASE_URL must include database, host, user, and password.")
    if port not in {None, 5432}:
        raise FixtureSafetyError("Unexpected PostgreSQL port for the Neon staging endpoint.")

    endpoint_label = hostname.split(".", 1)[0]
    if endpoint_label.endswith("-pooler"):
        endpoint_label = endpoint_label[: -len("-pooler")]
    if endpoint_label != EXPECTED_ENDPOINT_ID:
        raise FixtureSafetyError("DATABASE_URL does not target the approved Phase 4 staging endpoint.")
    if not hostname.endswith(".neon.tech"):
        raise FixtureSafetyError("DATABASE_URL host is not a Neon endpoint.")

    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    query = {key.lower(): value.lower() for key, value in query_pairs}
    if query.get("sslmode") != "verify-full":
        raise FixtureSafetyError(
            "DATABASE_URL must enforce certificate and hostname verification with sslmode=verify-full."
        )
    if query.get("channel_binding") != "require":
        raise FixtureSafetyError("DATABASE_URL must require channel binding.")

    # asyncpg 0.29 does not accept libpq's channel_binding/application_name DSN
    # options. They are checked as part of the provider URL contract and removed
    # only from the in-memory DSN. sslmode=verify-full remains part of the
    # validated provider contract; run() also supplies an explicit system-CA,
    # certificate- and hostname-verifying SSL context to asyncpg.
    asyncpg_query = [
        (key, value)
        for key, value in query_pairs
        if key.lower() not in {"channel_binding", "application_name"}
    ]
    scheme = "postgresql"
    netloc = parsed.netloc
    normalized = urlunsplit(
        (scheme, netloc, parsed.path, urlencode(asyncpg_query), parsed.fragment)
    )
    return normalized


def build_verified_ssl_context() -> ssl.SSLContext:
    """Build a system-CA TLS context that always verifies the Neon hostname."""
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context


def load_passwords(
    accounts: Sequence[FixtureAccount],
    environment: Mapping[str, str],
) -> dict[str, str]:
    passwords: dict[str, str] = {}
    by_label = {account.label: account for account in accounts}
    for label, environment_name in PASSWORD_ENVIRONMENTS.items():
        password = environment.get(environment_name)
        if password is None:
            raise FixtureSafetyError(f"Required password environment is missing: {environment_name}")
        try:
            validate_new_password(password)
        except (TypeError, ValueError) as exc:
            raise FixtureSafetyError(
                f"Password in {environment_name} does not satisfy the application policy."
            ) from exc
        account = by_label[label]
        if password_contains_account_data(
            password,
            account.email.split("@", 1)[0],
            account.phone,
        ):
            raise FixtureSafetyError(
                f"Password in {environment_name} contains fixture account data."
            )
        passwords[label] = password
    return passwords


async def verify_database_contract(connection: asyncpg.Connection) -> None:
    heads = await connection.fetch("SELECT version_num FROM alembic_version")
    found_heads = {str(row["version_num"]) for row in heads}
    if found_heads != {EXPECTED_ALEMBIC_HEAD}:
        raise FixtureSafetyError(
            "Database Alembic revision does not exactly match the approved Phase 4 head."
        )

    foreign_keys = {
        (str(row["table_name"]), str(row["column_name"]), str(row["delete_rule"]))
        for row in await connection.fetch(USER_FOREIGN_KEYS_SQL)
    }
    if foreign_keys != EXPECTED_USER_FOREIGN_KEYS:
        raise FixtureSafetyError(
            "Database user-FK contract differs from the audited Phase 4 schema."
        )


async def lock_fixture_operation(connection: asyncpg.Connection) -> None:
    await connection.execute("SELECT pg_advisory_xact_lock(hashtext($1))", ADVISORY_LOCK_NAME)


async def fetch_fixture_rows(
    connection: asyncpg.Connection,
    accounts: Sequence[FixtureAccount],
    *,
    for_update: bool,
) -> list[asyncpg.Record]:
    emails = [account.email for account in accounts]
    phones = [account.phone for account in accounts]
    # Lock only users: PostgreSQL rejects a blanket FOR UPDATE on the nullable
    # side of the profile LEFT JOIN.
    lock_clause = " FOR UPDATE OF u" if for_update else ""
    return list(
        await connection.fetch(
            """
            SELECT
                u.id,
                lower(u.email) AS email,
                u.phone,
                u.role,
                u.is_verified,
                u.status,
                u.password_hash,
                p.display_name,
                (
                    SELECT count(*)
                    FROM legal_acceptances AS la
                    WHERE la.user_id = u.id
                      AND (la.document_type, la.document_version) IN (
                          SELECT * FROM unnest($3::text[], $4::text[])
                      )
                ) AS legal_acceptance_count
            FROM users AS u
            LEFT JOIN user_profiles AS p ON p.user_id = u.id
            WHERE lower(u.email) = ANY($1::text[])
               OR u.phone = ANY($2::text[])
            """
            + lock_clause,
            emails,
            phones,
            list(LEGAL_DOCUMENT_VERSIONS),
            list(LEGAL_DOCUMENT_VERSIONS.values()),
        )
    )


def fixture_state(
    rows: Sequence[Mapping[str, object]],
    accounts: Sequence[FixtureAccount],
    passwords: Mapping[str, str] | None,
) -> str:
    if not rows:
        return "absent"
    if len(rows) != len(accounts):
        return "conflict"

    rows_by_email = {str(row["email"]): row for row in rows}
    for account in accounts:
        row = rows_by_email.get(account.email)
        if row is None:
            return "conflict"
        if (
            str(row["phone"]) != account.phone
            or str(row["role"]) != account.role
            or not bool(row["is_verified"])
            or str(row["status"]) != "active"
            or str(row["display_name"]) != account.display_name
            or int(row["legal_acceptance_count"]) != len(LEGAL_DOCUMENT_VERSIONS)
        ):
            return "conflict"
        if passwords is not None and not PASSWORD_CONTEXT.verify(
            passwords[account.label],
            str(row["password_hash"]),
        ):
            return "conflict"
    return "complete"


def public_accounts(
    accounts: Sequence[FixtureAccount],
    rows: Sequence[Mapping[str, object]] = (),
) -> list[dict[str, object]]:
    ids_by_email = {str(row["email"]): int(row["id"]) for row in rows}
    return [
        {
            "label": account.label,
            "email": account.email,
            "role": account.role,
            "user_id": ids_by_email.get(account.email),
        }
        for account in accounts
    ]


async def create_fixtures(
    connection: asyncpg.Connection,
    accounts: Sequence[FixtureAccount],
    passwords: Mapping[str, str],
    *,
    apply: bool,
) -> dict[str, object]:
    async with operation_transaction(connection, apply=apply):
        await verify_database_contract(connection)
        if apply:
            await lock_fixture_operation(connection)
        rows = await fetch_fixture_rows(connection, accounts, for_update=apply)
        state = fixture_state(rows, accounts, passwords)
        if state == "conflict":
            raise FixtureSafetyError(
                "Fixture identities are partially present or differ from the exact account contract."
            )
        if not apply or state == "complete":
            return {
                "action": "create",
                "mode": "apply" if apply else "dry-run",
                "state": state,
                "accounts": public_accounts(accounts, rows),
            }

        created_rows: list[dict[str, object]] = []
        for account in accounts:
            password_hash = PASSWORD_CONTEXT.hash(passwords[account.label])
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
                VALUES ($1, $2, $3, true, 'active', $4, now(), now(), now(), 0, false)
                RETURNING id
                """,
                account.email,
                account.phone,
                password_hash,
                account.role,
            )
            await connection.execute(
                """
                INSERT INTO user_profiles (user_id, display_name, profile_truth_confirmed)
                VALUES ($1, $2, true)
                """,
                user_id,
                account.display_name,
            )
            await connection.executemany(
                """
                INSERT INTO legal_acceptances (user_id, document_type, document_version)
                VALUES ($1, $2, $3)
                """,
                [
                    (user_id, document_type, document_version)
                    for document_type, document_version in LEGAL_DOCUMENT_VERSIONS.items()
                ],
            )
            created_rows.append({"id": user_id, "email": account.email})

        rows = await fetch_fixture_rows(connection, accounts, for_update=True)
        if fixture_state(rows, accounts, passwords) != "complete":
            raise FixtureSafetyError("Created fixture accounts failed their transaction postcondition.")
        if {int(row["id"]) for row in rows} != {
            int(row["id"]) for row in created_rows
        }:
            raise FixtureSafetyError("Created fixture identity set changed unexpectedly.")

        return {
            "action": "create",
            "mode": "apply",
            "state": "created",
            "accounts": public_accounts(accounts, rows),
        }


async def cleanup_inventory(
    connection: asyncpg.Connection,
    user_ids: Sequence[int],
) -> dict[str, int]:
    row = await connection.fetchrow(
        """
        SELECT
            (SELECT count(*) FROM media_assets WHERE user_id = ANY($1::bigint[])) AS media_assets,
            (
                SELECT count(*)
                FROM user_profiles
                WHERE user_id = ANY($1::bigint[])
                  AND NULLIF(btrim(avatar_url), '') IS NOT NULL
            ) AS profile_avatars,
            (
                SELECT count(*)
                FROM user_gallery_items
                WHERE user_id = ANY($1::bigint[])
            ) AS gallery_items,
            (
                SELECT count(*)
                FROM user_services
                WHERE user_id = ANY($1::bigint[])
                  AND NULLIF(btrim(banner_url), '') IS NOT NULL
            ) AS service_banners,
            (
                SELECT count(*)
                FROM articles
                WHERE author_user_id = ANY($1::bigint[])
                  AND NULLIF(btrim(cover_image), '') IS NOT NULL
            ) AS article_covers,
            (SELECT count(*) FROM forum_questions WHERE author_user_id = ANY($1::bigint[])) AS forum_questions,
            (SELECT count(*) FROM support_tickets WHERE user_id = ANY($1::bigint[])) AS support_tickets,
            (SELECT count(*) FROM messages WHERE sender_id = ANY($1::bigint[]) OR receiver_id = ANY($1::bigint[])) AS messages,
            (SELECT count(*) FROM content_reports WHERE reporter_id = ANY($1::bigint[]) OR assigned_to = ANY($1::bigint[])) AS direct_reports
        """,
        list(user_ids),
    )
    if row is None:
        raise FixtureSafetyError("Could not inventory fixture dependencies.")
    return {key: int(row[key]) for key in row.keys()}


async def snapshot_cleanup_targets(
    connection: asyncpg.Connection,
    user_ids: Sequence[int],
) -> None:
    ids = list(user_ids)
    await connection.execute(
        """
        DROP TABLE IF EXISTS
            pg_temp._p4_removed_reports,
            pg_temp._p4_owned_targets,
            pg_temp._p4_reports,
            pg_temp._p4_content_comments,
            pg_temp._p4_article_comments,
            pg_temp._p4_answers,
            pg_temp._p4_post_comments,
            pg_temp._p4_messages,
            pg_temp._p4_articles,
            pg_temp._p4_questions,
            pg_temp._p4_services,
            pg_temp._p4_galleries,
            pg_temp._p4_posts
        """
    )
    statements = (
        "CREATE TEMP TABLE _p4_posts ON COMMIT DROP AS SELECT id FROM posts WHERE author_user_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_galleries ON COMMIT DROP AS SELECT id FROM user_gallery_items WHERE user_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_services ON COMMIT DROP AS SELECT id FROM user_services WHERE user_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_questions ON COMMIT DROP AS SELECT id FROM forum_questions WHERE author_user_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_articles ON COMMIT DROP AS SELECT id FROM articles WHERE author_user_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_messages ON COMMIT DROP AS SELECT id FROM messages WHERE sender_id = ANY($1::bigint[]) OR receiver_id = ANY($1::bigint[])",
        "CREATE TEMP TABLE _p4_post_comments ON COMMIT DROP AS SELECT id FROM post_comments WHERE user_id = ANY($1::bigint[]) OR post_id IN (SELECT id FROM _p4_posts)",
        "CREATE TEMP TABLE _p4_answers ON COMMIT DROP AS SELECT id FROM forum_answers WHERE author_user_id = ANY($1::bigint[]) OR question_id IN (SELECT id FROM _p4_questions)",
        "CREATE TEMP TABLE _p4_article_comments ON COMMIT DROP AS SELECT id FROM article_comments WHERE author_user_id = ANY($1::bigint[]) OR article_id IN (SELECT id FROM _p4_articles)",
        """
        CREATE TEMP TABLE _p4_content_comments ON COMMIT DROP AS
        SELECT id FROM content_comments
        WHERE user_id = ANY($1::bigint[])
           OR (target_type = 'post' AND target_id IN (SELECT id FROM _p4_galleries))
           OR (target_type = 'service' AND target_id IN (SELECT id FROM _p4_services))
        """,
    )
    for statement in statements:
        await connection.execute(statement, ids)

    await connection.execute(
        """
        CREATE TEMP TABLE _p4_reports ON COMMIT DROP AS
        SELECT id
        FROM content_reports
        WHERE reporter_id = ANY($1::bigint[])
           OR assigned_to = ANY($1::bigint[])
           OR (target_type = 'user' AND target_id = ANY($1::bigint[]))
           OR (target_type = 'post' AND target_id IN (SELECT id FROM _p4_posts))
           OR (target_type = 'question' AND target_id IN (SELECT id FROM _p4_questions))
           OR (target_type = 'answer' AND target_id IN (SELECT id FROM _p4_answers))
           OR (target_type = 'article' AND target_id IN (SELECT id FROM _p4_articles))
           OR (target_type = 'article_comment' AND target_id IN (SELECT id FROM _p4_article_comments))
           OR (target_type = 'gallery' AND target_id IN (SELECT id FROM _p4_galleries))
           OR (target_type = 'service' AND target_id IN (SELECT id FROM _p4_services))
           OR (target_type = 'message' AND target_id IN (SELECT id FROM _p4_messages))
           OR (target_type = 'comment' AND target_id IN (SELECT id FROM _p4_content_comments))
        """,
        ids,
    )
    await connection.execute(
        """
        CREATE TEMP TABLE _p4_owned_targets ON COMMIT DROP AS
        SELECT 'user'::text AS target_type, unnest($1::bigint[]) AS target_id
        UNION ALL SELECT 'post', id FROM _p4_posts
        UNION ALL SELECT 'question', id FROM _p4_questions
        UNION ALL SELECT 'answer', id FROM _p4_answers
        UNION ALL SELECT 'article', id FROM _p4_articles
        UNION ALL SELECT 'article_comment', id FROM _p4_article_comments
        UNION ALL SELECT 'gallery', id FROM _p4_galleries
        UNION ALL SELECT 'service', id FROM _p4_services
        UNION ALL SELECT 'message', id FROM _p4_messages
        UNION ALL SELECT 'comment', id FROM _p4_content_comments
        """,
        ids,
    )
    await connection.execute(
        """
        CREATE TEMP TABLE _p4_removed_reports ON COMMIT DROP AS
        SELECT DISTINCT r.id
        FROM content_reports AS r
        JOIN user_notifications AS n
          ON n.user_id = ANY($1::bigint[])
         AND n.metadata_json ->> 'report_id' = r.id::text
         AND n.metadata_json ->> 'action' = 'remove'
        WHERE r.id IN (SELECT id FROM _p4_reports)
          AND r.status = 'resolved'
          AND r.resolution = 'remove'
        """,
        ids,
    )


async def verify_cleanup_scope(
    connection: asyncpg.Connection,
    user_ids: Sequence[int],
) -> None:
    """Abort before mutation when the fixture graph touches ordinary accounts."""
    ids = list(user_ids)
    checks = (
        (
            """
            SELECT EXISTS (
                SELECT 1
                FROM messages AS m
                JOIN _p4_messages AS p ON p.id = m.id
                WHERE m.sender_id <> ALL($1::bigint[])
                   OR m.receiver_id <> ALL($1::bigint[])
            )
            """,
            "Fixture chat includes an out-of-scope account.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM user_follows AS f
                WHERE (f.follower_id = ANY($1::bigint[]) OR f.followee_id = ANY($1::bigint[]))
                  AND NOT (
                    f.follower_id = ANY($1::bigint[])
                    AND f.followee_id = ANY($1::bigint[])
                  )
            ) OR EXISTS (
                SELECT 1 FROM user_blocks AS b
                WHERE (b.blocker_id = ANY($1::bigint[]) OR b.blocked_id = ANY($1::bigint[]))
                  AND NOT (
                    b.blocker_id = ANY($1::bigint[])
                    AND b.blocked_id = ANY($1::bigint[])
                  )
            ) OR EXISTS (
                SELECT 1 FROM user_referrals AS r
                WHERE (r.referrer_user_id = ANY($1::bigint[]) OR r.referred_user_id = ANY($1::bigint[]))
                  AND NOT (
                    r.referrer_user_id = ANY($1::bigint[])
                    AND r.referred_user_id = ANY($1::bigint[])
                  )
            )
            """,
            "Fixture social graph includes an out-of-scope account.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1
                FROM content_reports AS r
                JOIN _p4_reports AS p ON p.id = r.id
                WHERE NOT (r.reporter_id IS NULL OR r.reporter_id = ANY($1::bigint[]))
                   OR NOT (r.assigned_to IS NULL OR r.assigned_to = ANY($1::bigint[]))
                   OR (
                       NOT EXISTS (
                           SELECT 1 FROM _p4_owned_targets AS t
                           WHERE t.target_type = r.target_type AND t.target_id = r.target_id
                       )
                       AND r.id NOT IN (SELECT id FROM _p4_removed_reports)
                   )
            )
            """,
            "Fixture reports include an out-of-scope account or target.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1
                FROM moderation_actions AS a
                WHERE (
                    a.moderator_id = ANY($1::bigint[])
                    OR a.report_id IN (SELECT id FROM _p4_reports)
                    OR EXISTS (
                        SELECT 1 FROM _p4_owned_targets AS t
                        WHERE t.target_type = a.target_type AND t.target_id = a.target_id
                    )
                )
                  AND (
                    NOT (a.moderator_id IS NULL OR a.moderator_id = ANY($1::bigint[]))
                    OR NOT (a.report_id IS NULL OR a.report_id IN (SELECT id FROM _p4_reports))
                    OR (
                        NOT EXISTS (
                            SELECT 1 FROM _p4_owned_targets AS t
                            WHERE t.target_type = a.target_type AND t.target_id = a.target_id
                        )
                        AND a.report_id NOT IN (SELECT id FROM _p4_removed_reports)
                    )
                  )
            )
            """,
            "Fixture moderation history includes an out-of-scope account or target.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM user_notifications AS n
                WHERE (n.user_id = ANY($1::bigint[]) AND n.actor_user_id IS NOT NULL AND n.actor_user_id <> ALL($1::bigint[]))
                   OR (n.actor_user_id = ANY($1::bigint[]) AND n.user_id <> ALL($1::bigint[]))
            )
            """,
            "Fixture notifications cross into an out-of-scope account.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM support_tickets AS t
                WHERE (t.user_id = ANY($1::bigint[]) AND t.responded_by IS NOT NULL AND t.responded_by <> ALL($1::bigint[]))
                   OR (t.responded_by = ANY($1::bigint[]) AND t.user_id <> ALL($1::bigint[]))
            )
            """,
            "Fixture support activity crosses into an out-of-scope account.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM forum_answers AS a
                JOIN _p4_answers AS p ON p.id = a.id
                JOIN forum_questions AS q ON q.id = a.question_id
                WHERE a.author_user_id <> ALL($1::bigint[])
                   OR q.author_user_id <> ALL($1::bigint[])
                   OR (
                        a.parent_id IS NOT NULL
                        AND a.parent_id NOT IN (SELECT id FROM _p4_answers)
                   )
                   OR EXISTS (
                        SELECT 1 FROM forum_answers AS child
                        WHERE child.parent_id = a.id
                          AND child.id NOT IN (SELECT id FROM _p4_answers)
                   )
            ) OR EXISTS (
                SELECT 1 FROM post_comments AS c
                JOIN _p4_post_comments AS p ON p.id = c.id
                JOIN posts AS post ON post.id = c.post_id
                WHERE c.user_id <> ALL($1::bigint[])
                   OR post.author_user_id <> ALL($1::bigint[])
                   OR (
                        c.parent_id IS NOT NULL
                        AND c.parent_id NOT IN (SELECT id FROM _p4_post_comments)
                   )
                   OR EXISTS (
                        SELECT 1 FROM post_comments AS child
                        WHERE child.parent_id = c.id
                          AND child.id NOT IN (SELECT id FROM _p4_post_comments)
                   )
            ) OR EXISTS (
                SELECT 1 FROM article_comments AS c
                JOIN _p4_article_comments AS p ON p.id = c.id
                JOIN articles AS article ON article.id = c.article_id
                WHERE c.author_user_id <> ALL($1::bigint[])
                   OR article.author_user_id IS NULL
                   OR article.author_user_id <> ALL($1::bigint[])
                   OR (
                        c.parent_id IS NOT NULL
                        AND c.parent_id NOT IN (SELECT id FROM _p4_article_comments)
                   )
                   OR EXISTS (
                        SELECT 1 FROM article_comments AS child
                        WHERE child.parent_id = c.id
                          AND child.id NOT IN (SELECT id FROM _p4_article_comments)
                   )
            ) OR EXISTS (
                SELECT 1 FROM content_comments AS c
                JOIN _p4_content_comments AS p ON p.id = c.id
                WHERE c.user_id <> ALL($1::bigint[])
                   OR NOT (
                        (c.target_type = 'post' AND c.target_id IN (SELECT id FROM _p4_galleries))
                        OR (c.target_type = 'service' AND c.target_id IN (SELECT id FROM _p4_services))
                        OR c.target_type = 'course'
                   )
                   OR (
                        c.parent_id IS NOT NULL
                        AND c.parent_id NOT IN (SELECT id FROM _p4_content_comments)
                   )
                   OR EXISTS (
                        SELECT 1 FROM content_comments AS child
                        WHERE child.parent_id = c.id
                          AND child.id NOT IN (SELECT id FROM _p4_content_comments)
                   )
            )
            """,
            "Fixture content graph includes an out-of-scope owner or reply.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM post_likes AS l
                JOIN posts AS p ON p.id = l.post_id
                WHERE (l.user_id = ANY($1::bigint[]) OR p.author_user_id = ANY($1::bigint[]))
                  AND NOT (
                    l.user_id = ANY($1::bigint[])
                    AND p.author_user_id = ANY($1::bigint[])
                  )
            ) OR EXISTS (
                SELECT 1 FROM content_likes AS l
                WHERE (
                    l.user_id = ANY($1::bigint[])
                    OR (l.target_type = 'post' AND l.target_id IN (SELECT id FROM _p4_galleries))
                    OR (l.target_type = 'service' AND l.target_id IN (SELECT id FROM _p4_services))
                  )
                  AND NOT (
                    l.user_id = ANY($1::bigint[])
                    AND (
                        (l.target_type = 'post' AND l.target_id IN (SELECT id FROM _p4_galleries))
                        OR (l.target_type = 'service' AND l.target_id IN (SELECT id FROM _p4_services))
                        OR l.target_type = 'course'
                    )
                  )
            ) OR EXISTS (
                SELECT 1 FROM post_media AS pm
                JOIN posts AS p ON p.id = pm.post_id
                JOIN media_assets AS m ON m.id = pm.media_id
                WHERE p.author_user_id = ANY($1::bigint[])
                  AND m.user_id <> ALL($1::bigint[])
            )
            """,
            "Fixture-owned content includes out-of-scope engagement or media.",
        ),
        (
            """
            SELECT EXISTS (
                SELECT 1 FROM security_audit_events AS e
                WHERE e.actor_user_id = ANY($1::bigint[])
                  AND e.event_type IN ('rbac.role_changed', 'rbac.user_status_changed')
                  AND NOT EXISTS (
                    SELECT 1
                    FROM unnest($1::bigint[]) AS fixture_id
                    WHERE e.subject = fixture_id::text
                  )
            )
            """,
            "Fixture admin changed an out-of-scope account.",
        ),
    )
    for query, message in checks:
        if await connection.fetchval(query, ids):
            raise FixtureSafetyError(message)


async def delete_cleanup_targets(
    connection: asyncpg.Connection,
    user_ids: Sequence[int],
) -> None:
    ids = list(user_ids)

    # Remove polymorphic moderation records before deleting their unbound targets.
    await connection.execute(
        """
        DELETE FROM moderation_actions
        WHERE moderator_id = ANY($1::bigint[])
           OR report_id IN (SELECT id FROM _p4_reports)
           OR (target_type = 'user' AND target_id = ANY($1::bigint[]))
           OR (target_type = 'post' AND target_id IN (SELECT id FROM _p4_posts))
           OR (target_type = 'question' AND target_id IN (SELECT id FROM _p4_questions))
           OR (target_type = 'answer' AND target_id IN (SELECT id FROM _p4_answers))
           OR (target_type = 'article' AND target_id IN (SELECT id FROM _p4_articles))
           OR (target_type = 'article_comment' AND target_id IN (SELECT id FROM _p4_article_comments))
           OR (target_type = 'gallery' AND target_id IN (SELECT id FROM _p4_galleries))
           OR (target_type = 'service' AND target_id IN (SELECT id FROM _p4_services))
           OR (target_type = 'message' AND target_id IN (SELECT id FROM _p4_messages))
           OR (target_type = 'comment' AND target_id IN (SELECT id FROM _p4_content_comments))
        """,
        ids,
    )
    await connection.execute("DELETE FROM content_reports WHERE id IN (SELECT id FROM _p4_reports)")

    # Delete notifications emitted to or by a fixture, not merely the owned rows.
    await connection.execute(
        "DELETE FROM user_notifications WHERE user_id = ANY($1::bigint[]) OR actor_user_id = ANY($1::bigint[])",
        ids,
    )
    await connection.execute(
        "DELETE FROM security_audit_events WHERE actor_user_id = ANY($1::bigint[])",
        ids,
    )

    # Preserve unrelated tree nodes by detaching their parent before target deletion.
    await connection.execute(
        "UPDATE content_comments SET parent_id = NULL WHERE parent_id IN (SELECT id FROM _p4_content_comments)"
    )
    await connection.execute(
        "DELETE FROM content_comments WHERE id IN (SELECT id FROM _p4_content_comments)"
    )
    await connection.execute(
        """
        DELETE FROM content_likes
        WHERE user_id = ANY($1::bigint[])
           OR (target_type = 'post' AND target_id IN (SELECT id FROM _p4_galleries))
           OR (target_type = 'service' AND target_id IN (SELECT id FROM _p4_services))
        """,
        ids,
    )

    await connection.execute(
        "UPDATE post_comments SET parent_id = NULL WHERE parent_id IN (SELECT id FROM _p4_post_comments)"
    )
    await connection.execute(
        "DELETE FROM post_comments WHERE id IN (SELECT id FROM _p4_post_comments)"
    )
    await connection.execute(
        "DELETE FROM post_likes WHERE user_id = ANY($1::bigint[]) OR post_id IN (SELECT id FROM _p4_posts)",
        ids,
    )
    await connection.execute("DELETE FROM post_media WHERE post_id IN (SELECT id FROM _p4_posts)")

    await connection.execute(
        "UPDATE forum_answers SET parent_id = NULL WHERE parent_id IN (SELECT id FROM _p4_answers)"
    )
    await connection.execute("DELETE FROM forum_answers WHERE id IN (SELECT id FROM _p4_answers)")
    await connection.execute(
        "UPDATE article_comments SET parent_id = NULL WHERE parent_id IN (SELECT id FROM _p4_article_comments)"
    )
    await connection.execute(
        "DELETE FROM article_comments WHERE id IN (SELECT id FROM _p4_article_comments)"
    )

    await connection.execute("DELETE FROM messages WHERE id IN (SELECT id FROM _p4_messages)")
    await connection.execute("DELETE FROM posts WHERE id IN (SELECT id FROM _p4_posts)")
    await connection.execute("DELETE FROM forum_questions WHERE id IN (SELECT id FROM _p4_questions)")
    await connection.execute("DELETE FROM articles WHERE id IN (SELECT id FROM _p4_articles)")

    # A fixture responder must not keep an FK to the soon-to-be-deleted admin.
    await connection.execute(
        "UPDATE support_tickets SET responded_by = NULL WHERE responded_by = ANY($1::bigint[]) AND NOT (user_id = ANY($1::bigint[]))",
        ids,
    )
    await connection.execute("DELETE FROM support_tickets WHERE user_id = ANY($1::bigint[])", ids)

    direct_deletes = (
        "DELETE FROM auth_challenges WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM auth_sessions WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM legal_acceptances WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM mfa_backup_codes WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM study_sessions WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM subscription_orders WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_blocks WHERE blocker_id = ANY($1::bigint[]) OR blocked_id = ANY($1::bigint[])",
        "DELETE FROM user_flashcards WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_follows WHERE follower_id = ANY($1::bigint[]) OR followee_id = ANY($1::bigint[])",
        "DELETE FROM user_language_settings WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_lesson_watch_progress WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_preferences WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_profiles WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_referral_codes WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_referrals WHERE referrer_user_id = ANY($1::bigint[]) OR referred_user_id = ANY($1::bigint[])",
        "DELETE FROM user_saved_courses WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_services WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_social_links WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_subscriptions WHERE user_id = ANY($1::bigint[])",
        "DELETE FROM user_gallery_items WHERE user_id = ANY($1::bigint[])",
    )
    for statement in direct_deletes:
        await connection.execute(statement, ids)


async def cleanup_fixtures(
    connection: asyncpg.Connection,
    accounts: Sequence[FixtureAccount],
    *,
    apply: bool,
) -> dict[str, object]:
    async with operation_transaction(connection, apply=apply):
        await verify_database_contract(connection)
        if apply:
            await lock_fixture_operation(connection)
        rows = await fetch_fixture_rows(connection, accounts, for_update=apply)
        if not rows:
            return {
                "action": "cleanup",
                "mode": "apply" if apply else "dry-run",
                "state": "absent",
                "accounts": public_accounts(accounts),
                "inventory": {},
            }
        if fixture_state(rows, accounts, passwords=None) != "complete":
            raise FixtureSafetyError(
                "Cleanup requires all four exact verified fixture identities; refusing partial cleanup."
            )

        user_ids = [int(row["id"]) for row in rows]
        inventory = await cleanup_inventory(connection, user_ids)
        storage_footprint = {
            key: inventory[key]
            for key in (
                "media_assets",
                "profile_avatars",
                "gallery_items",
                "service_banners",
                "article_covers",
            )
            if inventory[key]
        }
        if storage_footprint:
            raise FixtureSafetyError(
                "Fixture accounts reference storage-backed content; remove the exact "
                "storage objects and clear their database references before cleanup."
            )
        await snapshot_cleanup_targets(connection, user_ids)
        await verify_cleanup_scope(connection, user_ids)
        if not apply:
            return {
                "action": "cleanup",
                "mode": "dry-run",
                "state": "present",
                "accounts": public_accounts(accounts, rows),
                "inventory": inventory,
            }

        await delete_cleanup_targets(connection, user_ids)
        deleted = await connection.fetch(
            "DELETE FROM users WHERE id = ANY($1::bigint[]) RETURNING id",
            user_ids,
        )
        if {int(row["id"]) for row in deleted} != set(user_ids):
            raise FixtureSafetyError("Cleanup did not delete exactly the locked fixture identity set.")
        remaining = await connection.fetchval(
            "SELECT count(*) FROM users WHERE lower(email) = ANY($1::text[])",
            [account.email for account in accounts],
        )
        if int(remaining) != 0:
            raise FixtureSafetyError("Fixture account cleanup postcondition failed.")

        return {
            "action": "cleanup",
            "mode": "apply",
            "state": "deleted",
            "deleted_user_count": len(deleted),
            "accounts": public_accounts(accounts),
            "inventory": inventory,
        }


async def run(args: argparse.Namespace) -> dict[str, object]:
    run_id = normalize_run_id(args.run_id or os.getenv("CHINVERSE_PHASE4_RUN_ID", ""))
    if args.apply and args.confirm_run_id != run_id:
        raise FixtureSafetyError("--confirm-run-id must exactly match the normalized run id.")
    accounts = build_fixture_accounts(run_id)
    passwords = load_passwords(accounts, os.environ) if args.action == "create" else None
    database_url = validate_and_normalize_database_url(os.getenv("DATABASE_URL", ""))

    try:
        connection = await asyncpg.connect(
            database_url,
            command_timeout=30,
            ssl=build_verified_ssl_context(),
        )
    except Exception as exc:
        raise FixtureSafetyError(
            f"Database connection failed ({type(exc).__name__}); details omitted to protect credentials."
        ) from None
    try:
        if args.action == "create":
            if passwords is None:
                raise FixtureSafetyError("Fixture passwords were not loaded.")
            result = await create_fixtures(connection, accounts, passwords, apply=args.apply)
        else:
            result = await cleanup_fixtures(connection, accounts, apply=args.apply)
    finally:
        await connection.close()

    result["run_id"] = run_id
    result["alembic_head"] = EXPECTED_ALEMBIC_HEAD
    result["endpoint_id"] = EXPECTED_ENDPOINT_ID
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Safely manage the four synthetic Phase 4 Neon staging fixtures."
    )
    parser.add_argument("action", choices=("create", "cleanup"))
    parser.add_argument(
        "--run-id",
        help="Synthetic run identifier; defaults to CHINVERSE_PHASE4_RUN_ID.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit the requested mutation. Without this flag the command is read-only.",
    )
    parser.add_argument(
        "--confirm-run-id",
        help="Required with --apply and must exactly match the normalized run id.",
    )
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = asyncio.run(run(args))
    except FixtureSafetyError as exc:
        print(f"Safety check failed: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(
            f"Fixture operation failed ({type(exc).__name__}); details omitted to protect credentials.",
            file=sys.stderr,
        )
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
