import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM2MDYzMCwiZXhwIjoyMTA3OTM2NjMwfQ.vAgp0IYu_g-aNAcdM9D4UockL8oBggGg3P1S5U2H_94';

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      clientUuid,
      deviceType,
      browser,
      os,
      screenRes,
      path = '/',
      duration = 0,
      hasOrdered = false,
      orderTotal = 0
    } = body || {};

    if (!clientUuid) {
      return res.status(400).json({ error: 'Missing clientUuid' });
    }

    // IP & Geolocation headers from Vercel Edge
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const city = req.headers['x-vercel-ip-city'] || 'Paterson / Local';
    const country = req.headers['x-vercel-ip-country'] || 'US';

    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Obtener o inicializar registro diario en restaurant_config
    const configKey = `analytics_${dateKey}`;
    const { data: existingEntry } = await adminClient
      .from('restaurant_config')
      .select('value')
      .eq('key', configKey)
      .maybeSingle();

    const currentStats = existingEntry?.value || {
      date: dateKey,
      total_pageviews: 0,
      unique_visitors: {},
      devices: { mobile: 0, desktop: 0, tablet: 0 },
      browsers: {},
      operating_systems: {},
      durations: [],
      conversions: { visits: 0, orders: 0, revenue: 0 },
      recent_sessions: []
    };

    // Incrementar vistas
    currentStats.total_pageviews = (currentStats.total_pageviews || 0) + 1;

    // Dispositivo
    const dev = (deviceType || 'mobile').toLowerCase();
    currentStats.devices[dev] = (currentStats.devices[dev] || 0) + 1;

    // Navegador & SO
    const br = browser || 'Chrome';
    currentStats.browsers[br] = (currentStats.browsers[br] || 0) + 1;
    const sys = os || 'Android/iOS';
    currentStats.operating_systems[sys] = (currentStats.operating_systems[sys] || 0) + 1;

    // Duración de la sesión
    if (duration > 0) {
      currentStats.durations.push(Math.min(duration, 3600)); // Tope de 1 hora
      if (currentStats.durations.length > 200) currentStats.durations.shift();
    }

    // Visitante único por UUID
    const isNewToday = !currentStats.unique_visitors[clientUuid];
    if (isNewToday) {
      currentStats.unique_visitors[clientUuid] = {
        firstSeen: now.toISOString(),
        device: dev
      };
    }

    // Conversión de Compra
    if (hasOrdered) {
      currentStats.conversions.orders = (currentStats.conversions.orders || 0) + 1;
      currentStats.conversions.revenue = (currentStats.conversions.revenue || 0) + Number(orderTotal || 0);
    }

    // Bitácora de sesiones recientes (máximo 50 más recientes para el panel)
    currentStats.recent_sessions.unshift({
      id: `${clientUuid.slice(0, 8)}_${Date.now()}`,
      clientUuid,
      timestamp: now.toISOString(),
      deviceType: dev,
      browser: br,
      os: sys,
      screenRes: screenRes || '390x844',
      durationSeconds: duration,
      hasOrdered,
      orderTotal: Number(orderTotal || 0),
      city,
      country,
      path
    });

    if (currentStats.recent_sessions.length > 50) {
      currentStats.recent_sessions = currentStats.recent_sessions.slice(0, 50);
    }

    // Guardar en Supabase restaurant_config
    await adminClient.from('restaurant_config').upsert({
      key: configKey,
      value: currentStats,
      updated_at: now.toISOString()
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error in record-visit API:', err);
    return res.status(500).json({ error: err.message });
  }
}

