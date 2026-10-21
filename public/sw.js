const CACHE_NAME = "anlikresim-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.jpg"
];

// Install Event - Pre-cache essential shells and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching offline assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clear old caches and take control instantly
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle offline requests and cache static assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests (bypass uploads, posts, reports, etc.)
  if (req.method !== "GET") {
    return;
  }

  // 2. Bypass API requests, system-status, dynamic raw image pages, or admin panel
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    (url.pathname.match(/\.[a-zA-Z0-9]+$/) && 
     !url.pathname.endsWith(".html") && 
     !url.pathname.endsWith(".js") && 
     !url.pathname.endsWith(".css") && 
     !url.pathname.endsWith(".json") && 
     !url.pathname.endsWith(".jpg") && 
     !url.pathname.endsWith(".png"))
  ) {
    return;
  }

  // 3. For SPA navigation requests (e.g., /i/:id, /hakkimizda), fetch from network, fallback to cached index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // 4. Cache-first strategy for static assets, network-first for others
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          // Cache Vite assets, fonts, or images dynamically
          if (
            networkResponse.status === 200 &&
            (url.pathname.includes("/assets/") || 
             url.pathname.endsWith(".js") || 
             url.pathname.endsWith(".css") || 
             url.pathname.endsWith(".json") || 
             url.pathname.endsWith(".jpg") || 
             url.pathname.endsWith(".png"))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          const acceptHeader = req.headers.get("accept");
          if (acceptHeader && acceptHeader.includes("text/html")) {
            return caches.match("/index.html") || caches.match("/");
          }
        });
    })
  );
});
