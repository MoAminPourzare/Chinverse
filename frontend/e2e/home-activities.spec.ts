import { expect, test, type Route } from "@playwright/test";

const provider = { id: 9, display_name: "عرفان", headline: "مدرس زبان چینی", avatar_url: "/assets/chinverse/image-unavailable.svg" };
const service = { id: "service_41", type: "service", provider, created_at: "2026-10-03T08:00:00Z", likes_count: 3,
    data: { id: 41, title: "دورهٔ تربیت مدرس زبان چینی", description: "آموزش روش‌های تدریس برای علاقه‌مندان به زبان چینی، همراه با تمرین و مشاورهٔ تخصصی.", banner_url: "/assets/chinverse/image-unavailable.svg", price_label: "برای اطلاع از هزینه تماس بگیرید" } };
const post = { id: "gallery_42", type: "gallery", provider, created_at: "2026-10-02T08:00:00Z", likes_count: 2, comments_count: 0,
    data: { id: 42, image_url: "/assets/chinverse/image-unavailable.svg", caption: "یادگیری زبان چینی با تمرین روزانه آسان‌تر می‌شود." } };
async function json(route: Route, body: unknown) { await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }); }

test("home shows services and posts with filters, details, comments and stable mobile layout", async ({ page }, testInfo) => {
    await page.route("**/api/backend/**", async route => {
        const url = new URL(route.request().url()), path = url.pathname.replace(/^\/api\/backend/, "");
        if (path === "/feed") return json(route, url.searchParams.get("kind") === "service" ? [service] : url.searchParams.get("kind") === "gallery" ? [post] : [service, post]);
        if (path.endsWith("/comments")) return json(route, []);
        if (path.startsWith("/engagements/")) return json(route, { likes_count: 2, comments_count: 0, liked: false });
        if (path === "/auth/refresh") return route.fulfill({ status: 401, contentType: "application/json", body: '{"detail":"Not authenticated"}' });
        return json(route, []);
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: service.data.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "مشاهدهٔ خدمت" })).toHaveAttribute("href", "/services/41");
    await expect(page.getByText(post.data.caption)).toBeVisible();
    await expect(page.getByRole("link", { name: "پروفایل عرفان" }).first()).toHaveAttribute("href", "/users/9");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await testInfo.attach("home-activities", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    await page.getByRole("button", { name: "دیدگاه‌های پست" }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "بستن", exact: true })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "بستن", exact: true }).click();
    await page.getByRole("button", { name: "خدمات", exact: true }).click();
    await expect(page.getByRole("heading", { name: service.data.title })).toBeVisible();
    await expect(page.getByText(post.data.caption)).toHaveCount(0);
    await page.getByRole("button", { name: "پست‌ها", exact: true }).click();
    await expect(page.getByText(post.data.caption)).toBeVisible();
    await expect(page.getByRole("heading", { name: service.data.title })).toHaveCount(0);
});
