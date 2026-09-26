import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/explore", "/showcase", "/community", "/support"];

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

  test("support affordance keeps one position across primary pages", async ({ page }) => {
    const positions: Array<{ x: number; y: number }> = [];

    for (const route of ["/", "/showcase", "/community"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const support = page.getByRole("link", { name: "پشتیبانی" });
      await expect(support).toBeVisible();
      const box = await support.boundingBox();
      expect(box).not.toBeNull();
      positions.push({ x: Math.round(box!.x), y: Math.round(box!.y) });
    }

    expect(new Set(positions.map((position) => `${position.x}:${position.y}`)).size).toBe(1);
  });

  test("chat exposes a retryable network error instead of an empty inbox", async ({ page }) => {
    await page.route("**/api/backend/chat/conversations**", (route) => route.abort("failed"));
    await page.goto("/chat", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "پیام‌ها باز نشد" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش دوباره" })).toBeVisible();
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
    await page.goto("/showcase", { waitUntil: "domcontentloaded" });
    await page.goBack();
    await expect(page).toHaveURL(/\/explore$/);
  });
});
