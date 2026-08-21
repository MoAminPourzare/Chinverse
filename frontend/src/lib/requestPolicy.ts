const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);

export const DEFAULT_API_TIMEOUT_MS = 15_000;
export const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000;
export const DEFAULT_API_RETRY_COUNT = 1;
export const MAX_RETRY_DELAY_MS = 8_000;
const MAX_PARSED_RETRY_AFTER_MS = 24 * 60 * 60 * 1_000;

export const parseBoundedInteger = (
    value: string | null | undefined,
    fallback: number,
    { min, max }: { min: number; max: number },
) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

export const isIdempotentMethod = (method: string | null | undefined) =>
    IDEMPOTENT_METHODS.has((method || "get").toLowerCase());

export const isRetryableStatus = (status: number | null | undefined) =>
    typeof status === "number" && RETRYABLE_STATUS_CODES.has(status);

const parseRetryAfterDate = (value: string, nowMs: number) => {
    const dateMs = Date.parse(value);
    return Number.isFinite(dateMs) ? Math.max(0, dateMs - nowMs) : null;
};

export const parseRetryAfterMs = (
    value: string | string[] | number | null | undefined,
    nowMs = Date.now(),
) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized === null || normalized === undefined || normalized === "") return null;
    const seconds = Number(normalized);
    const delay = Number.isFinite(seconds) && seconds >= 0
        ? seconds * 1_000
        : parseRetryAfterDate(String(normalized), nowMs);
    // Preserve the server's requested delay so callers can decide whether it
    // fits their own latency budget. Silently shortening Retry-After causes a
    // thundering herd while the upstream is explicitly asking for relief.
    return delay === null ? null : Math.min(delay, MAX_PARSED_RETRY_AFTER_MS);
};

export const computeBackoffDelayMs = ({
    attempt,
    baseDelayMs = 500,
    maxDelayMs = MAX_RETRY_DELAY_MS,
    jitterRatio = 0.2,
    retryAfterMs,
    random = Math.random,
}: {
    attempt: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitterRatio?: number;
    retryAfterMs?: number | null;
    random?: () => number;
}) => {
    if (typeof retryAfterMs === "number") return Math.min(Math.max(0, retryAfterMs), maxDelayMs);
    const exponential = Math.min(maxDelayMs, baseDelayMs * (2 ** Math.max(0, attempt)));
    const boundedJitter = Math.min(1, Math.max(0, jitterRatio));
    const jitter = exponential * boundedJitter * Math.min(1, Math.max(0, random()));
    return Math.round(Math.min(maxDelayMs, exponential + jitter));
};

export const waitForDelay = (delayMs: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
        reject(signal.reason ?? new DOMException("Request aborted", "AbortError"));
        return;
    }

    const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
    }, Math.max(0, delayMs));
    const abort = () => {
        clearTimeout(timer);
        reject(signal?.reason ?? new DOMException("Request aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
});

export const isAbortLikeError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    return error.name === "AbortError"
        || error.name === "CanceledError"
        || (error as Error & { code?: string }).code === "ERR_CANCELED";
};
