"""Phase four acceptance coverage for the main authenticated user journeys.

These tests intentionally exercise the HTTP contracts instead of reaching into
endpoint functions. They cover the success, empty, invalid-input, ownership,
notification and duplicate-request paths that are easy to break when the UI
changes several related modules at once.
"""

import asyncio
import time
from datetime import UTC, datetime
from io import BytesIO
from uuid import uuid4

import pytest
import pyotp
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.db.session import SessionLocal
from app.core.config import settings
from app.main import app
from app.models.course import Category, Course, CourseSection, Lesson, PublicationStatus, Subcategory
from app.models.dictionary import DictionaryWord, WordDefinition
from app.models.user import User, UserRole


pytestmark = pytest.mark.integration

PASSWORD = "Secure phase four passphrase 123!"
LEGAL_ACCEPTANCE = {
    "accept_terms": True,
    "accept_privacy": True,
    "accept_community_guidelines": True,
}


def png_bytes() -> bytes:
    image = Image.new("RGB", (8, 8), (25, 120, 200))
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


async def create_verified_user(
    client: AsyncClient,
    label: str,
    *,
    role: UserRole = UserRole.USER,
) -> tuple[int, dict[str, str]]:
    suffix = str(uuid4().int)[-9:]
    email = f"phase4-{label}-{uuid4().hex[:10]}@example.com"
    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": PASSWORD,
            "display_name": "کاربر فاز چهار",
            **LEGAL_ACCEPTANCE,
        },
    )
    assert signup.status_code == 200, signup.text
    user_id = signup.json()["id"]

    async with SessionLocal() as db:
        user = await db.get(User, user_id)
        now = datetime.now(UTC)
        user.email_verified_at = now
        user.phone_verified_at = now
        user.is_verified = True
        user.role = role
        await db.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": PASSWORD},
    )
    assert login.status_code == 200, login.text
    return user_id, {"Authorization": f"Bearer {login.json()['access_token']}"}


