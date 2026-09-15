import * as Sentry from "@sentry/nextjs";
import { sentryRuntimeOptions } from "@/lib/sentryPolicy";

const enabled = process.env.SENTRY_ENABLED?.trim().toLowerCase() === "true";
const environment = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER ?? "staging";

Sentry.init(sentryRuntimeOptions({
  dsn: process.env.SENTRY_DSN,
  enabled,
  environment,
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_RELEASE_SHA,
}));

// A provider operator may enable this briefly to prove the live staging DSN,
// release tag, environment and scrubber end to end. It is intentionally
// impossible to activate in production and stays false by default.
if (
  enabled
  && environment.trim().toLowerCase() === "staging"
  && process.env.SENTRY_STARTUP_TEST_EVENT?.trim().toLowerCase() === "true"
) {
  Sentry.captureMessage(
    "stage3-frontend-live-check email=synthetic@example.invalid token=synthetic-only",
    "info",
  );
}
