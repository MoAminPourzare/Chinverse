import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = resolve(process.cwd(), "next.config.js");
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
const originalCdnUrl = process.env.NEXT_PUBLIC_IMAGE_CDN_URL;

afterEach(() => {
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    if (originalCdnUrl === undefined) delete process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
    else process.env.NEXT_PUBLIC_IMAGE_CDN_URL = originalCdnUrl;
    delete require.cache[require.resolve(configPath)];
});

describe("Next image cache contract", () => {
    it("allowlists public local media without exposing private BFF media", () => {
        const config = readFileSync(configPath, "utf8");
        expect(config).toContain("{ pathname: '/assets/**' }");
        expect(config).toContain("{ pathname: '/api/backend/media/public-images/**' }");
        expect(config).not.toContain("{ pathname: '/api/backend/media/assets/**' }");
    });

    it("never grants the API origin an origin-wide optimizer pattern", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/api/v1";
        process.env.NEXT_PUBLIC_IMAGE_CDN_URL = "https://api.example.test";
        delete require.cache[require.resolve(configPath)];

        const config = require(configPath) as {
            images: { remotePatterns: Array<{ hostname: string; pathname: string }> };
        };
        const apiPatterns = config.images.remotePatterns.filter(
            (pattern) => pattern.hostname === "api.example.test",
        );

        expect(apiPatterns.map((pattern) => pattern.pathname)).toEqual([
            "/assets/**",
            "/uploads/**",
            "/static/uploads/**",
            "/api/v1/media/public-images/**",
        ]);
        expect(apiPatterns).not.toContainEqual(expect.objectContaining({ pathname: "/**" }));
    }, 20_000);
});
