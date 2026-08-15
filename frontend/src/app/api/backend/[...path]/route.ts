import { NextRequest, NextResponse } from "next/server";
import { isStateChangingMethod, isTrustedMutationOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1";
const REQUEST_HEADERS = [
    "accept",
    "authorization",
    "content-length",
    "content-type",
    "cookie",
    "user-agent",
    "if-match",
    "if-modified-since",
    "if-none-match",
    "if-range",
    "if-unmodified-since",
    "range",
    "x-mfa-code",
    "x-turnstile-token",
];
const RESPONSE_HEADERS = [
    "cache-control",
    "content-disposition",
    "content-language",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
    "accept-ranges",
    "retry-after",
];
const MEDIA_PROVIDER_REQUEST_HEADERS = [
    "accept",
    "if-match",
    "if-modified-since",
    "if-none-match",
    "if-range",
    "if-unmodified-since",
    "range",
    "user-agent",
];

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
    const fetchSite = request.headers.get("sec-fetch-site");
    if (
        !isTrustedMutationOrigin({
            method: request.method,
            expectedOrigin: request.nextUrl.origin,
            origin: request.headers.get("origin"),
            referer: request.headers.get("referer"),
        })
        || (isStateChangingMethod(request.method) && fetchSite === "cross-site")
    ) {
        return NextResponse.json(
            { detail: "Cross-origin request rejected" },
            { status: 403, headers: { "Cache-Control": "no-store" } },
        );
    }

    const { path } = await context.params;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    const upstreamUrl = new URL(`${apiBase}/${path.map(encodeURIComponent).join("/")}`);
    upstreamUrl.search = request.nextUrl.search;

    const headers = new Headers();
    for (const name of REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }
    headers.set("origin", request.headers.get("origin") || request.nextUrl.origin);

    let upstream: Response;
    try {
        const hasBody = !["GET", "HEAD"].includes(request.method) && request.body !== null;
        const upstreamRequest: RequestInit & { duplex?: "half" } = {
            method: request.method,
            headers,
            body: hasBody ? request.body : undefined,
            cache: "no-store",
            redirect: "manual",
            signal: request.signal,
        };
        if (hasBody) upstreamRequest.duplex = "half";
        upstream = await fetch(upstreamUrl, upstreamRequest);

        // The backend may resolve an entitlement-checked media token to a
        // short-lived object-storage URL. Follow it server-side so the
        // provider URL never reaches the browser and Range remains streamable.
        const isMediaContent = path.length === 4
            && path[0] === "media"
            && path[1] === "assets"
            && /^\d+$/.test(path[2])
            && path[3] === "content";
        if (isMediaContent && upstream.status >= 300 && upstream.status < 400) {
            const location = upstream.headers.get("location");
            if (!location) throw new Error("Media redirect did not include a location");
            const providerUrl = new URL(location, upstreamUrl);
            const production = process.env.NEXT_PUBLIC_DEPLOYMENT_TIER?.trim().toLowerCase() === "production";
            if (!/^https?:$/.test(providerUrl.protocol) || (production && providerUrl.protocol !== "https:")) {
                throw new Error("Media provider redirect is not secure");
            }
            const providerHeaders = new Headers();
            for (const name of MEDIA_PROVIDER_REQUEST_HEADERS) {
                const value = request.headers.get(name);
                if (value) providerHeaders.set(name, value);
            }
            upstream = await fetch(providerUrl, {
                method: request.method,
                headers: providerHeaders,
                cache: "no-store",
                redirect: "follow",
                signal: request.signal,
            });
        }
    } catch {
        return NextResponse.json(
            { detail: "Backend is temporarily unavailable" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
        );
    }

    const responseHeaders = new Headers();
    for (const name of RESPONSE_HEADERS) {
        const value = upstream.headers.get(name);
        if (value) responseHeaders.set(name, value);
    }
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("pragma", "no-cache");

    return new NextResponse(upstream.status === 204 || request.method === "HEAD" ? null : upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
    });
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
