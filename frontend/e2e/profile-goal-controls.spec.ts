import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);

const requestedTitle = "کارشناس مطالعات چین";
const account = {
    id: 901,
    email: "controls@example.com",
    phone: "09121234567",
    profile: { display_name: "کاربر آزمایشی", headline: "مترجم زبان چینی", country: "کانادا", gender: "خانم", profile_truth_confirmed: true },
};

async function ready(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

async function noOverflow(page: Page) {
    const overflow = await page.locator(".app-scroll").evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true"));
    await page.route("**/api/backend/**", async (route) => {
        const path = new URL(route.request().url()).pathname.replace("/api/backend", "");
        if (path === "/auth/refresh") return route.fulfill({ json: { access_token: "controls-test-token" } });
        if (path === "/users/me") return route.fulfill({ json: account });
        if (path === "/users/me/profile") return route.fulfill({ json: { ...account, profile: { ...account.profile, ...route.request().postDataJSON() } } });
        if (path === "/users/showcase") return route.fulfill({ json: [
            { id: 902, display_name: "متخصص مطالعات", headline: requestedTitle, country: "کانادا", gallery_preview: [], job_titles: [] },
            { id: 903, display_name: "مدرس آزمایشی", headline: "مدرس زبان چینی", country: "ایران", gallery_preview: [], job_titles: [] },
            { id: 904, display_name: "مترجم رزومه", headline: "زبان‌آموز چینی", country: "چین", gallery_preview: [], job_titles: ["مترجم شفاهی چینی"] },
        ] });
        return route.fulfill({ json: [] });
    });
});

test("account searches all 46 titles and sorted countries, then saves the exact selected values", async ({ page }) => {
    await ready(page, "/account");
    const main = page.locator("main:visible");
    await main.locator("#account-headline").click();
    await expect(main.getByRole("group", { name: "گزینه‌های عنوان شغلی", exact: true }).getByRole("button")).toHaveCount(46);
    const search = main.getByRole("searchbox", { name: "جست‌وجوی عنوان شغلی", exact: true });
    await search.fill("مطالعات چين");
    await search.press("Enter");
    await expect(main.locator("#account-headline")).toContainText(requestedTitle);
    await main.locator("#account-country").click();
    const countries = main.getByRole("group", { name: "گزینه‌های کشور یا منطقه", exact: true });
    const labels = await countries.getByRole("button").allTextContents();
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "fa")));
    const countrySearch = main.getByRole("searchbox", { name: "جست‌وجوی کشور یا منطقه", exact: true });
    await countrySearch.fill("آلمان");
    await countries.getByRole("button", { name: "آلمان", exact: true }).click();
    await main.locator("#account-country").click();
    await expect(main.getByRole("searchbox", { name: "جست‌وجوی کشور یا منطقه", exact: true })).toHaveValue("");
    await main.getByRole("searchbox", { name: "جست‌وجوی کشور یا منطقه", exact: true }).press("Escape");
    await expect(main.locator("#account-country")).toBeFocused();
    const request = page.waitForRequest((r) => r.url().endsWith("/users/me/profile") && r.method() === "PUT");
    await main.getByRole("button", { name: "ذخیره", exact: true }).click();
    expect((await request).postDataJSON()).toMatchObject({ headline: requestedTitle, country: "آلمان" });
    await noOverflow(page);
});

test("showcase searches job and country filters and filters by both headline and resume titles", async ({ page }) => {
    await ready(page, "/showcase");
    await page.getByRole("button", { name: "فیلترها", exact: true }).click();
    await page.getByRole("button", { name: "عنوان شغلی", exact: true }).click();
    const choices = page.getByRole("group", { name: "گزینه‌های عنوان شغلی", exact: true });
    await expect(choices.getByRole("button")).toHaveCount(46);
    const search = page.getByRole("searchbox", { name: "جست‌وجوی عنوان شغلی", exact: true });
    await search.fill("مطالعات چين");
    await choices.getByRole("button", { name: requestedTitle, exact: true }).click();
    await search.fill("مترجم شفاهی");
    await choices.getByRole("button", { name: "مترجم شفاهی چینی", exact: true }).click();
    await page.getByRole("button", { name: "بستن", exact: true }).click();
    await expect(page.getByRole("heading", { name: "متخصص مطالعات", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مترجم رزومه", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مدرس آزمایشی", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "فیلترها", exact: true }).click();
    await page.getByRole("button", { name: "لوکیشن", exact: true }).click();
    await page.getByRole("searchbox", { name: "جست‌وجوی لوکیشن", exact: true }).fill("كانادا");
    await page.getByRole("button", { name: "کانادا", exact: true }).click();
    await page.getByRole("button", { name: "بستن", exact: true }).click();
    await expect(page.getByRole("heading", { name: "متخصص مطالعات", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مترجم رزومه", exact: true })).toHaveCount(0);
    await noOverflow(page);
});

for (const width of [320, 390]) {
    test(`daily goal selects ten-minute ticks and single minutes with a stable box at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await ready(page, "/settings/daily");
        const box = page.getByRole("group", { name: "زمان هدف روزانه", exact: true });
        const initial = await box.boundingBox();
        const slider = page.getByRole("slider", { name: "زمان مطالعه روزانه", exact: true });
        for (let minutes = 0; minutes <= 100; minutes += 10) {
            await box.getByRole("button", { name: `${minutes} دقیقه`, exact: true }).click();
            await expect(slider).toHaveValue(String(minutes));
            expect(Math.abs((await box.boundingBox())!.height - initial!.height)).toBeLessThan(1);
        }
        await box.getByRole("button", { name: "20 دقیقه", exact: true }).click();
        await slider.focus();
        await slider.press("ArrowRight");
        await expect(slider).toHaveValue("21");
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("chinverse.learningPreferences.v1") || "{}").dailyGoalMinutes)).toBe(21);
        await page.getByLabel("سایر دقایق", { exact: true }).fill("300");
        await box.getByRole("button", { name: "ثبت", exact: true }).click();
        expect(Math.abs((await box.boundingBox())!.height - initial!.height)).toBeLessThan(1);
        await noOverflow(page);
        if (width === 390) {
            const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
            expect(audit.violations).toEqual([]);
        }
    });
}
