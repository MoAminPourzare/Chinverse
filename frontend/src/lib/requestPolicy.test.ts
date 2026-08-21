import { describe, expect, it } from "vitest";
import {
    computeBackoffDelayMs,
    isIdempotentMethod,
    isRetryableStatus,
    parseBoundedInteger,
    parseRetryAfterMs,
    waitForDelay,
} from "@/lib/requestPolicy";

describe("requestPolicy", () => {
    it("retries only safe HTTP methods and transient statuses", () => {
        expect(isIdempotentMethod("GET")).toBe(true);
        expect(isIdempotentMethod("head")).toBe(true);
        expect(isIdempotentMethod("POST")).toBe(false);
        expect(isRetryableStatus(503)).toBe(true);
        expect(isRetryableStatus(429)).toBe(true);
        expect(isRetryableStatus(404)).toBe(false);
    });

    it("bounds environment integers without shortening Retry-After", () => {
        expect(parseBoundedInteger("15000", 10, { min: 1_000, max: 20_000 })).toBe(15_000);
        expect(parseBoundedInteger("999999", 10, { min: 1_000, max: 20_000 })).toBe(10);
        expect(parseRetryAfterMs("2")).toBe(2_000);
        expect(parseRetryAfterMs("99")).toBe(99_000);
        expect(parseRetryAfterMs("invalid")).toBeNull();
    });

    it("uses capped exponential backoff and deterministic jitter", () => {
        expect(computeBackoffDelayMs({ attempt: 2, baseDelayMs: 100, random: () => 0 })).toBe(400);
        expect(computeBackoffDelayMs({ attempt: 2, baseDelayMs: 100, jitterRatio: 0.25, random: () => 1 })).toBe(500);
        expect(computeBackoffDelayMs({ attempt: 10, baseDelayMs: 100, maxDelayMs: 1_000 })).toBe(1_000);
    });

    it("allows callers to abort a pending delay", async () => {
        const controller = new AbortController();
        const waiting = waitForDelay(10_000, controller.signal);
        controller.abort();
        await expect(waiting).rejects.toMatchObject({ name: "AbortError" });
    });
});
