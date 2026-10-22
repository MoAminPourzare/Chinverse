/**
 * Retained as a deterministic compatibility response for old clients.
 * Media must be requested through the entitlement-checked lesson playback
 * gateway; the former local hardcoded video endpoint is intentionally gone.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
    return new Response("Legacy first-video media is no longer available.", {
        status: 410,
        headers: { "Cache-Control": "no-store" },
    });
}
