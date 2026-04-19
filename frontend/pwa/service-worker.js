const CACHE_NAME = "milk-app-cache-v4";

const urlsToCache = [
    "/",
    "/index.html",
    "/app.js",
    "/styles.css"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// FETCH (only cache static assets, let API requests go through)
self.addEventListener("fetch", event => {
    // Don't cache API requests - let them go through to server
    if (event.request.url.includes('/api/') || event.request.url.includes(':8000')) {
        return; // Let the request go through normally without caching
    }

    // For static assets, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    if (event.request.method === "GET" && event.request.url.startsWith(self.location.origin)) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                });
            })
    );
});
