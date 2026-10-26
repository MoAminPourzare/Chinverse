import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(90_000);
const stamp = "2026-10-08T08:00:00Z";
const post = { id: "gallery_42", type: "gallery", provider: { id: 9, display_name: "عرفان" }, created_at: stamp, comments_count: 40,
    data: { id: 42, image_url: "/assets/chinverse/image-unavailable.svg", caption: "پست آزمایشی فعالیت‌ها" } };
const cards = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, box_number: 1, next_review_at: stamp, word: { id: i + 1, chinese: "学习", pinyin: "xuéxí", persian_meaning: "آموختن", chinese_meaning: "中文解释" } }));

async function setup(page: Page) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true"));
    let failComments = false;
    const comments = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, user_id: 9, target_type: "post", target_id: 42, content: `دیدگاه شماره ${i + 1} ` + "تجربهٔ یادگیری چینی. ".repeat(4), created_at: stamp, author: { id: 9, display_name: "عرفان" } }));
    const today = { date: "2026-10-08", minutes: 15, watched_seconds: 900, learned_words_count: 4, reviewed_words_count: 2, is_active: true };
    await page.route("**/api/backend/**", async route => {
        const request = route.request(), endpoint = new URL(request.url()).pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (endpoint === "/auth/refresh") body = { access_token: "isolated-home-test-session" };
        else if (endpoint === "/users/me") body = { id: 1, email: "home@example.com", profile: { display_name: "کاربر آزمایشی", bio: "", resume: {} } };
        else if (endpoint === "/daily-activity/summary") body = { today, streak: { current_days: 2, longest_days: 3, last_active_date: today.date }, totals: { ...today, active_days: 2 }, calendar: [], weekly_chart: [], learning: { due_flashcards: 25, mastered_words: 2, total_flashcards: 25 } };
        else if (endpoint === "/feed") body = [post, { ...post, id: "gallery_43", data: { ...post.data, id: 43, caption: "پست دوم" } }];
        else if (endpoint === "/engagements/post/42/comments") {
            if (failComments) return route.fulfill({ status: 503, json: { detail: "temporary failure" } });
            if (request.method() === "POST") {
                const created = { ...comments[0], id: 100, user_id: 1, content: request.postDataJSON().content };
                comments.push(created); body = created;
            } else body = comments;
        } else if (endpoint.startsWith("/engagements/")) body = { liked: false, likes_count: 0, comments_count: comments.length };
        else if (endpoint === "/leitner/cards") body = { cards };
        else if (endpoint === "/leitner/review") body = { cards: [cards[0]] };
        else if (endpoint === "/leitner/dashboard") body = { box_counts: { 1: 25 }, total_cards: 25, total_due: 25, upcoming_count: 0, mastered_count: 0, due_by_box: {}, box_intervals: {}, recent_cards: cards };
        else if (endpoint.endsWith("/unread-count")) body = { count: 0 };
        else if (endpoint === "/users/showcase") body = Array.from({ length: 15 }, (_, i) => ({ id: i + 9, display_name: `مدرس ${i + 1}`, headline: "مدرس زبان چینی", bio: "معرفی مدرس. ".repeat(15), gallery_preview: [], job_titles: [] }));
        else if (endpoint === "/users/me/services/public") body = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: `خدمت ${i + 1}`, description: "معرفی خدمت. ".repeat(20), provider: post.provider }));
        await route.fulfill({ json: body });
    });
    return { set failComments(value: boolean) { failComments = value; } };
}

async function ready(page: Page, url: string) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.waitForFunction(() => document.fonts.status === "loaded");
    await expect.poll(() => page.locator(".app-scroll").evaluate(element => element.style.getPropertyValue("--app-header-height"))).not.toBe("");
}

