import { expect, test } from "@playwright/test";

const collections = [
    { domain: "historical-stories", slug: "chinese-tales-with-xiao-lin", count: 18 },
    { domain: "classical-poetry", slug: "rabbit-classical-poetry", count: 65 },
    { domain: "festivals-customs", slug: "sanmiao-wonderful-traditional-festivals", count: 10 },
    { domain: "tea-culture", slug: "yinsong8-chinese-tea-culture", count: 58 },
    { domain: "culture-texts", slug: "rabbit-sanzijing", count: 63 },
];

for (const collection of collections) {
    test(`${collection.domain} connects only uniquely identified published episodes`, async ({ page }) => {
        const published = {
            id: 121, title: "Published reference collection", description: "", level: collection.domain,
            slug: collection.slug, subcategory_slug: collection.domain,
            sections: [{ id: 1, lessons: [
                { id: 501, media_id: 1, metadata_json: { episode_index: 1, lesson_index: 1 } },
                { id: 502, media_id: 2, metadata_json: { episode_index: 2, lesson_index: 3 } },
                { id: 504, media_id: 4, title: "第4集" },
                { id: 505, media_id: null, metadata_json: { lesson_index: 5 } },
                { id: 500 + collection.count, media_id: 9, metadata_json: { lesson_index: collection.count } },
            ] }],
        };
        await page.route("**/api/backend/**", async (route) => {
            const pathname = new URL(route.request().url()).pathname;
            await route.fulfill({ json: pathname.endsWith("/courses/") ? [published] : { saved: false } });
        });
        await page.goto(`/${collection.domain}/${collection.slug}`);
        await expect(page.locator("main article")).toHaveCount(collection.count);
        const playback = page.locator(`main a[href^="/watch/${collection.domain}/"]`);
        await expect(playback).toHaveCount(2);
        await expect(playback.nth(0)).toHaveAttribute("href", `/watch/${collection.domain}/121?lesson=501`);
        await expect(playback.nth(1)).toHaveAttribute("href", `/watch/${collection.domain}/121?lesson=${500 + collection.count}`);
        for (const position of [2, 3, 4, 5]) {
            await expect(page.locator("main article").nth(position - 1)).toContainText("هنوز منتشر نشده");
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
    });
}
