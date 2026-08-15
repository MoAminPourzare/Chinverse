import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
    });

    it("keeps authenticated API and navigation responses out of runtime caches", () => {
        const worker = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
        expect(worker).toContain('url.pathname.startsWith("/api/")');
        expect(worker).toContain('event.request.mode === "navigate"');
        expect(worker).toContain("caches.match(OFFLINE_URL)");
        expect(worker).not.toMatch(/cache\.put\(event\.request[^]*mode === "navigate"/);
    });
});

