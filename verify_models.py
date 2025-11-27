import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.models import (
        User, UserProfile, UserSocialLink, 
        UserPreference, UserLanguageSetting,
        MediaAsset,
        DictionaryWord, WordDefinition, WordCollocation, WordExample,
        Category, Subcategory, Course, CourseSection, Lesson, LessonSubtitle, LessonWordMap,
        UserFollow, Post, PostMedia, PostLike, PostComment, ForumQuestion, ForumAnswer,
        Service, ConsultationRequest, SubscriptionPlan, UserSubscription,
        LeitnerCard, StudySession, UserStreak, CourseReview
    )
    print("Successfully imported all models.")
    print(f"User table: {User.__tablename__}")
    print(f"Post table: {Post.__tablename__}")
    print(f"Service table: {Service.__tablename__}")
    print(f"LeitnerCard table: {LeitnerCard.__tablename__}")
except Exception as e:
    print(f"Error importing models: {e}")
    sys.exit(1)
