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
