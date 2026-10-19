import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'scvlxcgmhbwjmvycrttf';
const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function requestManagement(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.supabase.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function requestStorage(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: `${SUPABASE_PROJECT_REF}.supabase.co`,
      path: `/storage/v1${apiPath}`,
      method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`Storage Error ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSql(sql) {
  return requestManagement(`/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, 'POST', { query: sql });
}

async function main() {
  console.log('🚀 Iniciando configuración completa de Supabase para Mi Barrunto...');

  // 1. Crear Storage Bucket público 'dishes'
  try {
    console.log('📁 Verificando / creando bucket de almacenamiento "dishes"...');
    await requestStorage('/bucket', 'POST', {
      id: 'dishes',
      name: 'dishes',
      public: true,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
    });
    console.log('✅ Bucket "dishes" creado correctamente (Público).');
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('409') || err.message.includes('Duplicate')) {
      console.log('ℹ️ Bucket "dishes" ya existe.');
    } else {
      console.warn('⚠️ Nota bucket:', err.message);
    }
  }

  // 2. Ejecutar Schema SQL
  console.log('🗄️ Creando tablas de Base de Datos y configurando Realtime...');
  const schemaSql = `
    -- 1. Categorías
    CREATE TABLE IF NOT EXISTS public.categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_en TEXT,
        icon TEXT,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 2. Platos
    CREATE TABLE IF NOT EXISTS public.dishes (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
        image_url TEXT,
        platos_image TEXT,
        is_active BOOLEAN DEFAULT true,
        is_available BOOLEAN DEFAULT true,
        badge TEXT,
        pairings TEXT[] DEFAULT '{}',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- 3. Mesas
    CREATE TABLE IF NOT EXISTS public.tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number INT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        capacity INT DEFAULT 4,
        status TEXT DEFAULT 'available', -- 'available', 'occupied', 'reserved'
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 4. Meseros / Personal
    CREATE TABLE IF NOT EXISTS public.waiters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        pin TEXT NOT NULL DEFAULT '1234',
        phone TEXT,
        role TEXT DEFAULT 'mesero', -- 'mesero', 'capitan', 'cajero', 'cocina'
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 5. Pedidos
    CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL,
        client_uuid TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        table_number TEXT NOT NULL,
        table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
        waiter_id UUID REFERENCES public.waiters(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'in_kitchen', 'ready', 'delivered', 'cancelled'
        estimated_time TEXT DEFAULT '15-20 min',
        subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
        tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        payment_method TEXT DEFAULT 'efectivo',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- 6. Items del Pedido
    CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        dish_id TEXT,
        dish_name TEXT NOT NULL,
        dish_price NUMERIC(10,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        subtotal NUMERIC(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- 7. Configuración General del Restaurante
    CREATE TABLE IF NOT EXISTS public.restaurant_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Habilitar RLS (Row Level Security)
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.restaurant_config ENABLE ROW LEVEL SECURITY;

    -- Políticas de lectura pública para menú, mesas y configuración
    DO $$
    BEGIN
        DROP POLICY IF EXISTS "Permitir lectura publica de categorias" ON public.categories;
        CREATE POLICY "Permitir lectura publica de categorias" ON public.categories FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir todo a service y auth en categorias" ON public.categories;
        CREATE POLICY "Permitir todo a service y auth en categorias" ON public.categories FOR ALL USING (true);

        DROP POLICY IF EXISTS "Permitir lectura publica de platos" ON public.dishes;
        CREATE POLICY "Permitir lectura publica de platos" ON public.dishes FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir todo a service y auth en platos" ON public.dishes;
        CREATE POLICY "Permitir todo a service y auth en platos" ON public.dishes FOR ALL USING (true);

        DROP POLICY IF EXISTS "Permitir lectura publica de mesas" ON public.tables;
        CREATE POLICY "Permitir lectura publica de mesas" ON public.tables FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir todo en mesas" ON public.tables;
        CREATE POLICY "Permitir todo en mesas" ON public.tables FOR ALL USING (true);

        DROP POLICY IF EXISTS "Permitir lectura de meseros" ON public.waiters;
        CREATE POLICY "Permitir lectura de meseros" ON public.waiters FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir todo en meseros" ON public.waiters;
        CREATE POLICY "Permitir todo en meseros" ON public.waiters FOR ALL USING (true);

        DROP POLICY IF EXISTS "Permitir lectura de pedidos" ON public.orders;
        CREATE POLICY "Permitir lectura de pedidos" ON public.orders FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir insercion de pedidos anonimos" ON public.orders;
        CREATE POLICY "Permitir insercion de pedidos anonimos" ON public.orders FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Permitir actualizar pedidos" ON public.orders;
        CREATE POLICY "Permitir actualizar pedidos" ON public.orders FOR UPDATE USING (true);

        DROP POLICY IF EXISTS "Permitir lectura de items de pedidos" ON public.order_items;
        CREATE POLICY "Permitir lectura de items de pedidos" ON public.order_items FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir insercion de items de pedidos" ON public.order_items;
        CREATE POLICY "Permitir insercion de items de pedidos" ON public.order_items FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Permitir lectura publica de config" ON public.restaurant_config;
        CREATE POLICY "Permitir lectura publica de config" ON public.restaurant_config FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Permitir modificacion de config" ON public.restaurant_config;
        CREATE POLICY "Permitir modificacion de config" ON public.restaurant_config FOR ALL USING (true);
    END $$;

    -- Realtime publication
    DO $$
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END $$;
  `;

  await runSql(schemaSql);
  console.log('✅ Esquema y políticas RLS creadas exitosamente.');

  // 3. Crear Mesas iniciales (Mesas 1 a 20)
  console.log('🪑 Sembrando mesas iniciales (1 a 20)...');
  const tablesSql = `
    INSERT INTO public.tables (number, name, capacity, status)
    VALUES 
      ${Array.from({ length: 20 }, (_, i) => `(${i + 1}, 'Mesa ${i + 1}', 4, 'available')`).join(',\n      ')}
    ON CONFLICT (number) DO NOTHING;
  `;
  await runSql(tablesSql);
  console.log('✅ Mesas 1 a 20 configuradas.');

  // 4. Crear Meseros iniciales
  console.log('🧑‍🍳 Sembrando personal / meseros iniciales...');
  const waitersSql = `
    INSERT INTO public.waiters (name, pin, phone, role)
    VALUES 
      ('Carlos Ramos', '1111', '(973) 555-0101', 'capitan'),
      ('María Huamán', '2222', '(973) 555-0102', 'mesero'),
      ('Jorge Quispe', '3333', '(973) 555-0103', 'mesero'),
      ('Ana Flores', '4444', '(973) 555-0104', 'mesero')
    ON CONFLICT DO NOTHING;
  `;
  await runSql(waitersSql);
  console.log('✅ Personal inicial configurado.');

  // 5. Configuración del Restaurante
  console.log('⚙️ Guardando configuración de restaurante...');
  const configSql = `
    INSERT INTO public.restaurant_config (key, value)
    VALUES 
      ('general', '{"name": "Mi Barrunto NJ", "address": "Paterson, New Jersey", "phone": "(973) 653-3749", "default_wait_time": "15-20 min", "is_open_24h": true, "tax_rate": 0.06625}'::jsonb),
      ('admin_auth', '{"pin": "2026", "passcode": "barrunto2026"}'::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  `;
  await runSql(configSql);
  console.log('✅ Configuración guardada.');

  // 6. Migrar Categorías y Platos locales a Supabase
  console.log('📦 Migrando las 16 categorías y 249 platos a Supabase...');
  const { CATEGORIES_DATA, DISHES_DATA } = await import('../src/data/menuData.js');
  const platosMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/platosMap.json'), 'utf8'));

  // Helper para escapar cadenas SQL
  const toSqlStr = (val) => val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

  // Insertar categorías
  for (let i = 0; i < CATEGORIES_DATA.length; i++) {
    const c = CATEGORIES_DATA[i];
    const catSql = `
      INSERT INTO public.categories (id, name, name_en, icon, sort_order, is_active)
      VALUES (
        ${toSqlStr(c.id)},
        ${toSqlStr(c.name)},
        ${toSqlStr(c.nameEn || '')},
        ${toSqlStr(c.icon || '')},
        ${i},
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order;
    `;
    await runSql(catSql);
  }
  console.log(`✅ ${CATEGORIES_DATA.length} categorías sincronizadas en Supabase.`);

  // Insertar platos en lotes
  const batchSize = 25;
  for (let i = 0; i < DISHES_DATA.length; i += batchSize) {
    const batch = DISHES_DATA.slice(i, i + batchSize);
    const valuesSql = batch.map((d, idx) => {
      const platosImg = d.platosImage || platosMap[d.id] || null;
      const pairingsArr = Array.isArray(d.pairings) && d.pairings.length > 0
        ? `ARRAY[${d.pairings.map(p => toSqlStr(p)).join(',')}]::text[]`
        : "'{}'::text[]";

      return `(
        ${toSqlStr(d.id)},
        ${toSqlStr(d.code || '')},
        ${toSqlStr(d.name)},
        ${toSqlStr(d.description || '')},
        ${Number(d.price) || 0},
        ${toSqlStr(d.category)},
        ${toSqlStr(d.image || '')},
        ${toSqlStr(platosImg || '')},
        true,
        true,
        ${toSqlStr(d.badge || '')},
        ${pairingsArr},
        ${i + idx}
      )`;
    }).join(',\n      ');

    const batchSql = `
      INSERT INTO public.dishes (
        id, code, name, description, price, category_id, image_url, platos_image, is_active, is_available, badge, pairings, sort_order
      ) VALUES
      ${valuesSql}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        category_id = EXCLUDED.category_id,
        image_url = EXCLUDED.image_url,
        platos_image = EXCLUDED.platos_image,
        is_available = EXCLUDED.is_available,
        badge = EXCLUDED.badge,
        pairings = EXCLUDED.pairings,
        sort_order = EXCLUDED.sort_order;
    `;
    await runSql(batchSql);
  }
  console.log(`✅ ${DISHES_DATA.length} platos sincronizados en Supabase.`);

  // 7. Configurar políticas de Storage para el bucket dishes (permisos para subir fotos)
  console.log('🔒 Configurando políticas de Supabase Storage para bucket "dishes"...');
  const storagePoliciesSql = `
    DO $$
    BEGIN
      DROP POLICY IF EXISTS "Public Access Dishes Bucket" ON storage.objects;
      CREATE POLICY "Public Access Dishes Bucket" ON storage.objects FOR SELECT USING (bucket_id = 'dishes');

      DROP POLICY IF EXISTS "Allow All Upload to Dishes" ON storage.objects;
      CREATE POLICY "Allow All Upload to Dishes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dishes');

      DROP POLICY IF EXISTS "Allow All Update to Dishes" ON storage.objects;
      CREATE POLICY "Allow All Update to Dishes" ON storage.objects FOR UPDATE USING (bucket_id = 'dishes');

      DROP POLICY IF EXISTS "Allow All Delete to Dishes" ON storage.objects;
      CREATE POLICY "Allow All Delete to Dishes" ON storage.objects FOR DELETE USING (bucket_id = 'dishes');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;
  `;
  await runSql(storagePoliciesSql);
  console.log('✅ Políticas de Storage listas.');

  console.log('\n🎉 ¡CONFIGURACIÓN DE SUPABASE COMPLETADA AL 100%!');
}

main().catch(err => {
  console.error('❌ Error general:', err);
  process.exit(1);
});
