import { NextResponse } from "next/server";
import { releaseConfig } from "@/config/release";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "chinverse-web",
      deployment_tier: releaseConfig.deploymentTier,
      indexable: releaseConfig.isPublicRelease,
      release:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.GITHUB_SHA ??
        "local",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
