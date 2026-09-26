import {
    computeBackoffDelayMs,
    isIdempotentMethod,
    isRetryableStatus,
    parseBoundedInteger,
    parseRetryAfterMs,
    waitForDelay,
} from "@/lib/requestPolicy";

export const DEFAULT_BACKEND_PROXY_TIMEOUT_MS = 12_000;
export const DEFAULT_BACKEND_PROXY_UPLOAD_TIMEOUT_MS = 120_000;
const MAX_BACKEND_PROXY_RETRY_DELAY_MS = 2_000;

export class UpstreamTimeoutError extends Error {
    constructor() {
        super("Upstream response headers timed out");
        this.name = "UpstreamTimeoutError";
    }
}

export const resolveBackendProxyTimeoutMs = (value = process.env.BACKEND_PROXY_TIMEOUT_MS) =>
    parseBoundedInteger(value, DEFAULT_BACKEND_PROXY_TIMEOUT_MS, { min: 1_000, max: 60_000 });

export const resolveBackendProxyUploadTimeoutMs = (
    value = process.env.BACKEND_PROXY_UPLOAD_TIMEOUT_MS,
) => parseBoundedInteger(value, DEFAULT_BACKEND_PROXY_UPLOAD_TIMEOUT_MS, {
    min: 10_000,
    max: 300_000,
});

const fetchResponseWithHeaderTimeout = async (
    input: URL | string,
    init: RequestInit,
    timeoutMs: number,
) => {
    const controller = new AbortController();
    let timedOut = false;
    const sourceSignal = init.signal;
    const abortFromSource = () => controller.abort(sourceSignal?.reason);
    if (sourceSignal?.aborted) abortFromSource();
    else sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
        if (timedOut) throw new UpstreamTimeoutError();
        throw error;
    } finally {
        clearTimeout(timer);
        sourceSignal?.removeEventListener("abort", abortFromSource);
    }
};

export const fetchUpstreamWithPolicy = async (
    input: URL | string,
    init: RequestInit,
    {
        timeoutMs = resolveBackendProxyTimeoutMs(),
        maxRetries = 0,
    }: { timeoutMs?: number; maxRetries?: number } = {},
) => {
    const retryableMethod = isIdempotentMethod(init.method);
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            const response = await fetchResponseWithHeaderTimeout(input, init, timeoutMs);
            if (!retryableMethod || !isRetryableStatus(response.status) || attempt >= maxRetries) {
                return response;
            }
            const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
            if (retryAfterMs !== null && retryAfterMs > MAX_BACKEND_PROXY_RETRY_DELAY_MS) {
                return response;
            }
            await response.body?.cancel().catch(() => undefined);
            await waitForDelay(computeBackoffDelayMs({
                attempt,
                baseDelayMs: 250,
                maxDelayMs: MAX_BACKEND_PROXY_RETRY_DELAY_MS,
                retryAfterMs,
            }), init.signal ?? undefined);
        } catch (error) {
            lastError = error;
            if (!retryableMethod || attempt >= maxRetries || init.signal?.aborted) throw error;
            await waitForDelay(computeBackoffDelayMs({
                attempt,
                baseDelayMs: 250,
                maxDelayMs: MAX_BACKEND_PROXY_RETRY_DELAY_MS,
            }), init.signal ?? undefined);
        }
    }

    throw lastError ?? new Error("Upstream request failed");
};
