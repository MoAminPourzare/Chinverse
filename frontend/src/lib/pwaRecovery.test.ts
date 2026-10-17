import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { pwaRecoveryScript } from "@/lib/pwaRecovery";
import { GET } from "@/app/api/pwa/recover/route";

describe("PWA recovery", () => {
    it("removes only this application's worker and public shell caches without reading account storage", async () => {
        const removeOwn = vi.fn().mockResolvedValue(true);
        const removeOther = vi.fn();
        const registrations = [
            { scope: "https://app.example/", active: { scriptURL: "https://app.example/sw.js?release=old" }, unregister: removeOwn },
            { scope: "https://app.example/other/", active: { scriptURL: "https://app.example/other/sw.js" }, unregister: removeOther },
            { scope: "https://app.example/", active: { scriptURL: "https://app.example/another-worker.js" }, unregister: removeOther },
        ];
        const deleteCache = vi.fn().mockResolvedValue(true);
        const replace = vi.fn();
        const status = { textContent: "" };
        const retry = { hidden: false, addEventListener: vi.fn() };
        await runInNewContext(pwaRecoveryScript, {
            URL,
            window: { location: { origin: "https://app.example", replace }, caches: {} },
            navigator: { serviceWorker: { getRegistrations: vi.fn().mockResolvedValue(registrations) } },
            caches: { keys: vi.fn().mockResolvedValue(["chinverse-shell-old", "another-app-cache"]), delete: deleteCache },
            document: { getElementById: (id: string) => id === "recovery-status" ? status : retry },
        });
        expect(removeOwn).toHaveBeenCalledOnce();
        expect(removeOther).not.toHaveBeenCalled();
        expect(deleteCache).toHaveBeenCalledExactlyOnceWith("chinverse-shell-old");
        expect(replace).toHaveBeenCalledWith("/");
        expect(retry.hidden).toBe(true);
    });
    it("keeps a failed recovery on screen with a retry, rather than entering a reload loop", async () => {
        const replace = vi.fn();
        const status = { textContent: "" };
        const retry = { hidden: true, addEventListener: vi.fn() };
        await runInNewContext(pwaRecoveryScript, {
            window: { location: { origin: "https://app.example", replace } },
            navigator: { serviceWorker: { getRegistrations: vi.fn().mockRejectedValue(new Error("unavailable")) } },
            document: { getElementById: (id: string) => id === "recovery-status" ? status : retry },
        });
        expect(replace).not.toHaveBeenCalled();
        expect(retry.hidden).toBe(false);
        expect(status.textContent).toContain("دوباره تلاش کن");
    });
    it("serves both recovery resources without caching, executable inline scripts or an open redirect", async () => {
        const document = GET(new Request("https://app.example/api/pwa/recover?next=https://untrusted.example"));
        const html = await document.text();
        expect(document.headers.get("cache-control")).toContain("no-store");
        expect(document.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
        expect(html).toContain('src="/api/pwa/recover?asset=script"');
        expect(html).not.toContain("untrusted.example");
        const script = GET(new Request("https://app.example/api/pwa/recover?asset=script"));
        expect(script.headers.get("cache-control")).toContain("no-store");
        expect(script.headers.get("content-type")).toContain("application/javascript");
        expect(await script.text()).toBe(pwaRecoveryScript);
    });
});
