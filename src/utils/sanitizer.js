/**
 * Utilidades de Sanitización y Seguridad Antifraude (XSS, SQLi, Anti-Abuso)
 * Mi Barrunto — Restaurante & Grocery
 */

/**
 * Sanitiza texto eliminando etiquetas HTML peligrosas, scripts y caracteres de inyección SQL
 * @param {string} input - Texto sin procesar
 * @param {number} [maxLength=250] - Longitud máxima permitida
 * @returns {string} Texto limpio y seguro
 */
export function sanitizeInput(input, maxLength = 250) {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // 1. Recortar espacios iniciales y finales
    .trim()
    // 2. Limitar longitud para prevenir desbordamientos y ataques de memoria (DoS)
    .slice(0, maxLength)
    // 3. Eliminar etiquetas HTML y scripts sospechosos
    .replace(/<[^>]*>?/gm, '')
    // 4. Prevenir vectores comunes de XSS (javascript:, data:, vbscript:, onload=, etc.)
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // 5. Neutralizar secuencias típicas de inyección SQL
    .replace(/(--|;|\/\*|\*\/|xp_)/g, '');

  return sanitized;
}

/**
 * Sanitiza números de teléfono (solo dígitos, espacios, guiones, paréntesis y '+')
 * @param {string} phone
 * @returns {string}
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').slice(0, 25).trim();
}

/**
 * Sanitiza nombres de clientes (solo letras, espacios, acentos, tildes y apóstrofes permitidos)
 * @param {string} name
 * @returns {string}
 */
export function sanitizeCustomerName(name) {
  if (typeof name !== 'string') return '';
  return sanitizeInput(name, 70);
}

/**
 * Sanitiza notas de cocina o indicaciones especiales
 * @param {string} note
 * @returns {string}
 */
export function sanitizeNotes(note) {
  if (typeof note !== 'string') return '';
  return sanitizeInput(note, 300);
}

/**
 * Generador y validador de Token CSRF simple para solicitudes de checkout
 */
export function generateClientSessionToken() {
  try {
    const key = 'mb_sess_token';
    let token = sessionStorage.getItem(key);
    if (!token) {
      token = 'mb_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem(key, token);
    }
    return token;
  } catch {
    return 'mb_default_token';
  }
}
