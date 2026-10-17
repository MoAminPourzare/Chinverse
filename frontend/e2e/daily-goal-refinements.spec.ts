import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

test.setTimeout(90_000);

async function ready(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".route-panel:visible").first()).toHaveCSS("opacity", "1");
    await page.evaluate(() => document.fonts.ready);
}

async function savedGoal(page: Page, name: "dailyGoalMinutes" | "dailyGoalWords", value: number) {
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem("chinverse.learningPreferences.v1") || "{}")[key], name)).toBe(value);
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("chinverse.pwa.ios-hint-dismissed", "true"));
    await page.route("**/api/backend/**", (route) => route.fulfill({ json: [] }));
});

test("minutes above 100 persist, controls have the requested order, and author pinyin matches the revised document", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await ready(page, "/settings/daily");
    const box = page.getByRole("group", { name: "زمان هدف روزانه", exact: true });
    const less = box.getByRole("button", { name: "کمتر", exact: true });
    const more = box.getByRole("button", { name: "بیشتر", exact: true });
    expect((await more.boundingBox())!.x).toBeGreaterThan((await less.boundingBox())!.x);
    const height = (await box.boundingBox())!.height;
    for (const [minutes, author] of [[10, "( Lǎozǐ)"], [40, "(Kǒngzǐ)"], [90, "(Hán Yù)"]] as const) {
        await box.getByRole("button", { name: `${minutes} دقیقه`, exact: true }).click();
        await expect(box.locator(".tab-content-motion [lang='zh-Latn']")).toContainText(author);
        expect(Math.abs((await box.boundingBox())!.height - height)).toBeLessThan(1);
    }
    for (const [input, value] of [["۱۸۰", 180], ["۶۰۰", 600]] as const) {
        await page.getByLabel("سایر دقایق", { exact: true }).fill(input);
        await box.getByRole("button", { name: "ثبت", exact: true }).click();
        await savedGoal(page, "dailyGoalMinutes", value);
        await expect(box.locator(".tab-content-motion")).toContainText(`هدف مطالعه: ${value.toLocaleString("fa-IR")} دقیقه`);
    }
    await more.click();
    await savedGoal(page, "dailyGoalMinutes", 610);
    await less.click();
    await savedGoal(page, "dailyGoalMinutes", 600);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(box.locator(".tab-content-motion")).toContainText("هدف مطالعه: ۶۰۰ دقیقه");
    expect(await page.locator(".app-scroll").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});

for (const scenario of [{ width: 320, theme: "light" }, { width: 390, theme: "light" }, { width: 390, theme: "dark" }]) {
    test(`Leitner has six square options, custom goals, and a usable modal at ${scenario.width}px in ${scenario.theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: scenario.width, height: 844 });
        await page.addInitScript((theme) => {
            if (!localStorage.getItem("chinverse.learningPreferences.v1")) localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme }));
        }, scenario.theme);
        await ready(page, "/settings/daily");
        const opener = page.getByRole("button", { name: /هدف روزانه لایتنر/ });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: "هدف روزانه لایتنر", exact: true });
        await expect(dialog.getByText("هر روز چند تا لغت میخوای با لایتنر مرور کنی؟", { exact: true })).toBeVisible();
        await dialog.evaluate(async (element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)));
        const options = ["۳ لغت – سبک", "۵ لغت – راحت", "۸ لغت – متعادل", "۱۰ لغت – پیشنهادی", "۱۵ لغت – جدی", "۲۰ لغت – فشرده"];
        const boxes = [];
        for (const name of options) {
            const radio = dialog.getByRole("radio", { name, exact: true });
            await expect(radio).toBeVisible();
            const rect = (await radio.boundingBox())!;
            expect(Math.abs(rect.width - rect.height)).toBeLessThan(1);
            boxes.push(rect);
        }
        expect(boxes[0].x).toBeLessThan(boxes[1].x);
        expect(boxes[1].x).toBeLessThan(boxes[2].x);
        expect(boxes[0].y).toBe(boxes[1].y);
        expect(boxes[3].y).toBe(boxes[4].y);
        expect(boxes[3].y).toBeGreaterThan(boxes[0].y);
        await dialog.getByRole("radio", { name: options[3], exact: true }).click();
        await expect(dialog.getByRole("radio", { name: options[3], exact: true })).toHaveAttribute("aria-checked", "true");
        await page.screenshot({ path: path.resolve("../.tmp", `leitner-goal-${testInfo.project.name}-${scenario.width}-${scenario.theme}.png`), style: "nextjs-portal { display: none !important; }" });
        if (scenario.width === 390) {
            const audit = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
            expect(audit.violations).toEqual([]);
        }
        await dialog.getByRole("button", { name: "ثبت هدف", exact: true }).click();
        await savedGoal(page, "dailyGoalWords", 10);
        await opener.click();
        await dialog.getByRole("radio", { name: /عدد دلخواه/ }).click();
        const custom = dialog.getByLabel("لغت در روز", { exact: true });
        await expect(custom).toBeFocused();
        await custom.fill("۲۵");
        await dialog.getByRole("button", { name: "افزایش تعداد لغت", exact: true }).click();
        await expect(custom).toHaveValue("26");
        await dialog.getByRole("button", { name: "کاهش تعداد لغت", exact: true }).click();
        await expect(custom).toHaveValue("25");
        await custom.fill("0");
        await expect(dialog.getByRole("button", { name: "ثبت هدف", exact: true })).toBeDisabled();
        await custom.fill("۲۵");
        await dialog.getByRole("button", { name: "ثبت هدف", exact: true }).click();
        await savedGoal(page, "dailyGoalWords", 25);
        await page.reload();
        await page.waitForLoadState("networkidle");
        await expect(opener).toContainText("۲۵ لغت");
        await opener.click();
        await expect(dialog.getByRole("radio", { name: /عدد دلخواه/ })).toHaveAttribute("aria-checked", "true");
        await expect(custom).toHaveValue("25");
        await dialog.getByRole("radio", { name: options[0], exact: true }).click();
        await dialog.getByRole("button", { name: "بستن", exact: true }).click();
        await savedGoal(page, "dailyGoalWords", 25);
        await expect(opener).toBeFocused();
        expect(await page.locator(".app-scroll").evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    });
}

test("about logo is enlarged and body text uses justified alignment throughout reading pages", async ({ page }) => {
    await ready(page, "/settings/about");
    const main = page.locator("main:visible");
    const logo = (await main.getByRole("img", { name: "چین ورس", exact: true }).boundingBox())!;
    expect(logo.width).toBe(180);
    expect(logo.height).toBe(180);
    await expect(main.locator("p").first()).toHaveCSS("text-align", "justify");
    await ready(page, "/legal/privacy");
    await expect(page.locator("main:visible p").first()).toHaveCSS("text-align", "justify");
    await ready(page, "/settings/daily");
    const quote = page.getByRole("group", { name: "زمان هدف روزانه", exact: true }).locator(".tab-content-motion p");
    await expect(quote.nth(1)).toHaveCSS("text-align", "justify");
    await expect(quote.nth(2)).toHaveCSS("text-align", "justify");
});
