from app.db.base_class import Base
from app.models.user import User, UserProfile, UserSocialLink
from app.models.settings import UserPreference, UserLanguageSetting
from app.models.media import MediaAsset
from app.models.dictionary import (
    DictionaryWord,
    WordCollocation,
    WordDefinition,
    WordExample,
)
from app.models.course import Category, Subcategory, Course, CourseSection, Lesson, LessonSubtitle, LessonWordMap, UserSavedCourse
from app.models.social import UserFollow, Post, PostMedia, PostLike, PostComment, ContentLike, ContentComment, ForumQuestion, ForumAnswer, Article, ArticleComment, SupportTicket, Message
from app.models.business import Service, ConsultationRequest, SubscriptionPlan, UserSubscription
from app.models.learning import LeitnerCard, StudySession, UserStreak, CourseReview
from app.models.leitner import UserFlashcard
from app.models.service import UserService
