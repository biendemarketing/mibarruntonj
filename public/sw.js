const CACHE_NAME = 'mibarrunto-pwa-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/LogoPWA/icon-192x192.png',
  '/LogoPWA/icon-512x512.png',
  '/LogoPWA/apple-touch-icon.png'
];

// Instalación: Pre-cacheados de recursos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Fallback al pre-cachear:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones antiguas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Fetch inteligente:
// 1. Ignorar solicitudes a Supabase (REST, WebSockets, Auth) -> Siempre red directa
// 2. Navegación HTML -> Network-First (prioriza datos frescos, fallback a cache)
// 3. Estáticos (JS, CSS, Imágenes) -> Stale-While-Revalidate (rapidez instantánea)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo manejar solicitudes GET HTTP/HTTPS
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar peticiones a Supabase / APIs externas para no interferir en tiempo real
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/') || url.pathname.includes('/realtime/')) {
    return;
  }

  // Navegación (HTML de páginas)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Recursos estáticos locales
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.startsWith('/LogoPWA/') ||
     url.pathname.match(/\.(js|css|webp|png|jpg|jpeg|svg|woff2|woff|ttf)$/i))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
