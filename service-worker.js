const CACHE_NAME = 'my-money-cache-v2';
const urlsToCache = [
    '/my-money-app/',
    '/my-money-app/index.html',
    '/my-money-app/style.css',
    '/my-money-app/app.js',
    '/my-money-app/manifest.json',
    '/my-money-app/logo.png',
    '/my-money-app/logo192.png',
    '/my-money-app/logo512.png',
    '/my-money-app/favicon.ico',
    '/my-money-app/home-icon.svg',
    '/my-money-app/wallet-icon.svg',
    '/my-money-app/chart-icon.svg',
    '/my-money-app/settings-icon.svg',
    '/my-money-app/google-icon.svg',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching all content');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('[Service Worker] Cache install failed:', err))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(err => console.error('[Service Worker] Fetch failed:', err))
    );
});