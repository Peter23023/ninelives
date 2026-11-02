// Keeps the game on the phone after the first visit: it opens instantly and works offline.
// build.sh writes a new VERSION each build, so an update replaces the old files.
const VERSION = '202611021427';
const CACHE = 'ninelives-' + VERSION;
const CORE = ['./', 'index.html', 'app.js', 'style.css', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('ninelives-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// pictures and sounds: from the phone once fetched; the page itself: fresh when online
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const asset = /\/(img|snd)\//.test(url.pathname);
  if (asset) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }))));
  } else {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
  }
});