async def create_learning_fixture() -> tuple[int, int, int]:
    suffix = uuid4().hex[:12]
    async with SessionLocal() as db:
        category = Category(name=f"Phase 4 {suffix}", slug=f"phase-4-{suffix}")
        db.add(category)
        await db.flush()

        subcategory = Subcategory(
            category_id=category.id,
            name=f"Phase 4 Chinese {suffix}",
            slug=f"phase-4-chinese-{suffix}",
        )
        db.add(subcategory)
        await db.flush()

        course = Course(
            subcategory_id=subcategory.id,
            title=f"Phase 4 course {suffix}",
            slug=f"phase-4-course-{suffix}",
            description="Course fixture for the phase four acceptance suite.",
            cover_image_url="/uploads/courses/phase4-cover.png",
            level="beginner",
            metadata_json={},
            # Phase 5 public catalog endpoints are intentionally fail-closed
            # for drafts. This synthetic phase-4 journey needs a catalog item
            # to exercise save/unsave, so seed it in the published state.
            status=PublicationStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        db.add(course)
        await db.flush()

        section = CourseSection(
            course_id=course.id,
            title="Phase 4 section",
            order_index=0,
            metadata_json={},
        )
        db.add(section)
        await db.flush()

        lesson = Lesson(
            course_id=course.id,
            section_id=section.id,
            title="Phase 4 lesson",
            video_url="https://video.example/phase4.m3u8",
            duration_minutes=3,
            is_free=True,
            metadata_json={},
        )
        word = DictionaryWord(
            chinese=f"测{suffix[:5]}",
            pinyin="ce4",
            level="HSK1",
            hsk_level=1,
            source="phase4-test",
            status="published",
            persian_meaning="آزمون فاز چهار",
        )
        word.definitions.append(
            WordDefinition(
                lang_code="fa",
                definition_text="واژه آزمایشی",
                part_of_speech="noun",
                sense_order=1,
            )
        )
        db.add_all([lesson, word])
        await db.commit()
        return int(course.id), int(lesson.id), int(word.id)


@pytest.mark.asyncio
async def test_profile_gallery_services_feed_engagement_and_ownership():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as client:
        owner_id, owner = await create_verified_user(client, "owner")
        viewer_id, viewer = await create_verified_user(client, "viewer")

        assert (await client.get("/api/v1/users/me/gallery/", headers=owner)).json() == []
        assert (await client.get("/api/v1/users/me/services", headers=owner)).json() == []

        profile = await client.put(
            "/api/v1/users/me/profile",
            headers=owner,
            json={
                "about_me": "پروفایل آزمایشی فاز چهار",
                "country": "ایران",
                "city": "تهران",
                "websites": ["example.org", "https://example.net"],
                "socials": [{"platform": "instagram", "handle": "chinverse_qa"}],
            },
        )
        assert profile.status_code == 200, profile.text

        gallery = await client.post(
            "/api/v1/users/me/gallery/",
            headers=owner,
            data={"caption": "تصویر تست گالری"},
            files={"file": ("phase4.png", png_bytes(), "image/png")},
        )
        assert gallery.status_code == 201, gallery.text
        gallery_id = gallery.json()["id"]

        service = await client.post(
            "/api/v1/users/me/services",
            headers=owner,
            data={
                "title": "خدمت تستی فاز چهار",
                "description": "توضیحات خدمت برای بررسی مالکیت و ویرایش.",
                "price_label": "تماس بگیرید",
            },
            files={"banner": ("phase4-banner.png", png_bytes(), "image/png")},
        )
        assert service.status_code == 201, service.text
        service_id = service.json()["id"]

        public_profile = await client.get(f"/api/v1/users/{owner_id}/public")
        assert public_profile.status_code == 200, public_profile.text
        assert public_profile.json()["profile"]["websites"] == [
            "https://example.org",
            "https://example.net",
        ]
        assert public_profile.json()["gallery_items"][0]["id"] == gallery_id

        public_services = await client.get(f"/api/v1/users/{owner_id}/services")
        assert public_services.status_code == 200, public_services.text
        assert public_services.json()[0]["id"] == service_id

        followed = await client.post(f"/api/v1/users/{owner_id}/follow", headers=viewer)
        assert followed.status_code == 201, followed.text
        following = await client.get("/api/v1/users/me/following", headers=viewer)
        assert following.status_code == 200
        assert any(item["id"] == owner_id for item in following.json())
        followers = await client.get("/api/v1/users/me/followers", headers=owner)
        assert followers.status_code == 200
        assert any(item["id"] == viewer_id for item in followers.json())
        assert (await client.delete(f"/api/v1/users/{owner_id}/follow", headers=viewer)).status_code == 200

        feed = await client.get("/api/v1/feed?limit=100")
        assert feed.status_code == 200, feed.text
        feed_ids = {(item["type"], item["data"]["id"]) for item in feed.json()}
        assert ("gallery", gallery_id) in feed_ids
        assert ("service", service_id) in feed_ids

        liked = await client.post(
            f"/api/v1/engagements/post/{gallery_id}/like", headers=viewer
        )
        assert liked.status_code == 201 and liked.json()["liked"] is True
        duplicate_like = await client.post(
            f"/api/v1/engagements/post/{gallery_id}/like", headers=viewer
        )
        assert duplicate_like.status_code == 201
        assert duplicate_like.json()["likes_count"] == 1

        comment = await client.post(
            f"/api/v1/engagements/post/{gallery_id}/comments",
            headers=viewer,
            json={"content": "بازخورد فاز چهار"},
        )
        assert comment.status_code == 201, comment.text
        invalid_comment = await client.post(
            f"/api/v1/engagements/post/{gallery_id}/comments",
            headers=viewer,
            json={"content": "   "},
        )
        assert invalid_comment.status_code == 422, invalid_comment.text

        forbidden_update = await client.patch(
            f"/api/v1/users/me/services/{service_id}",
            headers=viewer,
            data={"title": "تلاش غیرمجاز"},
        )
        assert forbidden_update.status_code == 404, forbidden_update.text
        forbidden_delete = await client.delete(
            f"/api/v1/users/me/gallery/{gallery_id}", headers=viewer
        )
        assert forbidden_delete.status_code == 404, forbidden_delete.text

        updated_service = await client.patch(
            f"/api/v1/users/me/services/{service_id}",
            headers=owner,
            data={"title": "خدمت ویرایش‌شده"},
        )
        assert updated_service.status_code == 200, updated_service.text
        assert updated_service.json()["title"] == "خدمت ویرایش‌شده"

        assert (await client.delete(f"/api/v1/users/me/services/{service_id}", headers=owner)).status_code == 204
        assert (await client.delete(f"/api/v1/users/me/gallery/{gallery_id}", headers=owner)).status_code == 204
        assert (await client.get(f"/api/v1/users/{owner_id}/services")).json() == []
        assert (await client.get(f"/api/v1/users/{owner_id}/public")).json()["gallery_items"] == []


@pytest.mark.asyncio
async def test_forum_support_chat_notifications_courses_leitner_daily_and_race():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as client:
        sender_id, sender = await create_verified_user(client, "sender")
        receiver_id, receiver = await create_verified_user(client, "receiver")
        course_id, lesson_id, word_id = await create_learning_fixture()

        question = await client.post(
            "/api/v1/community/forum/questions",
            headers=sender,
            json={"title": "سؤال فاز چهار", "content": "بدنه سؤال فاز چهار"},
        )
        assert question.status_code == 200, question.text
        question_id = question.json()["id"]
        answer = await client.post(
            f"/api/v1/community/forum/questions/{question_id}/answers",
            headers=receiver,
            json={"content": "پاسخ فاز چهار"},
        )
        assert answer.status_code == 200, answer.text
        detail = await client.get(f"/api/v1/community/forum/questions/{question_id}")
        assert detail.status_code == 200 and len(detail.json()["answers"]) == 1

        article = await client.post(
            "/api/v1/community/forum/articles",
            headers=sender,
            json={
                "title": "مقاله تست فاز چهار",
                "summary": "خلاصه مقاله تستی",
                "content": "محتوای مقاله برای بررسی مسیر مقالات.",
            },
        )
        assert article.status_code == 200, article.text
        article_id = article.json()["id"]
        article_comment = await client.post(
            f"/api/v1/community/forum/articles/{article_id}/comments",
            headers=receiver,
            json={"content": "نظر روی مقاله"},
        )
        assert article_comment.status_code == 200, article_comment.text
        article_detail = await client.get(f"/api/v1/community/forum/articles/{article_id}")
        assert article_detail.status_code == 200
        assert len(article_detail.json()["comments"]) == 1

        support = await client.post(
            "/api/v1/community/support",
            headers=sender,
            json={"message": "لطفاً این تیکت تستی را بررسی کنید."},
        )
        assert support.status_code == 200, support.text
        assert support.json()["success"] is True

        sent = await client.post(
            "/api/v1/chat",
            headers=sender,
            json={"receiver_id": receiver_id, "content": "پیام تست فاز چهار"},
        )
        assert sent.status_code == 200, sent.text
        message_id = sent.json()["id"]

        unread = await client.get("/api/v1/notifications/unread-count", headers=receiver)
        assert unread.status_code == 200 and unread.json()["count"] >= 1
        notifications = await client.get("/api/v1/notifications", headers=receiver)
        assert notifications.status_code == 200
        notification_id = next(
            item["id"] for item in notifications.json() if item["type"] == "message"
        )
        latest = await client.get("/api/v1/notifications/latest", headers=receiver)
        assert latest.status_code == 200
        assert notification_id in {item["id"] for item in latest.json()}
        foreign_read = await client.post(
            f"/api/v1/notifications/{notification_id}/read", headers=sender
        )
        assert foreign_read.status_code == 404
        assert (await client.post(f"/api/v1/notifications/{notification_id}/read", headers=receiver)).status_code == 200
        read_all = await client.post("/api/v1/notifications/read-all", headers=receiver)
        assert read_all.status_code == 200
        assert read_all.json()["updated"] >= 0
        assert (await client.get("/api/v1/notifications/unread-count", headers=receiver)).json()["count"] == 0

        history = await client.get(f"/api/v1/chat/{sender_id}/messages", headers=receiver)
        assert history.status_code == 200 and history.json()[0]["id"] == message_id
        assert history.json()[0]["is_read"] is True
        conversations = await client.get("/api/v1/chat/conversations", headers=sender)
        assert conversations.status_code == 200
        assert conversations.json()[0]["user"]["id"] == receiver_id
        self_message = await client.post(
            "/api/v1/chat",
            headers=sender,
            json={"receiver_id": sender_id, "content": "نباید ارسال شود"},
        )
        assert self_message.status_code == 400

        saved = await client.post(f"/api/v1/courses/{course_id}/save", headers=sender)
        assert saved.status_code == 201 and saved.json()["saved"] is True
        assert (await client.get(f"/api/v1/courses/{course_id}/saved", headers=receiver)).json()["saved"] is False
        assert (await client.get("/api/v1/courses/saved", headers=sender)).json()[0]["id"] == course_id
        assert (await client.delete(f"/api/v1/courses/{course_id}/save", headers=sender)).json()["saved"] is False

        vocabulary = await client.get(f"/api/v1/vocabulary/{(await word_value(word_id))}")
        assert vocabulary.status_code == 200 and vocabulary.json()["definitions"]
        added = await client.post("/api/v1/leitner/add", headers=sender, json={"word_id": word_id})
        assert added.status_code == 200, added.text
        card_id = added.json()["id"]
        duplicate = await client.post("/api/v1/leitner/add", headers=sender, json={"word_id": word_id})
        assert duplicate.status_code == 200 and duplicate.json()["id"] == card_id
        other_card = await client.get(f"/api/v1/leitner/check/{word_id}", headers=receiver)
        assert other_card.status_code == 200 and other_card.json()["in_leitner"] is False
        dashboard = await client.get("/api/v1/leitner/dashboard", headers=sender)
        assert dashboard.status_code == 200 and dashboard.json()["total_cards"] == 1
        reviewed = await client.post(
            "/api/v1/leitner/review",
            headers=sender,
            json={"card_id": card_id, "remembered": True},
        )
        assert reviewed.status_code == 200 and reviewed.json()["box_number"] == 2
        not_owner_review = await client.post(
            "/api/v1/leitner/review",
            headers=receiver,
            json={"card_id": card_id, "remembered": True},
        )
        assert not_owner_review.status_code == 404

        progress = await client.post(
            "/api/v1/daily-activity/video-progress",
            headers=sender,
            json={"lesson_id": lesson_id, "seconds_delta": 15, "position_seconds": 15, "duration_seconds": 180},
        )
        assert progress.status_code == 200, progress.text
        summary = await client.get("/api/v1/daily-activity/summary?days=7", headers=sender)
        assert summary.status_code == 200 and summary.json()["totals"]["watched_seconds"] >= 15

        async def add_again() -> object:
            return await client.post("/api/v1/leitner/add", headers=sender, json={"word_id": word_id})

        raced = await asyncio.gather(add_again(), add_again())
        assert all(response.status_code == 200 for response in raced)
        assert {response.json()["id"] for response in raced} == {card_id}


@pytest.mark.asyncio
async def test_account_security_session_password_change_and_reset(monkeypatch):
    monkeypatch.setattr(settings, "AUTH_DEBUG_TOKENS", True)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as client:
        user_id, first_headers = await create_verified_user(client, "security")
        async with SessionLocal() as db:
            user = await db.get(User, user_id)
            email = user.email

        second_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": PASSWORD},
        )
        assert second_login.status_code == 200, second_login.text
        second_headers = {
            "Authorization": f"Bearer {second_login.json()['access_token']}"
        }

        sessions = await client.get("/api/v1/auth/sessions", headers=second_headers)
        assert sessions.status_code == 200, sessions.text
        assert len(sessions.json()) >= 2
        previous_session = next(item for item in sessions.json() if not item["current"])
        revoked = await client.delete(
            f"/api/v1/auth/sessions/{previous_session['id']}",
            headers=second_headers,
        )
        assert revoked.status_code == 204, revoked.text
        assert (await client.get("/api/v1/users/me", headers=first_headers)).status_code == 401

        wrong_password = await client.post(
            "/api/v1/auth/password/change",
            headers=second_headers,
            json={
                "current_password": "wrong current passphrase",
                "new_password": "A different secure phase four passphrase 456!",
            },
        )
        assert wrong_password.status_code == 401, wrong_password.text

        changed_password = "A different secure phase four passphrase 456!"
        changed = await client.post(
            "/api/v1/auth/password/change",
            headers=second_headers,
            json={
                "current_password": PASSWORD,
                "new_password": changed_password,
            },
        )
        assert changed.status_code == 200, changed.text
        assert (await client.get("/api/v1/users/me", headers=second_headers)).status_code == 401
        assert (
            await client.post(
                "/api/v1/login/access-token",
                data={"username": email, "password": PASSWORD},
            )
        ).status_code == 401

        relogin = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": changed_password},
        )
        assert relogin.status_code == 200, relogin.text
        relogin_headers = {
            "Authorization": f"Bearer {relogin.json()['access_token']}"
        }

        reset_request = await client.post(
            "/api/v1/auth/password/reset/request",
            json={"email": email, "turnstile_token": None},
        )
        assert reset_request.status_code == 202, reset_request.text
        reset_token = reset_request.json()["debug_token"]
        assert reset_token

        reset_password = "Reset secure phase four passphrase 789!"
        reset = await client.post(
            "/api/v1/auth/password/reset/confirm",
            json={"token": reset_token, "new_password": reset_password},
        )
        assert reset.status_code == 200, reset.text
        replay = await client.post(
            "/api/v1/auth/password/reset/confirm",
            json={"token": reset_token, "new_password": changed_password},
        )
        assert replay.status_code == 401, replay.text
        assert (await client.get("/api/v1/users/me", headers=relogin_headers)).status_code == 401
        final_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": email, "password": reset_password},
        )
        assert final_login.status_code == 200, final_login.text


