/**
 * Identidad Única Anónima del Cliente para Pedidos sin Registro
 */

export function getClientUuid() {
  const STORAGE_KEY = 'mb-client-uuid';
  try {
    let uuid = localStorage.getItem(STORAGE_KEY);
    if (!uuid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uuid = crypto.randomUUID();
      } else {
        uuid = 'cli_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      }
      localStorage.setItem(STORAGE_KEY, uuid);
    }
    return uuid;
  } catch {
    return 'cli_fallback_' + Date.now();
  }
}

/**
 * Detectar número de mesa desde la URL (?mesa=3 o ?table=3) o de localStorage
 */
export function getSavedCustomerInfo() {
  let tableFromUrl = '';
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    tableFromUrl = params.get('mesa') || params.get('table') || '';
  }

  try {
    const saved = localStorage.getItem('mb-customer-info');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: parsed.name || '',
        phone: parsed.phone || '',
        tableNumber: tableFromUrl || parsed.tableNumber || ''
      };
    }
  } catch {}

  return {
    name: '',
    phone: '',
    tableNumber: tableFromUrl || ''
  };
}

/**
 * Guardar datos del cliente en localStorage para futuros pedidos
 */
export function saveCustomerInfo({ name, phone, tableNumber }) {
  try {
    localStorage.setItem(
      'mb-customer-info',
      JSON.stringify({
        name: name || '',
        phone: phone || '',
        tableNumber: tableNumber || ''
      })
    );
  } catch {}
}

/**
 * RATE LIMIT: Evitar abuso o spam de pedidos repetidos
 * Cooldown de 45 segundos entre pedidos desde el mismo dispositivo
 */
export function checkOrderRateLimit(cooldownSeconds = 45) {
  try {
    const lastTimestampStr = localStorage.getItem('mb-last-order-timestamp');
    if (!lastTimestampStr) return { allowed: true, secondsLeft: 0 };

    const lastTimestamp = parseInt(lastTimestampStr, 10);
    const elapsedSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);

    if (elapsedSeconds < cooldownSeconds) {
      return {
        allowed: false,
        secondsLeft: cooldownSeconds - elapsedSeconds
      };
    }
  } catch {}

  return { allowed: true, secondsLeft: 0 };
}

export function recordOrderTimestamp() {
  try {
    localStorage.setItem('mb-last-order-timestamp', String(Date.now()));
  } catch {}
}

/**
 * Obtener código corto amigable de cliente para meseros (ej: #CLI-8492)
 * Evita confusiones cuando comensales tienen el mismo nombre.
 */
export function getClientShortCode(clientUuid) {
  if (!clientUuid) return '#CLI-0001';
  let hash = 0;
  for (let i = 0; i < clientUuid.length; i++) {
    hash = (hash << 5) - hash + clientUuid.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash) % 9000 + 1000;
  return `#CLI-${positive}`;
}


