import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(90_000);

const confirmation = "تیم پشتیبانی چین‌ورس بزودی بررسیش می‌کنه و پاسخ می‌ده. ممنون که با ما در ارتباط هستی.";

async function ready(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ page }) => {
    let profile = { display_name: "کاربر آزمایشی", bio: "", websites: [], socials: [] };
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true"));
    await page.route("**/api/backend/**", async (route) => {
        const url = new URL(route.request().url()).pathname.replace("/api/backend", "");
        let body: unknown = [];
        if (url === "/auth/refresh") body = { access_token: "support-copy-test-session" };
        else if (url === "/users/me") body = { id: 7, email: "copy@example.com", profile };
        else if (url === "/users/me/profile") {
            profile = { ...profile, ...route.request().postDataJSON() };
            body = { id: 7, email: "copy@example.com", profile };
        } else if (url === "/community/support" && route.request().method() === "POST") body = { success: true, ticket_id: 41 };
        else if (url === "/admin/me") body = { is_admin: false };
        else if (url.endsWith("/unread-count")) body = { count: 0 };
        await route.fulfill({ json: body });
    });
});

for (const scenario of [{ width: 320, theme: "light" }, { width: 390, theme: "light" }, { width: 390, theme: "dark" }]) {
    test(`support confirmation matches the reference at ${scenario.width}px in ${scenario.theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: scenario.width, height: 844 });
        await page.addInitScript((theme) => localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme })), scenario.theme);
        await ready(page, "/support");
        const logo = page.getByRole("img", { name: "چین‌ورس", exact: true });
        await expect(logo).toHaveAttribute("src", /chinverse-wordmark/);
        const close = (await page.getByRole("button", { name: "بستن", exact: true }).boundingBox())!;
        expect(close.x).toBeLessThan((await logo.boundingBox())!.x);
        await page.getByLabel("پیام پشتیبانی", { exact: true }).fill("این پیام آزمایشی برای بررسی ارسال و طراحی صفحه است.");
        await page.getByRole("button", { name: "ارسال پیام", exact: true }).click();
        await expect(page.getByRole("heading", { name: "پیامت به دست ما رسید!", exact: true })).toBeVisible();
        await expect(page.locator("main:visible").getByRole("status")).toContainText(confirmation);
        await expect(page.getByRole("img", { name: "پشتیبان چین‌ورس", exact: true })).toHaveAttribute("src", /Support(?:%20| )/);
        await page.screenshot({ path: path.resolve("../.tmp", `support-confirmation-${testInfo.project.name}-${scenario.width}-${scenario.theme}.png`), style: "nextjs-portal { display: none !important; }" });
        expect(await page.locator(".app-scroll").evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
        const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        expect(audit.violations).toEqual([]);
        await page.getByRole("button", { name: "مشاهده درخواست‌ها", exact: true }).click();
        await expect(page.getByLabel("پیام پشتیبانی", { exact: true })).toBeVisible();
    });
}

test("questions and articles preserve the reference tone and the corrected brand name", async ({ page }) => {
    await ready(page, "/community");
    await expect(page.getByText("اگه درباره هر درس یا مبحثی سوال داری، اینجا مطرحش کن. سایر کاربران یا تیم پشتیبانی چین‌ورس بهت پاسخ می‌دن.", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "مقالات", exact: true }).click();
    await expect(page.getByText("در این بخش، سوالات پرتکرار یا موضوعات جالب توسط تیم ما تبدیل به مقاله میشه. می‌تونی مقاله‌ها رو بخونی، زیرش نظر بدی یا سوال جدید مطرح کنی.", { exact: true })).toBeVisible();
});
