const CACHE = 'festival-picks-v3';
// use self.location to build scope-relative paths
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');
const PRELOAD = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/pages.json',
  BASE + '/manifest.json'
];

// install: pre-cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRELOAD))
  );
  self.skipWaiting();
});

// activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// fetch: network-first for pages, cache fallback
self.addEventListener('fetch', e => {
  // skip non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // cache successful responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
