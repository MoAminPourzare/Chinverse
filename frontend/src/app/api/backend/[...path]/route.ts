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
    "x-mfa-code",
    "x-turnstile-token",
];
const RESPONSE_HEADERS = [
    "cache-control",
    "content-disposition",
    "content-language",
    "content-type",
    "etag",
    "last-modified",
    "retry-after",
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

    return new NextResponse(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: responseHeaders,
    });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
