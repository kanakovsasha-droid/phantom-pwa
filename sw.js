var CACHE_NAME = 'phantom-v1';

var CACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/ui.jpg',
  './assets/icon.png'
];

/* ── Install: cache all static assets ── */
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CACHE_ASSETS);
    }).catch(function () {
      /* If ui.jpg or icon.png not yet placed, cache what is available */
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll([
          './',
          './index.html',
          './style.css',
          './script.js',
          './manifest.json'
        ]);
      });
    })
  );
});

/* ── Activate: purge old caches ── */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: cache-first strategy ── */
self.addEventListener('fetch', function (event) {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (response) {
        /* Cache valid responses for future offline use */
        if (response && response.status === 200 && response.type === 'basic') {
          var toCache = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, toCache);
          });
        }
        return response;
      }).catch(function () {
        /* If fetch fails and no cache, return empty response */
        return new Response('', { status: 503 });
      });
    })
  );
});
