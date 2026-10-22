import asyncio
from unittest.mock import AsyncMock, Mock

import pytest

from app.services import chat_realtime
from app.services.chat_realtime import ChatRealtimeRelay


@pytest.mark.asyncio
async def test_idle_relay_never_opens_database_for_polling_or_maintenance(monkeypatch):
    session_factory = Mock(side_effect=AssertionError("Idle relay must let the database sleep"))
    monkeypatch.setattr(chat_realtime, "SessionLocal", session_factory)
    relay = ChatRealtimeRelay(dispatch=AsyncMock(), connected_users=set, enabled=True)
    for _ in range(3):
        assert await relay.poll_once() == 0
        await relay.maintenance()
    session_factory.assert_not_called()


@pytest.mark.asyncio
async def test_first_socket_sets_baseline_before_becoming_visible_and_wakes_relay(monkeypatch):
    connected = set()
    relay = ChatRealtimeRelay(
        dispatch=AsyncMock(), connected_users=lambda: connected,
        enabled=True, run_background_in_tests=True,
    )
    baselines = []

    async def baseline():
        assert not connected
        relay._cursor = 41
        baselines.append(41)

    monkeypatch.setattr(relay, "initialize_cursor", baseline)
    async with relay.connection_registration():
        assert relay._cursor == 41
        connected.add(7)
    assert relay._wake.is_set()
    async with relay.connection_registration():
        connected.add(8)
    assert baselines == [41]
    connected.clear()
    async with relay.connection_registration():
        connected.add(9)
    assert baselines == [41, 41]


@pytest.mark.asyncio
async def test_reconnect_waits_for_inflight_poll_before_resetting_idle_cursor(monkeypatch):
    connected = {7}
    relay = ChatRealtimeRelay(
        dispatch=AsyncMock(), connected_users=lambda: connected,
        enabled=True, run_background_in_tests=True,
    )
    polling = asyncio.Event()
    finish_poll = asyncio.Event()
    order = []

    async def poll(users):
        assert users == {7}
        polling.set()
        await finish_poll.wait()
        order.append("delivered")
        return 1

    async def baseline():
        order.append("baseline")

    async def reconnect():
        async with relay.connection_registration():
            connected.add(8)
            order.append("connected")

    monkeypatch.setattr(relay, "_poll_connected", poll)
    monkeypatch.setattr(relay, "initialize_cursor", baseline)
    task = asyncio.create_task(relay.poll_once())
    await asyncio.wait_for(polling.wait(), 1)
    connected.clear()
    connection = asyncio.create_task(reconnect())
    await asyncio.sleep(0)
    assert order == []
    finish_poll.set()
    assert await asyncio.wait_for(task, 1) == 1
    await asyncio.wait_for(connection, 1)
    assert order == ["delivered", "baseline", "connected"]
