import { pwaRecoveryHtml, pwaRecoveryScript } from "@/lib/pwaRecovery";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
    const script = new URL(request.url).searchParams.get("asset") === "script";
    return new Response(script ? pwaRecoveryScript : pwaRecoveryHtml, {
        headers: {
            "Content-Type": script ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8",
            "Cache-Control": "no-store, max-age=0",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
            "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        },
    });
}
