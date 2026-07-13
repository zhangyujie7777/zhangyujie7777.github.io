// Cache each complete request URL so a new image version cannot be replaced
// with an older query-string variant left by a previous release.
const HOME_IMAGE_CACHE = "portfolio-home-images-v6";

const HOME_IMAGE_PATHS = new Set([
  "/assets/c-home-v2/角色.png",
  "/assets/c-home-v2/我京入口.png",
  "/assets/c-home-v2/首页入口.png",
  "/assets/c-home-v2/ai入口-user-latest.png",
  "/assets/c-home-v2/通用箭头.png",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("portfolio-home-images-"))
          .filter((cacheName) => cacheName !== HOME_IMAGE_CACHE)
          .map((cacheName) => caches.delete(cacheName)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.destination !== "image") return;

  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);
  if (url.origin !== self.location.origin || !HOME_IMAGE_PATHS.has(pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(HOME_IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
