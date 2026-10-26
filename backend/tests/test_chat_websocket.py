import asyncio
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.api.v1.endpoints import chat
from app.main import app
from app.models.social import Message


ALLOWED_ORIGIN = "http://localhost:3000"
DISALLOWED_ORIGIN = "https://evil.example"


@pytest.fixture(autouse=True)
def reset_chat_connections():
    chat.chat_manager.active_connections.clear()
    yield
    chat.chat_manager.active_connections.clear()


def test_empty_chat_cursor_zero_is_a_valid_incremental_history_query():
    route = next(route for route in chat.router.routes if route.name == "get_message_history")
    field = next(field for field in route.dependant.query_params if field.name == "after_id")
    value, errors = field.validate(0, {}, loc=("query", "after_id"))

    assert value == 0
    assert errors == []


def test_negative_chat_cursor_is_rejected_by_query_validation():
    route = next(route for route in chat.router.routes if route.name == "get_message_history")
    field = next(field for field in route.dependant.query_params if field.name == "after_id")
    value, errors = field.validate(-1, {}, loc=("query", "after_id"))

    assert value is None
    assert errors


def test_private_messages_api_and_websocket_are_retired():
    with TestClient(app) as client:
        assert client.get("/api/v1/chat/conversations").status_code == 404
        assert client.post("/api/v1/chat", json={"receiver_id": 2, "content": "retired"}).status_code == 404
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/api/v1/chat/ws"):
                pytest.fail("Retired chat websocket accepted a connection")


class RecordingWebSocket:
    def __init__(self):
        self.payloads: list[dict] = []

    async def send_json(self, payload: dict) -> None:
        self.payloads.append(payload)


class SlowWebSocket:
    def __init__(self):
        self.closed = False

    async def send_json(self, _payload: dict) -> None:
        await asyncio.Event().wait()

    async def close(self, *, code: int) -> None:
        self.closed = code == 1011


@pytest.mark.asyncio
async def test_chat_fanout_is_concurrent_bounded_and_evicts_slow_sockets(monkeypatch):
    fast = RecordingWebSocket()
    slow = SlowWebSocket()
    monkeypatch.setattr(chat.settings, "CHAT_SOCKET_SEND_TIMEOUT_SECONDS", 0.02)
    await chat.chat_manager.connect(501, fast)
    await chat.chat_manager.connect(501, slow)

    started = asyncio.get_running_loop().time()
    delivered = await chat.chat_manager.send_to_user(501, {"type": "test"})
    elapsed = asyncio.get_running_loop().time() - started

    assert delivered == 1
    assert elapsed < 0.1
    assert fast.payloads == [{"type": "test"}]
    assert slow.closed is True
    assert slow not in chat.chat_manager.active_connections[501]


@pytest.mark.asyncio
async def test_chat_connection_count_is_bounded_per_user(monkeypatch):
    monkeypatch.setattr(chat.settings, "CHAT_MAX_CONNECTIONS_PER_USER", 1)
    first = RecordingWebSocket()
    second = RecordingWebSocket()

    assert await chat.chat_manager.connect(777, first) is True
    assert await chat.chat_manager.connect(777, second) is None
    assert chat.chat_manager.active_connections[777] == {first}


@pytest.mark.asyncio
async def test_chat_broadcasts_new_messages_and_read_receipts_to_active_sessions():
    sender_socket = RecordingWebSocket()
    receiver_socket = RecordingWebSocket()
    await chat.chat_manager.connect(101, sender_socket)
    await chat.chat_manager.connect(202, receiver_socket)

    now = datetime.now(UTC)
    message = Message(
        id=303,
        sender_id=101,
        receiver_id=202,
        content="phase four realtime message",
        is_read=False,
        sender=None,
        receiver=None,
        created_at=now,
        updated_at=now,
    )
    await chat._broadcast_message(message)
    await chat._broadcast_read_receipt(
        sender_id=101,
        reader_id=202,
        message_ids=[303],
    )

    assert receiver_socket.payloads == [
        {
            "type": "message:new",
            "message": {
                "id": 303,
                "sender_id": 101,
                "receiver_id": 202,
                "content": "phase four realtime message",
                "is_read": False,
                "created_at": now.isoformat().replace("+00:00", "Z"),
                "sender": None,
                "receiver": None,
            },
        }
    ]
    assert sender_socket.payloads == [
        receiver_socket.payloads[0],
        {
            "type": "messages:read",
            "reader_id": 202,
            "message_ids": [303],
        },
    ]
