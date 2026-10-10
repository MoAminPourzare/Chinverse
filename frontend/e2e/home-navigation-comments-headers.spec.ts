import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
    await page.evaluate(() => document.fonts.ready);
}

for (const [label, route, back] of [
    ["تغییر هدف روزانه", "/settings/daily", "بازگشت"],
    ["مرور لغات", "/leitner/review", "بازگشت"],
    ["دیدن ویدیو", "/explore", "بازگشت"],
] as const) {
    test(`${label}: back and browser back restore the learning tab and its position`, async ({ page }) => {
        await setup(page); await ready(page, "/");
        await expect(page.getByText(post.data.caption, { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "روند یادگیری", exact: true }).click();
        await expect(page).toHaveURL(/\?tab=daily$/);
        const link = page.getByRole("link", { name: label, exact: true });
        await expect(link).toBeVisible();
        await page.locator(".app-scroll").evaluate(element => element.scrollTo(0, 70));
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 70))).toBeLessThan(2);
        await link.click();
        await expect(page).toHaveURL(new RegExp(route + "\\?returnTo="));
        if (route === "/settings/daily") {
            await page.getByLabel("سایر دقایق", { exact: true }).fill("180");
        }
        await page.getByRole("link", { name: back, exact: true }).click();
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 70))).toBeLessThan(2);
        await link.click(); await expect(page).toHaveURL(new RegExp(route)); await page.goBack({ waitUntil: "domcontentloaded" });
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect.poll(() => page.locator(".app-scroll").evaluate(element => Math.abs(element.scrollTop - 70))).toBeLessThan(2);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
    });
}

test("comments scroll independently, keep the feed in place and retain a fixed composer and close button", async ({ page }, info) => {
    await setup(page); await ready(page, "/");
    const commentButton = page.getByRole("button", { name: "دیدگاه‌های پست", exact: true }).first();
    await commentButton.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const article = page.locator("article").first();
    const bounds = (await article.boundingBox())!;
    const feedTop = await page.locator(".app-scroll").evaluate(element => element.scrollTop);
    await commentButton.click();
    const dialog = page.getByRole("dialog", { name: "دیدگاه‌های پست", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("img")).toHaveCount(0);
    const list = dialog.getByRole("region", { name: "فهرست دیدگاه‌ها" });
    await expect(list.getByText(/دیدگاه شماره/)).toHaveCount(40);
    const input = dialog.getByRole("textbox", { name: "دیدگاهت رو بنویس" });
    await expect(input).toHaveAttribute("dir", "rtl");
    await expect(input).toHaveCSS("text-align", "right");
    const inputTop = (await input.boundingBox())!.y, close = dialog.getByRole("button", { name: "بستن دیدگاه‌ها" });
    const closeTop = (await close.boundingBox())!.y;
    await list.evaluate(element => element.scrollTo(0, element.scrollHeight));
    await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(500);
    expect((await input.boundingBox())!.y).toBe(inputTop);
    expect((await close.boundingBox())!.y).toBe(closeTop);
    expect(await page.locator(".app-scroll").evaluate(element => element.scrollTop)).toBe(feedTop);
    expect((await article.boundingBox())!.height).toBe(bounds.height);
    await input.fill("دیدگاه تازهٔ آزمایشی"); await dialog.getByRole("button", { name: "ارسال دیدگاه" }).click();
    await expect(list.getByText("دیدگاه تازهٔ آزمایشی", { exact: true })).toBeVisible();
    await test.step("dialog accessibility", async () => {
        const audit = await new AxeBuilder({ page }).include('[role="dialog"]').disableRules(["color-contrast"]).analyze();
        expect(audit.violations).toEqual([]);
    });
    await page.screenshot({ path: path.resolve("../.tmp", `home-comments-${info.project.name}.png`) });
    await close.click();
    await expect(dialog).toHaveCount(0);
    expect(await page.locator(".app-scroll").evaluate(element => element.scrollTop)).toBe(feedTop);
    expect((await article.boundingBox())!.height).toBe(bounds.height);
});

test("a full collection and lesson journey returns to the original learning tab", async ({ page }) => {
    await setup(page); await ready(page, "/?tab=daily");
    await page.getByRole("link", { name: "دیدن ویدیو", exact: true }).click();
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
    for (const target of ["/explore/cooking", "/explore", "/?tab=daily"]) {
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
        if (status === 200) await expect(page.getByRole("heading", { name: "آفرین! مرور امروز تمام شد" })).toBeVisible();
        else await expect(page.getByRole("button", { name: "تلاش دوباره", exact: true })).toBeVisible();
        await page.getByRole("link", { name: "بازگشت", exact: true }).click();
        await expect(page.getByRole("button", { name: "روند یادگیری", exact: true })).toHaveAttribute("aria-pressed", "true");
    }
});

test("comment loading failure can be retried without leaving activities", async ({ page }) => {
    const state = await setup(page); state.failComments = true; await ready(page, "/");
    await page.getByRole("button", { name: "دیدگاه‌های پست" }).first().click();
    const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("alert")).toContainText("دیدگاه‌ها دریافت نشد");
    state.failComments = false; await dialog.getByRole("button", { name: "تلاش دوباره" }).click();
    await expect(dialog.getByText(/دیدگاه شماره/)).toHaveCount(40);
    await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
});

