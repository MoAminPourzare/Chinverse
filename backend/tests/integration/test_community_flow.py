from uuid import uuid4
from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import SessionLocal
from app.main import app
from app.models.user import User, UserRole
from app.core.config import settings


pytestmark = pytest.mark.integration


async def authenticated_user(client: AsyncClient) -> tuple[int, dict[str, str]]:
    suffix = str(uuid4().int)[-9:]
    email = f"community-{uuid4().hex[:12]}@example.com"
    password = "Secure community passphrase 123!"

    signup = await client.post(
        "/api/v1/signup",
        json={
            "email": email,
            "phone": f"09{suffix}",
            "password": password,
            "display_name": "\u06a9\u0627\u0631\u0628\u0631 \u0622\u0632\u0645\u0627\u06cc\u0634\u06cc",
            "accept_terms": True,
            "accept_privacy": True,
            "accept_community_guidelines": True,
        },
    )
    assert signup.status_code == 200, signup.text

    async with SessionLocal() as db:
        user = await db.get(User, signup.json()["id"])
        user.email_verified_at = datetime.now(UTC)
        user.phone_verified_at = datetime.now(UTC)
        user.is_verified = True
        await db.commit()

    login = await client.post(
        "/api/v1/login/access-token",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200, login.text
    return signup.json()["id"], {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }


async def authenticated_headers(client: AsyncClient) -> dict[str, str]:
    _, headers = await authenticated_user(client)
    return headers


@pytest.mark.asyncio
async def test_optional_beta_questions_and_answers_survive_reloading(monkeypatch):
    from app.models.user import UserStatus

    monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
    monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        user_id, headers = await authenticated_user(client)
        async with SessionLocal.begin() as db:
            user = await db.get(User, user_id)
            user.is_verified = False
        content = "چطور تلفظ این کلمه چینی را تمرین کنم؟ " * 4
        created = await client.post("/api/v1/community/forum/questions", headers=headers,
            json={"title": content[:55].strip(), "content": content.strip()})
        assert created.status_code == 200, created.text
        identifier = created.json()["id"]
        answer = await client.post(f"/api/v1/community/forum/questions/{identifier}/answers",
            headers=headers, json={"content": "تلفظ را چند بار گوش بده و بعد تکرار کن."})
        assert answer.status_code == 200, answer.text

        for tier, required, visible in (
            ("staging", False, True), ("staging", True, False),
            ("production", False, False), ("local", False, False),
        ):
            monkeypatch.setattr(settings, "DEPLOYMENT_TIER", tier)
            monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", required)
            listing = await client.get("/api/v1/community/forum/questions?limit=100")
            assert listing.status_code == 200, listing.text
            assert (identifier in {question["id"] for question in listing.json()}) is visible
            detail = await client.get(f"/api/v1/community/forum/questions/{identifier}")
            assert detail.status_code == (200 if visible else 404), detail.text
            if visible:
                saved = next(question for question in listing.json() if question["id"] == identifier)
                assert saved["content"] == content.strip()
                assert saved["answers_count"] == detail.json()["answers_count"] == 1
                assert detail.json()["answers"][0]["id"] == answer.json()["id"]

        monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
        monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
        for status in (UserStatus.SUSPENDED, UserStatus.DELETED):
            async with SessionLocal.begin() as db:
                user = await db.get(User, user_id)
                user.status = status
            listing = await client.get("/api/v1/community/forum/questions?limit=100")
            assert identifier not in {question["id"] for question in listing.json()}
            assert (await client.get(f"/api/v1/community/forum/questions/{identifier}")).status_code == 404


@pytest.mark.asyncio
async def test_notification_failure_does_not_fail_an_already_saved_question(monkeypatch):
    from sqlalchemy import text
    from app.api.v1.endpoints import community

    async def broken_notifications(db, **kwargs):
        # A failed PostgreSQL transaction expires ORM objects on rollback.
        await db.execute(text("SELECT 1 / 0"))

    monkeypatch.setattr(community, "notify_followers", broken_notifications)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        _, headers = await authenticated_user(client)
        created = await client.post("/api/v1/community/forum/questions", headers=headers,
            json={"title": "سوال کوتاه", "content": "این سوال حتی بدون اعلان هم باید ذخیره شود."})
        assert created.status_code == 200, created.text
        identifier = created.json()["id"]
        detail = await client.get(f"/api/v1/community/forum/questions/{identifier}")
        assert detail.status_code == 200, detail.text
        assert detail.json()["content"] == created.json()["content"]


@pytest.mark.asyncio
async def test_question_can_be_edited_and_deleted_with_nested_answers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        headers = await authenticated_headers(client)

        created = await client.post(
            "/api/v1/community/forum/questions",
            headers=headers,
            json={"title": "First question", "content": "Initial question body"},
        )
        assert created.status_code == 200, created.text
        question_id = created.json()["id"]

        updated = await client.patch(
            f"/api/v1/community/forum/questions/{question_id}",
            headers=headers,
            json={"title": "Updated question", "content": "Updated question body"},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["title"] == "Updated question"
        assert updated.json()["content"] == "Updated question body"

        parent = await client.post(
            f"/api/v1/community/forum/questions/{question_id}/answers",
            headers=headers,
            json={"content": "Parent answer"},
        )
        assert parent.status_code == 200, parent.text

        child = await client.post(
            f"/api/v1/community/forum/questions/{question_id}/answers",
            headers=headers,
            json={"content": "Nested answer", "parent_id": parent.json()["id"]},
        )
        assert child.status_code == 200, child.text

        deleted = await client.delete(
            f"/api/v1/community/forum/questions/{question_id}",
            headers=headers,
        )
        assert deleted.status_code == 204, deleted.text

        missing = await client.get(f"/api/v1/community/forum/questions/{question_id}")
        assert missing.status_code == 404, missing.text


@pytest.mark.asyncio
async def test_message_reports_are_private_and_deduplicated():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="https://test",
    ) as client:
        first_user_id, first_headers = await authenticated_user(client)
        second_user_id, second_headers = await authenticated_user(client)

        message = await client.post(
            "/api/v1/chat",
            headers=second_headers,
            json={"receiver_id": first_user_id, "content": "reportable message"},
        )
        assert message.status_code == 200, message.text

        _, third_headers = await authenticated_user(client)

        report_payload = {
            "target_type": "message",
            "target_id": message.json()["id"],
            "reason": "harassment",
            "details": "integration security test",
        }
        private_report = await client.post(
            "/api/v1/trust/reports",
            headers=third_headers,
            json=report_payload,
        )
        assert private_report.status_code == 404, private_report.text

        report = await client.post(
            "/api/v1/trust/reports",
            headers=first_headers,
            json=report_payload,
        )
        assert report.status_code == 201, report.text

        duplicate = await client.post(
            "/api/v1/trust/reports",
            headers=first_headers,
            json=report_payload,
        )
        assert duplicate.status_code == 409, duplicate.text

        moderation_denied = await client.get(
            "/api/v1/trust/moderation/reports",
            headers=first_headers,
        )
        assert moderation_denied.status_code == 403, moderation_denied.text

        async with SessionLocal() as session:
            moderator = await session.get(User, first_user_id)
            admin = await session.get(User, second_user_id)
            moderator.role = UserRole.MODERATOR
            admin.role = UserRole.ADMIN
            await session.commit()

        admin_report = await client.post(
            "/api/v1/trust/reports",
            headers=third_headers,
            json={
                "target_type": "user",
                "target_id": second_user_id,
                "reason": "other",
                "details": "role hierarchy integration test",
            },
        )
        assert admin_report.status_code == 201, admin_report.text

        moderation_allowed = await client.get(
            "/api/v1/trust/moderation/reports",
            headers=first_headers,
        )
        assert moderation_allowed.status_code == 200, moderation_allowed.text

        forbidden_suspension = await client.post(
            f"/api/v1/trust/moderation/reports/{admin_report.json()['id']}/resolve",
            headers=first_headers,
            json={"action": "suspend_user", "notes": "must be rejected"},
        )
        assert forbidden_suspension.status_code == 403, forbidden_suspension.text


@pytest.mark.asyncio
async def test_editorial_article_publication_is_idempotent_and_preserves_comments():
    from sqlalchemy import select
    from app.models.social import Article
    from scripts.sync_articles import publish_articles, read_catalog

    item = read_catalog()[0].model_copy(update={"slug": f"editorial-test-{uuid4().hex}"})
    async with SessionLocal.begin() as db:
        await publish_articles(db, [item])
    async with SessionLocal() as db:
        saved = await db.scalar(select(Article).where(Article.slug == item.slug))
        identifier, created_at, updated_at = saved.id, saved.created_at, saved.updated_at
    async with SessionLocal.begin() as db:
        await publish_articles(db, [item])
    async with SessionLocal() as db:
        saved = await db.get(Article, identifier)
        assert saved.updated_at == updated_at
        assert saved.created_at == created_at

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        public = await client.get(f"/api/v1/community/forum/articles/by-slug/{item.slug}")
        assert public.status_code == 200, public.text
        assert public.json()["document"] == item.document.model_dump()
        assert public.json()["author"] is None
        assert public.json()["id"] == identifier
        listing = await client.get("/api/v1/community/forum/articles", params={"limit": 100})
        assert identifier in [article["id"] for article in listing.json()]
        _, headers = await authenticated_user(client)
        comment = await client.post(f"/api/v1/community/forum/articles/{identifier}/comments", headers=headers, json={"content": "A persistent comment on the editorial article"})
        assert comment.status_code == 200, comment.text
        revised = item.model_copy(update={"title": "Revised editorial article title"})
        async with SessionLocal.begin() as db:
            await publish_articles(db, [revised])
        detail = await client.get(f"/api/v1/community/forum/articles/{identifier}")
        assert detail.status_code == 200, detail.text
        assert detail.json()["title"] == revised.title
        assert detail.json()["comments_count"] == 1
        assert detail.json()["comments"][0]["id"] == comment.json()["id"]


@pytest.mark.asyncio
async def test_optional_beta_article_comments_persist_and_follow_account_visibility(monkeypatch):
    from sqlalchemy import select
    from app.models.social import Article, ArticleComment
    from app.models.user import UserStatus
    from scripts.sync_articles import publish_articles, read_catalog

    monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
    monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
    item = read_catalog()[0].model_copy(update={"slug": f"comment-test-{uuid4().hex}"})
    async with SessionLocal.begin() as db:
        await publish_articles(db, [item])
        article_id = await db.scalar(select(Article.id).where(Article.slug == item.slug))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        user_id, headers = await authenticated_user(client)
        async with SessionLocal.begin() as db:
            user = await db.get(User, user_id)
            user.is_verified = False
        content = "این مقاله برای یادگیری زبان چینی مفید بود."
        created = await client.post(f"/api/v1/community/forum/articles/{article_id}/comments",
            headers=headers, json={"content": f"  {content}  "})
        assert created.status_code == 200, created.text
        comment_id = created.json()["id"]
        assert created.json()["content"] == content
        assert created.json()["author"]["id"] == user_id

        for tier, required, visible in (
            ("staging", False, True), ("staging", True, False),
            ("production", False, False), ("local", False, False),
        ):
            monkeypatch.setattr(settings, "DEPLOYMENT_TIER", tier)
            monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", required)
            listing = await client.get("/api/v1/community/forum/articles?limit=100")
            assert listing.status_code == 200, listing.text
            saved = next(article for article in listing.json() if article["id"] == article_id)
            assert saved["comments_count"] == int(visible)
            for identifier in (str(article_id), f"by-slug/{item.slug}"):
                detail = await client.get(f"/api/v1/community/forum/articles/{identifier}")
                assert detail.status_code == 200, detail.text
                assert detail.json()["comments_count"] == int(visible)
                assert [comment["id"] for comment in detail.json()["comments"]] == ([comment_id] if visible else [])
                if visible:
                    assert detail.json()["comments"][0]["content"] == content
            async with SessionLocal() as db:
                saved_comment = await db.get(ArticleComment, comment_id)
                assert saved_comment.body == content

        monkeypatch.setattr(settings, "DEPLOYMENT_TIER", "staging")
        monkeypatch.setattr(settings, "REQUIRE_VERIFIED_LOGIN", False)
        for user_status in (UserStatus.SUSPENDED, UserStatus.DELETED):
            async with SessionLocal.begin() as db:
                user = await db.get(User, user_id)
                user.status = user_status
            detail = await client.get(f"/api/v1/community/forum/articles/{article_id}")
            assert detail.json()["comments_count"] == 0
            assert detail.json()["comments"] == []
            listing = await client.get("/api/v1/community/forum/articles?limit=100")
            assert next(article for article in listing.json() if article["id"] == article_id)["comments_count"] == 0
            rejected = await client.post(f"/api/v1/community/forum/articles/{article_id}/comments",
                headers=headers, json={"content": "Inactive accounts cannot post"})
            assert rejected.status_code == 403, rejected.text


@pytest.mark.asyncio
async def test_structured_articles_do_not_bypass_user_visibility_or_overwrite_authored_articles():
    from app.models.social import Article
    from scripts.sync_articles import publish_articles, read_catalog

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        user_id, headers = await authenticated_user(client)
        legacy = await client.post("/api/v1/community/forum/articles", headers=headers, json={"title": "An authored article", "content": "Original user-written content"})
        assert legacy.status_code == 200, legacy.text
        identifier = legacy.json()["id"]
        assert legacy.json()["document"] is None
        assert (await client.get(f"/api/v1/community/forum/articles/{identifier}")).status_code == 200
        slug = f"owned-test-{uuid4().hex}"
        async with SessionLocal.begin() as db:
            article = await db.get(Article, identifier)
            article.slug = slug
            article.document_json = read_catalog()[0].document.model_dump()
            user = await db.get(User, user_id)
            user.is_verified = False
        for path in [str(identifier), f"by-slug/{slug}"]:
            assert (await client.get(f"/api/v1/community/forum/articles/{path}")).status_code == 404
        listing = await client.get("/api/v1/community/forum/articles", params={"limit": 100})
        assert identifier not in [article["id"] for article in listing.json()]
        hidden_comment = await client.post(f"/api/v1/community/forum/articles/{identifier}/comments", headers=headers, json={"content": "must remain hidden"})
        assert hidden_comment.status_code in {403, 404}
        with pytest.raises(ValueError, match="owned by a user"):
            async with SessionLocal.begin() as db:
                await publish_articles(db, [read_catalog()[0].model_copy(update={"slug": slug})])
        async with SessionLocal() as db:
            saved = await db.get(Article, identifier)
            assert saved.content == "Original user-written content"
            assert saved.author_user_id == user_id
