import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjM2MDYzMCwiZXhwIjoyMTA3OTM2NjMwfQ.vAgp0IYu_g-aNAcdM9D4UockL8oBggGg3P1S5U2H_94';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadFile(filePath, storagePath, contentType) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from('dishes')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw error;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/dishes/${storagePath}`;
}

async function runQueue(tasks, concurrency = 8) {
  let index = 0;
  const results = [];

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      try {
        results[current] = await tasks[current]();
      } catch (err) {
        console.error(`Task ${current} failed:`, err.message);
        results[current] = null;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes y video a Supabase Storage CDN...');

  // 1. Subir Video y Fondo de Restaurante
  const videoPath = path.join(__dirname, '../public/header-bg.mp4');
  if (fs.existsSync(videoPath)) {
    console.log('🎥 Subiendo header-bg.mp4 a Supabase Storage...');
    try {
      const videoUrl = await uploadFile(videoPath, 'assets/header-bg.mp4', 'video/mp4');
      console.log('✅ Video subido exitosamente:', videoUrl);
    } catch (e) {
      console.warn('Nota video:', e.message);
    }
  }

  const bgPath = path.join(__dirname, '../public/bg-restaurant.jpg');
  if (fs.existsSync(bgPath)) {
    console.log('🖼️ Subiendo bg-restaurant.jpg a Supabase Storage...');
    try {
      const bgUrl = await uploadFile(bgPath, 'assets/bg-restaurant.jpg', 'image/jpeg');
      console.log('✅ Fondo de restaurante subido exitosamente:', bgUrl);
    } catch (e) {
      console.warn('Nota bg:', e.message);
    }
  }

  // 2. Subir todas las imágenes de platos_webp
  const platosDir = path.join(__dirname, '../public/platos_webp');
  if (fs.existsSync(platosDir)) {
    const files = fs.readdirSync(platosDir).filter(f => f.endsWith('.webp'));
    console.log(`📦 Encontradas ${files.length} imágenes en public/platos_webp. Subiendo en paralelo...`);

    const tasks = files.map((file, idx) => async () => {
      const fullPath = path.join(platosDir, file);
      const storagePath = `platos_webp/${file}`;
      await uploadFile(fullPath, storagePath, 'image/webp');
      if (idx % 25 === 0 || idx === files.length - 1) {
        console.log(`⏳ Progreso: ${idx + 1}/${files.length} imágenes subidas a Supabase.`);
      }
      return { file, storagePath };
    });

    await runQueue(tasks, 10);
    console.log(`✅ ¡Todas las ${files.length} imágenes WebP están subidas al bucket de Supabase!`);
  }

  // 3. Actualizar la base de datos de platos con la URL de Supabase CDN y array de imágenes inicial
  console.log('🔄 Actualizando URLs CDN en la tabla "dishes" de Supabase...');
  const { data: dishes, error: dishesErr } = await supabase.from('dishes').select('id, platos_image');
  if (dishesErr) {
    console.error('Error obteniendo platos:', dishesErr);
    return;
  }

  const updateTasks = dishes.map((dish, idx) => async () => {
    if (!dish.platos_image) return;

    // Extraer nombre del archivo WebP
    const filename = dish.platos_image.split('/').pop();
    if (!filename) return;

    const cdnUrl = `${SUPABASE_URL}/storage/v1/object/public/dishes/platos_webp/${filename}`;

    await supabase.from('dishes').update({
      platos_image: cdnUrl,
      images: [cdnUrl]
    }).eq('id', dish.id);

    if (idx % 50 === 0 || idx === dishes.length - 1) {
      console.log(`⏳ Actualizados ${idx + 1}/${dishes.length} platos con CDN URL.`);
    }
  });

  await runQueue(updateTasks, 15);
  console.log('🎉 ¡MIGRACIÓN DE ASSETS Y BASE DE DATOS COMPLETADA CON ÉXITO!');
}

main().catch(console.error);
