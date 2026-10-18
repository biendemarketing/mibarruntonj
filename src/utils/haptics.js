/**
 * Utilidad de Feedback Háptico (Vibración) para dispositivos móviles
 * Proporciona respuesta táctil limpia y sutil (tipo iOS/Android) sin afectar navegadores no soportados.
 */
export function triggerHaptic(duration = 12) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {}
}
