/* ChinVerse privacy-preserving application-shell service worker. */
const workerUrl = new URL(self.location.href);
const requestedRelease = (workerUrl.searchParams.get("release") || "local").toLowerCase();
const release = /^[0-9a-f]{7,64}$/.test(requestedRelease) ? requestedRelease : "local";
const CACHE_VERSION = `chinverse-shell-${release}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/offline.css",
  "/manifest.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

const precacheShell = async () => {
  const cache = await caches.open(CACHE_VERSION);
  await Promise.all(PRECACHE_URLS.map(async (path) => {
    const response = await fetch(new Request(path, {
      cache: "reload",
      credentials: "same-origin",
    }));
    if (!response.ok) throw new Error(`Unable to precache ${path}`);
    await cache.put(path, response);
  }));
};

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

const isSensitivePath = (pathname) => {
  const normalized = pathname.toLowerCase();
  return ["/api", "/uploads", "/static/uploads", "/_private-media", "/media"]
    .some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
};

const isPublicStaticAsset = (url) =>
  url.origin === self.location.origin
  && !isSensitivePath(url.pathname)
  && (url.pathname.startsWith("/_next/static/") || /\.(?:css|js|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)$/i.test(url.pathname));

const isCacheableStaticResponse = (response, url) => {
  if (!response.ok || response.type !== "basic") return false;
  const cacheControl = (response.headers.get("cache-control") || "").toLowerCase();
  if (/\b(?:private|no-cache|no-store)\b/.test(cacheControl)) return false;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  return /^(?:text\/(?:css|javascript)|application\/(?:javascript|json|wasm)|image\/|font\/)/.test(contentType)
    || (url.pathname.startsWith("/_next/static/") && contentType.startsWith("application/octet-stream"));
};

const fetchNavigationWithFallback = async (request) => {
  try {
    const response = await fetch(request);
    if (!response || response.type === "error" || response.status === 0 || response.status >= 500) {
      throw new Error("navigation network unavailable");
    }
    return response;
  } catch {
    const shellCache = await caches.open(CACHE_VERSION);
    return (await shellCache.match(OFFLINE_URL)) || Response.error();
  }
};

const fetchPublicStaticAsset = async (request, url) => {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableStaticResponse(response, url)) await cache.put(request, response.clone());
  return response;
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || isSensitivePath(url.pathname)) return;

  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(fetchNavigationWithFallback(event.request));
    return;
  }

  if (isPublicStaticAsset(url)) event.respondWith(fetchPublicStaticAsset(event.request, url));
});
