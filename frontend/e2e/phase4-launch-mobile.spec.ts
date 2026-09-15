import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const MOBILE_PROJECTS = new Set(["mobile-chromium", "mobile-webkit"]);

test.describe.configure({ mode: "serial", timeout: 60_000 });

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => Math.max(
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
    document.body.scrollWidth - document.body.clientWidth,
  ));
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectAccessibleTapTargets(page: Page) {
  const violations = await page
    .locator("button, input, select, textarea, [role='button'], a[href]")
    .evaluateAll((elements) => elements.flatMap((element) => {
      const node = element as HTMLElement;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const visible = rect.width > 0
        && rect.height > 0
        && style.display !== "none"
        && style.visibility !== "hidden";
      const exempt = node.dataset.inlineAction === "true"
        || (node.tagName === "A" && style.display === "inline")
        || Boolean(node.closest("nextjs-portal"));
      if (!visible || exempt || (rect.width + 0.5 >= 44 && rect.height + 0.5 >= 44)) return [];
      return [{
        tag: node.tagName,
        label: node.getAttribute("aria-label") || node.textContent?.trim().slice(0, 40) || "unlabelled",
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }];
    }));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

async function expectNoAutomaticWcagViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(!MOBILE_PROJECTS.has(testInfo.project.name), "launch stage 4 is a mobile-only gate");
});

test("login validation errors are announced and associated with their fields", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  const email = page.locator("#login-email:visible");
  const password = page.locator("#login-password:visible");

  await email.fill("not-an-email");
  await expect(email).toHaveValue("not-an-email");
  await page.getByRole("button", { name: "ورود", exact: true }).click();

  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "login-email-error");
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await expect(password).toHaveAttribute("aria-describedby", "login-password-error");
  await expect(page.locator("#login-email-error:visible")).toHaveAttribute("role", "alert");
  await expect(page.locator("#login-password-error:visible")).toHaveAttribute("role", "alert");
  await expect(page.locator("#login-email-error:visible")).toContainText("ساختار درست");
  await expect(page.locator("#login-password-error:visible")).toContainText("رمز عبور را وارد کن");

  await expectAccessibleTapTargets(page);
  await expectNoHorizontalOverflow(page);
  await expectNoAutomaticWcagViolations(page);
});

test("published lesson remains usable through rotation, 200% zoom and iOS-style fullscreen back", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value() {},
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value() { return Promise.resolve(); },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value() {},
    });
    Object.defineProperty(HTMLMediaElement.prototype, "canPlayType", {
      configurable: true,
      value() { return "probably"; },
    });
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    // The Playwright WebKit build has no proprietary MP4 decoder. Keep this
    // interaction test focused on our player controls rather than host codecs.
    window.addEventListener("error", (event) => {
      if (event.target instanceof HTMLMediaElement) event.stopImmediatePropagation();
    }, true);
  });

  let playbackRequestCount = 0;
  await page.route("**/api/backend/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/backend/, "");
    if (path === "/auth/refresh") return json(route, { access_token: "stage4-mobile-token" });
    if (path === "/admin/me") return json(route, { is_admin: false });
    if (path === "/notifications/latest") return json(route, []);
    if (path === "/courses/44") {
      return json(route, {
        id: 44,
        title: "دورهٔ مصنوعی مرحلهٔ چهار",
        description: "دادهٔ بدون اطلاعات شخصی برای آزمون موبایل",
        level: "مقدماتی",
        sections: [{
          id: 5,
          title: "بخش نمونه",
          lessons: [{ id: 77, title: "درس آزمایشی موبایل", duration_minutes: 2, is_free: true }],
        }],
      });
    }
    if (path === "/courses/lessons/77/playback") {
      playbackRequestCount += 1;
      return json(route, {
        lesson: { id: 77, course_id: 44, title: "درس آزمایشی موبایل", duration_seconds: 120 },
        media: {
          id: 12,
          playback_url: `/api/v1/media/assets/12/content?lesson_id=77&subject_id=10&expires=2051222400&signature=${"a".repeat(43)}`,
          playback_type: "mp4",
          poster_url: null,
          expires_at: "2035-01-01T00:00:00Z",
        },
        entitlement: { required: false, granted: true, reason: null },
        subtitles: [{
          id: 31,
          language: "fa-IR",
          format: "json",
          version: 1,
          status: "published",
          quality_status: "valid",
          quality_score: 100,
          quality_report: { warnings: [] },
          cues: [{ id: 1, start: 0, end: 3, zh_text: "你好", pinyin: "nǐ hǎo", target_text: "سلام" }],
        }],
      });
    }
    if (path === "/media/assets/12/content") {
      return route.fulfill({
        status: 307,
        headers: { location: "/assets/chinverse/logos/logonomy-1771069751778.mp4" },
      });
    }
    if (path === "/vocabulary/matches") return json(route, { matches: [[]] });
    return json(route, { detail: `Unhandled stage-four mobile mock: ${path}` }, 404);
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/watch/hsk/44?lesson=77", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "درس آزمایشی موبایل" })).toBeVisible();
  await expect(page.getByText("همگام‌سازی تأییدشده")).toBeVisible();
  await expect(page.locator(".lesson-video-shell [role='status']")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByLabel("ویدیوی درس درس آزمایشی موبایل")).toHaveAttribute("playsinline", "");
  await expect.poll(() => playbackRequestCount).toBe(1);
  await expectNoHorizontalOverflow(page);
  await expectAccessibleTapTargets(page);
  await expectNoAutomaticWcagViolations(page);

  const videoShell = page.locator(".lesson-video-shell:visible");
  await videoShell.getByRole("button", { name: "تمام صفحه" }).click();
  await expect(videoShell).toHaveAttribute("data-pseudo-fullscreen", "true");
  await expect(page.locator("html")).toHaveAttribute("data-media-fullscreen", "true");

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator("html")).toHaveAttribute("data-orientation", "landscape");
  await expectNoHorizontalOverflow(page);

  await page.goBack();
  await expect(videoShell).not.toHaveAttribute("data-pseudo-fullscreen", "true");
  await expect(page).toHaveURL(/\/watch\/hsk\/44\?lesson=77$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await expect(page.getByRole("heading", { name: "درس آزمایشی موبایل" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("disabled paid subscription route remains unavailable on mobile staging", async ({ page }) => {
  await page.goto("/settings/subscription");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "تنظیمات" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectAccessibleTapTargets(page);
  await expectNoAutomaticWcagViolations(page);
});
