import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getServiceWorkerUrl, normalizePwaRelease } from "@/components/pwa/PwaProvider";

describe("PWA public contracts", () => {
    it("ships an installable RTL manifest", () => {
        const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/manifest.json"), "utf8"));
        expect(manifest).toMatchObject({
            id: "/",
            start_url: "/?source=pwa",
            scope: "/",
            display: "standalone",
            lang: "fa-IR",
            dir: "rtl",
        });
        expect(manifest.icons).toEqual(expect.arrayContaining([
            expect.objectContaining({ sizes: "192x192", purpose: "any" }),
            expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        ]));
        expect(manifest.display_override).toBeUndefined();
    });

    it("binds each production worker URL to an immutable release SHA", () => {
        const release = "A".repeat(40);
        expect(normalizePwaRelease(release)).toBe(release.toLowerCase());
        expect(normalizePwaRelease("branch/name")).toBe("local");
        expect(getServiceWorkerUrl(release)).toBe(`/sw.js?release=${release.toLowerCase()}`);
    });

    it("ships a script-free standalone offline fallback", () => {
        const html = readFileSync(resolve(process.cwd(), "public/offline.html"), "utf8");
        const css = readFileSync(resolve(process.cwd(), "public/offline.css"), "utf8");
        expect(html).toContain('lang="fa-IR"');
        expect(html).toContain('href="/offline.css"');
        expect(html).toContain("اتصال اینترنت در دسترس نیست");
        expect(html).not.toMatch(/<script\b/i);
        expect(css).toContain("env(safe-area-inset-bottom)");
        expect(css).toContain("prefers-color-scheme: dark");
    });

    it("keeps authenticated API and navigation responses out of the release cache", () => {
        const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
        expect(worker).toContain('workerUrl.searchParams.get("release")');
        expect(worker).toContain('const OFFLINE_URL = "/offline.html"');
        expect(worker).toContain('return ["/api", "/uploads", "/static/uploads", "/_private-media", "/media"]');
        expect(worker).toContain('event.request.mode === "navigate"');
        expect(worker).toContain("shellCache.match(OFFLINE_URL");
        expect(worker).toContain("const cached = await cache.match(request)");
        expect(worker).toContain("await cache.put(request, response.clone())");
        expect(worker).toContain("keys.filter((key) => key !== CACHE_VERSION)");
        expect(worker).not.toContain("caches.match(event.request)");
        expect(worker).not.toMatch(/\bvoid\s+cache/);
    });
});
