import axios, {
    type AxiosError,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, hasAccessToken, setAccessToken } from "@/lib/auth-session";
import {
    computeBackoffDelayMs,
    DEFAULT_API_RETRY_COUNT,
    DEFAULT_API_TIMEOUT_MS,
    DEFAULT_UPLOAD_TIMEOUT_MS,
    isAbortLikeError,
    isIdempotentMethod,
    isRetryableStatus,
    MAX_RETRY_DELAY_MS,
    parseBoundedInteger,
    parseRetryAfterMs,
    shouldReplayAfterAuthRefresh,
    waitForDelay,
} from "@/lib/requestPolicy";
import {
    connectivityStateFromFailure,
    emitConnectivityState,
} from "@/lib/connectivity";

declare module "axios" {
    export interface AxiosRequestConfig {
        chinverseCacheTtlMs?: number;
        chinverseRetry?: boolean;
    }

    export interface InternalAxiosRequestConfig {
        chinverseCacheTtlMs?: number;
        chinverseRetry?: boolean;
        _chinverseRetryCount?: number;
    }
}

const DEFAULT_DEV_API_URL = "http://localhost:8000/api/v1";
const BROWSER_API_URL = "/api/backend";
const GET_CACHE_TTL_MS = 10_000;
const MAX_GET_CACHE_ENTRIES = 200;
export const API_TIMEOUT_MS = parseBoundedInteger(
    process.env.NEXT_PUBLIC_API_TIMEOUT_MS,
    DEFAULT_API_TIMEOUT_MS,
    { min: 1_000, max: 120_000 },
);
export const API_UPLOAD_TIMEOUT_MS = parseBoundedInteger(
    process.env.NEXT_PUBLIC_API_UPLOAD_TIMEOUT_MS,
    DEFAULT_UPLOAD_TIMEOUT_MS,
    { min: 5_000, max: 600_000 },
);
export const API_RETRY_COUNT = parseBoundedInteger(
    process.env.NEXT_PUBLIC_API_RETRY_COUNT,
    DEFAULT_API_RETRY_COUNT,
    { min: 0, max: 2 },
);

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

export const resolveApiBaseUrl = () => {
    if (typeof window !== "undefined") return BROWSER_API_URL;
    return trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_DEV_API_URL);
};

export const resolveWebSocketBaseUrl = () =>
    trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_DEV_API_URL).replace(/^http/, "ws");

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: API_TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
});

type CachedResponse = { timestamp: number; response: AxiosResponse };
type RetryableConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };

const getCache = new Map<string, CachedResponse>();
const originalGet = api.get.bind(api);
let refreshPromise: Promise<string | null> | null = null;

const updateAccessToken = (token: string | null) => {
    setAccessToken(token);
    getCache.clear();
};

export const clearApiCache = () => getCache.clear();
export const isAuthenticated = hasAccessToken;

export const refreshAccessToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    if (refreshPromise) return refreshPromise;

    refreshPromise = axios
        .post<{ access_token: string }>(`${BROWSER_API_URL}/auth/refresh`, undefined, {
            withCredentials: true,
            timeout: API_TIMEOUT_MS,
            headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
            updateAccessToken(response.data.access_token);
            return response.data.access_token;
        })
        .catch(() => {
            updateAccessToken(null);
            return null;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};

const buildCacheKey = (url: string, config?: AxiosRequestConfig) => {
    const params = config && "params" in config ? config.params : undefined;
    const headers = config && "headers" in config ? config.headers : undefined;
    return JSON.stringify({
        url,
        params: params || null,
        headers: headers || null,
        token: getAccessToken() || "",
    });
};

const cloneResponse = (response: AxiosResponse): AxiosResponse => ({
    ...response,
    data: response.data,
    headers: { ...response.headers },
    config: { ...response.config },
});

api.get = (async <T = unknown, R = AxiosResponse<T>, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
) => {
    const cacheKey = buildCacheKey(url, config);
    const cached = getCache.get(cacheKey);
    const now = Date.now();
    const cacheTtlMs = config?.chinverseCacheTtlMs ?? GET_CACHE_TTL_MS;
    if (cacheTtlMs > 0 && cached && now - cached.timestamp < cacheTtlMs) {
        getCache.delete(cacheKey);
        getCache.set(cacheKey, cached);
        return cloneResponse(cached.response) as R;
    }
    const response = await originalGet<T, R, D>(url, config);
    if (cacheTtlMs > 0) {
        getCache.set(cacheKey, { timestamp: Date.now(), response: cloneResponse(response as AxiosResponse) });
        while (getCache.size > MAX_GET_CACHE_ENTRIES) {
            const oldestKey = getCache.keys().next().value as string | undefined;
            if (!oldestKey) break;
            getCache.delete(oldestKey);
        }
    }
    return response;
}) as typeof api.get;

api.interceptors.request.use((config) => {
    config.baseURL = resolveApiBaseUrl();
    if (!config.headers.has("X-Request-ID") && typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        config.headers.set("X-Request-ID", crypto.randomUUID());
    }
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        config.headers.delete("Content-Type");
        if (!config.timeout || config.timeout === API_TIMEOUT_MS) config.timeout = API_UPLOAD_TIMEOUT_MS;
    }
    if ((config.method || "get").toLowerCase() !== "get") clearApiCache();
    return config;
});

api.interceptors.response.use(
    (response) => {
        emitConnectivityState(response.status >= 500 ? "degraded" : "online");
        return response;
    },
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        const path = String(config?.url || "");
        const canRefresh = !path.includes("/auth/refresh") && !path.includes("/login/access-token");

        if (
            error.response?.status === 401
            && config
            && !config._authRetry
            && canRefresh
            && shouldReplayAfterAuthRefresh(config.method)
        ) {
            const hadAccessToken = hasAccessToken();
            config._authRetry = true;
            const token = await refreshAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                return api.request(config);
            }

            if (hadAccessToken && typeof window !== "undefined") {
                const currentPath = `${window.location.pathname}${window.location.search}`;
                const isAuthPage = window.location.pathname.startsWith("/login")
                    || window.location.pathname.startsWith("/signup");
                if (!isAuthPage) window.location.assign(`/login?next=${encodeURIComponent(currentPath)}`);
            }
        }

        const retryCount = config?._chinverseRetryCount ?? 0;
        const retryAfter = parseRetryAfterMs(error.response?.headers?.["retry-after"]);
        const retryAfterFitsBudget = retryAfter === null || retryAfter <= MAX_RETRY_DELAY_MS;
        const retryAllowed = config?.chinverseRetry !== false
            && isIdempotentMethod(config?.method)
            && retryCount < API_RETRY_COUNT
            && retryAfterFitsBudget
            && !isAbortLikeError(error)
            && (error.response === undefined || isRetryableStatus(error.response.status));
        if (config && retryAllowed) {
            config._chinverseRetryCount = retryCount + 1;
            const retrySignal = typeof AbortSignal !== "undefined" && config.signal instanceof AbortSignal
                ? config.signal
                : undefined;
            await waitForDelay(computeBackoffDelayMs({
                attempt: retryCount,
                retryAfterMs: retryAfter,
            }), retrySignal);
            return api.request(config);
        }

        if (!isAbortLikeError(error)) {
            emitConnectivityState(error.response
                ? (error.response.status >= 500 ? "degraded" : "online")
                : connectivityStateFromFailure());
        }
        return Promise.reject(error);
    },
);

export const establishAccessToken = (token: string) => updateAccessToken(token);
export const clearAuthSession = () => updateAccessToken(null);

export default api;
