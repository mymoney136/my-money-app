const CACHE_NAME = 'my-money-cache-v1';
const urlsToCache = [
    '/my-money-app/',
    '/my-money-app/index.html',
    '/my-money-app/style.css',
    '/my-money-app/app.js',
    '/my-money-app/manifest.json',
    '/my-money-app/logo.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});