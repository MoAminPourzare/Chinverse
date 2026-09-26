import asyncio
from datetime import UTC, datetime
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
import jwt
from jwt.exceptions import PyJWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, update, text
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.core.browser_origin import is_allowed_browser_origin
from app.core.config import settings
from app.core.observability import record_chat_connection
from app.db.session import SessionLocal
from app.models.moderation import UserBlock
from app.models.security import AuthSession
from app.models.social import Message
from app.models.user import User, UserStatus
from app.schemas import chat as schemas
from app.schemas.token import TokenPayload
from app.services.notifications import create_notification
from app.services.chat_realtime import ChatRealtimeRelay

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> bool | None:
        connections = self.active_connections.setdefault(user_id, set())
        if len(connections) >= settings.CHAT_MAX_CONNECTIONS_PER_USER:
            return None
        first_connection = not connections
        connections.add(websocket)
        record_chat_connection(1)
        return first_connection

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        connections = self.active_connections.get(user_id)
        if not connections:
            return False
        if websocket in connections:
            connections.discard(websocket)
            record_chat_connection(-1)
        if not connections:
            self.active_connections.pop(user_id, None)
            return True
        return False

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> int:
        connections = list(self.active_connections.get(user_id, set()))

        async def send_one(websocket: WebSocket) -> bool:
            try:
                await asyncio.wait_for(
                    websocket.send_json(payload),
                    timeout=settings.CHAT_SOCKET_SEND_TIMEOUT_SECONDS,
                )
                return True
            except (Exception, TimeoutError):
                self.disconnect(user_id, websocket)
                try:
                    await asyncio.wait_for(
                        websocket.close(code=status.WS_1011_INTERNAL_ERROR),
                        timeout=min(1.0, settings.CHAT_SOCKET_SEND_TIMEOUT_SECONDS),
                    )
                except (Exception, TimeoutError):
                    pass
                return False

        if not connections:
            return 0
        results = await asyncio.gather(*(send_one(websocket) for websocket in connections))
        return sum(results)

    def is_online(self, user_id: int) -> bool:
        return bool(self.active_connections.get(user_id))

    def connected_user_ids(self) -> set[int]:
        return set(self.active_connections)


chat_manager = ChatConnectionManager()
chat_realtime = ChatRealtimeRelay(
    dispatch=chat_manager.send_to_user,
    connected_users=chat_manager.connected_user_ids,
)


async def start_chat_realtime() -> None:
    await chat_realtime.start()


async def stop_chat_realtime() -> None:
    if chat_realtime.running:
        await chat_realtime.stop()


async def _get_user_from_ws_token(
    token: str,
) -> tuple[User, str, datetime] | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        user_id = int(token_data.sub)
        if token_data.type != "access" or not token_data.sid:
            return None
        token_expires_at = datetime.fromtimestamp(float(payload["exp"]), UTC)
    except (KeyError, OverflowError, PyJWTError, TypeError, ValueError, ValidationError):
        return None

    async with SessionLocal() as session:
        result = await session.execute(
            select(User)
            .join(AuthSession, AuthSession.user_id == User.id)
            .options(selectinload(User.profile))
            .where(
                User.id == user_id,
                AuthSession.id == token_data.sid,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > datetime.now(UTC),
            )
        )
        user = result.scalar_one_or_none()
        if not user or user.status != UserStatus.ACTIVE:
            return None
        if settings.REQUIRE_VERIFIED_LOGIN and not user.is_verified:
            return None
        return user, token_data.sid, token_expires_at


async def _ws_session_is_active(*, user_id: int, session_id: str) -> bool:
    async with SessionLocal() as session:
        result = await session.scalar(
            select(AuthSession.id)
            .join(User, User.id == AuthSession.user_id)
            .where(
                AuthSession.id == session_id,
                AuthSession.user_id == user_id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > datetime.now(UTC),
                User.status == UserStatus.ACTIVE,
            )
        )
        return bool(result)


def _user_summary(user: User | None) -> schemas.ChatUserSummary | None:
    if not user:
        return None
    return schemas.ChatUserSummary(
        id=user.id,
        display_name=user.profile.display_name if user.profile else None,
        avatar_url=user.profile.avatar_url if user.profile else None,
    )


def _message_read(message: Message) -> schemas.MessageRead:
    return schemas.MessageRead(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender=_user_summary(message.sender),
        receiver=_user_summary(message.receiver),
    )


async def _broadcast_message(message: Message) -> None:
    payload = _message_event_payload(message)
    await asyncio.gather(
        chat_manager.send_to_user(message.receiver_id, payload),
        chat_manager.send_to_user(message.sender_id, payload),
    )


def _message_event_payload(message: Message) -> dict[str, Any]:
    return {
        "type": "message:new",
        "message": _message_read(message).model_dump(mode="json"),
    }


