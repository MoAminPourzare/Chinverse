import { expect, test } from "@playwright/test";

const collections = [
    ["hsk", "hsk-1"],
    ["energy-health", "xue-guoxue-wang-baduanjin"],
    ["martial-arts", "xue-guoxue-wang-eight-form-taijiquan"],
    ["cooking", "meishi-zuojia-wang-gang"],
    ["topic-talks", "dr-yuni-xia"],
    ["calligraphy", "chen-zhongjian-calligraphy-beginners"],
    ["culture-texts", "rabbit-sanzijing"],
    ["tea-culture", "yinsong8-chinese-tea-culture"],
    ["historical-stories", "chinese-tales-with-xiao-lin"],
    ["classical-poetry", "rabbit-classical-poetry"],
    ["festivals-customs", "sanmiao-wonderful-traditional-festivals"],
    ["series", "hidden-love"],
    ["cartoons", "boonie-bears-adventure-diary"],
    ["cartoons", "nezha-birth-of-the-demon-child"],
    ["movies", "dying-to-survive"],
    ["podcasts", "practical-mandarin"],
    ["pronunciation", "yoyo-chinese"],
    ["characters", "yoyo-chinese-character"],
    ["grammar", "baijia-talk-grammar"],
    ["idioms", "beckybunny-idiom-stories"],
    ["practical", "hoa-ngu-nam-khanh-office-sentences"],
    ["vlogs", "zhangkai-chinese-vlog"],
    ["synonyms", "baijia-talk-hsk5-synonyms"],
    ["classical", "baijia-talk-classical-chinese-introduction"],
];

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/backend/**", (route) => route.fulfill({ json: [] }));
});

for (const [domain, slug] of collections) {
    test(`${domain}/${slug}: unpublished entry opens and returns to its collection`, async ({ page }) => {
        // Four route transitions and two collection renders can exceed 30s in Windows WebKit.
        test.setTimeout(60_000);
        const basePath = `/${domain}/${slug}`;
        await page.goto(basePath);
        const entries = page.locator(`main a[href^="${basePath}/lesson/"]`);
        await expect(entries.first()).toBeVisible();
        // Verify both boundaries of each list, including repeat-number reference collections.
        for (const boundary of ["first", "last"] as const) {
            const href = await entries[boundary]().getAttribute("href");
            await entries[boundary]().click();
            await expect(page).toHaveURL(new RegExp(`${href}$`));
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            await expect(page.getByRole("heading", { name: /پیدا نشد/ })).toHaveCount(0);
            await expect(page.locator("main a[href^='/watch/']")).toHaveCount(0);
            await expect(page.locator("main").getByText(/فایل اصلی این .* هنوز منتشر نشده است\./)).toBeVisible();
            await page.locator(`main a[href="${basePath}"]`).first().click();
            await expect(page).toHaveURL(new RegExp(`${basePath}$`));
        }
    });
}

test("calligraphy level retains its identity when opening an unpublished lesson", async ({ page }) => {
    const basePath = "/calligraphy/chen-zhongjian-ouyang-xun-structure/level/advanced";
    await page.goto(basePath);
    await page.locator(`main a[href="${basePath}/lesson/1"]`).click();
    await expect(page).toHaveURL(new RegExp(`${basePath}/lesson/1$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("第1课");
    await expect(page.locator("main").getByText(/进阶 欧体结构/)).toBeVisible();
    await page.getByRole("link", { name: "قسمت بعدی" }).click();
    await expect(page).toHaveURL(new RegExp(`${basePath}/lesson/2$`));
    await page.getByRole("link", { name: "بازگشت به مجموعه", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${basePath}$`));
});

test("podcast level opens even before its episodes are published", async ({ page }) => {
    await page.goto("/podcasts/chinese-daily");
    await page.locator('main a[href="/podcasts/chinese-daily/level/intermediate"]').click();
    await expect(page).toHaveURL(/\/level\/intermediate$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("中级 (HSK 3–4)");
    await expect(page.locator("main").getByText("14 اپیزود در این سطح")).toBeVisible();
});

test("music release opens even before its tracks are published", async ({ page }) => {
    await page.goto("/music/jay-chou");
    await page.locator('main a[href="/music/jay-chou/release/jay"]').click();
    await expect(page).toHaveURL(/\/release\/jay$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jay");
    await expect(page.locator("main a[href^='/watch/']")).toHaveCount(0);
});

for (const path of [
    "/series/hidden-love/lesson/999", "/podcasts/practical-mandarin/lesson/0",
    "/music/jay-chou/release/unknown", "/calligraphy/chen-zhongjian-ouyang-xun-structure/level/unknown/lesson/1",
]) {
    test(`invalid catalog entry is rejected: ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("heading", { name: "این بخش پیدا نشد" })).toBeVisible();
        await expect(page.locator("main a[href^='/watch/']")).toHaveCount(0);
    });
}
