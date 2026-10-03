import asyncio
from datetime import UTC, datetime
from uuid import uuid4

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints.chat import chat_websocket
from app.core.config import settings
from app.db.session import SessionLocal
from app.main import app
from app.models.security import AuthSession
from app.models.user import User


pytestmark = pytest.mark.integration

PASSWORD = "Secure websocket integration passphrase 123!"
ALLOWED_ORIGIN = "http://localhost:3000"


class QueueWebSocket:
    def __init__(self, *initial_messages: dict):
        self.headers = {"origin": ALLOWED_ORIGIN}
        self.accepted = False
        self.close_code: int | None = None
        self.inbound: asyncio.Queue = asyncio.Queue()
        self.outbound: asyncio.Queue = asyncio.Queue()
        self.receive_count = 0
        self.post_auth_receive_started = asyncio.Event()
        for message in initial_messages:
            self.inbound.put_nowait(message)

    async def accept(self) -> None:
        self.accepted = True

    async def receive_json(self):
        self.receive_count += 1
        if self.receive_count == 2:
            self.post_auth_receive_started.set()
        return await self.inbound.get()

    async def send_json(self, payload: dict) -> None:
        await self.outbound.put(payload)

    async def close(self, *, code: int) -> None:
        self.close_code = code


async def create_verified_access_token(client: AsyncClient) -> tuple[int, str, str]:
    suffix = str(uuid4().int)[-9:]
    email = f"phase4-ws-{uuid4().hex[:12]}@example.com"
    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": PASSWORD,
            "display_name": "کاربر وب سوکت فاز چهار",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_community_guidelines": True,
        },
    )
    assert signup.status_code == 200, signup.text
    user_id = signup.json()["id"]

    async with SessionLocal() as session:
        user = await session.get(User, user_id)
        now = datetime.now(UTC)
        user.email_verified_at = now
        user.phone_verified_at = now
        user.is_verified = True
        await session.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": PASSWORD},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    token_payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )
    return user_id, token, token_payload["sid"]


@pytest.mark.asyncio
async def test_real_websocket_token_authentication_and_session_revocation():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        user_id, access_token, session_id = await create_verified_access_token(client)

    websocket = QueueWebSocket({"type": "auth", "token": access_token})
    handler = asyncio.create_task(chat_websocket(websocket))
    try:
        ready = await asyncio.wait_for(websocket.outbound.get(), timeout=5)
        assert websocket.accepted is True
        assert ready == {"type": "connection:ready", "user_id": user_id}

        await asyncio.wait_for(websocket.post_auth_receive_started.wait(), timeout=5)
        async with SessionLocal() as session:
            auth_session = await session.get(AuthSession, session_id)
            auth_session.revoked_at = datetime.now(UTC)
            await session.commit()

        await websocket.inbound.put({"type": "ping"})
        assert await asyncio.wait_for(websocket.outbound.get(), timeout=5) == {
            "type": "pong"
        }

        await asyncio.wait_for(handler, timeout=5)
        assert websocket.close_code == 1008
    finally:
        if not handler.done():
            handler.cancel()
            await asyncio.gather(handler, return_exceptions=True)
