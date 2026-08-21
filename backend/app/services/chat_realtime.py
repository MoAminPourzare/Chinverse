from __future__ import annotations

import asyncio
from collections.abc import Callable, Collection
from datetime import UTC, datetime, timedelta
import logging
from typing import Any, Awaitable
from uuid import uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.observability import record_chat_realtime_event
from app.db.session import SessionLocal
from app.models.social import ChatPresenceLease, ChatRealtimeEvent


logger = logging.getLogger(__name__)
DispatchCallback = Callable[[int, dict[str, Any]], Awaitable[int]]
ConnectedUsersCallback = Callable[[], Collection[int]]


class ChatRealtimeRelay:
    """PostgreSQL-backed outbox relay and expiring cross-replica presence."""

    def __init__(
        self,
        *,
        dispatch: DispatchCallback,
        connected_users: ConnectedUsersCallback,
        instance_id: str | None = None,
        enabled: bool | None = None,
        run_background_in_tests: bool = False,
    ) -> None:
        self.instance_id = instance_id or uuid4().hex
        self.enabled = (
            settings.CHAT_REALTIME_BACKEND == "database"
            if enabled is None
            else enabled
        )
        self._dispatch = dispatch
        self._connected_users = connected_users
        self._run_background_in_tests = run_background_in_tests
        self._cursor = 0
        self._task: asyncio.Task[None] | None = None
        self._stop = asyncio.Event()
        self._wake = asyncio.Event()
        self._last_maintenance_at = datetime.min.replace(tzinfo=UTC)

    @property
    def running(self) -> bool:
        return bool(self._task and not self._task.done())

    async def start(self) -> None:
        if not self.enabled or self.running:
            return
        if settings.ENVIRONMENT.lower() == "test" and not self._run_background_in_tests:
            return
        await self.initialize_cursor()
        self._stop.clear()
        self._task = asyncio.create_task(
            self._run(),
            name=f"chat-realtime-{self.instance_id[:8]}",
        )

    async def stop(self) -> None:
        if not self.enabled:
            return
        self._stop.set()
        self._wake.set()
        if self._task:
            self._task.cancel()
            await asyncio.gather(self._task, return_exceptions=True)
            self._task = None
        try:
            async with SessionLocal() as session:
                await session.execute(
                    delete(ChatPresenceLease).where(
                        ChatPresenceLease.instance_id == self.instance_id
                    )
                )
                await session.commit()
        except Exception:
            logger.exception(
                "Could not release chat presence leases during shutdown",
                extra={"event": "chat.realtime.shutdown", "outcome": "failed"},
            )

    async def initialize_cursor(self) -> None:
        if not self.enabled:
            return
        async with SessionLocal() as session:
            self._cursor = int(
                await session.scalar(select(func.coalesce(func.max(ChatRealtimeEvent.id), 0)))
                or 0
            )

    def enqueue(
        self,
        db: AsyncSession,
        *,
        recipients: Collection[int],
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        if not self.enabled:
            return
        expires_at = datetime.now(UTC) + timedelta(
            seconds=settings.CHAT_REALTIME_EVENT_RETENTION_SECONDS
        )
        unique_recipients = {int(user_id) for user_id in recipients}
        db.add_all(
            [
                ChatRealtimeEvent(
                    source_instance_id=self.instance_id,
                    recipient_user_id=user_id,
                    event_type=event_type,
                    payload_json=payload,
                    expires_at=expires_at,
                )
                for user_id in unique_recipients
            ]
        )
        for _user_id in unique_recipients:
            record_chat_realtime_event("published")

    def notify_committed(self) -> None:
        if self.enabled:
            self._wake.set()

    async def register_presence(self, user_id: int) -> bool:
        if not self.enabled or (
            settings.ENVIRONMENT.lower() == "test" and not self._run_background_in_tests
        ):
            return True
        expires_at = datetime.now(UTC) + timedelta(
            seconds=settings.CHAT_PRESENCE_TTL_SECONDS
        )
        try:
            async with SessionLocal() as session:
                statement = pg_insert(ChatPresenceLease).values(
                    instance_id=self.instance_id,
                    user_id=user_id,
                    expires_at=expires_at,
                )
                statement = statement.on_conflict_do_update(
                    index_elements=["instance_id", "user_id"],
                    set_={"expires_at": expires_at},
                )
                await session.execute(statement)
                await session.commit()
        except Exception:
            logger.exception(
                "Could not register chat presence",
                extra={"event": "chat.presence.register", "outcome": "failed"},
            )
            return False
        return True

    async def unregister_presence(self, user_id: int) -> None:
        if not self.enabled or (
            settings.ENVIRONMENT.lower() == "test" and not self._run_background_in_tests
        ):
            return
        try:
            async with SessionLocal() as session:
                await session.execute(
                    delete(ChatPresenceLease).where(
                        ChatPresenceLease.instance_id == self.instance_id,
                        ChatPresenceLease.user_id == user_id,
                    )
                )
                await session.commit()
        except Exception:
            logger.exception(
                "Could not unregister chat presence",
                extra={"event": "chat.presence.unregister", "outcome": "failed"},
            )

    async def refresh_presence(self) -> None:
        if not self.enabled:
            return
        connected = {int(user_id) for user_id in self._connected_users()}
        expires_at = datetime.now(UTC) + timedelta(
            seconds=settings.CHAT_PRESENCE_TTL_SECONDS
        )
        async with SessionLocal() as session:
            if connected:
                await session.execute(
                    delete(ChatPresenceLease).where(
                        ChatPresenceLease.instance_id == self.instance_id,
                        ChatPresenceLease.user_id.not_in(connected),
                    )
                )
                statement = pg_insert(ChatPresenceLease).values(
                    [
                        {
                            "instance_id": self.instance_id,
                            "user_id": user_id,
                            "expires_at": expires_at,
                        }
                        for user_id in connected
                    ]
                )
                statement = statement.on_conflict_do_update(
                    index_elements=["instance_id", "user_id"],
                    set_={"expires_at": expires_at},
                )
                await session.execute(statement)
            else:
                await session.execute(
                    delete(ChatPresenceLease).where(
                        ChatPresenceLease.instance_id == self.instance_id
                    )
                )
            await session.commit()

    async def poll_once(self) -> int:
        if not self.enabled:
            return 0
        connected = {int(user_id) for user_id in self._connected_users()}
        async with SessionLocal() as session:
            high_watermark = int(
                await session.scalar(
                    select(func.coalesce(func.max(ChatRealtimeEvent.id), self._cursor))
                )
                or self._cursor
            )
            await self._after_high_watermark(high_watermark)
            if high_watermark <= self._cursor:
                return 0
            if not connected:
                self._cursor = high_watermark
                return 0
            result = await session.execute(
                select(
                    ChatRealtimeEvent.id,
                    ChatRealtimeEvent.source_instance_id,
                    ChatRealtimeEvent.recipient_user_id,
                    ChatRealtimeEvent.payload_json,
                    ChatRealtimeEvent.expires_at,
                )
                .where(
                    ChatRealtimeEvent.id > self._cursor,
                    ChatRealtimeEvent.id <= high_watermark,
                    ChatRealtimeEvent.recipient_user_id.in_(connected),
                )
                .order_by(ChatRealtimeEvent.id.asc())
                .limit(settings.CHAT_REALTIME_BATCH_SIZE)
            )
            events = result.all()

        now = datetime.now(UTC)
        for event in events:
            self._cursor = max(self._cursor, int(event.id))
            if event.source_instance_id == self.instance_id or event.expires_at <= now:
                record_chat_realtime_event("ignored")
                continue
            try:
                delivered = await self._dispatch(
                    int(event.recipient_user_id),
                    dict(event.payload_json),
                )
            except Exception:
                record_chat_realtime_event("failed")
                logger.exception(
                    "Could not deliver a relayed chat event",
                    extra={"event": "chat.realtime.deliver", "outcome": "failed"},
                )
            else:
                record_chat_realtime_event("delivered" if delivered else "not_connected")
        if len(events) < settings.CHAT_REALTIME_BATCH_SIZE:
            # The Phase 7 BEFORE INSERT trigger serializes id allocation until
            # commit, so every id at or below this visible high watermark is also
            # visible. Advancing prevents replicas from rescanning events for
            # users they do not host without skipping a late commit.
            self._cursor = high_watermark
        return len(events)

    async def _after_high_watermark(self, _high_watermark: int) -> None:
        """Async boundary used by concurrency tests; production intentionally no-ops."""

    async def maintenance(self) -> None:
        if not self.enabled:
            return
        now = datetime.now(UTC)
        await self.refresh_presence()
        async with SessionLocal() as session:
            await session.execute(
                delete(ChatPresenceLease).where(ChatPresenceLease.expires_at <= now)
            )
            await session.execute(
                delete(ChatRealtimeEvent).where(ChatRealtimeEvent.expires_at <= now)
            )
            await session.commit()
        self._last_maintenance_at = now

    async def _run(self) -> None:
        while not self._stop.is_set():
            try:
                processed = await self.poll_once()
                while processed >= settings.CHAT_REALTIME_BATCH_SIZE:
                    processed = await self.poll_once()
                now = datetime.now(UTC)
                if (
                    now - self._last_maintenance_at
                    >= timedelta(seconds=max(5, settings.CHAT_PRESENCE_TTL_SECONDS // 3))
                ):
                    await self.maintenance()
            except asyncio.CancelledError:
                raise
            except Exception:
                record_chat_realtime_event("relay_error")
                logger.exception(
                    "Chat realtime relay iteration failed",
                    extra={"event": "chat.realtime.poll", "outcome": "failed"},
                )

            self._wake.clear()
            try:
                await asyncio.wait_for(
                    self._wake.wait(),
                    timeout=settings.CHAT_REALTIME_POLL_INTERVAL_SECONDS,
                )
            except TimeoutError:
                pass
