import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("HLS bundle loading policy", () => {
    it("keeps hls.js behind a dynamic import for native-HLS browsers", () => {
        const sourcePath = resolve(process.cwd(), "src/app/watch/[domain]/[courseId]/page.tsx");
        const source = readFileSync(sourcePath, "utf8");

        expect(source).toContain('void import("hls.js")');
        expect(source).not.toMatch(/^import\s+.*from\s+["']hls\.js["']/m);
        expect(source.indexOf('canPlayType("application/vnd.apple.mpegurl")'))
            .toBeLessThan(source.indexOf('void import("hls.js")'));
    });
});
