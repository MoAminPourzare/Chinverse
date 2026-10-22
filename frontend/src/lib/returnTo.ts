export function getCurrentReturnToPath() {
    if (typeof window === "undefined") return "/";
    return `${window.location.pathname}${window.location.search}`;
}

export function getReturnToHref(targetPath: string) {
    return `${targetPath}?returnTo=${encodeURIComponent(getCurrentReturnToPath())}`;
}

export function getSafeReturnTo(search: string, fallback: string) {
    const returnTo = new URLSearchParams(search).get("returnTo");
    return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !/[\\\r\n]/.test(returnTo)
        ? returnTo
        : fallback;
}

export function getJourneyHref(targetPath: string, currentPath = getCurrentReturnToPath()) {
    const query = currentPath.includes("?") ? currentPath.slice(currentPath.indexOf("?")) : "";
    if (!new URLSearchParams(query).has("returnTo") || !targetPath.startsWith("/") || targetPath.startsWith("//")) return targetPath;
    const destination = new URL(targetPath, "https://chinverse.invalid");
    if (!destination.searchParams.has("returnTo")) {
        const current = currentPath.split("?")[0];
        const siblingLesson = (current.startsWith("/watch/") && destination.pathname.startsWith("/watch/"))
            || (current.includes("/lesson/") && destination.pathname.includes("/lesson/"));
        destination.searchParams.set("returnTo", siblingLesson ? getSafeReturnTo(query, current) : currentPath);
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
}
