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
            await expect(box.locator(".tab-content-motion")).toHaveCSS("opacity", "1");
            const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
            expect(audit.violations).toEqual([]);
        }
    });
}
