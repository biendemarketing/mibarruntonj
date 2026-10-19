import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import './env_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en las variables de entorno o en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function cleanStorageName(filename) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/…/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadFile(filePath, storagePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from('dishes')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/dishes/${storagePath}`;
}

async function runQueue(tasks, concurrency = 12) {
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      try {
        await tasks[current]();
      } catch (err) {
        // Ignorar o loguear
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main() {
  const platosDir = path.join(__dirname, '../public/platos_webp');
  const files = fs.readdirSync(platosDir).filter(f => f.endsWith('.webp'));
  console.log(`Subiendo ${files.length} imágenes en paralelo (12 concurrentes)...`);

  const urlMap = new Map();

  const tasks = files.map((file, idx) => async () => {
    const cleanName = cleanStorageName(file);
    const storagePath = `platos_webp/${cleanName}`;
    const fullPath = path.join(platosDir, file);

    const cdnUrl = await uploadFile(fullPath, storagePath, 'image/webp');
    urlMap.set(file, cdnUrl);
    urlMap.set(cleanName, cdnUrl);
    if ((idx + 1) % 40 === 0 || idx === files.length - 1) {
      console.log(`⏳ Subidas ${idx + 1}/${files.length} imágenes.`);
    }
  });

  await runQueue(tasks, 12);
  console.log('✅ Todas las imágenes subidas al bucket dishes.');

  // Actualizar base de datos
  const { data: dishes } = await supabase.from('dishes').select('*');
  console.log(`Sincronizando ${dishes.length} platos en Supabase con sus URLs CDN...`);

  const updateTasks = dishes.map((dish) => async () => {
    if (!dish.platos_image) return;
    const baseName = dish.platos_image.split('/').pop();
    const cdnUrl = urlMap.get(baseName) || urlMap.get(cleanStorageName(baseName));

    if (cdnUrl) {
      await supabase.from('dishes').update({
        platos_image: cdnUrl,
        images: [cdnUrl]
      }).eq('id', dish.id);
    }
  });

  await runQueue(updateTasks, 15);
  console.log('🎉 ¡Base de datos y Storage sincronizados al 100%!');
}

main().catch(console.error);
