import * as Sentry from "@sentry/nextjs";
import { sentryRuntimeOptions } from "@/lib/sentryPolicy";

const enabled = process.env.SENTRY_ENABLED?.trim().toLowerCase() === "true";

Sentry.init(sentryRuntimeOptions({
  dsn: process.env.SENTRY_DSN,
  enabled,
  environment: process.env.NEXT_PUBLIC_DEPLOYMENT_TIER ?? "staging",
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_RELEASE_SHA,
}));
