import { afterEach, describe, expect, it, vi } from "vitest";
import {
    fetchUpstreamWithPolicy,
    resolveBackendProxyUploadTimeoutMs,
    UpstreamTimeoutError,
} from "@/lib/backendProxyPolicy";

describe("backend proxy request policy", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("retries an idempotent transient response once", async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(null, { status: 503 }))
            .mockResolvedValueOnce(new Response("ok", { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);

        const pending = fetchUpstreamWithPolicy("https://api.example.test/health", { method: "GET" }, {
            maxRetries: 1,
        });
        await vi.advanceTimersByTimeAsync(1_000);
        const response = await pending;

        expect(response.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("returns a throttled response when Retry-After exceeds its retry budget", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, {
            status: 429,
            headers: { "Retry-After": "60" },
        }));
        vi.stubGlobal("fetch", fetchMock);

        const response = await fetchUpstreamWithPolicy("https://api.example.test/health", {
            method: "GET",
        }, { maxRetries: 1 });

        expect(response.status).toBe(429);
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("does not retry by default so the browser remains the sole retry owner", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
        vi.stubGlobal("fetch", fetchMock);

        const response = await fetchUpstreamWithPolicy("https://api.example.test/health", { method: "GET" });

        expect(response.status).toBe(503);
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("never automatically replays a state-changing request", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
        vi.stubGlobal("fetch", fetchMock);

        const response = await fetchUpstreamWithPolicy("https://api.example.test/messages", { method: "POST" });
        expect(response.status).toBe(503);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("turns a response-header deadline into a typed timeout", async () => {
        vi.useFakeTimers();
        vi.stubGlobal("fetch", vi.fn((_input, init?: RequestInit) => new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })));

        const pending = fetchUpstreamWithPolicy("https://api.example.test/slow", { method: "GET" }, {
            timeoutMs: 1_000,
            maxRetries: 0,
        });
        const assertion = expect(pending).rejects.toBeInstanceOf(UpstreamTimeoutError);
        await vi.advanceTimersByTimeAsync(1_001);
        await assertion;
    });

    it("keeps a separate bounded response deadline for streaming uploads", () => {
        expect(resolveBackendProxyUploadTimeoutMs()).toBe(120_000);
        expect(resolveBackendProxyUploadTimeoutMs("10000")).toBe(10_000);
        expect(resolveBackendProxyUploadTimeoutMs("300000")).toBe(300_000);
        expect(resolveBackendProxyUploadTimeoutMs("5000")).toBe(120_000);
        expect(resolveBackendProxyUploadTimeoutMs("999999")).toBe(120_000);
    });
});
