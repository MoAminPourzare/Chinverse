import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("BFF observability contract", () => {
    it("forwards and returns the same sanitized request ID on success and failures", () => {
        const routePath = resolve(process.cwd(), "src/app/api/backend/[...path]/route.ts");
        const source = readFileSync(routePath, "utf8");

        expect(source).toContain('headers.set("x-request-id", requestId)');
        expect(source).toContain('responseHeaders.set("x-request-id", requestId)');
        expect(source.match(/"X-Request-ID": requestId/g)).toHaveLength(2);
        expect(source).not.toContain("request.text(");
        expect(source).not.toContain("request.json(");
        expect(source.match(/maxRetries: 0/g)).toHaveLength(2);
        expect(source).not.toContain("x-chinverse-retry-attempt");
        expect(source).toContain('headers.get("content-encoding")');
        expect(source).toContain('name === "content-length" && hasDecodedTransferBody(upstream.headers)');
    });
});