def _enqueue_message_event(db: AsyncSession, message: Message) -> None:
    chat_realtime.enqueue(
        db,
        recipients=(message.receiver_id, message.sender_id),
        event_type="message:new",
        payload=_message_event_payload(message),
    )


async def _broadcast_read_receipt(*, sender_id: int, reader_id: int, message_ids: list[int]) -> None:
    if not message_ids:
        return
    await chat_manager.send_to_user(sender_id, _read_receipt_payload(reader_id, message_ids))


def _read_receipt_payload(reader_id: int, message_ids: list[int]) -> dict[str, Any]:
    return {
        "type": "messages:read",
        "reader_id": reader_id,
        "message_ids": message_ids,
    }


def _enqueue_read_receipt(
    db: AsyncSession,
    *,
    sender_id: int,
    reader_id: int,
    message_ids: list[int],
) -> None:
    if not message_ids:
        return
    chat_realtime.enqueue(
        db,
        recipients=(sender_id,),
        event_type="messages:read",
        payload=_read_receipt_payload(reader_id, message_ids),
    )


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    origin = websocket.headers.get("origin")
    if origin and not is_allowed_browser_origin(
        origin,
        allowed_origins=settings.CORS_ORIGINS,
        allowed_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    ):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        auth_message = await asyncio.wait_for(
            websocket.receive_json(),
            timeout=5.0,
        )
    except (TimeoutError, ValueError, WebSocketDisconnect):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not isinstance(auth_message, dict):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    token = str(auth_message.get("token", "")) if auth_message.get("type") == "auth" else ""
    principal = await _get_user_from_ws_token(token)
    if not principal:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user, session_id, token_expires_at = principal

    first_connection = await chat_manager.connect(user.id, websocket)
    if first_connection is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    if first_connection:
        presence_registered = await chat_realtime.register_presence(user.id)
        if not presence_registered and settings.ENVIRONMENT.lower() != "test":
            chat_manager.disconnect(user.id, websocket)
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            return
    try:
        await websocket.send_json({"type": "connection:ready", "user_id": user.id})
        while True:
            if datetime.now(UTC) >= token_expires_at or not await _ws_session_is_active(
                user_id=user.id,
                session_id=session_id,
            ):
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            try:
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=30.0,
                )
            except TimeoutError:
                continue
            if not isinstance(data, dict):
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except (ValueError, WebSocketDisconnect):
        pass
    finally:
        chat_manager.disconnect(user.id, websocket)
        if not chat_manager.is_online(user.id):
            await chat_realtime.unregister_presence(user.id)


@router.post("", response_model=schemas.MessageRead)
async def send_message(
    message_in: schemas.MessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
):
    """
    Send a message to another user.
    """
    content = message_in.content.strip()
    if not content:
        raise bad_request("Message cannot be empty")

    if message_in.receiver_id == current_user.id:
        raise bad_request("You cannot message yourself")
    
    # Check if receiver exists
    receiver_query = select(User).where(User.id == message_in.receiver_id)
    result = await db.execute(receiver_query)
    receiver = result.scalar_one_or_none()
    if not receiver or receiver.status != UserStatus.ACTIVE or not receiver.is_verified:
        raise not_found("User")

    blocked = await db.scalar(
        select(UserBlock.id).where(
            or_(
                and_(
                    UserBlock.blocker_id == current_user.id,
                    UserBlock.blocked_id == message_in.receiver_id,
                ),
                and_(
                    UserBlock.blocker_id == message_in.receiver_id,
                    UserBlock.blocked_id == current_user.id,
                ),
            )
        )
    )
    if blocked:
        raise bad_request("Messaging is unavailable for this conversation")
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        receiver_id=message_in.receiver_id,
        content=content,
    )
    db.add(message)
    await db.flush()
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile),
        )
        .where(Message.id == message.id)
    )
    message = result.scalar_one()
    _enqueue_message_event(db, message)
    await db.commit()
    chat_realtime.notify_committed()
    try:
        sender_name = current_user.profile.display_name if current_user.profile else "Chinverse user"
        await create_notification(
            db,
            user_id=message.receiver_id,
            actor_user_id=current_user.id,
            type="message",
            title="پیام جدید",
            body=f"{sender_name}: {content[:120]}",
            target_url=f"/chat/{current_user.id}",
            metadata={"message_id": message.id},
        )
    except Exception:
        await db.rollback()
        logger.exception(
            "Could not create the new-message notification",
            extra={"event": "chat.notification", "outcome": "failed"},
        )
    await _broadcast_message(message)

    return _message_read(message)


