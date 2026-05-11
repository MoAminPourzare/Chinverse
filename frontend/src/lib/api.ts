import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const DEFAULT_DEV_API_URL = 'http://localhost:8000/api/v1';
const GET_CACHE_TTL_MS = 10_000;

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_DEV_API_URL).replace(/\/$/, '');

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

api.interceptors.request.use(
    (config) => {
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

export default api;
