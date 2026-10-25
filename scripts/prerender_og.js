import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const distIndexPath = path.join(distDir, 'index.html');

async function prerenderOpenGraph() {
  if (!fs.existsSync(distIndexPath)) {
    console.error('[prerender-og] dist/index.html not found. Run vite build first.');
    return;
  }

  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  const { DISHES_DATA } = await import('../src/data/menuData.js');
  
  let platosMap = {};
  try {
    const mapContent = fs.readFileSync(path.join(rootDir, 'src/data/platosMap.json'), 'utf-8');
    platosMap = JSON.parse(mapContent);
  } catch (e) {}

  const baseUrl = 'https://mibarruntonj.vercel.app';
  let generatedCount = 0;

  for (const dish of DISHES_DATA) {
    const dishDir = path.join(distDir, 'plato', String(dish.id));
    fs.mkdirSync(dishDir, { recursive: true });

    const priceText = dish.priceDisplay || `$${dish.price ? dish.price.toFixed(2) : '0.00'}`;
    const titleText = `${dish.name} (${priceText}) — Mi Barrunto`;
    const descText = dish.nameEn 
      ? `${dish.nameEn}. ¡Prueba nuestra especialidad en Mi Barrunto, auténtica comida criolla y marina en Paterson, NJ!`
      : `${dish.name} preparado al momento con la receta tradicional de Mi Barrunto en Paterson, NJ.`;

    // Resolver ruta de imagen
    let relImage = dish.platosImage || platosMap[dish.id] || dish.image || '/logo/logo.png';
    if (relImage.startsWith('./')) relImage = relImage.replace(/^\.\//, '/');
    if (!relImage.startsWith('/')) relImage = '/' + relImage;
    const fullImageUrl = `${baseUrl}${relImage}`;
    const pageUrl = `${baseUrl}/plato/${dish.id}`;

    let dishHtml = baseHtml
      // Title
      .replace(/<title>.*?<\/title>/i, `<title>${titleText}</title>`)
      // Description
      .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${descText}" />`)
      // OG Title
      .replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${titleText}" />`)
      // OG Description
      .replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${descText}" />`)
      // OG Image
      .replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${fullImageUrl}" />`)
      // OG Secure URL
      .replace(/<meta\s+property=["']og:image:secure_url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image:secure_url" content="${fullImageUrl}" />`)
      // OG URL
      .replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${pageUrl}" />`)
      // Twitter Title
      .replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${titleText}" />`)
      // Twitter Description
      .replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${descText}" />`)
      // Twitter Image
      .replace(/<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:image" content="${fullImageUrl}" />`);

    fs.writeFileSync(path.join(dishDir, 'index.html'), dishHtml, 'utf-8');
    generatedCount++;
  }

  // Copia fallback a dist/plato/index.html
  fs.writeFileSync(path.join(distDir, 'plato', 'index.html'), baseHtml, 'utf-8');

  console.log(`[prerender-og] Generadas ${generatedCount} páginas estáticas con metadatos Open Graph listos para redes sociales.`);
}

prerenderOpenGraph();
