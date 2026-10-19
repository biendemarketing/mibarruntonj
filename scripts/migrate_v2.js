import https from 'node:https';
import './env_loader.js';

const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_TOKEN || '';
const projectRef = process.env.SUPABASE_PROJECT_REF || '';

const sql = `
  -- 1. Soporte para múltiples imágenes y ocultar plato en dishes
  ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
  ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

  -- 2. Soporte para estado de pago en orders
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2);

  -- 3. Configuración para el menú imprimible
  INSERT INTO public.restaurant_config (key, value)
  VALUES (
    'printable_menu',
    '{"title": "Mi Barrunto — Carta Menú Oficial", "subtitle": "Auténtica Gastronomía Peruana", "phone": "(973) 653-3749", "address": "Paterson, New Jersey", "schedule": "Atención 24 Horas · Abierto todos los días", "notice": "Agradecimiento del 18% en las mesas con 2 o más personas", "columns": 2, "highlight_color": "#d91c2b"}'::jsonb
  )
  ON CONFLICT (key) DO NOTHING;
`;

const payload = JSON.stringify({ query: sql });
const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Migration response:', res.statusCode, data));
});
req.on('error', console.error);
req.write(payload);
req.end();