for (const [label, route, back] of [
    ["تغییر هدف روزانه", "/settings/daily", "بازگشت"],
    ["مرور لغات", "/leitner/review", "بازگشت"],
    ["دیدن ویدیو", "/explore", "بازگشت"],
] as const) {
    test(`${label}: back and browser back restore the learning tab and its position`, async ({ page }) => {
        await setup(page); await ready(page, "/");
        await expect(page.getByRole("textbox", { name: "متن سوال", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "روند یادگیری", exact: true }).click();
        await expect(page).toHaveURL(/\?tab=daily$/);
        const link = page.getByRole("link", { name: label, exact: true });
        await expect(link).toBeVisible();
        // Keep the action below the pinned toolbar so clicking does not auto-scroll it.
        await page.locator(".app-scroll").evaluate(element => element.scrollTo(0, 20));
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 20))).toBeLessThan(2);
        await link.click();
        await expect(page).toHaveURL(new RegExp(route + "\\?returnTo="));
        if (route === "/settings/daily") {
            await page.getByLabel("سایر دقایق", { exact: true }).fill("180");
        }
        await page.getByRole("link", { name: back, exact: true }).click();
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 20))).toBeLessThan(2);
        await link.click(); await expect(page).toHaveURL(new RegExp(route)); await page.goBack({ waitUntil: "domcontentloaded" });
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 20))).toBeLessThan(2);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
    });
}

