import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const useProductionServer =
  process.env.PLAYWRIGHT_SERVER_MODE === "production" || Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /phase6-pwa\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        serviceWorkers: "block",
      },
    },
    {
      name: "mobile-chromium",
      testIgnore: /phase6-pwa\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        serviceWorkers: "block",
      },
    },
    {
      name: "mobile-webkit",
      testIgnore: /phase6-pwa\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        serviceWorkers: "block",
      },
    },
    {
      name: "pwa-mobile-chromium",
      testMatch: /phase6-pwa\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        serviceWorkers: "allow",
      },
    },
    {
      name: "pwa-mobile-webkit",
      testMatch: /phase6-pwa\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        serviceWorkers: "allow",
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: useProductionServer
          ? `npm run start -- --hostname 127.0.0.1 --port ${port}`
          : `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !useProductionServer,
        timeout: 240_000,
        env: {
          NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api/v1",
        },
      },
});