test("entertainment shows all six subjects in the requested order", async ({ page }) => {
    await setup(page); await ready(page, "/explore");
    const expected = ["موسیقی", "پادکست", "گفتارهای موضوعی", "فیلم", "سریال", "کارتون و انیمیشن"];
    await expect(page.locator('section[aria-labelledby="explore-entertainment"] li a > span:first-child > span:first-child')).toHaveText(expected);
    await page.getByRole("link", { name: "مشاهده همهٔ سرگرمی چینی" }).click();
    await expect(page.getByRole("region", { name: "موضوع‌های سرگرمی چینی" }).locator("li a > span:first-child > span:first-child")).toHaveText(expected);
});

for (const [group, urls] of [
    ["home and showcase", ["/", "/?tab=daily", "/showcase"]],
    ["explore and collections", ["/explore", "/explore/groups/entertainment", "/explore/cooking", "/cooking/meishi-zuojia-wang-gang"]],
    ["leitner and settings", ["/leitner", "/settings", "/settings/daily", "/account"]],
] as const) {
test(`${group}: page toolbars remain visible while long content scrolls`, async ({ page }, info) => {
    await setup(page);
    for (const url of urls) {
        await ready(page, url);
        const header = page.locator('.route-panel[data-phase="enter"] [data-page-header]').first();
        await expect(header).toBeVisible();
        if (url === "/") await expect(page.getByText(post.data.caption, { exact: true })).toBeAttached();
        if (url === "/?tab=daily") await expect(page.getByRole("link", { name: "مرور لغات", exact: true })).toBeAttached();
        if (url === "/showcase") await expect(page.getByRole("heading", { name: "مدرس 15", exact: true })).toBeAttached();
        if (url === "/leitner") await expect(page.getByRole("button", { name: "حذف 学习 از لایتنر", exact: true })).toHaveCount(25);
        if (url === "/account") await expect(page.locator("#account-headline")).toBeAttached();
        const scrolled = await page.locator(".app-scroll").evaluate(element => { element.scrollTo(0, element.scrollHeight); return element.scrollHeight - element.clientHeight; });
        if (scrolled > 20) {
            await expect.poll(async () => (await header.boundingBox())!.y).toBeGreaterThanOrEqual(-1);
            expect((await header.boundingBox())!.y).toBeLessThan(36);
        }
        if (url === "/showcase") {
            await page.getByRole("button", { name: "ویترین خدمات", exact: true }).click();
            await expect(page.getByRole("heading", { name: "خدمت 10", exact: true })).toBeAttached();
            await page.locator(".app-scroll").evaluate(element => element.scrollTo(0, element.scrollHeight));
            expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(-1);
            expect((await header.boundingBox())!.y).toBeLessThan(36);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
    await page.screenshot({ path: path.resolve("../.tmp", `page-header-${group.replaceAll(" ", "-")}-${info.project.name}.png`) });
});
}
