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
  test("signup waits for email and both tabs continue after confirmation", async ({ page, context }) => {
    const email = "verify-journey@example.com";
    let verified = false;
    let signupRequests = 0;
    let resendRequests = 0;
    await context.route("**/api/backend/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/signup")) {
        signupRequests += 1;
        await route.fulfill({ json: { id: 27, email, is_verified: false } });
      } else if (url.pathname.endsWith("/auth/refresh")) {
        await route.fulfill({ json: { access_token: "mock-verification-session" } });
      } else if (url.pathname.endsWith("/auth/verification/status")) {
        await route.fulfill({
          json: { account_id: 27, email, email_verified: verified, account_verified: verified },
        });
      } else if (url.pathname.endsWith("/auth/verification/email/confirm")) {
        expect(route.request().postDataJSON()).toEqual({ token: "test-email-token" });
        verified = true;
        await route.fulfill({ json: { account_id: 27, message: "Email verified." } });
      } else if (url.pathname.endsWith("/auth/verification/email/request")) {
        resendRequests += 1;
        await route.fulfill({ json: { message: "Email sent." } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto("/signup");
    await page.locator("#signup-display-name").fill("کاربر آزمایشی");
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-password").fill("A long test-only passphrase");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "ثبت نام", exact: true }).click();
    await expect(page).toHaveURL(/\/verify-account\?signup=1$/);
    await expect(page.getByRole("heading", { name: "صندوق ایمیلت را چک کن" })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    expect(signupRequests).toBe(1);
    expect(resendRequests).toBe(0);

    const emailTab = await context.newPage();
    const confirmationUrl = new URL("/verify-account?email_token=test-email-token", page.url());
    await emailTab.setContent(`<a href="${confirmationUrl.href}">تأیید حساب</a>`);
    await emailTab.getByRole("link", { name: "تأیید حساب" }).click();
    await expect(emailTab).toHaveURL("/");
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page).toHaveURL("/");
    expect(resendRequests).toBe(0);
  });

  test("an unfinished signup can be verified on the same page and later logins skip verification", async ({ page }) => {
    const email = "verify-code@example.com";
    const code = "q".repeat(43);
    let verified = false;
    let resendRequests = 0;
    await page.route("**/api/backend/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/login/access-token") || path.endsWith("/auth/refresh")) {
        await route.fulfill({ json: { access_token: "mock-session", requires_verification: !verified } });
      } else if (path.endsWith("/auth/verification/status")) {
        await route.fulfill({ json: { account_id: 32, email, email_verified: verified, account_verified: verified } });
      } else if (path.endsWith("/auth/verification/email/confirm")) {
        expect(route.request().postDataJSON()).toEqual({ token: code });
        verified = true;
        await route.fulfill({ json: { account_id: 32 } });
      } else if (path.endsWith("/auth/verification/email/request")) {
        resendRequests += 1;
        await route.fulfill({ json: { message: "Email requested." } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    const login = async () => {
      await page.goto("/login");
      await page.locator("#login-email").fill(email);
      await page.locator("#login-password").fill("A long test-only passphrase");
      await page.getByRole("button", { name: "ورود", exact: true }).click();
    };

    await login();
    await expect(page.getByRole("heading", { name: "ثبت‌نامت را کامل کن" })).toBeVisible();
    await expect(page.getByText(/می‌توانی این صفحه را باز بگذاری/)).toHaveCount(0);
    await page.getByText("لینک باز نمی‌شود؟", { exact: true }).click();
    await page.getByLabel("کد تأیید داخل ایمیل").fill(code);
    await page.getByRole("button", { name: "تأیید حساب", exact: true }).click();
    await expect(page).toHaveURL("/");

    await login();
    await expect(page).toHaveURL("/");
    expect(resendRequests).toBe(0);
  });

  test("email confirmation asks for login in a browser without the account session", async ({ page }) => {
    await page.route("**/api/backend/auth/verification/email/confirm", (route) =>
      route.fulfill({ json: { account_id: 27, message: "Email verified." } }));
    await page.route("**/api/backend/auth/refresh", (route) =>
      route.fulfill({ status: 401, json: { detail: "Session expired" } }));

    await page.goto("/verify-account?email_token=test-email-token");
    await expect(page).toHaveURL(/\/login\?email_verified=1$/);
    await expect(page.getByText("ایمیل با موفقیت تأیید شد. حالا وارد حسابت شو.", { exact: true })).toBeVisible();
  });

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
    await expect(page.locator("#signup-phone")).toHaveCount(0);
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
