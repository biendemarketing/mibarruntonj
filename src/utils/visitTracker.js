import { getClientUuid } from './clientIdentity';

// Helper para detectar tipo de dispositivo y navegador
function detectClientEnvironment() {
  if (typeof window === 'undefined' || !navigator) {
    return { deviceType: 'desktop', browser: 'Unknown', os: 'Unknown', screenRes: '1920x1080' };
  }

  const ua = navigator.userAgent || '';
  let deviceType = 'desktop';
  if (/mobile|android|touch|webos|hpwos/i.test(ua)) deviceType = 'mobile';
  else if (/ipad|tablet/i.test(ua)) deviceType = 'tablet';

  let browser = 'Chrome';
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  let os = 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;

  return { deviceType, browser, os, screenRes };
}

class VisitTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.hasRecordedVisit = false;
    this.currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  }

  // Enviar telemetría al endpoint seguro de Vercel
  async sendPayload(extra = {}) {
    try {
      const clientUuid = getClientUuid();
      const env = detectClientEnvironment();
      const duration = Math.max(0, Math.floor((Date.now() - this.sessionStartTime) / 1000));

      const payload = {
        clientUuid,
        deviceType: env.deviceType,
        browser: env.browser,
        os: env.os,
        screenRes: env.screenRes,
        path: this.currentPath,
        duration,
        ...extra
      };

      // Usar sendBeacon si está disponible al descargar la página
      if (extra.isUnload && navigator.sendBeacon) {
        navigator.sendBeacon('/api/record-visit', JSON.stringify(payload));
        return;
      }

      await fetch('/api/record-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (_) {}
  }

  // Inicializar rastreo automático al cargar la web
  init() {
    if (typeof window === 'undefined') return;

    // Evitar contar accesos al panel de administración como visitas de clientes
    if (window.location.pathname.startsWith('/admin')) return;

    // Registrar inicio de visita
    this.sendPayload({ hasOrdered: false });

    // Actualizar duración periódica cada 30 segundos
    setInterval(() => {
      this.sendPayload({ hasOrdered: false });
    }, 30000);

    // Enviar duración final al cerrar la pestaña
    window.addEventListener('beforeunload', () => {
      this.sendPayload({ isUnload: true });
    });
  }

  // Registrar conversión cuando el cliente finaliza un pedido
  recordOrderConversion(orderTotal = 0) {
    this.sendPayload({
      hasOrdered: true,
      orderTotal: Number(orderTotal) || 0
    });
  }
}

export const visitTracker = new VisitTracker();

