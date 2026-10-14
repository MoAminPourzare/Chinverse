import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
function worker(fetch: ReturnType<typeof vi.fn>) {
    const listeners: Record<string, (event: unknown) => void> = {};
    const fallback = new Response("offline shell");
    const match = vi.fn().mockResolvedValue(fallback);
    const open = vi.fn().mockResolvedValue({ match });
    runInNewContext(source, {
        URL, Request, Response, fetch,
        caches: { open },
        self: { location: { href: "https://app.example/sw.js?release=abcdef1234", origin: "https://app.example" }, addEventListener: (name: string, listener: (event: unknown) => void) => { listeners[name] = listener; } },
    });
    const navigate = (path = "/settings/subscription") => {
        const respondWith = vi.fn();
        listeners.fetch({ request: { method: "GET", url: `https://app.example${path}`, mode: "navigate", destination: "document", redirect: "manual" }, respondWith });
        return respondWith;
    };
    return { navigate, open, match, fallback };
}

describe("service worker navigation", () => {
    it("preserves opaque navigation redirects instead of mistaking status 0 for offline", async () => {
        const redirect = { type: "opaqueredirect", status: 0 };
        const { navigate, open } = worker(vi.fn().mockResolvedValue(redirect));
        expect(await navigate().mock.calls[0][0]).toBe(redirect);
        expect(open).not.toHaveBeenCalled();
    });
    it.each([401, 403, 500, 503])("returns HTTP %i without claiming the internet is disconnected", async (status) => {
        const response = new Response("server response", { status });
        const { navigate, open } = worker(vi.fn().mockResolvedValue(response));
        expect(await navigate().mock.calls[0][0]).toBe(response);
        expect(open).not.toHaveBeenCalled();
    });
    it("uses only the release's offline document when the network actually fails", async () => {
        const { navigate, fallback, match } = worker(vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
        expect(await navigate().mock.calls[0][0]).toBe(fallback);
        expect(match).toHaveBeenCalledWith("/offline.html");
    });
    it("leaves the recovery document and script to the network even during a navigation failure", () => {
        const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
        const { navigate, open } = worker(fetch);
        expect(navigate("/api/pwa/recover")).not.toHaveBeenCalled();
        expect(navigate("/api/pwa/recover?asset=script")).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
    });
});
