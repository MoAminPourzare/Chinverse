export type IncompleteFeature = "subscriptions" | "referrals" | "points";

const enabled = (value: string | undefined) => value?.trim().toLowerCase() === "true";
const deploymentTier = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER?.trim().toLowerCase() || "staging";

export const releaseConfig = {
  deploymentTier,
  isPublicRelease: deploymentTier === "production",
  features: {
    subscriptions: enabled(process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS),
    referrals: enabled(process.env.NEXT_PUBLIC_FEATURE_REFERRALS),
    points: enabled(process.env.NEXT_PUBLIC_FEATURE_POINTS),
  } satisfies Record<IncompleteFeature, boolean>,
} as const;
