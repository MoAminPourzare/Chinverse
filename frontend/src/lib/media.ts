const DEFAULT_API_URL = "http://localhost:8000/api/v1";

export const getApiRootUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
    return apiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
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
