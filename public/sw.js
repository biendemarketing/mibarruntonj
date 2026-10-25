/**
 * Service Worker de Auto-Destrucción y Purga Definitiva de Caché
 * Elimina toda la caché guardada previamente y se desregistra de forma permanente en todos los clientes.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});

// Nunca interceptar peticiones; pasar directo a la red
self.addEventListener('fetch', () => {
  return;
});
