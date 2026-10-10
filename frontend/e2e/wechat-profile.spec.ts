import { expect, test, type Page } from "@playwright/test";

const profile = {
    display_name: "زبان‌آموز", bio: "ارتباط برای تمرین زبان چینی", websites: [],
    socials: [
        { platform: "wechat", handle: "weixin://dl/chat?chinverse_id" },
        { platform: "telegram", handle: "chinverse_app" },
    ],
};

async function prepare(page: Page, copyDenied = false) {
    await page.addInitScript(denied => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
            writeText: async (value: string) => {
                if (denied) throw new DOMException("Clipboard denied", "NotAllowedError");
                document.documentElement.dataset.copiedWechatId = value;
            },
        } });
    }, copyDenied);
    await page.route("**/api/backend/**", async route => {
        const path = new URL(route.request().url()).pathname.replace(/^\/api\/backend/, "");
        let body: unknown = [];
        if (path === "/auth/refresh") body = { access_token: "wechat-profile-test-session" };
        else if (path === "/users/me") body = { id: 7, email: "learner@example.com", profile };
        else if (path === "/users/9/public") body = { id: 9, profile };
        else if (path.endsWith("/is-following")) body = { is_following: false };
        else if (path.endsWith("/followers-count")) body = { followers_count: 0 };
        else if (path.endsWith("/following-count")) body = { following_count: 0 };
        else if (path.endsWith("/unread-count")) body = { count: 0 };
        else if (path === "/admin/me") body = { is_admin: false };
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
}

for (const path of ["/users/9", "/profile"]) {
    test(`WeChat IDs can be copied from ${path} without navigating away`, async ({ page }, testInfo) => {
        await prepare(page);
        await page.goto(path);
        await expect(page.getByRole("link", { name: /Telegram/ })).toHaveAttribute("href", "https://t.me/chinverse_app");
        await page.getByRole("button", { name: /WeChat/ }).click();
        const dialog = page.getByRole("dialog", { name: "ارتباط در وی‌چت" });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByLabel("آیدی وی‌چت")).toHaveValue("chinverse_id");
        await dialog.getByRole("button", { name: "کپی آیدی", exact: true }).click();
        await expect(dialog.getByRole("status")).toHaveText("آیدی وی‌چت کپی شد.");
        expect(await page.evaluate(() => document.documentElement.dataset.copiedWechatId)).toBe("chinverse_id");
        expect(new URL(page.url()).pathname).toBe(path);
        expect(await dialog.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
        await testInfo.attach("wechat-contact", { body: await page.screenshot(), contentType: "image/png" });
        await dialog.getByRole("button", { name: "بستن", exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(page.getByRole("button", { name: /WeChat/ })).toBeFocused();
    });
}

test("a denied clipboard leaves the WeChat ID selected for manual copying", async ({ page }) => {
    await prepare(page, true);
    await page.goto("/users/9");
    await page.getByRole("button", { name: /WeChat/ }).click();
    const dialog = page.getByRole("dialog", { name: "ارتباط در وی‌چت" });
    await dialog.getByRole("button", { name: "کپی آیدی", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("آیدی را انتخاب و کپی کن");
    const id = dialog.getByLabel("آیدی وی‌چت");
    await expect(id).toHaveValue("chinverse_id");
    await expect(id).toBeFocused();
    expect(await id.evaluate(element => (element as HTMLInputElement).selectionEnd! - (element as HTMLInputElement).selectionStart!)).toBe("chinverse_id".length);
});
