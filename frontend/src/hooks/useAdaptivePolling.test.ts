import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAdaptivePollDelayMs, useAdaptivePolling } from "@/hooks/useAdaptivePolling";

describe("adaptive polling delay", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("keeps the first quiet interval responsive, then backs off", () => {
        const input = { baseIntervalMs: 4_000, maxIntervalMs: 30_000, failureStreak: 0, jitterRatio: 0, random: () => 0 };
        expect(computeAdaptivePollDelayMs({ ...input, idleStreak: 1 })).toBe(4_000);
        expect(computeAdaptivePollDelayMs({ ...input, idleStreak: 2 })).toBe(6_000);
        expect(computeAdaptivePollDelayMs({ ...input, idleStreak: 3 })).toBe(9_000);
    });

    it("backs off failures independently and respects the ceiling", () => {
        const input = { baseIntervalMs: 4_000, maxIntervalMs: 10_000, idleStreak: 0, jitterRatio: 0, random: () => 0 };
        expect(computeAdaptivePollDelayMs({ ...input, failureStreak: 1 })).toBe(4_000);
        expect(computeAdaptivePollDelayMs({ ...input, failureStreak: 2 })).toBe(8_000);
        expect(computeAdaptivePollDelayMs({ ...input, failureStreak: 3 })).toBe(10_000);
    });

    it("never overlaps a slow request", async () => {
        vi.useFakeTimers();
        let finish: ((activity: boolean) => void) | undefined;
        const task = vi.fn(() => new Promise<boolean>((resolve) => {
            finish = resolve;
        }));
        renderHook(() => useAdaptivePolling({
            task,
            baseIntervalMs: 1_000,
            maxIntervalMs: 10_000,
            jitterRatio: 0,
        }));

        await act(async () => vi.advanceTimersByTimeAsync(0));
        expect(task).toHaveBeenCalledTimes(1);
        await act(async () => vi.advanceTimersByTimeAsync(60_000));
        expect(task).toHaveBeenCalledTimes(1);

        await act(async () => {
            finish?.(false);
            await Promise.resolve();
        });
        await act(async () => vi.advanceTimersByTimeAsync(1_000));
        expect(task).toHaveBeenCalledTimes(2);
    });

    it("pauses while hidden and resumes immediately when visible", async () => {
        vi.useFakeTimers();
        const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
        const task = vi.fn().mockResolvedValue(false);
        renderHook(() => useAdaptivePolling({ task, baseIntervalMs: 1_000, maxIntervalMs: 10_000 }));

        await act(async () => vi.advanceTimersByTimeAsync(5_000));
        expect(task).not.toHaveBeenCalled();

        visibility.mockReturnValue("visible");
        await act(async () => {
            document.dispatchEvent(new Event("visibilitychange"));
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(task).toHaveBeenCalledOnce();
    });
});
