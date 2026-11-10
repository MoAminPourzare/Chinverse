import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(90_000);
const titles = ["استاد دانشگاه", "کارآفرین حوزه چین", "صراف"];

async function setup(page: Page, theme = "light") {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((theme) => {
        localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme }));
        localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true");
    }, theme);
    const user = { id: 901, email: "ui@example.com", profile: { display_name: "کاربر آزمایشی", headline: titles[0], job_titles: [titles[0]], profile_truth_confirmed: true } };
    const saved: unknown[] = [];
    await page.route("**/api/backend/**", async (route) => {
        const request = route.request(), endpoint = new URL(request.url()).pathname.replace("/api/backend", "");
        if (endpoint === "/auth/refresh") return route.fulfill({ json: { access_token: "isolated-ui-test-session" } });
        if (endpoint === "/users/me") return route.fulfill({ json: user });
        if (endpoint === "/users/me/profile") {
            const update = request.postDataJSON(); saved.push(update);
            user.profile = { ...user.profile, ...update };
            return route.fulfill({ json: user });
        }
        if (endpoint === "/leitner/review") return route.fulfill({ json: { cards: [{ id: 11, box_number: 1, word: { id: 1, chinese: "学习學習", pinyin: "xuéxí", chinese_meaning: "學習中文", persian_meaning: "یادگیری" } }] } });
        if (endpoint.endsWith("/unread-count")) return route.fulfill({ json: { count: 0 } });
        if (endpoint === "/leitner/dashboard") return route.fulfill({ json: { box_counts: { 1: 1 }, due_by_box: { 1: 0 }, box_intervals: { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 }, total_cards: 1, total_due: 0, upcoming_count: 1, mastered_count: 0, recent_cards: [] } });
        if (endpoint === "/leitner/cards") return route.fulfill({ json: { cards: [{ id: 11, box_number: 1, word: { id: 1, chinese: "学习", pinyin: "xuéxí", persian_meaning: "یادگیری" } }] } });
        return route.fulfill({ json: [] });
    });
    return saved;
}

async function ready(page: Page, url: string) {
    await page.goto(url);
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
    test(`${theme} mode uses local Chinese glyphs and the correct illustration paints`, async ({ page }, info) => {
        const fonts: string[] = [];
        page.on("response", (response) => { if (response.url().includes("/fonts/wenkai-screen/")) fonts.push(response.url()); });
        await setup(page, theme);
        await ready(page, "/leitner/review");
        const word = page.getByText("学习學習", { exact: true });
        await expect(word).toHaveCSS("font-family", /LXGW WenKai GB Screen/);
        const loaded = await page.evaluate(async () => {
            const faces = await document.fonts.load('48px "LXGW WenKai GB Screen"', "学习學習");
            return faces.every((face) => face.status === "loaded") && faces.length > 0;
        });
        expect(loaded).toBe(true);
        expect(fonts.length).toBeGreaterThan(0);
        expect(fonts.length).toBeLessThan(12);
        expect(fonts.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
        await expect(page.locator(".bottom-nav-dot")).toHaveCount(0);
        const speaker = page.getByRole("button", { name: "پخش تلفظ", exact: true });
        await expect(speaker.locator('img[data-theme-asset="dark"]')).toBeVisible({ visible: theme === "dark" });
        await expect(speaker.locator('img[data-theme-asset="light"]')).toBeVisible({ visible: theme === "light" });
        const accessibility = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(accessibility.violations).toEqual([]);
        await page.screenshot({ path: path.resolve("../.tmp", `font-review-${theme}-${info.project.name}.png`) });
        await ready(page, "/settings");
        await page.screenshot({ path: path.resolve("../.tmp", `theme-settings-${theme}-${info.project.name}.png`) });
        if (theme === "dark") {
            await expect(page.locator("html")).toHaveClass(/dark/);
            const icon = page.locator('img[data-theme-asset="dark"]:visible').first();
            await expect(icon).toHaveAttribute("src", /\/assets\/chinverse\/dark\//);
            await expect(page.locator('img[data-theme-asset="light"]:visible')).toHaveCount(0);
        }
        for (const route of ["/settings/daily", "/leitner"]) {
            await ready(page, route);
            const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
            expect(result.violations).toEqual([]);
        }
    });
}
