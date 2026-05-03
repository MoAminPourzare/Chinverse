from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
import shutil

from app.api import deps
from app.core.paths import AVATARS_DIR, resolve_backend_file_url, safe_unlink
from app.models.user import User, UserProfile, UserGalleryItem
from app.schemas import user as schemas
from app.schemas.showcase import ShowcaseUser, PublicUser, PublicUserProfile, GalleryItemPublic, EducationSummary

router = APIRouter()

# مجاز فایل‌های تصویری
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def get_user_with_profile(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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
        ForumQuestion, ForumAnswer, Post, PostMedia, PostLike, PostComment,
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
    file_urls = list(gallery_files.scalars().all()) + [
        url for url in service_files.scalars().all() if url
    ]
    if current_user.profile and current_user.profile.avatar_url:
        file_urls.append(current_user.profile.avatar_url)

    owned_question_ids = select(ForumQuestion.id).where(ForumQuestion.author_user_id == user_id)
    owned_post_ids = select(Post.id).where(Post.author_user_id == user_id)
    owned_comment_ids = select(PostComment.id).where(PostComment.user_id == user_id)
    owned_media_ids = select(MediaAsset.id).where(MediaAsset.user_id == user_id)
    owned_business_service_ids = select(BusinessService.id).where(
        BusinessService.provider_user_id == user_id
    )

    await db.execute(delete(ForumAnswer).where(
        or_(ForumAnswer.author_user_id == user_id, ForumAnswer.question_id.in_(owned_question_ids))
    ))
    await db.execute(delete(ForumQuestion).where(ForumQuestion.author_user_id == user_id))

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
) -> Any:
    """
    Update current user profile.
    """
    update_data = profile_in.model_dump(exclude_unset=True)
    if update_data.get("display_name") is None:
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
) -> Any:
    """
    Upload user avatar image.
    """
    # بررسی فرمت فایل
    if not file.filename:
        raise HTTPException(status_code=400, detail="فایل نامعتبر است")
    
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"فرمت فایل باید یکی از این‌ها باشد: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # بررسی حجم فایل
    file.file.seek(0, 2)  # به انتهای فایل برو
    file_size = file.file.tell()  # حجم فایل
    file.file.seek(0)  # برگرد به اول فایل
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="حجم فایل نباید بیشتر از ۵ مگابایت باشد")
    
    # ایجاد نام یونیک برای فایل
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
    # مسیر ذخیره‌سازی
    AVATARS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = AVATARS_DIR / unique_filename
    
    # ذخیره فایل
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در ذخیره فایل: {str(e)}")
    finally:
        file.file.close()
    
    # آدرس URL برای دسترسی به فایل
    avatar_url = f"/uploads/avatars/{unique_filename}"
    
    # به‌روزرسانی پروفایل کاربر
    if not current_user.profile:
        # ایجاد پروفایل جدید
        profile = UserProfile(user_id=current_user.id, avatar_url=avatar_url, display_name="کاربر")
        db.add(profile)
    else:
        # به‌روزرسانی پروفایل موجود
        safe_unlink(resolve_backend_file_url(current_user.profile.avatar_url))
        current_user.profile.avatar_url = avatar_url
        db.add(current_user.profile)
    
    await db.commit()
    return await get_user_with_profile(db, current_user.id)


# ===== PUBLIC ENDPOINTS (No auth required) =====

@router.get("/showcase", response_model=List[ShowcaseUser])
async def get_showcase_users(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
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
        .offset(skip)
        .limit(limit)
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
        
        # Get first 3 gallery images for preview
        gallery_preview = [item.image_url for item in user.gallery_items[:3]]
        
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
        raise HTTPException(status_code=404, detail="User not found")
    
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
        for item in user.gallery_items
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
) -> Any:
    """
    Get public services for a user.
    Endpoint: GET /users/{user_id}/services
    """
    from app.models.service import UserService
    
    result = await db.execute(
        select(UserService).where(UserService.user_id == user_id)
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
) -> Any:
    """
    Follow a user.
    """
    from app.models.social import UserFollow
    
    # Prevent self-following
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot follow yourself"
        )
    
    # Check if user exists
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Check if already following
    existing = await db.execute(
        select(UserFollow)
        .where(
            UserFollow.follower_id == current_user.id,
            UserFollow.followee_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Already following this user"
        )
    
    # Create follow
    follow = UserFollow(
        follower_id=current_user.id,
        followee_id=user_id
    )
    db.add(follow)
    await db.commit()
    
    return {"message": "Successfully followed user"}


@router.delete("/{user_id}/follow", status_code=200)
async def unfollow_user(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
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
        raise HTTPException(
            status_code=400,
            detail="Not following this user"
        )
    
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
