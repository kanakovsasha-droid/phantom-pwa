var CACHE_NAME = 'phantom-v4';

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

/* ── Fetch: network-first для CSS/JS, cache-first для картинок ── */
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = event.request.url;
  var isAsset = /\.(jpg|jpeg|png|gif|webp|ico)$/i.test(url);

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return cached || fetch(event.request).then(function (res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
          return res;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
        return res;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
  }
});
