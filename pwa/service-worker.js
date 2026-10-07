/* Arrow Escape service worker — generated into dist/sw.js by vite.config.js. */
const CACHE_NAME = 'arrow-escape-__CACHE_VERSION__';
const PRECACHE_URLS = __PRECACHE_URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('arrow-escape-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network first so new releases appear straight away; the cached shell keeps the game working offline.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match('./index.html')),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
