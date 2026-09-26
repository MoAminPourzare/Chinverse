import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcagRoutes = [
  "/login",
  "/signup",
  "/settings",
  "/settings/appearance",
  "/settings/app",
  "/legal/terms",
  "/offline",
];

test.describe.configure({ mode: "serial" });

for (const route of wcagRoutes) {
  test(`${route} has no automatically detectable WCAG 2.2 A/AA violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude("nextjs-portal")
      .analyze();

    const violations = result.violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target),
    }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}

for (const route of ["/login", "/settings/appearance"]) {
  test(`${route} passes the same WCAG gate in dark mode`, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("chinverse.learningPreferences.v1", JSON.stringify({ theme: "dark" }));
    });
    await page.goto(route);
    await expect(page.locator("html")).toHaveClass(/dark/);

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude("nextjs-portal")
      .analyze();
    expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
  });
}
