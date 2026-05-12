import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def ensure_notifications_storage(db: AsyncSession) -> None:
    await db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_notifications (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                actor_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
                type VARCHAR(40) NOT NULL,
                title VARCHAR(180) NOT NULL,
                body TEXT NULL,
                target_url VARCHAR(500) NULL,
                metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
                is_read BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_notifications_user_created
            ON user_notifications (user_id, created_at DESC)
            """
        )
    )
    await db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS ix_user_notifications_user_unread
            ON user_notifications (user_id, is_read)
            """
        )
    )


def _notification_row(row: Any) -> dict[str, Any]:
    metadata = row.get("metadata_json") or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            metadata = {}

    actor = None
    if row.get("actor_id"):
        actor = {
            "id": row.get("actor_id"),
            "display_name": row.get("actor_display_name"),
            "avatar_url": row.get("actor_avatar_url"),
        }

    return {
        "id": row["id"],
        "type": row["type"],
        "title": row["title"],
        "body": row.get("body"),
        "target_url": row.get("target_url"),
        "metadata": metadata,
        "is_read": row["is_read"],
        "created_at": row["created_at"],
        "actor": actor,
    }


async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    type: str,
    title: str,
    body: str | None = None,
    actor_user_id: int | None = None,
    target_url: str | None = None,
    metadata: dict[str, Any] | None = None,
    commit: bool = True,
) -> int:
    await ensure_notifications_storage(db)
    result = await db.execute(
        text(
            """
            INSERT INTO user_notifications (
                user_id, actor_user_id, type, title, body, target_url, metadata_json
            )
            VALUES (
                :user_id, :actor_user_id, :type, :title, :body, :target_url,
                CAST(:metadata_json AS JSONB)
            )
            RETURNING id
            """
        ),
        {
            "user_id": user_id,
            "actor_user_id": actor_user_id,
            "type": type,
            "title": title,
            "body": body,
            "target_url": target_url,
            "metadata_json": json.dumps(metadata or {}),
        },
    )
    notification_id = int(result.scalar_one())
    if commit:
        await db.commit()
    return notification_id


async def list_notifications(
    db: AsyncSession,
    *,
    user_id: int,
    skip: int,
    limit: int,
    unread_only: bool = False,
    after_id: int | None = None,
) -> list[dict[str, Any]]:
    await ensure_notifications_storage(db)
    filters = ["n.user_id = :user_id"]
    params: dict[str, Any] = {"user_id": user_id, "skip": skip, "limit": limit}

    if unread_only:
        filters.append("n.is_read = false")
    if after_id is not None:
        filters.append("n.id > :after_id")
        params["after_id"] = after_id

    result = await db.execute(
        text(
            f"""
            SELECT
                n.id,
                n.type,
                n.title,
                n.body,
                n.target_url,
                n.metadata_json,
                n.is_read,
                n.created_at,
                u.id AS actor_id,
                p.display_name AS actor_display_name,
                p.avatar_url AS actor_avatar_url
            FROM user_notifications n
            LEFT JOIN users u ON u.id = n.actor_user_id
            LEFT JOIN user_profiles p ON p.user_id = u.id
            WHERE {' AND '.join(filters)}
            ORDER BY n.created_at DESC, n.id DESC
            OFFSET :skip
            LIMIT :limit
            """
        ),
        params,
    )
    return [_notification_row(row) for row in result.mappings().all()]


async def unread_count(db: AsyncSession, *, user_id: int) -> int:
    await ensure_notifications_storage(db)
    result = await db.execute(
        text(
            """
            SELECT count(*)
            FROM user_notifications
            WHERE user_id = :user_id AND is_read = false
            """
        ),
        {"user_id": user_id},
    )
    return int(result.scalar() or 0)


async def mark_notification_read(db: AsyncSession, *, user_id: int, notification_id: int) -> bool:
    await ensure_notifications_storage(db)
    result = await db.execute(
        text(
            """
            UPDATE user_notifications
            SET is_read = true, updated_at = now()
            WHERE id = :notification_id AND user_id = :user_id
            """
        ),
        {"notification_id": notification_id, "user_id": user_id},
    )
    await db.commit()
    return bool(result.rowcount)


async def mark_all_notifications_read(db: AsyncSession, *, user_id: int) -> int:
    await ensure_notifications_storage(db)
    result = await db.execute(
        text(
            """
            UPDATE user_notifications
            SET is_read = true, updated_at = now()
            WHERE user_id = :user_id AND is_read = false
            """
        ),
        {"user_id": user_id},
    )
    await db.commit()
    return int(result.rowcount or 0)


async def notify_followers(
    db: AsyncSession,
    *,
    actor_user_id: int,
    type: str,
    title: str,
    body: str | None = None,
    target_url: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> int:
    await ensure_notifications_storage(db)
    followers_result = await db.execute(
        text(
            """
            SELECT follower_id
            FROM user_follows
            WHERE followee_id = :actor_user_id AND follower_id <> :actor_user_id
            """
        ),
        {"actor_user_id": actor_user_id},
    )
    follower_ids = [int(row[0]) for row in followers_result.all()]
    if not follower_ids:
        return 0

    for follower_id in follower_ids:
        await create_notification(
            db,
            user_id=follower_id,
            actor_user_id=actor_user_id,
            type=type,
            title=title,
            body=body,
            target_url=target_url,
            metadata=metadata,
            commit=False,
        )

    await db.commit()
    return len(follower_ids)
