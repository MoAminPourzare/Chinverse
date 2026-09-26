export const getApiRootUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    return apiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
};

export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path;
    }

    const rootUrl = getApiRootUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    if (cleanPath.startsWith("/api/v1/media/")) {
        return `/api/backend${cleanPath.slice("/api/v1".length)}`;
    }
    if (cleanPath.startsWith("/api/backend/media/")) return cleanPath;

    return `${rootUrl}${cleanPath}`;
};

const parseOrigin = (value: string | undefined) => {
    try {
        return value ? new URL(value).origin : null;
    } catch {
        return null;
    }
};

const publicMediaPath = (pathname: string) => (
    pathname.startsWith("/assets/")
    || pathname.startsWith("/uploads/")
    || pathname.startsWith("/static/uploads/")
    || /^\/api\/(?:v1|backend)\/media\/public-images\/\d+\/?$/.test(pathname)
);

/**
 * Next's image optimizer is intentionally limited to public media. Entitlement
 * protected `/media/assets/.../content` responses must never enter its shared
 * cache because the optimizer cannot forward the viewer's authorization.
 */
export const isPublicOptimizableMediaUrl = (value: string | null | undefined) => {
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) return false;

    try {
        const parsed = new URL(value, "https://chinverse.invalid");
        if (parsed.origin === "https://chinverse.invalid") return publicMediaPath(parsed.pathname);

        const apiOrigin = parseOrigin(process.env.NEXT_PUBLIC_API_URL);
        const cdnOrigins = [
            process.env.NEXT_PUBLIC_IMAGE_CDN_URL,
            ...(process.env.NEXT_PUBLIC_IMAGE_REMOTE_ORIGINS || "").split(","),
        ].map((item) => parseOrigin(item?.trim())).filter(Boolean);

        // The API origin always keeps the path-level public allowlist, even if
        // it is accidentally repeated in a CDN environment variable.
        if (parsed.origin === apiOrigin) return publicMediaPath(parsed.pathname);
        return cdnOrigins.includes(parsed.origin);
    } catch {
        return false;
    }
};
