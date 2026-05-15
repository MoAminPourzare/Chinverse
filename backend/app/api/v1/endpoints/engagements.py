from typing import Any, List

from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.course import Course
from app.models.service import UserService
from app.models.social import ContentComment, ContentLike
from app.models.user import User, UserGalleryItem
from app.schemas import engagement as schemas

router = APIRouter()

ALLOWED_TARGETS = {"post", "service", "course"}


def _normalize_target(target_type: str) -> str:
    normalized = target_type.strip().lower()
    if normalized not in ALLOWED_TARGETS:
        raise bad_request("Unsupported engagement target")
    return normalized


async def _ensure_target_exists(db: AsyncSession, target_type: str, target_id: int) -> None:
    model = {
        "post": UserGalleryItem,
        "service": UserService,
        "course": Course,
    }[target_type]
    exists = await db.scalar(select(model.id).where(model.id == target_id))
    if not exists:
        raise not_found(target_type.title())


def _author_summary(user: User | None) -> schemas.EngagementUserSummary | None:
    if not user:
        return None
    return schemas.EngagementUserSummary(
        id=user.id,
        display_name=user.profile.display_name if user.profile else None,
        avatar_url=user.profile.avatar_url if user.profile else None,
    )


def _comment_to_response(comment: ContentComment) -> schemas.EngagementCommentRead:
    return schemas.EngagementCommentRead(
        id=comment.id,
        target_type=comment.target_type,
        target_id=comment.target_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        content=comment.body,
        created_at=comment.created_at,
        author=_author_summary(comment.user),
    )


async def _engagement_state(
    db: AsyncSession,
    *,
    target_type: str,
    target_id: int,
    user_id: int,
) -> schemas.EngagementState:
    likes_count = await db.scalar(
        select(func.count())
        .select_from(ContentLike)
        .where(ContentLike.target_type == target_type, ContentLike.target_id == target_id)
    )
    comments_count = await db.scalar(
        select(func.count())
        .select_from(ContentComment)
        .where(ContentComment.target_type == target_type, ContentComment.target_id == target_id)
    )
    liked = await db.scalar(
        select(ContentLike.id).where(
            ContentLike.user_id == user_id,
            ContentLike.target_type == target_type,
            ContentLike.target_id == target_id,
        )
    )
    return schemas.EngagementState(
        target_type=target_type,
        target_id=target_id,
        liked=liked is not None,
        likes_count=int(likes_count or 0),
        comments_count=int(comments_count or 0),
    )


@router.get("/{target_type}/{target_id}", response_model=schemas.EngagementState)
async def read_engagement_state(
    target_type: str,
    target_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    target_type = _normalize_target(target_type)
    await _ensure_target_exists(db, target_type, target_id)
    return await _engagement_state(db, target_type=target_type, target_id=target_id, user_id=current_user.id)


@router.post("/{target_type}/{target_id}/like", response_model=schemas.EngagementState, status_code=status.HTTP_201_CREATED)
async def like_target(
    target_type: str,
    target_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    target_type = _normalize_target(target_type)
    await _ensure_target_exists(db, target_type, target_id)
    existing = await db.scalar(
        select(ContentLike.id).where(
            ContentLike.user_id == current_user.id,
            ContentLike.target_type == target_type,
            ContentLike.target_id == target_id,
        )
    )
    if not existing:
        db.add(ContentLike(user_id=current_user.id, target_type=target_type, target_id=target_id))
        await db.commit()
    return await _engagement_state(db, target_type=target_type, target_id=target_id, user_id=current_user.id)


@router.delete("/{target_type}/{target_id}/like", response_model=schemas.EngagementState)
async def unlike_target(
    target_type: str,
    target_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    target_type = _normalize_target(target_type)
    await db.execute(
        delete(ContentLike).where(
            ContentLike.user_id == current_user.id,
            ContentLike.target_type == target_type,
            ContentLike.target_id == target_id,
        )
    )
    await db.commit()
    await _ensure_target_exists(db, target_type, target_id)
    return await _engagement_state(db, target_type=target_type, target_id=target_id, user_id=current_user.id)


@router.get("/{target_type}/{target_id}/comments", response_model=List[schemas.EngagementCommentRead])
async def read_comments(
    target_type: str,
    target_id: int,
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
) -> Any:
    target_type = _normalize_target(target_type)
    await _ensure_target_exists(db, target_type, target_id)
    result = await db.execute(
        select(ContentComment)
        .options(selectinload(ContentComment.user).selectinload(User.profile))
        .where(ContentComment.target_type == target_type, ContentComment.target_id == target_id)
        .order_by(ContentComment.created_at.asc(), ContentComment.id.asc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    return [_comment_to_response(comment) for comment in result.scalars().all()]


@router.post("/{target_type}/{target_id}/comments", response_model=schemas.EngagementCommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    target_type: str,
    target_id: int,
    comment_in: schemas.EngagementCommentCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    target_type = _normalize_target(target_type)
    await _ensure_target_exists(db, target_type, target_id)

    content = comment_in.content.strip()
    if not content:
        raise bad_request("Comment cannot be empty")

    if comment_in.parent_id:
        parent = await db.scalar(
            select(ContentComment.id).where(
                ContentComment.id == comment_in.parent_id,
                ContentComment.target_type == target_type,
                ContentComment.target_id == target_id,
            )
        )
        if not parent:
            raise bad_request("Parent comment does not belong to this item")

    comment = ContentComment(
        user_id=current_user.id,
        target_type=target_type,
        target_id=target_id,
        parent_id=comment_in.parent_id,
        body=content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    comment.user = current_user
    return _comment_to_response(comment)
