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

  test("signup requires explicit legal acceptance", async ({ page }) => {
    await page.goto("/signup");
    const acceptance = page.getByRole("checkbox");
    await expect(acceptance).not.toBeChecked();
    await expect(page.getByRole("link", { name: "شرایط استفاده" })).toHaveAttribute("href", "/legal/terms");
    await acceptance.check();
    await expect(acceptance).toBeChecked();
  });
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
