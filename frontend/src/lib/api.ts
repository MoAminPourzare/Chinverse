import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const DEFAULT_DEV_API_URL = 'http://localhost:8000/api/v1';
const GET_CACHE_TTL_MS = 10_000;

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

export const resolveApiBaseUrl = () => {
    const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

    if (typeof window === "undefined") {
        return trimTrailingSlash(configuredUrl || DEFAULT_DEV_API_URL);
    }

    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol === "https:" ? "https" : "http";

    if (configuredUrl) {
        try {
            const parsed = new URL(configuredUrl);
            const isLoopbackApiHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
            const isLoopbackPageHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(currentHost);

            if (isLoopbackApiHost && !isLoopbackPageHost) {
                parsed.hostname = currentHost;
                parsed.protocol = `${currentProtocol}:`;
                return trimTrailingSlash(parsed.toString());
            }
        } catch {
            return trimTrailingSlash(configuredUrl);
        }

        return trimTrailingSlash(configuredUrl);
    }

    return `${currentProtocol}://${currentHost}:8000/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

type CachedResponse = {
    timestamp: number;
    response: AxiosResponse;
};

const getCache = new Map<string, CachedResponse>();
const originalGet = api.get.bind(api);

const buildCacheKey = (url: string, config?: AxiosRequestConfig) => {
    const params = config && typeof config === "object" && "params" in config ? (config as { params?: unknown }).params : undefined;
    const headers = config && typeof config === "object" && "headers" in config ? (config as { headers?: unknown }).headers : undefined;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    return JSON.stringify({
        url,
        baseURL: resolveApiBaseUrl(),
        params: params || null,
        headers: headers || null,
        token,
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

    if (cached && now - cached.timestamp < GET_CACHE_TTL_MS) {
        return cloneResponse(cached.response) as R;
    }

    const response = await originalGet<T, R, D>(url, config);
    getCache.set(cacheKey, {
        timestamp: now,
        response: cloneResponse(response as AxiosResponse),
    });

    return response;
}) as typeof api.get;

const clearGetCache = () => {
    getCache.clear();
};

export const clearApiCache = clearGetCache;

const notifyAuthChanged = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("chinverse-auth-change"));
};

const clearStoredAuth = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    clearGetCache();
    notifyAuthChanged();
};

api.interceptors.request.use(
    (config) => {
        config.baseURL = resolveApiBaseUrl();

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        if ((config.method || "get").toLowerCase() !== "get") {
            clearGetCache();
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error && typeof error === "object" && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401 && typeof window !== "undefined") {
            clearStoredAuth();

            const currentPath = `${window.location.pathname}${window.location.search}`;
            const isAuthPage = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/signup");

            if (!isAuthPage) {
                window.location.assign(`/login?next=${encodeURIComponent(currentPath)}`);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
