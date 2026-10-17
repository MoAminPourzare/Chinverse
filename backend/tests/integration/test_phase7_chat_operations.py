from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import delete, func, insert, select

from app.api.pagination import PaginationParams
from app.api.v1.endpoints.chat import get_conversations
from app.db.session import SessionLocal
from app.models.social import ChatPresenceLease, ChatRealtimeEvent, Message
from app.models.user import User, UserProfile
from app.services.chat_realtime import ChatRealtimeRelay


pytestmark = pytest.mark.integration


async def _create_user(label: str) -> int:
    suffix = uuid4().hex[:14]
    async with SessionLocal() as session:
        user = User(
            email=f"phase7-{label}-{suffix}@example.test",
            phone=f"09{uuid4().int % 10**9:09d}",
            password_hash="phase-seven-test-password-hash",
            is_verified=True,
        )
        session.add(user)
        await session.flush()
        session.add(
            UserProfile(
                user_id=user.id,
                display_name=f"Phase 7 {label}",
            )
        )
        await session.commit()
        return int(user.id)


@pytest.mark.asyncio
async def test_conversation_query_is_exact_beyond_the_old_thousand_message_scan_cap():
    current_user_id = await _create_user("current")
    busy_partner_id = await _create_user("busy")
    older_partner_id = await _create_user("older")

    async with SessionLocal() as session:
        await session.execute(
            insert(Message),
            [
                {
                    "sender_id": older_partner_id,
                    "receiver_id": current_user_id,
                    "content": "older conversation must remain visible",
                    "is_read": False,
                },
                *[
                    {
                        "sender_id": busy_partner_id,
                        "receiver_id": current_user_id,
                        "content": f"busy message {index}",
                        "is_read": False,
                    }
                    for index in range(1005)
                ],
            ],
        )
        await session.commit()

    async with SessionLocal() as session:
        current_user = await session.get(User, current_user_id)
        conversations = await get_conversations(
            db=session,
            current_user=current_user,
            pagination=PaginationParams(skip=0, limit=20),
        )

    by_user = {conversation.user.id: conversation for conversation in conversations}
    assert set(by_user) == {busy_partner_id, older_partner_id}
    assert by_user[busy_partner_id].unread_count == 1005
    assert by_user[busy_partner_id].last_message == "busy message 1004"
    assert by_user[older_partner_id].unread_count == 1
    assert by_user[older_partner_id].last_message == "older conversation must remain visible"


@pytest.mark.asyncio
async def test_event_ids_are_allocated_in_commit_order_and_relay_cannot_skip_them():
    recipient_user_id = await _create_user("commit-order-recipient")
    received: list[dict] = []

    async def dispatch(_user_id: int, payload: dict) -> int:
        received.append(payload)
        return 1

    target = ChatRealtimeRelay(
        dispatch=dispatch,
        connected_users=lambda: {recipient_user_id},
        instance_id=f"commit-order-target-{uuid4().hex}",
        enabled=True,
        run_background_in_tests=True,
    )
    await target.initialize_cursor()

    source_a = f"commit-order-a-{uuid4().hex}"
    source_b = f"commit-order-b-{uuid4().hex}"
    expires_at = datetime.now(UTC) + timedelta(hours=1)
    session_a = SessionLocal()
    insert_b_started = asyncio.Event()
    insert_b_task: asyncio.Task[int] | None = None
    event_a_id = 0
    event_b_id = 0

    async def insert_and_commit_b() -> int:
        async with SessionLocal() as session_b:
            event_b = ChatRealtimeEvent(
                source_instance_id=source_b,
                recipient_user_id=recipient_user_id,
                event_type="message:new",
                payload_json={"type": "message:new", "sequence": 2},
                expires_at=expires_at,
            )
            session_b.add(event_b)
            insert_b_started.set()
            await session_b.flush()
            allocated_id = int(event_b.id)
            await session_b.commit()
            return allocated_id

    try:
        event_a = ChatRealtimeEvent(
            source_instance_id=source_a,
            recipient_user_id=recipient_user_id,
            event_type="message:new",
            payload_json={"type": "message:new", "sequence": 1},
            expires_at=expires_at,
        )
        session_a.add(event_a)
        await session_a.flush()
        event_a_id = int(event_a.id)

        insert_b_task = asyncio.create_task(insert_and_commit_b())
        await asyncio.wait_for(insert_b_started.wait(), timeout=1)
        with pytest.raises(TimeoutError):
            await asyncio.wait_for(asyncio.shield(insert_b_task), timeout=0.2)
        assert not insert_b_task.done()

        await session_a.commit()
        event_b_id = await asyncio.wait_for(insert_b_task, timeout=3)
    finally:
        if session_a.in_transaction():
            await session_a.rollback()
        await session_a.close()
        if insert_b_task is not None and not insert_b_task.done():
            insert_b_task.cancel()
            await asyncio.gather(insert_b_task, return_exceptions=True)

    assert event_a_id < event_b_id
    assert await target.poll_once() == 2
    assert [payload["sequence"] for payload in received] == [1, 2]
    assert target._cursor == event_b_id

    async with SessionLocal() as session:
        await session.execute(
            delete(ChatRealtimeEvent).where(
                ChatRealtimeEvent.source_instance_id.in_((source_a, source_b))
            )
        )
        await session.commit()


