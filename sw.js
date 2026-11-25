/* KINET OS · Service Worker (v51)
   - Permite instalar la app (PWA) y que abra aunque no haya red (muestra la última versión guardada o una pantalla "sin conexión").
   - SOLO guarda archivos del propio sitio. Nunca toca Supabase, Stripe, Gemini ni nada de otros dominios, ni peticiones que no sean GET.
   - Estrategia "red primero": con internet siempre carga la versión más reciente; la copia local es solo el plan B. */
const VERSION = 'kinet-v60';
const SHELL = ['offline.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// La copia local es solo el plan B: se guardan como máximo 70 archivos (los más antiguos se descartan) para no ocupar espacio.
const MAX_ENTRIES = 70;
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  const keep = new Set(SHELL.map((s) => new URL(s, self.location).pathname));
  let extra = keys.length - MAX_ENTRIES;
  for (const k of keys) { if (extra <= 0) break; if (keep.has(new URL(k.url).pathname)) continue; await cache.delete(k); extra--; }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                       // otros dominios: ni se tocan
  if (url.pathname.endsWith('/sw.js')) return;

  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then(async (c) => { await c.put(req, copy); trim(c); }).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: false }) || await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await caches.match('offline.html')) || Response.error();
      return Response.error();
    }
  })());
});
