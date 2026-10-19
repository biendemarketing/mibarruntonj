/**
 * Registro de Service Worker para PWA
 * Activa capacidades sin conexión, velocidad instantánea e instalación en pantalla de inicio.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Registrar después de que la página termine de cargar para no bloquear LCP / First Paint
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Escuchar actualizaciones disponibles
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.info('[PWA] Nueva versión de Mi Barrunto disponible.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Registro de ServiceWorker falló:', error);
      });
  });
}
