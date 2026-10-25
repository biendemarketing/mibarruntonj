import {
  isChunkLoadError,
  recoverFromChunkError,
  purgeCachesAndServiceWorkers
} from './utils/chunkRecovery';

/**
 * Desregistrador Permanente de PWA y Limpiador de Caché
 * Asegura que ningún cliente mantenga service workers ni cachés viejas en su navegador.
 */
export function purgePwaAndUnregisterSW() {
  if (typeof window === 'undefined') {
    return;
  }

  // Desregistrar todos los Service Workers y vaciar cachés inmediatamente
  purgeCachesAndServiceWorkers();

  // Escuchar errores de carga de bundle o chunks para auto-recuperar con recarga limpia
  window.addEventListener('error', (e) => {
    if (isChunkLoadError(e.message || e.error)) {
      console.warn('[App] Desincronización de bundle detectada. Recuperando...');
      recoverFromChunkError();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (isChunkLoadError(e.reason)) {
      console.warn('[App] Import dinámico fallido. Recuperando...');
      recoverFromChunkError();
    }
  });

  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    recoverFromChunkError();
  });
}

// Alias de compatibilidad
export const registerServiceWorker = purgePwaAndUnregisterSW;

