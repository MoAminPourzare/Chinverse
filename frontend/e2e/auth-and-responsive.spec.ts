import { expect, test } from "@playwright/test";

test("frontend health endpoint is observable and uncached", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  expect(response.headers()["x-chinverse-deployment-tier"]).toBe("staging");
  expect(await response.json()).toMatchObject({
    status: "ok",
    service: "chinverse-web",
    deployment_tier: "staging",
    indexable: false,
  });
});

test("HTML responses use per-request CSP nonces without unsafe inline scripts", async ({ request }) => {
  const first = await request.get("/login");
  const second = await request.get("/login");
  const firstCsp = first.headers()["content-security-policy"];
  const secondCsp = second.headers()["content-security-policy"];

  expect(first.ok()).toBe(true);
  expect(firstCsp).toContain("strict-dynamic");
  expect(firstCsp).toContain("frame-ancestors 'none'");
  const firstScriptDirective = firstCsp.split(";").find((item) => item.trim().startsWith("script-src"));
  expect(firstScriptDirective).toContain("'nonce-");
  expect(firstScriptDirective).not.toContain("'unsafe-inline'");
  expect(firstCsp.match(/'nonce-([^']+)'/)?.[1]).not.toBe(secondCsp.match(/'nonce-([^']+)'/)?.[1]);
});

test("same-origin backend proxy rejects mutations without trusted browser origin", async ({ request }) => {
  const missingOrigin = await request.post("/api/backend/auth/logout", {
    headers: { Origin: "", Referer: "" },
  });
  expect(missingOrigin.status()).toBe(403);

  const crossOrigin = await request.post("/api/backend/auth/logout", {
    headers: { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" },
  });
  expect(crossOrigin.status()).toBe(403);
});

test("staging blocks search indexing and incomplete routes", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /");

  for (const route of ["/settings/subscription", "/settings/referrals", "/settings/points"]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe("/settings");
  }
});

test.describe("authentication forms", () => {
  for (const route of ["/login", "/signup"]) {
    test(`${route} can reveal and hide the password`, async ({ page }) => {
      await page.goto(route);
      const password = page.locator(`#${route.slice(1)}-password:visible`);
      await expect(password).toBeVisible();
      await password.fill("Secure123");

      await page.getByRole("button", { name: "نمایش رمز", exact: true }).click();
      await expect(password).toHaveAttribute("type", "text");
      await expect(password).toHaveValue("Secure123");

      await page.getByRole("button", { name: "پنهان کردن رمز", exact: true }).click();
      await expect(password).toHaveAttribute("type", "password");
    });
  }

  test("signup requires explicit legal acceptance", async ({ page }) => {
    await page.goto("/signup");
    const acceptance = page.getByRole("checkbox");
    await expect(acceptance).not.toBeChecked();
    await expect(page.getByRole("link", { name: "شرایط استفاده" })).toHaveAttribute("href", "/legal/terms");
    await acceptance.check();
    await expect(acceptance).toBeChecked();
  });

  test("signup legal documents preserve the draft through close, back and forward", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/signup?ref=CH12AB");
    await page.locator("#signup-display-name").fill("کاربر آزمایشی");
    await page.locator("#signup-email").fill("draft@example.invalid");
    await page.locator("#signup-phone").fill("09121234567");
    await page.locator("#signup-password").fill("A long test-only passphrase");

    for (const [title, slug, action] of [
      ["شرایط استفاده", "terms", "close"],
      ["حریم خصوصی", "privacy", "escape"],
      ["قوانین جامعه", "community-guidelines", "back"],
    ] as const) {
      const link = page.getByRole("link", { name: title, exact: true });
      await link.click();
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`legal=${slug}`));
      await expect(dialog.getByText(/لازم‌الاجرا از/)).toBeVisible();

      if (action === "close") {
        await dialog.getByRole("button", { name: "بازگشت به ثبت‌نام" }).click();
      } else if (action === "escape") {
        await dialog.press("Escape");
      } else {
        await page.goBack();
        await expect(dialog).not.toBeVisible();
        await page.goForward();
        await expect(dialog).toBeVisible();
        await page.goBack();
      }

      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(page).toHaveURL(/\/signup\?ref=CH12AB$/);
      await expect(page.locator("#signup-display-name")).toHaveValue("کاربر آزمایشی");
      await expect(page.locator("#signup-email")).toHaveValue("draft@example.invalid");
      await expect(page.locator("#signup-phone")).toHaveValue("09121234567");
      await expect(page.locator("#signup-password")).toHaveValue("A long test-only passphrase");
      await expect(page.getByRole("checkbox")).not.toBeChecked();
    }
  });

  test("a directly opened signup legal document closes onto the signup form", async ({ page }) => {
    await page.goto("/settings/about");
    await page.goto("/signup?legal=terms");
    const dialog = page.getByRole("dialog", { name: "شرایط استفاده", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "حریم خصوصی", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "حریم خصوصی", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "بازگشت به ثبت‌نام" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.locator("#signup-display-name")).toBeVisible();
  });
});

test.describe("responsive shell", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1280, height: 720 },
    { width: 1280, height: 1100 },
    { width: 844, height: 390 },
  ]) {
    test(`signup legal dialog fits the app frame at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/signup?legal=community-guidelines");
      const dialog = page.getByRole("dialog", { name: "قوانین جامعه", exact: true });
      const panel = dialog.locator("[id^=headlessui-dialog-panel]");
      const back = dialog.getByRole("button", { name: "بازگشت به ثبت‌نام" });
      await expect(dialog).toBeVisible();

      const frameBox = await page.locator(".app-frame").boundingBox();
      const panelBox = await panel.boundingBox();
      expect(frameBox).not.toBeNull();
      expect(panelBox).not.toBeNull();
      expect(panelBox!.y).toBeGreaterThanOrEqual(frameBox!.y);
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(frameBox!.y + frameBox!.height);
      expect(panelBox!.x).toBeGreaterThanOrEqual(frameBox!.x);
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width);

      const initialBackBox = await back.boundingBox();
      const lastSection = dialog.getByRole("heading", { name: "به‌روزرسانی قواعد", exact: true });
      await lastSection.scrollIntoViewIfNeeded();
      await expect(lastSection).toBeInViewport();
      await expect(back).toBeInViewport();
      const scrolledBackBox = await back.boundingBox();
      expect(scrolledBackBox!.y).toBeCloseTo(initialBackBox!.y, 0);
      await back.click();
      await expect(dialog).not.toBeVisible();
      await expect(page).toHaveURL(/\/signup$/);
    });
  }

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