@router.post("/{user_id}/read")
async def mark_conversation_read(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise not_found("User")

    result = await db.execute(
        update(Message)
        .where(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read.is_(False),
        )
        .values(is_read=True)
        .returning(Message.id)
    )
    message_ids = [int(message_id) for message_id in result.scalars().all()]
    _enqueue_read_receipt(
        db,
        sender_id=user_id,
        reader_id=current_user.id,
        message_ids=message_ids,
    )
    await db.commit()
    chat_realtime.notify_committed()
    await _broadcast_read_receipt(
        sender_id=user_id,
        reader_id=current_user.id,
        message_ids=message_ids,
    )
    return {"updated": len(message_ids), "message_ids": message_ids}


@router.get("/conversations", response_model=List[schemas.ConversationPreview])
async def get_conversations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
):
    """
    Get list of active conversations (users I have chatted with).
    Returns the other user's info and last message preview.
    """
    result = await db.execute(
        text(
            """
            WITH directional AS (
                SELECT
                    m.id,
                    m.receiver_id AS partner_id,
                    m.content,
                    m.created_at
                FROM messages m
                WHERE m.sender_id = :current_user_id

                UNION ALL

                SELECT
                    m.id,
                    m.sender_id AS partner_id,
                    m.content,
                    m.created_at
                FROM messages m
                WHERE m.receiver_id = :current_user_id
            ),
            latest AS (
                SELECT DISTINCT ON (partner_id)
                    id,
                    partner_id,
                    content,
                    created_at
                FROM directional
                ORDER BY partner_id, id DESC
            ),
            page AS (
                SELECT *
                FROM latest
                ORDER BY id DESC
                OFFSET :skip
                LIMIT :limit
            ),
            unread AS (
                SELECT sender_id AS partner_id, count(*)::integer AS unread_count
                FROM messages
                WHERE receiver_id = :current_user_id
                  AND is_read = false
                GROUP BY sender_id
            )
            SELECT
                page.partner_id,
                page.content,
                page.created_at,
                profile.display_name,
                profile.avatar_url,
                COALESCE(unread.unread_count, 0) AS unread_count,
                EXISTS (
                    SELECT 1
                    FROM chat_presence_leases presence
                    WHERE presence.user_id = page.partner_id
                      AND presence.expires_at > now()
                ) AS is_online
            FROM page
            JOIN users partner ON partner.id = page.partner_id
            LEFT JOIN user_profiles profile ON profile.user_id = partner.id
            LEFT JOIN unread ON unread.partner_id = page.partner_id
            ORDER BY page.id DESC
            """
        ),
        {
            "current_user_id": current_user.id,
            "skip": pagination.skip,
            "limit": pagination.limit,
        },
    )
    rows = result.mappings().all()
    return [
        schemas.ConversationPreview(
            user=schemas.ChatUserSummary(
                id=int(row["partner_id"]),
                display_name=row["display_name"],
                avatar_url=row["avatar_url"],
            ),
            last_message=str(row["content"] or "")[:100],
            last_message_time=row["created_at"],
            unread_count=int(row["unread_count"] or 0),
            is_online=(
                chat_manager.is_online(int(row["partner_id"]))
                if settings.CHAT_REALTIME_BACKEND == "memory"
                else bool(row["is_online"])
            ),
        )
        for row in rows
    ]


@router.get("/{user_id}/messages", response_model=List[schemas.MessageRead])
async def get_message_history(
    user_id: int,
    after_id: int | None = Query(default=None, ge=0),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
):
    """
    Get the full message history between current user and another user.
    Messages are sorted by time (oldest first for chat display).
    """
    target_user = await db.get(User, user_id)
    if not target_user:
        raise not_found("User")

    # Get messages between the two users
    conversation_filter = or_(
        and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
        and_(Message.sender_id == user_id, Message.receiver_id == current_user.id),
    )
    filters = [conversation_filter]
    if after_id is not None:
        filters.append(Message.id > after_id)

    if after_id is None:
        latest_ids = (
            select(Message.id)
            .where(conversation_filter)
            .order_by(Message.id.desc())
            .offset(pagination.skip)
            .limit(pagination.limit)
        )
        filters = [Message.id.in_(latest_ids)]
        offset = 0
    else:
        offset = pagination.skip

    query = (
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile)
        )
        .where(*filters)
        .order_by(Message.id.asc())
        .offset(offset)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    messages = result.scalars().all()

    # Mark received messages as read and notify the sender's active sessions.
    read_message_ids: list[int] = []
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
            read_message_ids.append(msg.id)
    _enqueue_read_receipt(
        db,
        sender_id=user_id,
        reader_id=current_user.id,
        message_ids=read_message_ids,
    )
    await db.commit()
    chat_realtime.notify_committed()
    await _broadcast_read_receipt(
        sender_id=user_id,
        reader_id=current_user.id,
        message_ids=read_message_ids,
    )

    return [_message_read(msg) for msg in messages]
