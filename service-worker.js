
const CACHE_VERSION = "azuria-v1";
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./siente.png",
  "./laboral.png",
  "./mejor.png",
  "./inicio.png",
  "./tirada.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll([
        "./",
        "./index.html",
        "./manifest.json"
      ]);

      await Promise.allSettled(
        APP_SHELL.slice(3).map((url) => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) =>
            key.startsWith("azuria-") &&
            key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  const scope = new URL(self.registration.scope);

  if (!url.pathname.startsWith(scope.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      if (event.request.mode === "navigate") {
        try {
          const response = await fetch(event.request);

          if (response.ok) {
            await cache.put(
              event.request,
              response.clone()
            );
          }

          return response;
        } catch {
          return (
            await cache.match(event.request) ||
            await cache.match("./index.html") ||
            Response.error()
          );
        }
      }

      const cached = await cache.match(event.request);

      if (cached) return cached;

      try {
        const response = await fetch(event.request);

        if (response.ok && response.type === "basic") {
          await cache.put(
            event.request,
            response.clone()
          );
        }

        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});
