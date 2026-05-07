from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, gallery, courses, course_admin, services, feed, community, chat, vocabulary, leitner

api_router = APIRouter()

# ===== AUTHENTICATION =====
api_router.include_router(auth.router, tags=["auth"])

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

# ===== VOCABULARY =====
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["vocabulary"])

# ===== LEITNER =====
api_router.include_router(leitner.router, prefix="/leitner", tags=["leitner"])
