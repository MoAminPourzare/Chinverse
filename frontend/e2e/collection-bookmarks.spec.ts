import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

for (const collection of [
    { domain: "hsk", slug: "hsk-1" },
    { domain: "festivals-customs", slug: "sanmiao-wonderful-traditional-festivals" },
    { domain: "pronunciation", slug: "yoyo-chinese" },
]) {
    test(`${collection.domain}: save, reload, open in profile and remove without published media`, async ({ page }) => {
        let saved = false;
        await page.route("**/api/backend/**", async (route) => {
            const path = new URL(route.request().url()).pathname;
            const method = route.request().method();
            let body: unknown = [];
            if (path.endsWith("/users/me")) body = { id: 9, email: "qa@example.com", profile: { display_name: "کاربر تست" } };
            else if (path.endsWith("/followers/count")) body = { count: 0 };
            else if (path.endsWith("/collections/saved")) body = saved ? [collection] : [];
            else if (path.includes(`/collections/${collection.domain}/${collection.slug}/`)) {
                if (method === "POST") saved = true;
                if (method === "DELETE") saved = false;
                body = { saved };
            }
            await route.fulfill({ json: body });
        });
        await page.goto(`/${collection.domain}/${collection.slug}`);
        await page.getByRole("button", { name: "ذخیره در منتخب‌ها", exact: true }).click();
        await expect(page.getByRole("button", { name: "حذف از منتخب‌ها", exact: true })).toHaveAttribute("aria-pressed", "true");
        await page.reload();
        await expect(page.getByRole("button", { name: "حذف از منتخب‌ها", exact: true })).toBeEnabled();
        await page.goto("/profile");
        await page.getByRole("button", { name: /مجموعه‌های منتخب/ }).click();
        const link = page.locator(`a[href="/${collection.domain}/${collection.slug}"]`);
        await expect(link).toHaveCount(1);
        await expect.poll(() => link.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        await link.click();
        await page.getByRole("button", { name: "حذف از منتخب‌ها", exact: true }).click();
        await expect(page.getByRole("button", { name: "ذخیره در منتخب‌ها", exact: true })).toHaveAttribute("aria-pressed", "false");
        await page.goto("/profile");
        await page.getByRole("button", { name: /مجموعه‌های منتخب/ }).click();
        await expect(page.getByText("اولین مجموعه‌ات رو انتخاب کن!")).toBeVisible();
    });
}

test("server errors keep the bookmark unsaved and allow retry", async ({ page }) => {
    let failing = true;
    await page.route("**/api/backend/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/save") && route.request().method() === "POST") {
            await route.fulfill({ status: failing ? 503 : 201, json: failing ? { detail: "Unavailable" } : { saved: true } });
        } else await route.fulfill({ json: path.endsWith("/saved") ? { saved: false } : [] });
    });
    await page.goto("/hsk/hsk-1");
    await page.getByRole("button", { name: "ذخیره در منتخب‌ها", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ذخیرهٔ مجموعه انجام نشد" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ذخیره در منتخب‌ها", exact: true })).toHaveAttribute("aria-pressed", "false");
    failing = false;
    await page.getByRole("button", { name: "ذخیره در منتخب‌ها", exact: true }).click();
    await expect(page.getByRole("button", { name: "حذف از منتخب‌ها", exact: true })).toHaveAttribute("aria-pressed", "true");
});
