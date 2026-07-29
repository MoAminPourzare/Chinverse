import { expect, test } from "@playwright/test";

test("frontend health endpoint is observable and uncached", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(await response.json()).toMatchObject({
    status: "ok",
    service: "chinverse-web",
  });
});

test.describe("authentication forms", () => {
  for (const route of ["/login", "/signup"]) {
    test(`${route} can reveal and hide the password`, async ({ page }) => {
      await page.goto(route);
      const password = page.locator(`#${route.slice(1)}-password`);
      await expect(password).toBeVisible();
      await password.fill("Secure123");

      await page.getByRole("button", { name: "نمایش رمز", exact: true }).click();
      await expect(password).toHaveAttribute("type", "text");
      await expect(password).toHaveValue("Secure123");

      await page.getByRole("button", { name: "پنهان کردن رمز", exact: true }).click();
      await expect(password).toHaveAttribute("type", "password");
    });
  }
});

test.describe("responsive shell", () => {
  for (const route of ["/login", "/signup", "/settings/appearance", "/settings/daily"]) {
    test(`${route} has no horizontal page overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));

      expect(overflow.document).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);
    });
  }

  test("appearance preview stays inside the viewport", async ({ page }) => {
    await page.goto("/settings/appearance");
    await page.getByRole("button", { name: /سایز متن فارسی/ }).click();

    const panel = page.locator(".modal-panel-motion");
    await expect(panel).toBeVisible();
    await panel.evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    const box = await panel.boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
  });
});
