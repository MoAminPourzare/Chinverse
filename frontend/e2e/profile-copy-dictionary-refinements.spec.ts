import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(90_000);
const serviceHint = "اینجا دقیق‌تر بگو چه خدماتی ارائه می‌دی، این خدمات برای چه کسایی مناسبه، چه مزیت‌هایی داره و چرا مشتری‌ها باید خدمات تو رو انتخاب کنن.";
const word = {
    id: 1, chinese: "学习", pinyin: "xuéxí", chinese_meaning: "学习知识", persian_meaning: "یادگیری",
    definitions: [
        { id: 1, sense_order: 1, lang_code: "zh", part_of_speech: "فعل", definition_text: "学习知识" },
        { id: 2, sense_order: 1, lang_code: "fa", part_of_speech: "فعل", definition_text: "یاد گرفتن" },
        { id: 3, sense_order: 2, lang_code: "fa", part_of_speech: "اسم", definition_text: "مطالعه" },
    ],
    collocations: [
        { id: 11, sense_order: 2, phrase_zh: "学习汉语", phrase_pinyin: "xuéxí hànyǔ", translation_target: "یادگیری زبان چینی" },
        { id: 3, sense_order: 1, phrase_zh: "学习知识", translation_target: "یادگیری دانش" },
        { id: 10, sense_order: 2, phrase_zh: "学习方法", translation_target: "روش یادگیری" },
    ], examples: [],
};

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true"));
    await page.route("**/api/backend/**", async (route) => {
        const endpoint = new URL(route.request().url()).pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (endpoint === "/auth/refresh") body = { access_token: "isolated-copy-layout-session" };
        else if (endpoint === "/users/me") body = { id: 7, email: "layout@example.com", profile: { display_name: "کاربر آزمایشی", bio: "", resume: {}, websites: [], socials: [] } };
        else if (endpoint === "/admin/me") body = { is_admin: false };
        else if (endpoint === "/leitner/review") body = { cards: [{ id: 11, box_number: 1, next_review_at: "2020-01-01T00:00:00Z", word }] };
        else if (endpoint.endsWith("/unread-count")) body = { count: 0 };
        await route.fulfill({ json: body });
    });
});

async function ready(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

test("profile guidance is centered and description fields match the approved biography font", async ({ page }) => {
    await ready(page, "/profile");
    const content = page.locator("[data-centered-copy]");
    for (const tab of ["درباره من", "مجموعه‌های منتخب", "رزومه", "گالری", "خدمات"]) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await expect(content.locator("h3").first()).toBeVisible();
        await expect(content.locator("p").first()).toHaveCSS("text-align", "center");
    }
    await page.getByRole("button", { name: "افزودن خدمت", exact: true }).click();
    const description = page.getByPlaceholder(serviceHint, { exact: true });
    await expect(description).toHaveCSS("font-size", "13px");
    await expect(description).toHaveCSS("line-height", "24px");
    expect(await description.evaluate((node) => getComputedStyle(node, "::placeholder").fontSize)).toBe("13px");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "گالری", exact: true }).click();
    await page.getByRole("button", { name: "افزودن عکس", exact: true }).click();
    const caption = page.getByPlaceholder("هر عکسی یه داستانی داره؛ داستانتو اینجا بنویس!", { exact: true });
    await expect(caption).toHaveCSS("font-size", "13px");
    await expect(caption).toHaveCSS("line-height", "24px");
});

