import { expect, test } from "@playwright/test";

const publicRoutes = ["/login", "/settings/appearance", "/settings/app", "/offline"];

test.describe.configure({ mode: "serial" });

test.describe("mobile viewport, orientation, zoom and target-size gates", () => {
  for (const route of publicRoutes) {
    test(`${route} reflows in portrait and compact landscape`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();

      const portraitOverflow = await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth,
      ));
      expect(portraitOverflow).toBeLessThanOrEqual(1);
      await expect(page.locator("html")).toHaveAttribute("data-orientation", "portrait");

      await page.setViewportSize({ width: 844, height: 390 });
      await expect(page.locator("html")).toHaveAttribute("data-orientation", "landscape");
      const landscapeOverflow = await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth,
      ));
      expect(landscapeOverflow).toBeLessThanOrEqual(1);
    });
  }

  test("200 percent text zoom keeps authentication usable without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");

    const overflow = await page.evaluate(() => Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth,
    ));
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByLabel("رمز عبور")).toBeVisible();
    await expect(page.getByRole("button", { name: "ورود" })).toBeVisible();
  });

  test("visible non-inline controls meet the 44px tap target policy", async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      const violations = await page.locator("button, input, select, textarea, [role='button'], a[href]").evaluateAll((elements) => (
        elements.flatMap((element) => {
          const node = element as HTMLElement;
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          const isInlineLink = node.tagName === "A" && style.display === "inline";
          const isFrameworkUi = Boolean(node.closest("nextjs-portal"));
          const isFrameworkControl = node.getAttribute("aria-label") === "Open Next.js Dev Tools";
          const isExempt = node.dataset.inlineAction === "true" || isInlineLink || isFrameworkUi || isFrameworkControl;
          if (!isVisible || isExempt || (rect.width + 0.5 >= 44 && rect.height + 0.5 >= 44)) return [];
          return [{
            tag: node.tagName,
            label: node.getAttribute("aria-label") || node.textContent?.trim().slice(0, 40) || "unlabelled",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }];
        })
      ));
      expect(violations, `${route}: ${JSON.stringify(violations)}`).toEqual([]);
    }
  });
});

test("keyboard viewport keeps the focused login field visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  const password = page.getByLabel("رمز عبور");
  await password.focus();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.waitForTimeout(250);

  const box = await password.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(500);
});

test("keyboard-only navigation exposes a visible focus indicator", async ({ page }) => {
  await page.goto("/login");
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return null;
      const style = getComputedStyle(active);
      const rect = active.getBoundingClientRect();
      return {
        tag: active.tagName,
        visible: rect.width > 0 && rect.height > 0,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focus).not.toBeNull();
    expect(focus!.visible, JSON.stringify(focus)).toBe(true);
    expect(focus!.outlineStyle, JSON.stringify(focus)).not.toBe("none");
    expect(focus!.outlineWidth, JSON.stringify(focus)).toBeGreaterThanOrEqual(2);
  }
});

test("dark mode initializes before interaction and retains readable foreground/background", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme: "dark" }));
  });
  await page.goto("/settings/appearance");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(colors.color).not.toBe(colors.background);
});

test("direct entry back action remains inside ChinVerse", async ({ page }) => {
  await page.goto("/notifications");
  await page.getByRole("button", { name: "بازگشت" }).click();
  await expect(page).toHaveURL(/\/$/);
});
