/* Faza service worker: pliki aplikacji i baza pytań idą z sieci, gdy jest internet (aktualizacje przychodzą
   przy następnym uruchomieniu), a z pamięci, gdy internetu nie ma. Zmień CACHE przy zmianie listy plików. */
const CACHE = 'ele-1.0.0';
const FONTS = 'ele-fonts';
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './figs.js',
  './data/pytania.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2',
  './fonts/atkinson-hyperlegible-next-latin-ext-wght-normal.woff2',
  './fonts/barlow-condensed-latin-600-normal.woff2',
  './fonts/barlow-condensed-latin-ext-600-normal.woff2',
  './fonts/barlow-condensed-latin-700-normal.woff2',
  './fonts/barlow-condensed-latin-ext-700-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('ele-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
      if (hit) return hit;
      throw e;
    }
  })());
});
