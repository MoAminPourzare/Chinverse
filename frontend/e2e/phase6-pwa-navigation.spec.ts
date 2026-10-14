import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);
const production = process.env.PLAYWRIGHT_SERVER_MODE === "production" || Boolean(process.env.CI);
const oldRelease = "f".repeat(40);
const legacyWorker = readFileSync(path.resolve("e2e/fixtures/legacy-navigation-worker.js"), "utf8");
const legacyOffline = readFileSync(path.resolve("e2e/fixtures/legacy-offline.html"), "utf8");

async function install(page: Page, release: string) {
    await page.goto("/offline.html");
    await page.evaluate(async (release) => {
        await navigator.serviceWorker.register(`/sw.js?release=${release}`, { scope: "/", updateViaCache: "none" });
        await navigator.serviceWorker.ready;
    }, release);
    await page.waitForFunction((release) => navigator.serviceWorker.controller?.scriptURL.includes(`release=${release}`), release);
}

test("active workers preserve real navigation redirects while the browser is online", async ({ page, context }) => {
    test.skip(!production, "requires a production service worker");
    await context.route("**/api/backend/**", route => route.fulfill({ json: [] }));
    await page.goto("/offline.html");
    const release = await page.evaluate(async () => (await (await fetch("/api/health")).json()).release);
    await install(page, release);
    await page.goto("/settings/subscription");
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "تنظیمات", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ارتباط با چین‌ورس برقرار نشد", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
});

test("recovery reopens a browser trapped by a legacy worker and preserves account cookies and preferences", async ({ page, context }, info) => {
    test.skip(!production, "requires a production service worker");
    await context.route("**/api/backend/**", route => route.fulfill({ json: [] }));
    await context.route(`**/sw.js?release=${oldRelease}`, route => route.fulfill({ body: legacyWorker, contentType: "application/javascript", headers: { "Cache-Control": "no-store" } }));
    await install(page, oldRelease);
    const origin = new URL(page.url()).origin;
    await context.addCookies([{ name: "pwa-recovery-account-probe", value: "preserve", url: origin, httpOnly: true }]);
    await page.evaluate(async ({ release, html }) => {
        localStorage.setItem("chinverse.recovery-test", "preserve");
        sessionStorage.setItem("chinverse.recovery-test", "preserve");
        const cache = await caches.open(`chinverse-shell-${release}`);
        await cache.put("/offline.html", new Response(html, { headers: { "Content-Type": "text/html" } }));
    }, { release: oldRelease, html: legacyOffline });
    await page.goto("/settings/subscription");
    await expect(page.getByRole("heading", { name: "اتصال اینترنت در دسترس نیست", exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    await page.goto("/api/pwa/recover", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new URL("/", origin).href);
    await expect(page.getByRole("button", { name: "فعالیت‌ها", exact: true })).toBeVisible();
    expect(await page.evaluate(() => [localStorage.getItem("chinverse.recovery-test"), sessionStorage.getItem("chinverse.recovery-test")])).toEqual(["preserve", "preserve"]);
    expect(await context.cookies()).toEqual(expect.arrayContaining([expect.objectContaining({ name: "pwa-recovery-account-probe", value: "preserve", httpOnly: true })]));
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes(`chinverse-shell-${"f".repeat(40)}`))).toBe(false);
    await page.screenshot({ path: path.resolve("../.tmp", `pwa-recovered-${info.project.name}.png`) });
});
