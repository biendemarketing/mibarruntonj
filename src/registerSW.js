/**
 * Registro de Service Worker para PWA con Auto-Recuperación de Chunks
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Si hay un error de carga de bundle o chunk por nueva versión en Vercel, purgar y recargar automáticamente
  window.addEventListener('error', (e) => {
    const isChunkError = e.message && (
      e.message.includes('Loading chunk') ||
      e.message.includes('Failed to fetch dynamically imported module') ||
      e.message.includes('Importing a module script failed') ||
      e.message.includes('Failed to load module script')
    );
    if (isChunkError) {
      console.warn('[PWA] Desincronización de bundle detectada. Purgando caché...');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) reg.unregister();
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        });
      }
      const hasRetried = sessionStorage.getItem('chunk_retry');
      if (!hasRetried) {
        sessionStorage.setItem('chunk_retry', '1');
        setTimeout(() => {
          window.location.reload();
        }, 200);
      }
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.warn('[PWA] Registro de ServiceWorker falló:', error);
      });
  });
}