@pytest.mark.asyncio
async def test_relay_filters_to_local_users_advances_cursor_and_keeps_high_watermark_races(
    monkeypatch,
):
    connected_user_id = await _create_user("connected")
    offline_user_id = await _create_user("offline")
    connected_users = {connected_user_id}
    received: list[tuple[int, dict]] = []

    async def dispatch(user_id: int, payload: dict) -> int:
        received.append((user_id, payload))
        return 1

    async def discard(_user_id: int, _payload: dict) -> int:
        return 0

    source = ChatRealtimeRelay(
        dispatch=discard,
        connected_users=set,
        instance_id=f"source-{uuid4().hex}",
        enabled=True,
        run_background_in_tests=True,
    )
    target = ChatRealtimeRelay(
        dispatch=dispatch,
        connected_users=lambda: connected_users,
        instance_id=f"target-{uuid4().hex}",
        enabled=True,
        run_background_in_tests=True,
    )
    assert await target.register_presence(connected_user_id) is True
    async with SessionLocal() as session:
        lease = await session.get(
            ChatPresenceLease,
            (target.instance_id, connected_user_id),
        )
        assert lease is not None
    await target.initialize_cursor()

    async with SessionLocal() as session:
        source.enqueue(
            session,
            recipients=(connected_user_id,),
            event_type="message:new",
            payload={"type": "message:new", "sequence": 1},
        )
        source.enqueue(
            session,
            recipients=(offline_user_id,),
            event_type="message:new",
            payload={"type": "message:new", "sequence": 2},
        )
        await session.commit()

    assert await target.poll_once() == 1
    assert received == [
        (connected_user_id, {"type": "message:new", "sequence": 1})
    ]
    async with SessionLocal() as session:
        current_high_watermark = int(
            await session.scalar(select(func.max(ChatRealtimeEvent.id))) or 0
        )
    assert target._cursor == current_high_watermark

    async with SessionLocal() as session:
        source.enqueue(
            session,
            recipients=(connected_user_id,),
            event_type="message:new",
            payload={"type": "message:new", "sequence": 3},
        )
        await session.commit()

    race_inserted = False

    async def insert_after_high_watermark(_high_watermark: int) -> None:
        nonlocal race_inserted
        if race_inserted:
            return
        race_inserted = True
        async with SessionLocal() as session:
            source.enqueue(
                session,
                recipients=(connected_user_id,),
                event_type="message:new",
                payload={"type": "message:new", "sequence": 4},
            )
            await session.commit()

    monkeypatch.setattr(target, "_after_high_watermark", insert_after_high_watermark)
    assert await target.poll_once() == 1
    assert received[-1][1]["sequence"] == 3
    assert all(payload["sequence"] != 4 for _user_id, payload in received)

    assert await target.poll_once() == 1
    assert received[-1] == (
        connected_user_id,
        {"type": "message:new", "sequence": 4},
    )

    await target.unregister_presence(connected_user_id)
    async with SessionLocal() as session:
        assert (
            await session.get(
                ChatPresenceLease,
                (target.instance_id, connected_user_id),
            )
        ) is None

    async with SessionLocal() as session:
        await session.execute(
            delete(ChatRealtimeEvent).where(
                ChatRealtimeEvent.source_instance_id == source.instance_id
            )
        )
        await session.commit()
