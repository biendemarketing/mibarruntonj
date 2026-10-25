/**
 * Recuperación automática ante desincronización de bundles (deploy nuevo en Vercel).
 * - Detecta errores de carga de chunks / imports dinámicos.
 * - Desregistra el service worker, borra cachés y recarga UNA sola vez (protegido por marca de tiempo).
 */
const RETRY_KEY = 'mb_chunk_retry_at';
const RETRY_WINDOW_MS = 30000;

export function isChunkLoadError(errOrMessage) {
  const msg = String(
    (errOrMessage && (errOrMessage.message || errOrMessage.reason?.message)) || errOrMessage || ''
  );
  return (
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Failed to load module script') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Unexpected token \'<\'')
  );
}

export async function purgeCachesAndServiceWorkers() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignorar
  }
}

/** Devuelve true si se inició una recarga automática; false si ya se reintentó recientemente. */
export function recoverFromChunkError() {
  try {
    const last = Number(localStorage.getItem(RETRY_KEY) || 0);
    if (Date.now() - last < RETRY_WINDOW_MS) return false;
    localStorage.setItem(RETRY_KEY, String(Date.now()));
  } catch {
    // si localStorage no está disponible, intentamos igualmente una vez por carga
    if (window.__mbRetried) return false;
    window.__mbRetried = true;
  }
  purgeCachesAndServiceWorkers().finally(() => {
    window.location.reload();
  });
  return true;
}
