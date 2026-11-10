import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/explore", "/profile", "/community", "/support"];

test.describe("phase four public journey shell", () => {
  for (const route of publicRoutes) {
    test(`${route} renders without horizontal overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));

      expect(overflow.document).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);
    });
  }

  test("support is available in the forum and settings", async ({ page }) => {
    for (const route of ["/", "/community", "/settings"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: /^پشتیبانی/ })).toBeVisible();
    }
    for (const route of ["/profile", "/explore", "/leitner"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".app-support-button")).toHaveCount(0);
    }
  });

  test("the retired messages URL returns to the forum", async ({ page }) => {
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(url => url.pathname === "/" && url.searchParams.get("tab") === "forum");
    await expect(page.getByRole("button", { name: "تالار گفتگو", exact: true })).toBeVisible();
  });

  test("notifications exposes its empty copy and browser back restores the prior route", async ({ page }) => {
    await page.route("**/api/backend/notifications**", async (route) => {
      const url = new URL(route.request().url());
      const body = url.pathname.endsWith("/unread-count") ? { count: 0 } : [];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("اینجا محل نمایش همه ی اعلان هاست.", { exact: false })).toBeVisible();

    await page.goto("/explore", { waitUntil: "domcontentloaded" });
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await page.goBack();
    await expect(page).toHaveURL(/\/explore$/);
  });
});
