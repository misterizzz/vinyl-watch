const CACHE = 'vinylwatch-v1';
const STATIC = ['/', '/index.html', '/manifest.json', '/icon.svg', '/sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
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

  // Discogs API: network first, no cache (live data)
  if (url.hostname === 'api.discogs.com') {
    e.respondWith(fetch(e.request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }), 
      { headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // Google Fonts: cache first
  if (url.hostname.includes('fonts')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    })));
    return;
  }

  // Static files: cache first, fallback to network
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
