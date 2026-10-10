export function buildBackendUpstreamUrl(
    apiBase: string,
    path: string[],
    requestUrl: URL,
): URL {
    const encodedPath = path.map(encodeURIComponent).join("/");
    const trailingSlash = encodedPath && requestUrl.pathname.endsWith("/") ? "/" : "";
    const upstreamUrl = new URL(`${apiBase.replace(/\/$/, "")}/${encodedPath}${trailingSlash}`);
    upstreamUrl.search = requestUrl.search;
    return upstreamUrl;
}