test("message and notification guidance is centered and network copy uses the requested names", async ({ page }) => {
    await ready(page, "/chat");
    await expect(page.getByText(/در این بخش می‌تونی با افراد شبکه‌ات/)).toHaveCSS("text-align", "center");
    await ready(page, "/notifications");
    await expect(page.getByRole("heading", { name: "هنوز هیچ اعلانی نداری!", exact: true })).toBeVisible();
    await expect(page.getByText(/اینجا محل نمایش همه/)).toHaveCSS("text-align", "center");
    await ready(page, "/profile/network");
    await expect(page.getByRole("button", { name: "دنبال‌کنندگان (0)", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "هنوز کسی دنبالت نمی‌کنه!", exact: true })).toBeVisible();
    await expect(page.getByText("وقتی کسی پروفایلت رو دنبال کنه، می‌تونی اینجا ببینیش", { exact: true })).toHaveCSS("text-align", "center");
    await page.getByRole("button", { name: "دنبال می‌کنم (0)", exact: true }).click();
    await expect(page.getByRole("heading", { name: "هنوز کسی رو دنبال نمی‌کنی!", exact: true })).toBeVisible();
});

test("daily Chinese quote is centered and both highlight menus call the amber swatch yellow", async ({ page }) => {
    await ready(page, "/settings/daily");
    await expect(page.getByText("滴水穿石", { exact: true })).toHaveCSS("text-align", "center");
    await expect(page.getByText("dī shuǐ chuān shí", { exact: true })).toHaveCSS("text-align", "center");
    await ready(page, "/settings/appearance");
    for (const label of ["رنگ هایلایت لغات جدید", "رنگ هایلایت لغات لایتنر"]) {
        await page.getByRole("button", { name: new RegExp(label) }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByText("زرد", { exact: true })).toBeVisible();
        await expect(dialog.getByText("نارنجی", { exact: true })).toHaveCount(0);
        await page.keyboard.press("Escape");
    }
});

for (const width of [320, 390]) {
    test(`review keeps Chinese numbering on the left, Persian on the right and groups collocations at ${width}px`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 844 });
        await ready(page, "/leitner/review");
        await expect(page.getByText("xuéxí", { exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "دیدن پشت کارت", exact: true }).click();
        const panel = page.getByRole("tabpanel");
        const chineseHeader = panel.locator('div[dir="ltr"]').first();
        const chineseNumber = (await chineseHeader.getByText("۱.", { exact: true }).boundingBox())!;
        const chinesePos = (await chineseHeader.getByText("فعل", { exact: true }).boundingBox())!;
        expect(chineseNumber.x).toBeLessThan(chinesePos.x);
        await expect(panel.getByText("学习知识", { exact: true })).toHaveCSS("text-align", "left");
        await page.getByRole("tab", { name: "معنی فارسی", exact: true }).click();
        const persianHeader = panel.locator('div[dir="rtl"]').first();
        const persianNumber = (await persianHeader.getByText("۱.", { exact: true }).boundingBox())!;
        const persianPos = (await persianHeader.getByText("فعل", { exact: true }).boundingBox())!;
        expect(persianNumber.x).toBeGreaterThan(persianPos.x);
        await expect(panel.getByText("یاد گرفتن", { exact: true })).toHaveCSS("text-align", "right");
        await page.getByRole("tab", { name: "ترکیب واژگانی", exact: true }).click();
        const groups = panel.getByRole("region");
        await expect(groups).toHaveCount(2);
        const secondGroup = groups.nth(1);
        await expect(secondGroup).toContainText("معنی 2");
        await expect(secondGroup).toContainText("مطالعه");
        const phrases = secondGroup.getByRole("listitem");
        await expect(phrases).toHaveCount(2);
        await expect(phrases.nth(0).locator("span").first()).toHaveText("1");
        await expect(phrases.nth(0)).toContainText("روش یادگیری");
        await expect(phrases.nth(1).locator("span").first()).toHaveText("2");
        await expect(phrases.nth(1)).toContainText("学习汉语");
        await expect(panel.getByText("学习汉语", { exact: true })).toHaveCSS("text-align", "left");
        await expect(panel.getByText("یادگیری زبان چینی", { exact: true })).toHaveCSS("text-align", "right");
        expect(await page.locator(".app-scroll").evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
        await page.screenshot({ path: path.resolve("../artifacts", `review-collocations-${info.project.name}-${width}.png`) });
    });
}
