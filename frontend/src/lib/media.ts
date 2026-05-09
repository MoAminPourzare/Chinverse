import { API_BASE_URL } from "@/lib/api";

export const getApiRootUrl = () => {
    return API_BASE_URL.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
};

export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }

    const rootUrl = getApiRootUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (cleanPath.startsWith("/uploads/gallery/") || cleanPath.startsWith("/uploads/services/")) {
        return `${rootUrl}/static${cleanPath}`;
    }

    return `${rootUrl}${cleanPath}`;
};
