import { describe, expect, it } from "vitest";
import { buildBackendUpstreamUrl } from "./backendProxyUrl";

describe("buildBackendUpstreamUrl", () => {
    const apiBase = "https://api.example.com/api/v1";

    it("preserves a trailing slash required by collection routes", () => {
        const requestUrl = new URL("https://preview.example.com/api/backend/courses/?subcategory_slug=hsk");
        const result = buildBackendUpstreamUrl(apiBase, ["courses"], requestUrl);

        expect(result.href).toBe("https://api.example.com/api/v1/courses/?subcategory_slug=hsk");
    });

    it("does not add a trailing slash to item routes", () => {
        const requestUrl = new URL("https://preview.example.com/api/backend/users/me");
        const result = buildBackendUpstreamUrl(apiBase, ["users", "me"], requestUrl);

        expect(result.href).toBe("https://api.example.com/api/v1/users/me");
    });

    it("encodes path segments without changing the query string", () => {
        const requestUrl = new URL("https://preview.example.com/api/backend/search?term=%E4%BD%A0%E5%A5%BD");
        const result = buildBackendUpstreamUrl(`${apiBase}/`, ["search", "a b"], requestUrl);

        expect(result.href).toBe("https://api.example.com/api/v1/search/a%20b?term=%E4%BD%A0%E5%A5%BD");
    });
});
