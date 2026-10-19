/**
 * Utilidad de Feedback Háptico y Táctil (Vibración física + Micro-Tap Acústico)
 * Diseñado especialmente para proporcionar respuesta física real tanto en Android (vibración)
 * como en iPhone / iOS Safari y ordenadores (micro-tap acústico sintetizado con Web Audio API).
 */

let audioCtx = null;

/**
 * Inicialización perezosa (lazy) del AudioContext para cumplir con las políticas de autoplay
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {}

  return audioCtx;
}

// Desbloqueo automático del AudioContext en el primer toque de pantalla o clic
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {}
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('touchend', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };

  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchend', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
}

/**
 * Genera un micro-sonido "Tap / Click" sintetizado de alta frecuencia y decaimiento ultra rápido
 * Emula la respuesta del Taptic Engine de Apple (20-25 milisegundos).
 */
export function playTapSound(intensity = 12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    const isHeavy = typeof intensity === 'number' ? intensity >= 18 : intensity === 'heavy';
    const isLight = typeof intensity === 'number' ? intensity <= 10 : intensity === 'light';

    // Frecuencias sutiles tipo clic mecánico sordo
    const startFreq = isHeavy ? 240 : isLight ? 180 : 210;
    const endFreq = isHeavy ? 45 : 35;
    const duration = isHeavy ? 0.026 : 0.018;
    const volume = isHeavy ? 0.14 : isLight ? 0.08 : 0.11;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}

/**
 * Disparador unificado de feedback táctil:
 * 1. Vibración real en Android / dispositivos compatibles (navigator.vibrate)
 * 2. Micro-tap acústico en iPhone (iOS Safari) y navegadores web
 */
export function triggerHaptic(duration = 12) {
  // 1. Vibración física (Android)
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  } catch {}

  // 2. Micro-tap acústico (iPhone / iOS y navegadores web)
  playTapSound(duration);
}
