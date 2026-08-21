"use client";

import { useEffect, useRef } from "react";
import { computeBackoffDelayMs, isAbortLikeError } from "@/lib/requestPolicy";

export const computeAdaptivePollDelayMs = ({
    baseIntervalMs,
    maxIntervalMs,
    idleStreak,
    failureStreak,
    jitterRatio = 0.15,
    random = Math.random,
}: {
    baseIntervalMs: number;
    maxIntervalMs: number;
    idleStreak: number;
    failureStreak: number;
    jitterRatio?: number;
    random?: () => number;
}) => {
    if (failureStreak > 0) {
        return computeBackoffDelayMs({
            attempt: failureStreak - 1,
            baseDelayMs: baseIntervalMs,
            maxDelayMs: maxIntervalMs,
            jitterRatio,
            random,
        });
    }
    // Preserve the normal cadence for the first quiet poll, then progressively
    // back off. This keeps chat responsive without hammering an idle inbox.
    const idleMultiplier = 1.5 ** Math.min(Math.max(0, idleStreak - 1), 6);
    const base = Math.min(maxIntervalMs, Math.round(baseIntervalMs * idleMultiplier));
    const jitter = base * Math.min(1, Math.max(0, jitterRatio)) * Math.min(1, Math.max(0, random()));
    return Math.min(maxIntervalMs, Math.round(base + jitter));
};

type PollTask = (signal: AbortSignal) => Promise<boolean | void>;

export function useAdaptivePolling({
    task,
    enabled = true,
    baseIntervalMs,
    maxIntervalMs,
    runImmediately = true,
    pauseWhenHidden = true,
    pauseWhenOffline = true,
    jitterRatio = 0.15,
    onError,
}: {
    task: PollTask;
    enabled?: boolean;
    baseIntervalMs: number;
    maxIntervalMs: number;
    runImmediately?: boolean;
    pauseWhenHidden?: boolean;
    pauseWhenOffline?: boolean;
    jitterRatio?: number;
    onError?: (error: unknown) => void;
}) {
    const taskRef = useRef(task);
    const errorRef = useRef(onError);
    taskRef.current = task;
    errorRef.current = onError;

    useEffect(() => {
        if (!enabled) return;
        let disposed = false;
        let timer: number | null = null;
        let controller: AbortController | null = null;
        let running = false;
        let idleStreak = 0;
        let failureStreak = 0;

        const canRun = () => {
            if (disposed) return false;
            if (pauseWhenHidden && document.visibilityState === "hidden") return false;
            if (pauseWhenOffline && navigator.onLine === false) return false;
            return true;
        };

        const clearTimer = () => {
            if (timer !== null) window.clearTimeout(timer);
            timer = null;
        };

        const schedule = (delayMs: number) => {
            clearTimer();
            if (!canRun()) return;
            timer = window.setTimeout(() => void run(), Math.max(0, delayMs));
        };

        const run = async () => {
            if (!canRun() || running) return;
            running = true;
            controller = new AbortController();
            try {
                const hadActivity = await taskRef.current(controller.signal);
                if (disposed || controller.signal.aborted) return;
                failureStreak = 0;
                idleStreak = hadActivity === true ? 0 : idleStreak + 1;
            } catch (error) {
                if (disposed || controller.signal.aborted || isAbortLikeError(error)) return;
                failureStreak += 1;
                idleStreak = 0;
                errorRef.current?.(error);
            } finally {
                running = false;
                controller = null;
                if (!disposed && canRun()) {
                    schedule(computeAdaptivePollDelayMs({
                        baseIntervalMs,
                        maxIntervalMs,
                        idleStreak,
                        failureStreak,
                        jitterRatio,
                    }));
                }
            }
        };

        const syncAvailability = () => {
            clearTimer();
            if (!canRun()) {
                controller?.abort();
                return;
            }
            if (!running) schedule(0);
        };

        document.addEventListener("visibilitychange", syncAvailability);
        window.addEventListener("online", syncAvailability);
        window.addEventListener("offline", syncAvailability);
        schedule(runImmediately ? 0 : baseIntervalMs);

        return () => {
            disposed = true;
            clearTimer();
            controller?.abort();
            document.removeEventListener("visibilitychange", syncAvailability);
            window.removeEventListener("online", syncAvailability);
            window.removeEventListener("offline", syncAvailability);
        };
    }, [baseIntervalMs, enabled, jitterRatio, maxIntervalMs, pauseWhenHidden, pauseWhenOffline, runImmediately]);
}
