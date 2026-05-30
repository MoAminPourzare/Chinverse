from fastapi import APIRouter
from app.api.v1.endpoints import admin, auth, users, gallery, courses, course_admin, services, feed, community, chat, vocabulary, leitner, notifications, daily_activity, referrals, subscriptions, engagements

api_router = APIRouter()

# ===== AUTHENTICATION =====
api_router.include_router(auth.router, tags=["auth"])

# ===== ADMIN =====
api_router.include_router(admin.router, tags=["admin"])

# ===== FEED =====
api_router.include_router(feed.router, prefix="/feed", tags=["feed"])

# ===== GALLERY =====
api_router.include_router(gallery.router, prefix="/users/me/gallery", tags=["gallery"])

# ===== SERVICES =====
api_router.include_router(services.router, prefix="/users/me/services", tags=["services"])

# ===== USERS =====
api_router.include_router(users.router, prefix="/users", tags=["users"])

# ===== COURSES =====
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(course_admin.router, prefix="/courses", tags=["course-admin"])

# ===== COMMUNITY =====
api_router.include_router(community.router, prefix="/community", tags=["community"])

# ===== CHAT =====
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

# ===== NOTIFICATIONS =====
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# ===== ENGAGEMENTS =====
api_router.include_router(engagements.router, prefix="/engagements", tags=["engagements"])

# ===== DAILY ACTIVITY =====
api_router.include_router(daily_activity.router, prefix="/daily-activity", tags=["daily-activity"])

# ===== REFERRALS =====
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])

# ===== SUBSCRIPTIONS =====
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])

# ===== VOCABULARY =====
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["vocabulary"])

# ===== LEITNER =====
api_router.include_router(leitner.router, prefix="/leitner", tags=["leitner"])
