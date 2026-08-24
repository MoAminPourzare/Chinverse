from app.db.base_class import Base
from app.models.user import User, UserProfile, UserRole, UserSocialLink
from app.models.security import (
    AuthChallenge,
    AuthSession,
    LegalAcceptance,
    MfaBackupCode,
    RateLimitBucket,
    SecurityAuditEvent,
)
from app.models.moderation import ContentReport, ModerationAction, UserBlock
from app.models.settings import UserPreference, UserLanguageSetting
from app.models.media import MediaAccessAuditEvent, MediaAsset
from app.models.dictionary import (
    DictionaryWord,
    WordCollocation,
    WordDefinition,
    WordExample,
)
from app.models.course import Category, Subcategory, Course, CourseSection, Lesson, LessonSubtitle, LessonWordMap, SubtitleCue, SubtitleTrack, UserSavedCourse
from app.models.social import (
    Article,
    ArticleComment,
    ChatPresenceLease,
    ChatRealtimeEvent,
    ContentComment,
    ContentLike,
    ForumAnswer,
    ForumQuestion,
    Message,
    Post,
    PostComment,
    PostLike,
    PostMedia,
    SupportTicket,
    UserFollow,
)
from app.models.activity import StudySession
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.leitner import UserFlashcard
from app.models.service import UserService
from app.models.operational import (
    SubscriptionOrder,
    UserLessonWatchProgress,
    UserNotification,
    UserReferral,
    UserReferralCode,
)
from app.models.phase8 import BetaFeedback, BetaInvite, PaymentWebhookEvent
