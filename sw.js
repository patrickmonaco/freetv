// Service Worker - TV Remote PWA
const CACHE_NAME = 'tv-remote-v1';
const CACHED_URLS = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHED_URLS);
        })
    );
    self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch : stratégie Network First pour les API, Cache First pour les assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Toujours réseau pour les appels API
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache First pour les assets statiques
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Mettre en cache la nouvelle ressource
                if (response.status === 200) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, cloned);
                    });
                }
                return response;
            });
        }).catch(() => {
            // Fallback offline : retourner la page principale
            return caches.match('/');
        })
    );
});
