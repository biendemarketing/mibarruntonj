const CACHE_NAME = 'mibarrunto-pwa-v3';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/LogoPWA/icon-192x192.png',
  '/LogoPWA/icon-512x512.png',
  '/LogoPWA/apple-touch-icon.png'
];

// Instalación: Pre-cachear solo iconos estáticos (NUNCA index.html para evitar bundles obsoletos)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching parcial:', err);
      });
    })
  );
});

// Activación: Purgar automáticamente TODAS las versiones anteriores de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.info('[SW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Fetch:
// 1. Navegación HTML -> SIEMPRE Network-First directo con fallback solo si offline absoluto.
// 2. Supabase, WebSockets, APIs -> BYPASS TOTAL (nunca cachear).
// 3. Estáticos versionados (assets/index-HASH.js) -> Cache-First con fallback a red.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar llamadas a Supabase y APIs en tiempo real
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/') || url.pathname.includes('/realtime/')) {
    return;
  }

  // Solicitudes de Navegación (HTML de páginas): NETWORK-FIRST SIEMPRE
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(async () => {
          // Si está completamente desconectado sin internet, intentar responder con caché guardada
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Assets estáticos con hash de Vite (/assets/*)
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[SW] Error cargando asset:', url.pathname, err);
          throw err;
        });
      })
    );
    return;
  }

  // Iconos PWA
  if (url.origin === self.location.origin && url.pathname.startsWith('/LogoPWA/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
  }
});
