import { expect, test } from "@playwright/test";

const isProductionServer =
  process.env.PLAYWRIGHT_SERVER_MODE === "production" || Boolean(process.env.CI);
const candidateOldRelease = "a".repeat(40);

test.describe.configure({ mode: "serial" });

test("PWA assets expose an installable, release-scoped and private-cache-safe contract", async ({ request }) => {
  const manifestResponse = await request.get("/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    id: "/",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    lang: "fa-IR",
    dir: "rtl",
  });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/android-chrome-192x192.png", sizes: "192x192" }),
    expect.objectContaining({ src: "/android-chrome-512x512.png", sizes: "512x512" }),
  ]));
  expect(manifest.display_override).toBeUndefined();

  const workerResponse = await request.get(`/sw.js?release=${"a".repeat(40)}`);
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["content-type"]).toContain("javascript");
  const worker = await workerResponse.text();
  expect(worker).toContain('workerUrl.searchParams.get("release")');
  expect(worker).toContain('const OFFLINE_URL = "/offline.html"');
  expect(worker).toContain('return ["/api", "/uploads", "/static/uploads", "/_private-media", "/media"]');

  const offlineResponse = await request.get("/offline.html");
  expect(offlineResponse.ok()).toBe(true);
  const offline = await offlineResponse.text();
  expect(offline).toContain('href="/offline.css"');
  expect(offline).not.toMatch(/<script\b/i);
  expect((await request.get("/offline.css")).ok()).toBe(true);
});

test("Chromium install events drive the install UI without persisting browser events", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "beforeinstallprompt is a Chromium contract");
  await page.goto("/settings/app");
  await page.evaluate(() => {
    const promptEvent = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    Object.defineProperty(promptEvent, "prompt", {
      value: async () => {
        const testWindow = window as Window & { __pwaPromptCalls?: number };
        testWindow.__pwaPromptCalls = (testWindow.__pwaPromptCalls || 0) + 1;
      },
    });
    Object.defineProperty(promptEvent, "userChoice", {
      value: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    window.dispatchEvent(promptEvent);
  });

  const installButton = page.getByRole("button", { name: "نصب برنامه" });
  await expect(installButton).toBeVisible();
  await installButton.click();
  await expect.poll(() => page.evaluate(
    () => (window as Window & { __pwaPromptCalls?: number }).__pwaPromptCalls || 0,
  )).toBe(1);
  await expect(installButton).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByText("چین‌ورس روی این دستگاه به‌صورت standalone اجرا شده است.")).toBeVisible();
});

test("WebKit iPhone profile receives explicit Safari installation guidance", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "iOS installation guidance belongs to the WebKit profile");
  await page.goto("/settings/app");
  await expect(page.getByText("Safari → Share → Add to Home Screen")).toBeVisible();
  await expect(page.getByRole("button", { name: "نصب برنامه" })).toHaveCount(0);
});

