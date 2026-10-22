import { expect, test } from "@playwright/test";

function word(id: number, chinese: string, level: string) {
    return {
        id, chinese, level, hsk_level: level === "HSK4" ? 4 : null,
        pinyin: "āi / ái", source: level === "NON-HSK" ? "manual" : "hsk", status: "published",
        persian_meaning: "معنی نمونهٔ واژه", chinese_meaning: "词义", composition: "组合", notes: "",
        definitions: [{ id, lang_code: "fa", definition_text: "معنی نمونهٔ واژه", part_of_speech: "اسم", sense_order: 1 }],
        examples: [{ id, zh_text: "一个词。", pinyin: "Yí ge cí.", target_text: "یک واژه.", sense_order: 1 }],
        collocations: [{ id, phrase_zh: "词组", phrase_pinyin: "cízǔ", translation_target: "", sense_order: 1 }],
        created_at: "2026-10-03T00:00:00Z", updated_at: "2026-10-03T00:00:00Z",
    };
}

test("dictionary searches the complete catalog by level and loads later results", async ({ page }) => {
    test.setTimeout(90_000);
    const requests: Array<{ level: string; skip: number }> = [];
    await page.route("**/api/backend/**", async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace(/^\/api\/backend/, "");
        let body: unknown = [];
        if (path === "/auth/refresh") body = { access_token: "dictionary-fixture-only" };
        if (path === "/admin/me") body = { is_admin: true, email: "admin@example.com", mfa_enabled: true, mfa_verified: true };
        if (path === "/admin/overview") body = { stats: [], recent_users: [], recent_courses: [], recent_words: [] };
        if (path === "/admin/dictionary") {
            const level = url.searchParams.get("level") || "";
            const skip = Number(url.searchParams.get("skip") || 0);
            requests.push({ level, skip });
            if (!level) body = skip ? [word(900, "初级词", "HSK4")] : Array.from({ length: 100 }, (_, index) => word(index + 1000, `入门词${index}`, "HSK4"));
            if (level === "HSK7-9") body = skip ? [word(500, "深切", level)] : Array.from({ length: 100 }, (_, index) => word(index + 1, index === 0 ? "挨" : `高级词${index}`, level));
            if (level === "NON-HSK") body = [word(600, "优厚", level)];
            if (level === "HSK4") body = [word(700, "爱情", level)];
        }
        await route.fulfill({ json: body });
    });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "دیکشنری", exact: true }).click();
    await page.getByRole("button", { name: "نمایش واژه‌های بیشتر" }).click();
    await expect(page.getByText("初级词", { exact: true })).toBeVisible();
    expect(requests).toContainEqual({ level: "", skip: 100 });
    const level = page.getByLabel("سطح واژه‌ها");
    await level.selectOption("HSK7-9");
    await expect(page.getByText("挨", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "نمایش واژه‌های بیشتر" }).click();
    await expect(page.getByText("深切", { exact: true })).toBeVisible();
    expect(requests).toContainEqual({ level: "HSK7-9", skip: 100 });
    await expect(page.getByRole("button", { name: "نمایش واژه‌های بیشتر" })).toHaveCount(0);
    await level.selectOption("NON-HSK");
    await expect(page.getByText("优厚", { exact: true })).toBeVisible();
    expect(requests).toContainEqual({ level: "NON-HSK", skip: 0 });
    await expect(page.getByText("挨", { exact: true })).toHaveCount(0);
    await level.selectOption("HSK4");
    await expect(page.getByText("爱情", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
});
