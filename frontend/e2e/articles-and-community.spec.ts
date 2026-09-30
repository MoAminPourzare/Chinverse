import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const source = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../backend/data/articles/staying-motivated-learning-chinese.json"), "utf8"));
const firstArticle = {
    ...source, id: 71, author_user_id: null, author: null,
    content: source.document.blocks.map((block: { text?: string; spans?: { text: string }[] }) => block.text || block.spans?.map(span => span.text).join("") || "").join("\n\n"),
    created_at: "2026-09-30T09:30:00Z", comments_count: 0, comments: [],
};

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
