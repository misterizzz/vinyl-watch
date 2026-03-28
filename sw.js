const CACHE = 'vinylwatch-v2';
const BASE = '/vinyl-watch';
const STATIC = [BASE + '/', BASE + '/index.html', BASE + '/manifest.json', BASE + '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname === 'api.discogs.com' || url.hostname.includes('onrender.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }),
      { headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  if (url.hostname.includes('fonts')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    })));
    return;
  }

  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
