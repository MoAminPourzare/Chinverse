export function getCurrentReturnToPath() {
    if (typeof window === "undefined") return "/";
    return `${window.location.pathname}${window.location.search}`;
}

export function getReturnToHref(targetPath: string) {
    return `${targetPath}?returnTo=${encodeURIComponent(getCurrentReturnToPath())}`;
}

export function getSafeReturnTo(search: string, fallback: string) {
    const returnTo = new URLSearchParams(search).get("returnTo");
    return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : fallback;
}
