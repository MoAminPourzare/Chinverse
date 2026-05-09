"""add database health indexes

Revision ID: b0a8f1c2d3e4
Revises: 1f3c7d8a4b2e
Create Date: 2026-05-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "b0a8f1c2d3e4"
down_revision: Union[str, None] = "1f3c7d8a4b2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INDEXES: tuple[tuple[str, str, list[str]], ...] = (
    ("ix_subcategories_category_id", "subcategories", ["category_id"]),
    ("ix_courses_subcategory_id", "courses", ["subcategory_id"]),
    ("ix_course_sections_course_id", "course_sections", ["course_id"]),
    ("ix_course_sections_course_order", "course_sections", ["course_id", "order_index"]),
    ("ix_lessons_course_id", "lessons", ["course_id"]),
    ("ix_lessons_section_id", "lessons", ["section_id"]),
    ("ix_lessons_section_order", "lessons", ["section_id", "id"]),
    ("ix_contents_lesson_id", "contents", ["lesson_id"]),
    ("ix_lesson_subtitles_lesson_id", "lesson_subtitles", ["lesson_id"]),
    ("ix_lesson_word_maps_lesson_id", "lesson_word_maps", ["lesson_id"]),
    ("ix_lesson_word_maps_word_id", "lesson_word_maps", ["word_id"]),
    ("ix_leitner_cards_user_id", "leitner_cards", ["user_id"]),
    ("ix_leitner_cards_word_id", "leitner_cards", ["word_id"]),
    ("ix_leitner_cards_user_next_review", "leitner_cards", ["user_id", "next_review_at"]),
    ("ix_study_sessions_user_id", "study_sessions", ["user_id"]),
    ("ix_study_sessions_user_date", "study_sessions", ["user_id", "date"]),
    ("ix_course_reviews_course_id", "course_reviews", ["course_id"]),
    ("ix_course_reviews_user_id", "course_reviews", ["user_id"]),
    ("ix_user_flashcards_user_next_review", "user_flashcards", ["user_id", "next_review_at"]),
    ("ix_user_flashcards_user_box", "user_flashcards", ["user_id", "box_number"]),
    ("ix_word_definitions_word_id", "word_definitions", ["word_id"]),
    ("ix_word_collocations_word_id", "word_collocations", ["word_id"]),
    ("ix_word_examples_word_id", "word_examples", ["word_id"]),
    ("ix_word_examples_media_id", "word_examples", ["media_id"]),
    ("ix_user_follows_follower_id", "user_follows", ["follower_id"]),
    ("ix_user_follows_followee_id", "user_follows", ["followee_id"]),
    ("ix_posts_author_user_id", "posts", ["author_user_id"]),
    ("ix_post_media_post_id", "post_media", ["post_id"]),
    ("ix_post_media_media_id", "post_media", ["media_id"]),
    ("ix_post_likes_user_id", "post_likes", ["user_id"]),
    ("ix_post_likes_post_id", "post_likes", ["post_id"]),
    ("ix_post_comments_user_id", "post_comments", ["user_id"]),
    ("ix_post_comments_post_id", "post_comments", ["post_id"]),
    ("ix_post_comments_parent_id", "post_comments", ["parent_id"]),
    ("ix_forum_questions_author_user_id", "forum_questions", ["author_user_id"]),
    ("ix_forum_answers_question_id", "forum_answers", ["question_id"]),
    ("ix_forum_answers_author_user_id", "forum_answers", ["author_user_id"]),
    ("ix_support_tickets_user_id", "support_tickets", ["user_id"]),
    ("ix_services_provider_user_id", "services", ["provider_user_id"]),
    ("ix_consultation_requests_service_id", "consultation_requests", ["service_id"]),
    ("ix_consultation_requests_requester_user_id", "consultation_requests", ["requester_user_id"]),
    ("ix_user_subscriptions_user_id", "user_subscriptions", ["user_id"]),
    ("ix_user_subscriptions_plan_id", "user_subscriptions", ["plan_id"]),
    ("ix_media_assets_user_id", "media_assets", ["user_id"]),
    ("ix_user_services_user_id", "user_services", ["user_id"]),
    ("ix_user_social_links_user_id", "user_social_links", ["user_id"]),
    ("ix_user_gallery_items_user_id", "user_gallery_items", ["user_id"]),
)


def upgrade() -> None:
    for index_name, table_name, columns in INDEXES:
        op.create_index(index_name, table_name, columns, unique=False)


def downgrade() -> None:
    for index_name, table_name, _columns in reversed(INDEXES):
        op.drop_index(index_name, table_name=table_name)
