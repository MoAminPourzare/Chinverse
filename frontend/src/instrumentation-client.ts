import * as Sentry from "@sentry/nextjs";
import { sentryRuntimeOptions } from "@/lib/sentryPolicy";

const enabled = process.env.NEXT_PUBLIC_SENTRY_ENABLED?.trim().toLowerCase() === "true";

Sentry.init(sentryRuntimeOptions({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled,
  environment: process.env.NEXT_PUBLIC_DEPLOYMENT_TIER ?? "staging",
  release: process.env.NEXT_PUBLIC_RELEASE_SHA,
}));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
