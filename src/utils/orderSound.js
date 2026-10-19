/**
 * Notificación Sonora Sutil para Nuevos Pedidos en el Panel Administrativo
 * Implementado con la Web Audio API nativa (sin dependencias externas ni archivos de audio)
 */

export function playOrderNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Campana de doble tono agradable (arpegio de restaurante)
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Envolvente suave para evitar clicks
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.4);       // Re5
    playTone(880.00, now + 0.15, 0.6); // La5
    playTone(1174.66, now + 0.3, 0.8); // Re6
  } catch (e) {
    console.debug('Sonido no reproducido (bloqueado por políticas de navegador):', e);
  }
}
