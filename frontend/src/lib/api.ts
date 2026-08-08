import axios, {
    type AxiosError,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, hasAccessToken, setAccessToken } from "@/lib/auth-session";

const DEFAULT_DEV_API_URL = "http://localhost:8000/api/v1";
const BROWSER_API_URL = "/api/backend";
const GET_CACHE_TTL_MS = 10_000;

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
    if (cached && now - cached.timestamp < GET_CACHE_TTL_MS) {
        return cloneResponse(cached.response) as R;
    }
    const response = await originalGet<T, R, D>(url, config);
    getCache.set(cacheKey, { timestamp: now, response: cloneResponse(response as AxiosResponse) });
    return response;
}) as typeof api.get;

api.interceptors.request.use((config) => {
    config.baseURL = resolveApiBaseUrl();
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        config.headers.delete("Content-Type");
    }
    if ((config.method || "get").toLowerCase() !== "get") clearApiCache();
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        const path = String(config?.url || "");
        const canRefresh = !path.includes("/auth/refresh") && !path.includes("/login/access-token");

        if (error.response?.status === 401 && config && !config._authRetry && canRefresh) {
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
        return Promise.reject(error);
    },
);

export const establishAccessToken = (token: string) => updateAccessToken(token);
export const clearAuthSession = () => updateAccessToken(null);

export default api;