test("a full collection and lesson journey returns to the original learning tab", async ({ page }) => {
    await setup(page); await ready(page, "/?tab=daily");
    await page.getByRole("link", { name: "دیدن ویدیو", exact: true }).click();
    await page.getByRole("navigation", { name: "دسته‌بندی‌های اصلی کاوش" }).getByRole("link", { name: /هنر و مهارت‌های چینی/ }).click();
    await page.locator('a[href^="/explore/cooking"]').click();
    await page.locator('main a[href^="/cooking/meishi-zuojia-wang-gang?"]').click();
    await page.locator('main a[href^="/cooking/meishi-zuojia-wang-gang/lesson/1?"]').first().click();
    await expect(page).toHaveURL(url => url.pathname.endsWith("/lesson/1"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("第1集");
    const back = page.locator('[data-page-header] a[aria-label^="بازگشت"]').first();
    const parent = await back.getAttribute("href");
    await page.getByRole("link", { name: "قسمت بعدی", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("第2集");
    await expect(back).toHaveAttribute("href", parent!);
    await back.click();
    await expect(page).toHaveURL(url => url.pathname === "/cooking/meishi-zuojia-wang-gang");
    for (const target of ["/explore/cooking", "/explore/groups/arts", "/explore", "/?tab=daily"]) {
        const returnHref = new URL(page.url()).searchParams.get("returnTo");
        const button = page.locator('[data-page-header] a[aria-label^="بازگشت"]').first();
        await expect(button).toHaveAttribute("href", returnHref!);
        await button.click();
        await expect(page).toHaveURL(url => target === "/?tab=daily" ? url.pathname === "/" && url.searchParams.get("tab") === "daily" : url.pathname === target);
    }
    await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("empty and failed review sessions keep a back path to learning progress", async ({ page }) => {
    await setup(page);
    for (const status of [200, 503]) {
        await page.route("**/api/backend/leitner/review**", route => route.fulfill({ status, json: status === 200 ? { cards: [] } : { detail: "unavailable" } }));
        await ready(page, "/?tab=daily");
        await page.getByRole("link", { name: "مرور لغات", exact: true }).click();
        if (status === 200) await expect(page.getByRole("heading", { name: "آفرین! مرور امروزت رو تموم کردی" })).toBeVisible();
        else await expect(page.getByRole("button", { name: "تلاش دوباره", exact: true })).toBeVisible();
        await page.getByRole("link", { name: "بازگشت", exact: true }).click();
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
    }
});

test("Explore starts with four categories and entertainment opens its six subjects", async ({ page }) => {
    await setup(page); await ready(page, "/explore");
    const categories = page.getByRole("navigation", { name: "دسته‌بندی‌های اصلی کاوش" });
    await expect(categories.getByRole("link")).toHaveCount(4);
    await expect(page.locator('main a[href^="/explore/podcasts"]')).toHaveCount(0);
    await categories.getByRole("link", { name: /سرگرمی چینی/ }).click();
    const expected = ["پادکست", "گفتارهای موضوعی", "فیلم", "سریال", "کارتون و انیمیشن", "موسیقی"];
    await expect(page.getByRole("region", { name: "موضوع‌های سرگرمی چینی" }).locator("li a > span:first-child > span:first-child")).toHaveText(expected);
    await expect(page.locator('main a[data-tone="violet"]')).toHaveCount(6);
    await page.getByRole("link", { name: "بازگشت به کاوش", exact: true }).click();
    await expect(categories.getByRole("link")).toHaveCount(4);
});

test("culture contains tea and a working coming-soon page without moving the learning journey", async ({ page }) => {
    await setup(page); await ready(page, "/explore/groups/arts");
    await expect(page.locator('main a[data-tone="green"]')).toHaveCount(4);
    await expect(page.locator('main a[href^="/explore/tea-culture"]')).toHaveCount(0);
    await ready(page, "/explore/groups/culture");
    await expect(page.locator('main a[data-tone="amber"]')).toHaveCount(6);
    await expect(page.locator('main a[href^="/explore/tea-culture"]')).toHaveCount(1);
    await page.getByRole("link", { name: /چین، فراتر از زبان/ }).click();
    await expect(page.getByRole("heading", { name: "چین، فراتر از زبان", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "به‌زودی", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "بازگشت به فرهنگ و اندیشه", exact: true }).click();
    await expect(page).toHaveURL(/\/explore\/groups\/culture$/);
});

test("back controls sit on the right across shared, grid, absolute and detail headers", async ({ page }) => {
    await setup(page);
    for (const url of ["/settings", "/settings/daily", "/settings/points", "/community", "/profile/collections", "/notifications", "/account", "/explore/groups/culture", "/explore/china-beyond-language", "/explore/podcasts", "/explore/series", "/cooking/meishi-zuojia-wang-gang/lesson/1"]) {
        await ready(page, url);
        const back = page.locator("[data-page-header] [data-back-button]");
        await expect(back).toHaveCount(1);
        const backBox = (await back.boundingBox())!;
        const headerBox = (await page.locator("[data-page-header]").first().boundingBox())!;
        expect(backBox.x + backBox.width / 2, url).toBeGreaterThan(headerBox.x + headerBox.width / 2);
        expect(backBox.y, url).toBeGreaterThanOrEqual(headerBox.y - 1);
    }
});

for (const [group, urls] of [
    ["home and profile", ["/", "/?tab=daily", "/profile"]],
    ["explore and collections", ["/explore", "/explore/groups/entertainment", "/explore/cooking", "/cooking/meishi-zuojia-wang-gang"]],
    ["leitner and settings", ["/leitner", "/settings", "/settings/daily", "/account"]],
] as const) {
test(`${group}: page toolbars remain visible while long content scrolls`, async ({ page }, info) => {
    await setup(page);
    for (const url of urls) {
        await ready(page, url);
        const header = page.locator('.route-panel[data-phase="enter"] [data-page-header]').first();
        await expect(header).toBeVisible();
        if (url === "/") await expect(page.getByRole("textbox", { name: "متن سوال", exact: true })).toBeAttached();
        if (url === "/?tab=daily") await expect(page.getByRole("link", { name: "مرور لغات", exact: true })).toBeAttached();
        if (url === "/profile") await expect(page.getByRole("heading", { name: "کاربر آزمایشی", exact: true })).toBeAttached();
        if (url === "/leitner") await expect(page.getByRole("button", { name: "حذف 学习 از لایتنر", exact: true })).toHaveCount(25);
        if (url === "/account") await expect(page.locator("#account-display_name")).toBeAttached();
        const initialTop = (await header.boundingBox())!.y;
        const back = header.locator("[data-back-button]");
        if (await back.count()) {
            const headerBox = (await header.boundingBox())!, backBox = (await back.first().boundingBox())!;
            expect(backBox.x + backBox.width / 2).toBeGreaterThan(headerBox.x + headerBox.width / 2);
        }
        const scrolled = await page.locator(".app-scroll").evaluate(element => { element.scrollTo(0, element.scrollHeight); return element.scrollHeight - element.clientHeight; });
        if (scrolled > 20) {
            await expect.poll(async () => Math.abs((await header.boundingBox())!.y - initialTop)).toBeLessThanOrEqual(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: path.resolve("../.tmp", `page-header-${group.replaceAll(" ", "-")}-${info.project.name}.png`) });
});
}
