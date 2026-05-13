from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.errors import bad_request, not_found


DEFAULT_SUBSCRIPTION_PLANS = [
    {
        "id": 1001,
        "name": "اشتراک سالانه چین ورس",
        "duration_months": 12,
        "price": 1_980_000,
        "badge": "به صرفه ترین",
        "savings_percent": 31,
        "is_recommended": True,
    },
    {
        "id": 1002,
        "name": "اشتراک سه ماهه چین ورس",
        "duration_months": 3,
        "price": 630_000,
        "badge": "محبوب",
        "savings_percent": 12,
        "is_recommended": False,
    },
    {
        "id": 1003,
        "name": "اشتراک یک ماهه چین ورس",
        "duration_months": 1,
        "price": 240_000,
        "badge": None,
        "savings_percent": 0,
        "is_recommended": False,
    },
]

SUBSCRIPTION_FEATURES = [
    "دسترسی کامل به درس های ویدیویی و مسیرهای آموزشی",
    "تمرین های لایتنر، واژگان و مرور هوشمند",
    "مشاهده ترجمه، پین یین و متن های آموزشی کامل",
    "ذخیره دوره ها و ساخت مسیر یادگیری شخصی",
    "دسترسی به بخش های جدید آموزشی پس از انتشار",
    "آماده برای اتصال به پرداخت و مزایای ویژه آینده",
]


async def ensure_subscription_storage(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id BIGINT PRIMARY KEY,
                name VARCHAR NOT NULL,
                duration_months BIGINT NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR NOT NULL DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_subscriptions_user_status_end
            ON user_subscriptions (user_id, status, end_date DESC)
            """
        )
    )
    await db.execute(
        text(
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
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_subscription_orders_user_created
            ON subscription_orders (user_id, created_at DESC)
            """
        )
    )

    for plan in DEFAULT_SUBSCRIPTION_PLANS:
        await db.execute(
            text(
                """
                INSERT INTO subscription_plans (
                    id,
                    name,
                    duration_months,
                    price,
                    is_active,
                    updated_at
                )
                VALUES (
                    :id,
                    :name,
                    :duration_months,
                    :price,
                    TRUE,
                    now()
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    duration_months = EXCLUDED.duration_months,
                    price = EXCLUDED.price,
                    is_active = TRUE,
                    updated_at = now()
                """
            ),
            {
                "id": plan["id"],
                "name": plan["name"],
                "duration_months": plan["duration_months"],
                "price": plan["price"],
            },
        )


def _plan_meta(duration_months: int) -> dict[str, Any]:
    for plan in DEFAULT_SUBSCRIPTION_PLANS:
        if plan["duration_months"] == duration_months:
            return plan
    return {
        "badge": None,
        "savings_percent": 0,
        "is_recommended": False,
    }


def _serialize_plan(row: dict[str, Any]) -> dict[str, Any]:
    duration_months = int(row["duration_months"])
    price = int(float(row["price"]))
    meta = _plan_meta(duration_months)
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "duration_months": duration_months,
        "price": price,
        "price_per_month": max(round(price / max(duration_months, 1)), 0),
        "currency": "IRT",
        "badge": meta.get("badge"),
        "savings_percent": int(meta.get("savings_percent") or 0),
        "is_recommended": bool(meta.get("is_recommended")),
        "is_active": bool(row["is_active"]),
    }


async def list_subscription_plans(db: AsyncSession) -> list[dict[str, Any]]:
    await ensure_subscription_storage(db)
    result = await db.execute(
        text(
            """
            SELECT id, name, duration_months, price, is_active
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY
                CASE duration_months
                    WHEN 12 THEN 1
                    WHEN 3 THEN 2
                    WHEN 1 THEN 3
                    ELSE 9
                END,
                duration_months DESC
            """
        )
    )
    return [_serialize_plan(dict(row)) for row in result.mappings().all()]


async def get_current_subscription(db: AsyncSession, *, user_id: int) -> dict[str, Any] | None:
    await ensure_subscription_storage(db)
    result = await db.execute(
        text(
            """
            SELECT
                s.id,
                s.user_id,
                s.plan_id,
                s.start_date,
                s.end_date,
                s.status,
                p.name AS plan_name,
                p.duration_months,
                p.price
            FROM user_subscriptions s
            JOIN subscription_plans p ON p.id = s.plan_id
            WHERE s.user_id = :user_id
              AND s.status = 'active'
              AND s.end_date >= CURRENT_DATE
            ORDER BY s.end_date DESC
            LIMIT 1
            """
        ),
        {"user_id": user_id},
    )
    row = result.mappings().one_or_none()
    if not row:
        return None

    end_date = row["end_date"]
    days_remaining = (end_date - date.today()).days if isinstance(end_date, date) else 0
    return {
        "id": int(row["id"]),
        "plan_id": int(row["plan_id"]),
        "plan_name": row["plan_name"],
        "start_date": row["start_date"],
        "end_date": row["end_date"],
        "status": row["status"],
        "days_remaining": max(days_remaining, 0),
    }


async def get_subscription_overview(db: AsyncSession, *, user_id: int) -> dict[str, Any]:
    plans = await list_subscription_plans(db)
    current_subscription = await get_current_subscription(db, user_id=user_id)
    await db.commit()
    return {
        "plans": plans,
        "current_subscription": current_subscription,
        "features": SUBSCRIPTION_FEATURES,
        "payment": {
            "gateway_configured": False,
            "message": "درگاه پرداخت هنوز به پروژه وصل نشده است. سفارش پرداخت ساخته می شود، اما فعال سازی نهایی بعد از اتصال درگاه انجام خواهد شد.",
        },
    }


async def create_subscription_checkout(
    db: AsyncSession,
    *,
    user_id: int,
    plan_id: int,
) -> dict[str, Any]:
    await ensure_subscription_storage(db)
    result = await db.execute(
        text(
            """
            SELECT id, name, duration_months, price, is_active
            FROM subscription_plans
            WHERE id = :plan_id AND is_active = TRUE
            """
        ),
        {"plan_id": plan_id},
    )
    plan = result.mappings().one_or_none()
    if not plan:
        raise not_found("Subscription plan")

    current_subscription = await get_current_subscription(db, user_id=user_id)
    if current_subscription and current_subscription["plan_id"] == int(plan["id"]):
        raise bad_request("This subscription is already active for your account")

    created = await db.execute(
        text(
            """
            INSERT INTO subscription_orders (
                user_id,
                plan_id,
                amount,
                currency,
                status,
                provider
            )
            VALUES (
                :user_id,
                :plan_id,
                :amount,
                'IRT',
                'created',
                'manual-placeholder'
            )
            RETURNING id, created_at
            """
        ),
        {
            "user_id": user_id,
            "plan_id": int(plan["id"]),
            "amount": float(plan["price"]),
        },
    )
    order = created.mappings().one()
    await db.commit()

    return {
        "order_id": int(order["id"]),
        "status": "gateway_not_configured",
        "checkout_url": None,
        "amount": int(float(plan["price"])),
        "currency": "IRT",
        "plan": _serialize_plan(dict(plan)),
        "message": "سفارش پرداخت ساخته شد. بعد از انتخاب درگاه پرداخت، این درخواست لینک پرداخت واقعی برمی گرداند.",
    }