@pytest.mark.asyncio
async def test_support_ticket_ownership_admin_mfa_reply_and_notification():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="https://test"
    ) as client:
        owner_id, owner_headers = await create_verified_user(client, "support-owner")
        _, other_headers = await create_verified_user(client, "support-other")
        admin_id, admin_setup_headers = await create_verified_user(
            client, "support-admin", role=UserRole.ADMIN
        )

        created = await client.post(
            "/api/v1/community/support",
            headers=owner_headers,
            json={"message": "Please investigate this complete support workflow request."},
        )
        assert created.status_code == 200, created.text
        ticket_id = created.json()["ticket_id"]

        owner_tickets = await client.get(
            "/api/v1/community/support", headers=owner_headers
        )
        assert owner_tickets.status_code == 200, owner_tickets.text
        assert [item["id"] for item in owner_tickets.json()] == [ticket_id]
        assert (
            await client.get("/api/v1/community/support", headers=other_headers)
        ).json() == []
        assert (
            await client.get("/api/v1/admin/support-tickets", headers=other_headers)
        ).status_code == 403

        async with SessionLocal() as db:
            admin = await db.get(User, admin_id)
            admin_email = admin.email

        setup = await client.post(
            "/api/v1/auth/mfa/setup",
            headers=admin_setup_headers,
            json={"current_password": PASSWORD},
        )
        assert setup.status_code == 200, setup.text
        secret = setup.json()["secret"]
        confirmed = await client.post(
            "/api/v1/auth/mfa/confirm",
            headers=admin_setup_headers,
            json={"code": pyotp.TOTP(secret).now()},
        )
        assert confirmed.status_code == 200, confirmed.text
        admin_login = await client.post(
            "/api/v1/login/access-token",
            data={"username": admin_email, "password": PASSWORD},
            headers={"X-MFA-Code": pyotp.TOTP(secret).at(time.time() + 30)},
        )
        assert admin_login.status_code == 200, admin_login.text
        admin_headers = {
            "Authorization": f"Bearer {admin_login.json()['access_token']}"
        }

        queue = await client.get(
            "/api/v1/admin/support-tickets?status=open", headers=admin_headers
        )
        assert queue.status_code == 200, queue.text
        assert ticket_id in {item["id"] for item in queue.json()}

        close_without_reply = await client.patch(
            f"/api/v1/admin/support-tickets/{ticket_id}",
            headers=admin_headers,
            json={"status": "closed"},
        )
        assert close_without_reply.status_code == 400, close_without_reply.text

        reply = "Your support request was reviewed and resolved."
        resolved = await client.patch(
            f"/api/v1/admin/support-tickets/{ticket_id}",
            headers=admin_headers,
            json={"status": "closed", "reply": reply},
        )
        assert resolved.status_code == 200, resolved.text
        assert resolved.json()["status"] == "closed"
        assert resolved.json()["admin_reply"] == reply
        assert resolved.json()["user_id"] == owner_id

        visible_to_owner = await client.get(
            "/api/v1/community/support", headers=owner_headers
        )
        assert visible_to_owner.json()[0]["admin_reply"] == reply
        notifications = await client.get(
            "/api/v1/notifications", headers=owner_headers
        )
        assert any(
            item["type"] == "system"
            and item["metadata"].get("ticket_id") == ticket_id
            and item["target_url"] == "/support"
            for item in notifications.json()
        )


async def word_value(word_id: int) -> str:
    async with SessionLocal() as db:
        word = await db.get(DictionaryWord, word_id)
        return word.chinese
