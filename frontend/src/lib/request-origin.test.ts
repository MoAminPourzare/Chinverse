import { describe, expect, it } from "vitest";
import { isTrustedMutationOrigin } from "./request-origin";

const expectedOrigin = "https://chinverse.example";

describe("same-origin mutation protection", () => {
    it("accepts safe methods without browser origin metadata", () => {
        expect(isTrustedMutationOrigin({ method: "GET", expectedOrigin })).toBe(true);
    });

    it("accepts exact same-origin mutations", () => {
        expect(isTrustedMutationOrigin({ method: "POST", expectedOrigin, origin: expectedOrigin })).toBe(true);
        expect(isTrustedMutationOrigin({ method: "DELETE", expectedOrigin, referer: `${expectedOrigin}/profile` })).toBe(true);
    });

    it("rejects missing, malformed, and cross-origin mutation metadata", () => {
        expect(isTrustedMutationOrigin({ method: "PATCH", expectedOrigin })).toBe(false);
        expect(isTrustedMutationOrigin({ method: "POST", expectedOrigin, referer: "not-a-url" })).toBe(false);
        expect(isTrustedMutationOrigin({ method: "POST", expectedOrigin, origin: "https://evil.example" })).toBe(false);
    });
});
