
const CACHE='mv-navigator-v18';
const SHELL=['./manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  // Always prefer the newest HTML/navigation response.
  if(req.mode === 'navigate' || req.destination === 'document'){
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(resp => resp)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Network-first for app assets; cached fallback only if offline.
  event.respondWith(
    fetch(req)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
