from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, gallery, courses, services

api_router = APIRouter()

# ===== AUTHENTICATION =====
# auth.py has /login/access-token and /signup endpoints
api_router.include_router(auth.router, tags=["auth"])

# ===== GALLERY =====
# MUST come before users router to avoid /{user_id} matching "me"
api_router.include_router(gallery.router, prefix="/users/me/gallery", tags=["gallery"])

# ===== SERVICES =====
# MUST come before users router to avoid /{user_id} matching "me"
api_router.include_router(services.router, prefix="/users/me/services", tags=["services"])

# ===== USERS =====
# MUST come after /me/* specific routes to avoid path conflicts
api_router.include_router(users.router, prefix="/users", tags=["users"])

# ===== COURSES =====
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
