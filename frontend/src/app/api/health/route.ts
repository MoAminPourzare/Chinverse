import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "chinverse-web",
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
