import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const source = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../backend/data/articles/staying-motivated-learning-chinese.json"), "utf8"));
const firstArticle = {
    ...source, id: 71, author_user_id: null, author: null,
    content: source.document.blocks.map((block: { text?: string; spans?: { text: string }[] }) => block.text || block.spans?.map(span => span.text).join("") || "").join("\n\n"),
    created_at: "2026-09-30T09:30:00Z", comments_count: 0, comments: [],
};

test("questions and answers remain after reload, including full question text", async ({ page }) => {
    const questions: Record<string, unknown>[] = [];
    const answers: Record<string, unknown>[] = [];
    await page.route("**/api/backend/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        let body: unknown = [];
        if (pathname.endsWith("/auth/refresh")) body = { access_token: "question-test-session" };
        else if (pathname.endsWith("/users/me")) body = { id: 1 };
        else if (pathname.endsWith("/forum/questions")) {
            if (route.request().method() === "POST") {
                body = { ...route.request().postDataJSON(), id: 51, author_user_id: 1, author: { id: 1, display_name: "زبان‌آموز" }, created_at: firstArticle.created_at, answers_count: 0 };
                questions.push(body as Record<string, unknown>);
            } else body = questions.map(question => ({ ...question, answers_count: answers.length }));
        } else if (pathname.endsWith("/questions/51/answers")) {
            body = { ...route.request().postDataJSON(), id: 61, question_id: 51, author_user_id: 1, parent_id: null, author: { id: 1, display_name: "زبان‌آموز" }, created_at: firstArticle.created_at };
            answers.push(body as Record<string, unknown>);
        } else if (pathname.endsWith("/questions/51")) body = { ...questions[0], answers_count: answers.length, answers };
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/community?section=questions");
    const question = "برای یادگیری تلفظ و تفاوت لحن‌های زبان چینی چه تمرینی پیشنهاد می‌کنید؟ بخش پایانی سوال نباید حذف شود.";
    await page.getByRole("textbox", { name: "متن سوال", exact: true }).fill(question);
    await page.getByRole("button", { name: "ارسال سوال", exact: true }).click();
    await expect(page.getByText("سوالت ثبت شد.", { exact: true })).toBeVisible();
    await expect(page.getByText(question, { exact: true })).toBeVisible();
    await page.getByPlaceholder("پاسخت را بنویس").fill("هر روز یک دیالوگ کوتاه گوش بده و تکرار کن.");
    await page.getByRole("button", { name: "ارسال پاسخ", exact: true }).click();
    await expect(page.getByText("هر روز یک دیالوگ کوتاه گوش بده و تکرار کن.", { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole("heading", { level: 3 }).click();
    await expect(page.getByText(question, { exact: true })).toBeVisible();
    await expect(page.getByText("هر روز یک دیالوگ کوتاه گوش بده و تکرار کن.", { exact: true })).toBeVisible();
    expect(questions).toHaveLength(1);
    expect(answers).toHaveLength(1);
});

test("question errors stay inline with the draft and submission can be retried", async ({ page }) => {
    let failure = 403;
    let writes = 0;
    await page.route("**/api/backend/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        let status = 200;
        let body: unknown = [];
        if (pathname.endsWith("/auth/refresh")) body = { access_token: "question-test-session" };
        else if (pathname.endsWith("/users/me")) body = { id: 1 };
        else if (pathname.endsWith("/forum/questions") && route.request().method() === "POST") {
            writes++;
            status = failure || 200;
            body = failure ? { detail: failure === 422 ? [{ loc: ["body", "content"], msg: "Too short" }] : "Account verification is required" } : { ...route.request().postDataJSON(), id: 51, author_user_id: 1, author: null, created_at: firstArticle.created_at, answers_count: 0 };
        }
        await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/community?section=questions");
    const draft = page.getByRole("textbox", { name: "متن سوال", exact: true });
    await draft.fill("چطور تمرین کنم؟");
    for (const [status, message] of [[403, "تأیید حساب"], [422, "معتبر نیست"], [503, "ثبت سوال انجام نشد"]] as const) {
        failure = status;
        await page.getByRole("button", { name: "ارسال سوال", exact: true }).click();
        await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
        await expect(draft).toHaveValue("چطور تمرین کنم؟");
    }
    failure = 0;
    // The API accepts questions from three characters; short drafts used to
    // be blocked by a conflicting eight-character frontend rule.
    await draft.fill("چی؟");
    await page.getByRole("button", { name: "ارسال سوال", exact: true }).click();
    await expect(page.getByText("سوالت ثبت شد.", { exact: true })).toBeVisible();
    expect(writes).toBe(4);
});

test("an expired access token is renewed before posting a question once", async ({ page }) => {
    let expired = false;
    let refreshes = 0;
    let writes = 0;
    await page.route("**/api/backend/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        let status = 200;
        let body: unknown = [];
        if (pathname.endsWith("/auth/refresh")) { refreshes++; expired = false; body = { access_token: `question-session-${refreshes}` }; }
        else if (pathname.endsWith("/users/me")) { status = expired ? 401 : 200; body = expired ? { detail: "Expired access token" } : { id: 1 }; }
        else if (pathname.endsWith("/forum/questions") && route.request().method() === "POST") {
            writes++;
            status = expired ? 401 : 200;
            body = { ...route.request().postDataJSON(), id: 51, author_user_id: 1, author: null, created_at: firstArticle.created_at, answers_count: 0 };
        }
        await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/community?section=questions");
    await expect.poll(() => refreshes).toBe(1);
    await page.getByRole("textbox", { name: "متن سوال", exact: true }).fill("بعد از مدت طولانی هم باید بتوانم سوال بپرسم.");
    expired = true;
    await page.getByRole("button", { name: "ارسال سوال", exact: true }).click();
    await expect(page.getByText("سوالت ثبت شد.", { exact: true })).toBeVisible();
    expect(refreshes).toBe(2);
    expect(writes).toBe(1);
});

test("article library opens the complete imported article and retains its selected section on return", async ({ page }) => {
    await page.route("**/api/backend/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        const body = pathname.endsWith("/forum/articles") ? [firstArticle] : pathname.includes("/forum/articles/by-slug/") ? firstArticle : [];
        await route.fulfill({ status: pathname.endsWith("/auth/refresh") ? 401 : 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto("/community?section=articles");
    await expect(page.getByRole("link", { name: "پیام‌های من گفتگوهای خصوصی و پشتیبانی" })).toHaveAttribute("href", "/chat");
    await expect(page.getByRole("link", { name: "مقالات", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: /خواندن مقاله/ }).click();
    await expect(page).toHaveURL(new RegExp(`/articles/${source.slug}$`));
    await expect(page.getByRole("heading", { name: source.title, level: 1 })).toBeVisible();
    await expect(page.locator("article h2, article h3")).toHaveCount(8);
    await expect(page.locator("article blockquote")).toHaveCount(2);
    await expect(page.getByRole("img", { name: `تصویر مقالهٔ ${source.title}` })).toBeVisible();
    await page.getByText("در این مقاله می‌خوانی", { exact: true }).click();
    const finalHeading = source.document.blocks.filter((block: { type: string }) => block.type === "heading").at(-1);
    await page.getByRole("navigation", { name: "فهرست مقاله" }).getByRole("link", { name: finalHeading.text }).click();
    await expect(page.getByRole("heading", { name: finalHeading.text })).toBeInViewport();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "بازگشت", exact: true }).click();
    await expect(page).toHaveURL(/\/community\?section=articles$/);
    await expect(page.getByRole("link", { name: "مقالات", exact: true })).toHaveAttribute("aria-current", "page");
});

test("article load errors can be retried and signed-in comments survive reloading", async ({ page }) => {
    let offline = true;
    const comments: unknown[] = [];
    await page.route("**/api/backend/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        let body: unknown = [];
        let status = 200;
        if (pathname.endsWith("/auth/refresh")) body = { access_token: "test-article-token" };
        else if (pathname.endsWith("/users/me")) body = { id: 1 };
        else if (pathname.endsWith("/comments") && route.request().method() === "POST") {
            body = { id: 1, article_id: 71, author_user_id: 1, parent_id: null, content: route.request().postDataJSON().content, created_at: firstArticle.created_at, author: { id: 1, display_name: "زبان‌آموز", avatar_url: null } };
            comments.push(body);
        } else if (pathname.includes("/forum/articles/")) {
            if (offline) { status = 503; body = { detail: "temporary outage" }; }
            else body = { ...firstArticle, comments_count: comments.length, comments };
        }
        await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto(`/articles/${source.slug}`);
    await expect(page.getByText("مقاله باز نشد.", { exact: false })).toBeVisible();
    offline = false;
    await page.getByRole("button", { name: "تلاش دوباره" }).click();
    await page.getByLabel("دیدگاه شما").fill("این مقاله برای شروع دوباره مفید بود.");
    await page.getByRole("button", { name: "ثبت دیدگاه", exact: true }).click();
    await expect(page.getByText("این مقاله برای شروع دوباره مفید بود.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("این مقاله برای شروع دوباره مفید بود.", { exact: true })).toBeVisible();
    expect(comments).toHaveLength(1);
});
