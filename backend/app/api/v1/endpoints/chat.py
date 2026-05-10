from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, desc
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.social import Message
from app.models.user import User, UserProfile
from app.schemas import chat as schemas

router = APIRouter()


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
    await db.refresh(message)

    # Build response with user info
    sender_summary = None
    if current_user.profile:
        sender_summary = schemas.ChatUserSummary(
            id=current_user.id,
            display_name=current_user.profile.display_name,
            avatar_url=current_user.profile.avatar_url
        )

    return schemas.MessageRead(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender=sender_summary,
        receiver=None  # Could add receiver info if needed
    )


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
                unread_count=unread_counts.get(other_user_id, 0)
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
    query = (
        select(Message)
        .options(
            selectinload(Message.sender).selectinload(User.profile),
            selectinload(Message.receiver).selectinload(User.profile)
        )
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        )
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

    # Build response
    response = []
    for msg in messages:
        sender_summary = None
        receiver_summary = None

        if msg.sender and msg.sender.profile:
            sender_summary = schemas.ChatUserSummary(
                id=msg.sender.id,
                display_name=msg.sender.profile.display_name,
                avatar_url=msg.sender.profile.avatar_url
            )
        if msg.receiver and msg.receiver.profile:
            receiver_summary = schemas.ChatUserSummary(
                id=msg.receiver.id,
                display_name=msg.receiver.profile.display_name,
                avatar_url=msg.receiver.profile.avatar_url
            )

        response.append(schemas.MessageRead(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender=sender_summary,
            receiver=receiver_summary
        ))

    return response
