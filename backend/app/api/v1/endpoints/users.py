from datetime import datetime
from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import bad_request, conflict, not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import upload_rate_limit, write_rate_limit
from app.core.paths import AVATARS_DIR, resolve_backend_file_url, safe_unlink
from app.core.storage import delete_public_file
from app.core.uploads import save_image_upload
from app.models.user import User, UserProfile, UserGalleryItem
from app.schemas import user as schemas
from app.schemas.showcase import ShowcaseUser, PublicUser, PublicUserProfile, GalleryItemPublic, EducationSummary

router = APIRouter()


async def get_user_with_profile(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise not_found("User")
    return user

@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete("/me", status_code=200)
async def delete_user_account(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Delete current user account and all related data.
    This is a destructive action - all user data will be permanently removed.
    Manual cascade delete to handle foreign key constraints.
    """
    from sqlalchemy import delete, or_, update
    from app.models.business import ConsultationRequest, Service as BusinessService, UserSubscription
    from app.models.dictionary import WordExample
    from app.models.learning import LeitnerCard, StudySession, UserStreak, CourseReview
    from app.models.leitner import UserFlashcard
    from app.models.media import MediaAsset
    from app.models.settings import UserLanguageSetting, UserPreference
    from app.models.social import (
        ForumQuestion, ForumAnswer, Article, ArticleComment, ContentComment, ContentLike, Post, PostMedia, PostLike, PostComment,
        UserFollow, Message, SupportTicket
    )
    from app.models.service import UserService
    from app.models.user import UserGalleryItem, UserProfile, UserSocialLink
    
    user_id = current_user.id

    gallery_files = await db.execute(
        select(UserGalleryItem.image_url).where(UserGalleryItem.user_id == user_id)
    )
    service_files = await db.execute(
        select(UserService.banner_url).where(UserService.user_id == user_id)
    )
    media_files = await db.execute(
        select(MediaAsset.file_url, MediaAsset.thumbnail_url).where(MediaAsset.user_id == user_id)
    )
    file_urls = list(gallery_files.scalars().all()) + [
        url for url in service_files.scalars().all() if url
    ]
    for file_url, thumbnail_url in media_files.all():
        if file_url:
            file_urls.append(file_url)
        if thumbnail_url:
            file_urls.append(thumbnail_url)
    if current_user.profile and current_user.profile.avatar_url:
        file_urls.append(current_user.profile.avatar_url)

    owned_question_ids = select(ForumQuestion.id).where(ForumQuestion.author_user_id == user_id)
    owned_post_ids = select(Post.id).where(Post.author_user_id == user_id)
    owned_article_ids = select(Article.id).where(Article.author_user_id == user_id)
    owned_answer_ids = select(ForumAnswer.id).where(
        or_(ForumAnswer.author_user_id == user_id, ForumAnswer.question_id.in_(owned_question_ids))
    )
    owned_comment_ids = select(PostComment.id).where(PostComment.user_id == user_id)
    owned_article_comment_ids = select(ArticleComment.id).where(ArticleComment.author_user_id == user_id)
    owned_media_ids = select(MediaAsset.id).where(MediaAsset.user_id == user_id)
    owned_gallery_ids = select(UserGalleryItem.id).where(UserGalleryItem.user_id == user_id)
    owned_business_service_ids = select(BusinessService.id).where(
        BusinessService.provider_user_id == user_id
    )
    owned_user_service_ids = select(UserService.id).where(UserService.user_id == user_id)

    await db.execute(update(ForumAnswer).where(ForumAnswer.parent_id.in_(owned_answer_ids)).values(parent_id=None))
    await db.execute(delete(ForumAnswer).where(
        or_(ForumAnswer.author_user_id == user_id, ForumAnswer.question_id.in_(owned_question_ids))
    ))
    await db.execute(delete(ForumQuestion).where(ForumQuestion.author_user_id == user_id))
    await db.execute(update(ArticleComment).where(
        ArticleComment.parent_id.in_(owned_article_comment_ids)
    ).values(parent_id=None))
    await db.execute(delete(ArticleComment).where(
        or_(ArticleComment.author_user_id == user_id, ArticleComment.article_id.in_(owned_article_ids))
    ))
    await db.execute(delete(Article).where(Article.author_user_id == user_id))

    await db.execute(update(PostComment).where(
        PostComment.parent_id.in_(owned_comment_ids)
    ).values(parent_id=None))
    await db.execute(delete(PostMedia).where(
        or_(PostMedia.post_id.in_(owned_post_ids), PostMedia.media_id.in_(owned_media_ids))
    ))
    await db.execute(delete(PostLike).where(
        or_(PostLike.user_id == user_id, PostLike.post_id.in_(owned_post_ids))
    ))
    await db.execute(delete(PostComment).where(
        or_(PostComment.user_id == user_id, PostComment.post_id.in_(owned_post_ids))
    ))
    await db.execute(delete(Post).where(Post.author_user_id == user_id))
    await db.execute(update(ContentComment).where(
        ContentComment.parent_id.in_(select(ContentComment.id).where(ContentComment.user_id == user_id))
    ).values(parent_id=None))
    await db.execute(delete(ContentComment).where(
        or_(
            ContentComment.user_id == user_id,
            (ContentComment.target_type == "post") & ContentComment.target_id.in_(owned_gallery_ids),
            (ContentComment.target_type == "service") & ContentComment.target_id.in_(owned_user_service_ids),
        )
    ))
    await db.execute(delete(ContentLike).where(
        or_(
            ContentLike.user_id == user_id,
            (ContentLike.target_type == "post") & ContentLike.target_id.in_(owned_gallery_ids),
            (ContentLike.target_type == "service") & ContentLike.target_id.in_(owned_user_service_ids),
        )
    ))

    await db.execute(delete(ConsultationRequest).where(
        or_(
            ConsultationRequest.requester_user_id == user_id,
            ConsultationRequest.service_id.in_(owned_business_service_ids),
        )
    ))
    await db.execute(delete(BusinessService).where(BusinessService.provider_user_id == user_id))
    await db.execute(delete(UserSubscription).where(UserSubscription.user_id == user_id))

    await db.execute(delete(UserService).where(UserService.user_id == user_id))
    await db.execute(update(WordExample).where(
        WordExample.media_id.in_(owned_media_ids)
    ).values(media_id=None))
    await db.execute(delete(MediaAsset).where(MediaAsset.user_id == user_id))
    await db.execute(delete(UserFlashcard).where(UserFlashcard.user_id == user_id))
    await db.execute(delete(LeitnerCard).where(LeitnerCard.user_id == user_id))
    await db.execute(delete(StudySession).where(StudySession.user_id == user_id))
    await db.execute(delete(UserStreak).where(UserStreak.user_id == user_id))
    await db.execute(delete(CourseReview).where(CourseReview.user_id == user_id))

    await db.execute(delete(Message).where(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ))
    await db.execute(delete(SupportTicket).where(SupportTicket.user_id == user_id))
    await db.execute(delete(UserGalleryItem).where(UserGalleryItem.user_id == user_id))
    await db.execute(delete(UserFollow).where(
        (UserFollow.follower_id == user_id) | (UserFollow.followee_id == user_id)
    ))
    await db.execute(delete(UserSocialLink).where(UserSocialLink.user_id == user_id))
    await db.execute(delete(UserLanguageSetting).where(UserLanguageSetting.user_id == user_id))
    await db.execute(delete(UserPreference).where(UserPreference.user_id == user_id))
    await db.execute(delete(UserProfile).where(UserProfile.user_id == user_id))

    await db.delete(current_user)
    await db.commit()

    for file_url in file_urls:
        safe_unlink(resolve_backend_file_url(file_url))
    
    return {"message": "حساب کاربری با موفقیت حذف شد"}

@router.put("/me/profile", response_model=schemas.User)
async def update_user_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: schemas.UserProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Update current user profile.
    """
    update_data = profile_in.model_dump(exclude_unset=True)
    if "display_name" in update_data and isinstance(update_data["display_name"], str):
        update_data["display_name"] = update_data["display_name"].strip()
    if update_data.get("display_name") is None or update_data.get("display_name") == "":
        update_data.pop("display_name", None)

    # Check if profile exists
    if not current_user.profile:
        # Create new profile
        update_data.setdefault("display_name", current_user.email or "User")
        profile = UserProfile(user_id=current_user.id, **update_data)
        db.add(profile)
    else:
        # Update existing profile
        profile = current_user.profile
        for field, value in update_data.items():
            setattr(profile, field, value)
        db.add(profile)
    
    await db.commit()
    return await get_user_with_profile(db, current_user.id)

@router.post("/me/avatar", response_model=schemas.User)
async def upload_avatar(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(upload_rate_limit),
) -> Any:
    """
    Upload user avatar image.
    """
    avatar_url = await save_image_upload(
        file,
        destination_dir=AVATARS_DIR,
        public_url_prefix="/uploads/avatars",
    )
    old_avatar_url = None

    if not current_user.profile:
        profile = UserProfile(
            user_id=current_user.id,
            avatar_url=avatar_url,
            display_name="User",
        )
        db.add(profile)
    else:
        old_avatar_url = current_user.profile.avatar_url
        current_user.profile.avatar_url = avatar_url
        db.add(current_user.profile)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        delete_public_file(avatar_url)
        raise

    if old_avatar_url:
        delete_public_file(old_avatar_url)

    return await get_user_with_profile(db, current_user.id)

# ===== PUBLIC ENDPOINTS (No auth required) =====

@router.get("/showcase", response_model=List[ShowcaseUser])
async def get_showcase_users(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users for showcase directory.
    Returns summary data for talent cards (no sensitive info).
    """
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.profile),
            selectinload(User.gallery_items)
        )
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    users = result.scalars().all()
    
    showcase_users = []
    for user in users:
        if not user.profile:
            continue
        
        # Extract education summary from resume
        education = None
        if user.profile.resume and user.profile.resume.get("educations"):
            edu_list = user.profile.resume.get("educations", [])
            if edu_list:
                first_edu = edu_list[0]
                education = EducationSummary(
                    university=first_edu.get("university"),
                    field=first_edu.get("field"),
                    degree=first_edu.get("degree")
                )

        job_titles = []
        if user.profile.resume and user.profile.resume.get("work_experiences"):
            for work in user.profile.resume.get("work_experiences", []):
                title = (work.get("job_title") or "").strip()
                if title and title not in job_titles:
                    job_titles.append(title)
        
        # Get first 3 gallery images for preview
        gallery_preview = [
            item.image_url
            for item in sorted(
                user.gallery_items,
                key=lambda item: item.created_at or datetime.min,
                reverse=True,
            )[:3]
        ]
        
        # Extract HSK level from skills if available
        hsk_level = None
        if user.profile.resume and user.profile.resume.get("skills"):
            for skill in user.profile.resume.get("skills", []):
                if "HSK" in skill.get("name", "").upper():
                    hsk_level = skill.get("name")
                    break
        
        showcase_users.append(ShowcaseUser(
            id=user.id,
            display_name=user.profile.display_name,
            headline=user.profile.headline,
            city=user.profile.city,
            country=user.profile.country,
            avatar_url=user.profile.avatar_url,
            education=education,
            job_titles=job_titles,
            gallery_preview=gallery_preview,
            hsk_level=hsk_level
        ))
    
    return showcase_users


@router.get("/{user_id}/public", response_model=PublicUser)
async def get_public_user_profile(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get public profile of a user.
    Returns full public details (no email, phone, password).
    """
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.profile),
            selectinload(User.gallery_items)
        )
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise not_found("User")
    
    # Build public profile
    public_profile = None
    if user.profile:
        public_profile = PublicUserProfile(
            display_name=user.profile.display_name,
            headline=user.profile.headline,
            city=user.profile.city,
            country=user.profile.country,
            avatar_url=user.profile.avatar_url,
            bio=user.profile.bio,
            websites=user.profile.websites,
            socials=user.profile.socials,
            resume=user.profile.resume
        )
    
    # Build gallery items
    gallery_items = [
        GalleryItemPublic(
            id=item.id,
            image_url=item.image_url,
            caption=item.caption
        )
        for item in sorted(
            user.gallery_items,
            key=lambda item: item.created_at or datetime.min,
            reverse=True,
        )
    ]
    
    return PublicUser(
        id=user.id,
        profile=public_profile,
        gallery_items=gallery_items
    )


@router.get("/{user_id}/services", response_model=List[dict])
async def get_user_services(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get public services for a user.
    Endpoint: GET /users/{user_id}/services
    """
    from app.models.service import UserService

    target_user = await db.get(User, user_id)
    if not target_user:
        raise not_found("User")
    
    result = await db.execute(
        select(UserService)
        .where(UserService.user_id == user_id)
        .order_by(UserService.created_at.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    services = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "banner_url": s.banner_url,
            "price_label": s.price_label
        }
        for s in services
    ]


# ===== NETWORKING / FOLLOWING SYSTEM =====

@router.get("/me/network", response_model=List[dict])
async def get_my_network(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users in current user's network.
    Returns users that the current user is following.
    """
    from app.models.social import UserFollow
    
    # Get users I'm following
    following_result = await db.execute(
        select(User)
        .join(UserFollow, User.id == UserFollow.followee_id)
        .where(UserFollow.follower_id == current_user.id)
        .options(selectinload(User.profile))
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    following = following_result.scalars().all()
    
    network = []
    for user in following:
        network.append({
            "id": user.id,
            "display_name": user.profile.display_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
        })
    
    return network


@router.get("/me/followers-count", response_model=dict)
async def get_my_followers_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the count of users following me.
    """
    from app.models.social import UserFollow
    from sqlalchemy import func
    
    result = await db.execute(
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.followee_id == current_user.id)
    )
    count = result.scalar() or 0
    
    return {"followers_count": count}


@router.post("/{user_id}/follow", status_code=201)
async def follow_user(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Follow a user.
    """
    from app.models.social import UserFollow
    
    # Prevent self-following
    if user_id == current_user.id:
        raise bad_request("Cannot follow yourself")
    
    # Check if user exists
    target_user = await db.get(User, user_id)
    if not target_user:
        raise not_found("User")
    
    # Check if already following
    existing = await db.execute(
        select(UserFollow)
        .where(
            UserFollow.follower_id == current_user.id,
            UserFollow.followee_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("Already following this user")
    
    # Create follow
    follow = UserFollow(
        follower_id=current_user.id,
        followee_id=user_id
    )
    db.add(follow)
    await db.commit()
    from app.services.notifications import create_notification

    try:
        follower_name = current_user.profile.display_name if current_user.profile else "Chinverse user"
        await create_notification(
            db,
            user_id=user_id,
            actor_user_id=current_user.id,
            type="follow",
            title="دنبال کننده جدید",
            body=f"{follower_name} شما را دنبال کرد.",
            target_url=f"/users/{current_user.id}",
            metadata={"follower_id": current_user.id},
        )
    except Exception:
        await db.rollback()
    
    return {"message": "Successfully followed user"}


@router.delete("/{user_id}/follow", status_code=200)
async def unfollow_user(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _rate_limit: None = Depends(write_rate_limit),
) -> Any:
    """
    Unfollow a user.
    """
    from app.models.social import UserFollow
    
    # Check if following
    result = await db.execute(
        select(UserFollow)
        .where(
            UserFollow.follower_id == current_user.id,
            UserFollow.followee_id == user_id
        )
    )
    follow = result.scalar_one_or_none()
    
    if not follow:
        raise bad_request("Not following this user")
    
    # Remove follow
    await db.delete(follow)
    await db.commit()
    
    return {"message": "Successfully unfollowed user"}


@router.get("/{user_id}/is-following", response_model=dict)
async def check_if_following(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if current user is following a specific user.
    """
    from app.models.social import UserFollow
    
    result = await db.execute(
        select(UserFollow)
        .where(
            UserFollow.follower_id == current_user.id,
            UserFollow.followee_id == user_id
        )
    )
    is_following = result.scalar_one_or_none() is not None
    
    return {"is_following": is_following}


@router.get("/{user_id}/followers-count", response_model=dict)
async def get_user_followers_count(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get the followers count for a specific user.
    """
    from app.models.social import UserFollow
    from sqlalchemy import func
    
    result = await db.execute(
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.followee_id == user_id)
    )
    count = result.scalar() or 0
    
    return {"followers_count": count}


@router.get("/me/following-count", response_model=dict)
async def get_my_following_count(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the count of users I am following.
    """
    from app.models.social import UserFollow
    from sqlalchemy import func
    
    result = await db.execute(
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.follower_id == current_user.id)
    )
    count = result.scalar() or 0
    
    return {"following_count": count}


@router.get("/me/followers", response_model=List[dict])
async def get_my_followers(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users who follow me.
    """
    from app.models.social import UserFollow
    
    # Get users who follow me
    followers_result = await db.execute(
        select(User)
        .join(UserFollow, User.id == UserFollow.follower_id)
        .where(UserFollow.followee_id == current_user.id)
        .options(selectinload(User.profile))
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    followers = followers_result.scalars().all()
    
    result = []
    for user in followers:
        result.append({
            "id": user.id,
            "display_name": user.profile.display_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
        })
    
    return result


@router.get("/me/following", response_model=List[dict])
async def get_my_following(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users I am following.
    """
    from app.models.social import UserFollow
    
    # Get users I'm following
    following_result = await db.execute(
        select(User)
        .join(UserFollow, User.id == UserFollow.followee_id)
        .where(UserFollow.follower_id == current_user.id)
        .options(selectinload(User.profile))
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    following = following_result.scalars().all()
    
    result = []
    for user in following:
        result.append({
            "id": user.id,
            "display_name": user.profile.display_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
        })
    
    return result


@router.get("/{user_id}/followers", response_model=List[dict])
async def get_user_followers(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users who follow a specific user.
    """
    from app.models.social import UserFollow
    
    followers_result = await db.execute(
        select(User)
        .join(UserFollow, User.id == UserFollow.follower_id)
        .where(UserFollow.followee_id == user_id)
        .options(selectinload(User.profile))
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    followers = followers_result.scalars().all()
    
    result = []
    for user in followers:
        result.append({
            "id": user.id,
            "display_name": user.profile.display_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
        })
    
    return result


@router.get("/{user_id}/following", response_model=List[dict])
async def get_user_following(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get list of users a specific user is following.
    """
    from app.models.social import UserFollow
    
    following_result = await db.execute(
        select(User)
        .join(UserFollow, User.id == UserFollow.followee_id)
        .where(UserFollow.follower_id == user_id)
        .options(selectinload(User.profile))
        .order_by(User.id.desc())
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    following = following_result.scalars().all()
    
    result = []
    for user in following:
        result.append({
            "id": user.id,
            "display_name": user.profile.display_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
            "headline": user.profile.headline if user.profile else None,
        })
    
    return result


@router.get("/{user_id}/following-count", response_model=dict)
async def get_user_following_count(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get the following count for a specific user.
    """
    from app.models.social import UserFollow
    from sqlalchemy import func
    
    result = await db.execute(
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.follower_id == user_id)
    )
    count = result.scalar() or 0
    
    return {"following_count": count}
