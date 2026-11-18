const V = 'siandal-v6';
const A = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/supabase.js',
  'assets/js/auth.js',
  'assets/js/app.js',
  'assets/img/icon-192.png',
  'assets/img/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(A)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const c = r.clone();
      caches.open(V).then(x => x.put(e.request, c));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});