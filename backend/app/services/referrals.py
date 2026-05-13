import secrets
import string
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import bad_request, conflict

REFERRAL_CODE_ALPHABET = string.ascii_uppercase + string.digits


async def ensure_referral_storage(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_referral_codes (
                user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                code VARCHAR(32) NOT NULL UNIQUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_referral_codes_code
            ON user_referral_codes (code)
            """
        )
    )
    await db.execute(
        text(
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
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_referrals_referrer_created
            ON user_referrals (referrer_user_id, created_at DESC)
            """
        )
    )


def normalize_referral_code(value: str | None) -> str | None:
    if value is None:
        return None
    code = value.strip().upper().replace("-", "").replace(" ", "")
    return code or None


def _base36(value: int) -> str:
    if value <= 0:
        return "0"
    chars = []
    while value:
        value, remainder = divmod(value, 36)
        chars.append(REFERRAL_CODE_ALPHABET[remainder])
    return "".join(reversed(chars))


def _random_suffix(length: int = 4) -> str:
    return "".join(secrets.choice(REFERRAL_CODE_ALPHABET) for _ in range(length))


async def get_or_create_referral_code(db: AsyncSession, *, user_id: int, commit: bool = True) -> str:
    await ensure_referral_storage(db)
    result = await db.execute(
        text("SELECT code FROM user_referral_codes WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    existing_code = result.scalar_one_or_none()
    if existing_code:
        return str(existing_code)

    for _ in range(6):
        candidate = f"CH{_base36(user_id)}{_random_suffix()}"
        created = await db.execute(
            text(
                """
                INSERT INTO user_referral_codes (user_id, code)
                VALUES (:user_id, :code)
                ON CONFLICT DO NOTHING
                RETURNING code
                """
            ),
            {"user_id": user_id, "code": candidate},
        )
        code = created.scalar_one_or_none()
        if code:
            if commit:
                await db.commit()
            return str(code)

    raise conflict("Could not generate referral code")


async def get_referrer_id_by_code(db: AsyncSession, *, code: str | None) -> int | None:
    await ensure_referral_storage(db)
    normalized = normalize_referral_code(code)
    if not normalized:
        return None
    result = await db.execute(
        text("SELECT user_id FROM user_referral_codes WHERE code = :code"),
        {"code": normalized},
    )
    value = result.scalar_one_or_none()
    return int(value) if value is not None else None


async def apply_referral_code(
    db: AsyncSession,
    *,
    referred_user_id: int,
    code: str,
    commit: bool = True,
) -> dict[str, Any]:
    await ensure_referral_storage(db)
    normalized = normalize_referral_code(code)
    if not normalized:
        raise bad_request("Referral code is required")

    referrer_user_id = await get_referrer_id_by_code(db, code=normalized)
    if not referrer_user_id:
        raise bad_request("Referral code is invalid")
    if referrer_user_id == referred_user_id:
        raise bad_request("You cannot use your own referral code")

    result = await db.execute(
        text(
            """
            INSERT INTO user_referrals (
                referrer_user_id,
                referred_user_id,
                referral_code,
                status,
                reward_status
            )
            VALUES (
                :referrer_user_id,
                :referred_user_id,
                :referral_code,
                'joined',
                'pending'
            )
            ON CONFLICT (referred_user_id) DO NOTHING
            RETURNING id
            """
        ),
        {
            "referrer_user_id": referrer_user_id,
            "referred_user_id": referred_user_id,
            "referral_code": normalized,
        },
    )
    referral_id = result.scalar_one_or_none()
    if referral_id is None:
        raise conflict("Referral code was already applied for this account")

    if commit:
        await db.commit()

    return {
        "id": int(referral_id),
        "referrer_user_id": referrer_user_id,
        "referral_code": normalized,
        "status": "joined",
        "reward_status": "pending",
    }


async def get_referral_dashboard(db: AsyncSession, *, user_id: int) -> dict[str, Any]:
    await ensure_referral_storage(db)
    code = await get_or_create_referral_code(db, user_id=user_id, commit=False)

    stats_result = await db.execute(
        text(
            """
            SELECT
                COUNT(*) AS total_invites,
                COUNT(*) FILTER (WHERE status = 'joined') AS joined_count,
                COUNT(*) FILTER (WHERE reward_status = 'ready') AS ready_rewards,
                COUNT(*) FILTER (WHERE reward_status = 'claimed') AS claimed_rewards
            FROM user_referrals
            WHERE referrer_user_id = :user_id
            """
        ),
        {"user_id": user_id},
    )
    stats = stats_result.mappings().one()

    recent_result = await db.execute(
        text(
            """
            SELECT
                r.id,
                r.status,
                r.reward_status,
                r.created_at,
                p.display_name,
                p.avatar_url
            FROM user_referrals r
            LEFT JOIN user_profiles p ON p.user_id = r.referred_user_id
            WHERE r.referrer_user_id = :user_id
            ORDER BY r.created_at DESC
            LIMIT 8
            """
        ),
        {"user_id": user_id},
    )
    recent_invites = [
        {
            "id": row["id"],
            "status": row["status"],
            "reward_status": row["reward_status"],
            "created_at": row["created_at"],
            "display_name": row["display_name"],
            "avatar_url": row["avatar_url"],
        }
        for row in recent_result.mappings().all()
    ]

    applied_result = await db.execute(
        text(
            """
            SELECT
                r.id,
                r.status,
                r.reward_status,
                r.created_at,
                r.referral_code,
                p.display_name AS referrer_name,
                p.avatar_url AS referrer_avatar_url
            FROM user_referrals r
            LEFT JOIN user_profiles p ON p.user_id = r.referrer_user_id
            WHERE r.referred_user_id = :user_id
            """
        ),
        {"user_id": user_id},
    )
    applied = applied_result.mappings().one_or_none()

    await db.commit()
    return {
        "code": code,
        "stats": {
            "total_invites": int(stats["total_invites"] or 0),
            "joined_count": int(stats["joined_count"] or 0),
            "ready_rewards": int(stats["ready_rewards"] or 0),
            "claimed_rewards": int(stats["claimed_rewards"] or 0),
        },
        "recent_invites": recent_invites,
        "applied_referral": dict(applied) if applied else None,
        "benefits": [
            "دعوت موفق دوستان در آینده می‌تواند امتیاز یا دسترسی ویژه بسازد.",
            "پاداش‌ها فعلاً در حالت آماده‌سازی هستند و بعداً فعال می‌شوند.",
        ],
    }
