import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM2MDYzMCwiZXhwIjoyMTA3OTM2NjMwfQ.vAgp0IYu_g-aNAcdM9D4UockL8oBggGg3P1S5U2H_94';

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
