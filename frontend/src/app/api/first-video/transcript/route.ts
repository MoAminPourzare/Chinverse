import { NextResponse } from "next/server";

/**
 * Retained as a deterministic compatibility response for old clients.
 * Course playback and subtitles now come exclusively from the database-backed
 * lesson playback contract; no local transcript or media fallback is served.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
    return NextResponse.json(
        { detail: "Legacy first-video subtitles are no longer available." },
        { status: 410, headers: { "Cache-Control": "no-store" } },
    );
}
