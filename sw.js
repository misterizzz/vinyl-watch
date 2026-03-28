const CACHE = 'vinylwatch-v3';
const BASE = '/vinyl-watch';

self.addEventListener('install', e => {
  // Skip waiting immediately — don't hold on to old version
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: always network, never cache
  if (url.hostname === 'api.discogs.com' || url.hostname.includes('onrender.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }),
      { headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // App files: network first, fall back to cache
  // This means updates are always picked up when online
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache the fresh response
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});});
