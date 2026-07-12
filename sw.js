const HOME_IMAGE_CACHE = "portfolio-home-images-v5";

const HOME_IMAGE_PATHS = new Set([
  "/assets/c-home/welcome-character.png",
  "/assets/c-home/hero-character.png",
  "/assets/c-home/hero-flower.png",
  "/assets/fonts/bbh-bartle/BBHBartle-Regular.woff2",
  "/assets/new-raw/新切图/Frame 2085666221.png",
  "/assets/home-figma/问号图标.png",
  "/assets/home-figma/年度账单.webp",
  "/assets/home-figma/3d素材库.webp",
  "/assets/home-figma/app13.0.png",
  "/assets/home-figma/小组件.png",
  "/assets/home/footer-codex.png",
  "/assets/home-figma/文件夹 .png",
  "/assets/home/contact-title-full.png",
  "/assets/home/contact-qr-final.webp",
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
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
