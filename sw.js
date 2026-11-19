// Ritme service worker: app-shell offline, netwerk-eerst voor updates.
const CACHE = 'ritme-v2';
const SHELL = ['./', 'index.html', 'css/app.css', 'css/fig.css', 'js/app.js', 'js/store.js', 'js/logic.js', 'js/data.js', 'js/exercises.js', 'js/poses.js', 'js/figure.js', 'js/player.js', 'js/charts.js', 'js/icons.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
