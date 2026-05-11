from typing import Any, List
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, desc
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.social import Message
from app.models.user import User, UserStatus
from app.schemas import chat as schemas
from app.schemas.token import TokenPayload

router = APIRouter()


class ChatConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> None:
        connections = list(self.active_connections.get(user_id, set()))
        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                self.disconnect(user_id, websocket)

    def is_online(self, user_id: int) -> bool:
        return bool(self.active_connections.get(user_id))


chat_manager = ChatConnectionManager()


async def _get_user_from_ws_token(token: str) -> User | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        user_id = int(token_data.sub)
    except (JWTError, TypeError, ValueError):
        return None

    async with SessionLocal() as session:
        result = await session.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or user.status != UserStatus.ACTIVE:
            return None
        return user


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
    payload = {
        "type": "message:new",
        "message": _message_read(message).model_dump(mode="json"),
    }
    await chat_manager.send_to_user(message.receiver_id, payload)
    await chat_manager.send_to_user(message.sender_id, payload)


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, token: str = Query("")):
    user = await _get_user_from_ws_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await chat_manager.connect(user.id, websocket)
    try:
        await websocket.send_json({"type": "connection:ready", "user_id": user.id})
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        chat_manager.disconnect(user.id, websocket)


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
    if not receiver:
        raise not_found("User")
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        receiver_id=message_in.receiver_id,
        content=content,
    )
    db.add(message)
    await db.commit()
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile),
        )
        .where(Message.id == message.id)
    )
    message = result.scalar_one()
    await _broadcast_message(message)

    return _message_read(message)


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
    scan_limit = max(100, min(1000, (pagination.skip + pagination.limit) * 20))

    query = (
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile)
        )
        .where(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id
            )
        )
        .order_by(desc(Message.created_at))
        .limit(scan_limit)
    )
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    # Group by conversation partner and get the last message
    unread_counts: dict[int, int] = {}
    for msg in messages:
        if msg.sender_id != current_user.id and msg.receiver_id == current_user.id and not msg.is_read:
            unread_counts[msg.sender_id] = unread_counts.get(msg.sender_id, 0) + 1

    conversations_dict: dict = {}
    for msg in messages:
        # Determine the other user
        if msg.sender_id == current_user.id:
            other_user = msg.receiver
        else:
            other_user = msg.sender
        
        if other_user is None:
            continue
            
        other_user_id = other_user.id
        
        if other_user_id not in conversations_dict:
            conversations_dict[other_user_id] = schemas.ConversationPreview(
                user=schemas.ChatUserSummary(
                    id=other_user.id,
                    display_name=other_user.profile.display_name if other_user.profile else None,
                    avatar_url=other_user.profile.avatar_url if other_user.profile else None
                ),
                last_message=msg.content[:100] if msg.content else "",
                last_message_time=msg.created_at,
                unread_count=unread_counts.get(other_user_id, 0),
                is_online=chat_manager.is_online(other_user_id),
            )
    
    conversations = sorted(
        conversations_dict.values(),
        key=lambda item: item.last_message_time,
        reverse=True,
    )
    return conversations[pagination.skip:pagination.skip + pagination.limit]


@router.get("/{user_id}/messages", response_model=List[schemas.MessageRead])
async def get_message_history(
    user_id: int,
    after_id: int | None = Query(default=None, ge=1),
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
    filters = [
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id),
        )
    ]
    if after_id is not None:
        filters.append(Message.id > after_id)

    query = (
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile)
        )
        .where(*filters)
        .order_by(Message.created_at.asc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    messages = result.scalars().all()

    # Mark received messages as read
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
    await db.commit()

    return [_message_read(msg) for msg in messages]
