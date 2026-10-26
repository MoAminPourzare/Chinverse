import { expect, test } from "@playwright/test";

test("public profiles expose only name and photo and recover from a missing avatar", async ({ page }) => {
    await page.route("**/api/backend/**", async route => {
        const endpoint = new URL(route.request().url()).pathname.replace("/api/backend", "");
        if (endpoint === "/users/2/identity") return route.fulfill({ json: { id: 2, display_name: "تارا نمایشی", avatar_url: "/uploads/avatars/missing.jpg" } });
        if (endpoint.includes("/uploads/avatars/")) return route.fulfill({ status: 404, body: "Missing avatar" });
        return route.fulfill({ status: endpoint === "/auth/refresh" ? 401 : 200, json: [] });
    });
    await page.goto("/users/2");
    await expect(page.getByRole("heading", { name: "تارا نمایشی", exact: true })).toBeVisible();
    const avatar = page.getByRole("img", { name: "عکس پروفایل", exact: true });
    await expect(avatar).toHaveAttribute("src", /image-unavailable\.svg/);
    await expect.poll(() => avatar.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    for (const label of ["شبکه", "رزومه", "خدمات", "درباره من", "ارسال پیام"]) await expect(page.getByText(label, { exact: true })).toHaveCount(0);
});
