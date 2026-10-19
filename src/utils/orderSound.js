/**
 * Sistema de Notificaciones Sonoras y Push para Nuevos Pedidos
 * Mi Barrunto - Panel Administrativo & Cocina
 */

let sharedAudioContext = null;

/**
 * Obtiene o inicializa el AudioContext compartido
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextClass();
    }

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
  } catch (err) {
    console.debug('Error inicializando AudioContext:', err);
    return null;
  }
}

/**
 * Desbloquea el audio del navegador tras la primera interacción del usuario
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Reproduce la campana de restaurante de doble arpegio para nuevos pedidos
 */
export function playOrderNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Si sigue suspendido, intentar reanudar
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playTone = (freq, startTime, duration, vol = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Tono más cálido y resonante tipo campana
      osc.frequency.setValueAtTime(freq, startTime);

      // Envolvente acústica de campana
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Secuencia de campana de restaurante alegre: Do6 -> Mi6 -> Sol6 -> Do7
    playTone(523.25, now, 0.45, 0.28);
    playTone(659.25, now + 0.12, 0.45, 0.32);
    playTone(783.99, now + 0.24, 0.55, 0.35);
    playTone(1046.50, now + 0.36, 0.95, 0.38);
  } catch (e) {
    console.debug('Sonido bloqueado por política de autoplay:', e);
  }
}

/**
 * Solicita permiso de notificaciones del sistema en el navegador
 * @returns {Promise<boolean>} si se otorgó el permiso
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  unlockAudio();

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playOrderNotificationSound();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error solicitando permiso de notificación:', err);
    return false;
  }
}

/**
 * Consulta el estado actual del permiso de notificaciones
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Envía una notificación nativa del navegador / sistema operativo
 * Funciona aun si la pestaña está en segundo plano o minimizada
 */
export function sendBrowserNotification(order) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const orderNum = order.order_number ? `#${order.order_number}` : '';
    const tableStr = order.table_number ? `(${order.table_number})` : '';
    const itemCount = order.items ? order.items.length : 1;
    const totalStr = order.total_amount ? `$${Number(order.total_amount).toFixed(2)}` : '';

    const title = `¡Nuevo Pedido en Mi Barrunto! ${orderNum}`;
    const options = {
      body: `${order.customer_name || 'Cliente'} ${tableStr} · ${itemCount} ${itemCount === 1 ? 'plato' : 'platos'} · Total: ${totalStr}`,
      icon: '/logo/logo.png',
      badge: '/logo/logo.png',
      tag: `mb-order-${order.id || Date.now()}`,
      vibrate: [250, 100, 250, 100, 250],
      requireInteraction: true // Mantiene la notificación visible hasta que el mesero la atienda
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    console.debug('No se pudo enviar notificación nativa:', e);
  }
}
