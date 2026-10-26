import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SUPABASE_URL = 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const batidosDir = path.join(rootDir, 'public', 'Batidos');
const variacionesDir = path.join(batidosDir, 'Variaciones');
const platosWebpDir = path.join(rootDir, 'public', 'platos_webp');

// Encontrar archivos ignorando problemas de codificación tildes
function findFile(dir, pattern) {
  const files = fs.readdirSync(dir);
  const found = files.find(f => pattern.test(f));
  if (!found) {
    throw new Error(`No se encontró archivo con patrón ${pattern} en ${dir}`);
  }
  return path.join(dir, found);
}

const items = [
  {
    key: 'pina',
    source: findFile(batidosDir, /Peruvian_pineapple_drink/i),
    webpName: 'batido_de_pina.webp'
  },
  {
    key: 'fresa',
    source: findFile(batidosDir, /Strawberry_smoothie/i),
    webpName: 'batido_de_fresa.webp'
  },
  {
    key: 'papaya',
    source: findFile(batidosDir, /Papaya_smoothie/i),
    webpName: 'batido_de_papaya.webp'
  },
  {
    key: 'maracuya',
    source: findFile(batidosDir, /Make_passion_fruit/i),
    webpName: 'batido_de_maracuya.webp'
  },
  {
    key: 'mango',
    source: findFile(batidosDir, /Mango_smoothie/i),
    webpName: 'batido_de_mango.webp'
  },
  {
    key: 'guanabana',
    source: findFile(batidosDir, /Guan.*smoothie/i),
    webpName: 'batido_de_guanabana.webp'
  },
  {
    key: 'platano',
    source: findFile(batidosDir, /Banana_smoothie/i),
    webpName: 'batido_de_platano.webp'
  },
  {
    key: 'chocolate',
    source: findFile(batidosDir, /Chocolate_milk/i),
    webpName: 'batido_de_chocolate.webp'
  },
  {
    key: 'vainilla',
    source: findFile(batidosDir, /Vanilla_milk/i),
    webpName: 'batido_de_vainilla.webp'
  },
  {
    key: 'lucuma',
    source: findFile(batidosDir, /L.*cuma_smoothie/i),
    webpName: 'batido_de_lucuma.webp'
  },
  {
    key: 'mora',
    source: findFile(batidosDir, /Blackberry_smoothie/i),
    webpName: 'batido_de_mora.webp'
  },
  {
    key: 'surtido',
    source: findFile(batidosDir, /Surtido\s*Peruano/i),
    webpName: 'batido_surtido_peruano.webp'
  },
  {
    key: 'especial',
    source: findFile(batidosDir, /Especial\s*peruano/i),
    webpName: 'batido_especial_peruano.webp'
  },
  {
    key: 'var_agua_leche',
    source: findFile(variacionesDir, /Glass_of_milk_and_water/i),
    webpName: 'variacion_agua_o_leche_regular.webp'
  },
  {
    key: 'var_carnation',
    source: findFile(variacionesDir, /Carnation_evaporated/i),
    webpName: 'variacion_leche_carnation.webp'
  }
];

async function main() {
  console.log(`[1/3] Convirtiendo ${items.length} imágenes a WebP con ffmpeg...`);
  for (const item of items) {
    const destPlatos = path.join(platosWebpDir, item.webpName);
    const destBatidos = path.join(batidosDir, item.webpName);
    
    // Comando ffmpeg para convertir a WebP con calidad 85 y escala proporcionada máx 1024
    const cmd = `ffmpeg -y -i "${item.source}" -vf "scale='min(1024,iw)':-1" -c:v libwebp -quality 85 "${destPlatos}"`;
    execSync(cmd, { stdio: 'inherit' });
    
    // Copiar también a Batidos para respaldo
    fs.copyFileSync(destPlatos, destBatidos);
    console.log(`✔ Convertido: ${item.webpName}`);
  }

  console.log(`\n[2/3] Subiendo WebPs al bucket 'dishes' de Supabase Storage...`);
  const uploadedUrls = {};

  for (const item of items) {
    const filePath = path.join(platosWebpDir, item.webpName);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Subir tanto a platos_webp/ como a batidos/
    const storagePathPlatos = `platos_webp/${item.webpName}`;
    const storagePathBatidos = `batidos/${item.webpName}`;

    console.log(`Subiendo ${item.webpName}...`);
    
    const { error: err1 } = await supabase.storage
      .from('dishes')
      .upload(storagePathPlatos, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
    if (err1) console.warn(`Aviso al subir a ${storagePathPlatos}:`, err1.message);

    const { error: err2 } = await supabase.storage
      .from('dishes')
      .upload(storagePathBatidos, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });
    if (err2) console.warn(`Aviso al subir a ${storagePathBatidos}:`, err2.message);

    const { data: publicData } = supabase.storage
      .from('dishes')
      .getPublicUrl(storagePathPlatos);

    uploadedUrls[item.key] = publicData.publicUrl;
    console.log(`✔ Subido a Supabase: ${publicData.publicUrl}`);
  }

  console.log('\n[3/3] Resumen de URLs públicas generadas:');
  console.log(JSON.stringify(uploadedUrls, null, 2));

  // Guardar archivo JSON con los links para importación
  fs.writeFileSync(
    path.join(rootDir, 'scripts', 'batidos_links.json'),
    JSON.stringify(uploadedUrls, null, 2),
    'utf-8'
  );
  console.log('✔ Guardado en scripts/batidos_links.json');
}

main().catch(err => {
  console.error('Error en proceso:', err);
  process.exit(1);
});
