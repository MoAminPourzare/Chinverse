import { describe, expect, it } from "vitest";
import { isValidRequestId, resolveRequestId } from "@/lib/requestId";

describe("request ID contract", () => {
    it("preserves a bounded, log-safe incoming ID", () => {
        const uuid = "123e4567-e89b-12d3-a456-426614174000";
        expect(isValidRequestId(uuid)).toBe(true);
        expect(resolveRequestId(uuid, () => "fallback-id")).toBe(uuid);
    });

    it("replaces missing, short, or log-injection values", () => {
        for (const value of [
            null,
            "tiny",
            "web.01HZZY3V5R4C9Q0A",
            "bad\nforged-header",
            "x".repeat(129),
        ]) {
            expect(resolveRequestId(value, () => "generated-request-id")).toBe("generated-request-id");
        }
    });
});