test("production worker isolates caches, updates atomically and serves the standalone fallback", async ({ page, context, browserName }) => {
  test.skip(!isProductionServer, "requires a production service worker");

  await page.goto("/offline.html");
  const authoritativeRelease = await page.evaluate(async () => {
    const response = await fetch("/api/health", { cache: "no-store" });
    const payload = await response.json() as { release?: unknown };
    const raw = typeof payload.release === "string" ? payload.release.toLowerCase() : "local";
    return /^[0-9a-f]{7,64}$/.test(raw) ? raw : "local";
  });

  if (browserName === "chromium") {
    const oldRelease = authoritativeRelease === candidateOldRelease ? "c".repeat(40) : candidateOldRelease;
    await page.evaluate(async (release) => {
      await navigator.serviceWorker.register(`/sw.js?release=${release}`, {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
    }, oldRelease);
    await page.waitForFunction((release) =>
      navigator.serviceWorker.controller?.scriptURL.includes(`release=${release}`) || false, oldRelease);
  }

  await page.evaluate(async () => {
    const legacy = await caches.open("workbox-legacy-private");
    await legacy.put("/api/backend/private.jpg", new Response("private-data"));
  });

  await page.goto("/settings/app");
  if (browserName === "chromium") {
    await expect(page.getByText("نسخهٔ تازه آماده است.")).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "به‌روزرسانی", exact: true }).click(),
    ]);
  } else {
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
  }
  await page.waitForFunction(async (release) => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return Boolean(
      registration?.active?.state === "activated"
      && registration.active.scriptURL.includes(`release=${release}`)
      && navigator.serviceWorker.controller?.scriptURL.includes(`release=${release}`),
    );
  }, authoritativeRelease);
  const workerState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const scriptUrl = registration?.active?.scriptURL || "";
    const scriptRelease = scriptUrl ? new URL(scriptUrl).searchParams.get("release") : null;
    const cacheKeys = await caches.keys();
    const cacheName = scriptRelease ? `chinverse-shell-${scriptRelease}` : "";
    const shellCache = cacheName ? await caches.open(cacheName) : null;
    return {
      controlled: Boolean(navigator.serviceWorker.controller),
      activeState: registration?.active?.state,
      scriptRelease,
      cacheName,
      cacheKeys,
      offlineCached: Boolean(await shellCache?.match("/offline.html")),
      stylesheetCached: Boolean(await shellCache?.match("/offline.css")),
    };
  });
  expect(workerState.controlled).toBe(true);
  expect(workerState.activeState, JSON.stringify(workerState)).toBe("activated");
  expect(workerState.scriptRelease).toBe(authoritativeRelease);
  expect(workerState.cacheKeys).toEqual([workerState.cacheName]);
  expect(workerState.offlineCached).toBe(true);
  expect(workerState.stylesheetCached).toBe(true);
  if (browserName !== "chromium") return;

  const runtimeProbe = `/android-chrome-192x192.png?runtime-probe=${Date.now()}`;
  const runtimeState = await page.evaluate(async (probe) => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const release = new URL(registration?.active?.scriptURL || location.href).searchParams.get("release") || "local";
    const currentCacheName = `chinverse-shell-${release}`;
    const legacy = await caches.open("workbox-legacy-static");
    await legacy.put(probe, new Response("legacy-response", { headers: { "Content-Type": "text/plain" } }));

    const response = await fetch(probe, { cache: "reload" });
    await response.arrayBuffer();
    await fetch(`/api/health?cache-probe=${Date.now()}`, { cache: "no-store" });
    await fetch(`/uploads/private-probe.png?cache-probe=${Date.now()}`, { cache: "no-store" });

    const current = await caches.open(currentCacheName);
    const allCachedUrls = (await Promise.all((await caches.keys()).map(async (key) =>
      (await (await caches.open(key)).keys()).map((request) => request.url),
    ))).flat();
    return {
      contentType: response.headers.get("content-type"),
      writtenBeforeFetchSettled: Boolean(await current.match(probe)),
      hasSensitiveEntry: allCachedUrls.some((value) => {
        const path = new URL(value).pathname;
        return path === "/api" || path.startsWith("/api/") || path === "/uploads" || path.startsWith("/uploads/");
      }),
    };
  }, runtimeProbe);
  expect(runtimeState.contentType).toContain("image/png");
  expect(runtimeState.writtenBeforeFetchSettled).toBe(true);
  expect(runtimeState.hasSensitiveEntry).toBe(false);
  await page.evaluate(async () => {
    await caches.delete("workbox-legacy-static");
  });
  expect(await page.evaluate(async () => caches.keys())).toEqual([workerState.cacheName]);

  try {
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "اتصال اینترنت در دسترس نیست" })).toBeVisible();
    expect(await page.locator('link[href="/offline.css"]').count()).toBe(1);
    expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
    const cardBackground = await page.locator(".offline-card").evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(cardBackground).not.toBe("rgba(0, 0, 0, 0)");
  } finally {
    await context.setOffline(false);
  }
});
