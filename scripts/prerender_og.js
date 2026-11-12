import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import './env_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const distIndexPath = path.join(distDir, 'index.html');

async function loadMergedCatalog() {
  const { DISHES_DATA, CATEGORIES_DATA } = await import('../src/data/menuData.js');
  const dishesMap = new Map(DISHES_DATA.map(d => [String(d.id), { ...d }]));
  const categoriesMap = new Map(CATEGORIES_DATA.map(c => [String(c.id), { ...c }]));

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const [{ data: remoteCats }, { data: remoteDishes }] = await Promise.all([
        supabase.from('categories').select('*').neq('is_active', false),
        supabase.from('dishes').select('*').neq('is_active', false)
      ]);
      if (Array.isArray(remoteCats)) {
        for (const rc of remoteCats) {
          if (!categoriesMap.has(String(rc.id))) {
            categoriesMap.set(String(rc.id), {
              id: rc.id,
              name: rc.name,
              nameEn: rc.name_en || ''
            });
          }
        }
      }
      if (Array.isArray(remoteDishes)) {
        for (const rd of remoteDishes) {
          const existing = dishesMap.get(String(rd.id)) || {};
          const price = Number(rd.price ?? existing.price ?? 0);
          dishesMap.set(String(rd.id), {
            ...existing,
            id: existing.id ?? rd.id,
            name: rd.name || existing.name,
            nameEn: rd.name_en || rd.description || existing.nameEn || '',
            glosa: rd.description || existing.glosa || '',
            price,
            priceDisplay: `$${price.toFixed(2)}`,
            category: rd.category_id || existing.category || 'criolla',
            platosImage: rd.platos_image || existing.platosImage || null,
            image: rd.image_url || existing.image || null
          });
        }
      }
    }
  } catch (_) {}

  return {
    DISHES_DATA: Array.from(dishesMap.values()),
    CATEGORIES_DATA: Array.from(categoriesMap.values())
  };
}

async function prerenderOpenGraph() {
  if (!fs.existsSync(distIndexPath)) {
    console.error('[prerender-og] dist/index.html not found. Run vite build first.');
    return;
  }

  let baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  const cssLinkMatch = baseHtml.match(/<link\s+rel=["']stylesheet["'][^>]*href=["'](\/assets\/index-[^"']+\.css)["'][^>]*>/i);
  if (cssLinkMatch) {
    const cssRelPath = cssLinkMatch[1].replace(/^\//, '');
    const cssFullPath = path.join(distDir, cssRelPath);
    if (fs.existsSync(cssFullPath)) {
      const cssContent = fs.readFileSync(cssFullPath, 'utf-8');
      const inlinedHtml = baseHtml.replace(cssLinkMatch[0], `<style>${cssContent}</style>`);
      fs.writeFileSync(distIndexPath, inlinedHtml, 'utf-8');
      console.log(`[prerender-og] Inlined ${cssRelPath} (${(cssContent.length / 1024).toFixed(1)} KB) into dist/index.html to eliminate render-blocking CSS.`);
    }
  }
  const { DISHES_DATA, CATEGORIES_DATA } = await loadMergedCatalog();
  
  let platosMap = {};
  try {
    const mapContent = fs.readFileSync(path.join(rootDir, 'src/data/platosMap.json'), 'utf-8');
    platosMap = JSON.parse(mapContent);
  } catch (e) {}

  const baseUrl = 'https://mibarruntonj.com';
  let generatedCount = 0;

  // ── Contenido HTML rastreable (SEO) ─────────────────────────────────────────
  // El #root se renderiza vacío con React (SPA), por lo que Google "descubre" las URLs
  // del sitemap pero no ve contenido ni enlaces internos y las deja sin indexar.
  // Inyectamos HTML estático con enlaces <a href> reales; React lo reemplaza al montar.
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const withBody = (html, body) => html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  const catNameById = Object.fromEntries(CATEGORIES_DATA.map((c) => [c.id, c.name]));
  const dishLink = (d) => `<li><a href="/plato/${d.id}">${esc(d.name)}</a> — ${esc(d.priceDisplay || '')}</li>`;
  const catNav = `<nav aria-label="Categorías"><ul>${CATEGORIES_DATA.map((c) => `<li><a href="/categoria/${c.id}">${esc(c.name)}</a></li>`).join('')}</ul></nav>`;

  const homeBody = `<main><h1>Mi Barrunto — Restaurante Peruano en Paterson, NJ</h1>`
    + `<p>Auténtica comida criolla y marina peruana: ceviches, lomo saltado, parrillas y más. 21 Mill St, Paterson, NJ 07011. Tel. +1-973-653-3749.</p>`
    + catNav
    + CATEGORIES_DATA.map((c) => `<section><h2><a href="/categoria/${c.id}">${esc(c.name)}</a></h2><ul>${DISHES_DATA.filter((d) => d.category === c.id).map(dishLink).join('')}</ul></section>`).join('')
    + `</main>`;
  fs.writeFileSync(distIndexPath, withBody(baseHtml, homeBody), 'utf-8');



  // Prerenderizar páginas de categorías para Google Sitelinks y SEO
  let catGenerated = 0;
  for (const cat of CATEGORIES_DATA) {
    const catDir = path.join(distDir, 'categoria', cat.id);
    fs.mkdirSync(catDir, { recursive: true });

    const catTitle = `${cat.name} | Mi Barrunto Restaurant Paterson NJ`;
    const catDesc = `Explora nuestra selección de ${cat.name} en Mi Barrunto Paterson NJ. Auténtica comida peruana, ceviches y criollos 24 horas.`;
    const catUrl = `${baseUrl}/categoria/${cat.id}`;
    const catImage = `${baseUrl}/logo/logo.png`;

    let catHtml = baseHtml
      .replace(/<title>.*?<\/title>/i, `<title>${catTitle}</title>`)
      .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${catDesc}" />`)
      .replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${catUrl}" />`)
      .replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${catTitle}" />`)
      .replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${catDesc}" />`)
      .replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${catImage}" />`)
      .replace(/<meta\s+property=["']og:image:secure_url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image:secure_url" content="${catImage}" />`)
      .replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${catUrl}" />`);

    catHtml = withBody(catHtml, `<main><h1>${esc(cat.name)} — Mi Barrunto Paterson NJ</h1><p>${esc(cat.nameEn || '')}</p><ul>${DISHES_DATA.filter((d) => d.category === cat.id).map(dishLink).join('')}</ul>${catNav}<p><a href="/">Ver carta completa</a></p></main>`);
    fs.writeFileSync(path.join(catDir, 'index.html'), catHtml, 'utf-8');
    catGenerated++;
  }
  fs.mkdirSync(path.join(distDir, 'categoria'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'categoria', 'index.html'), baseHtml, 'utf-8');
  console.log(`[prerender-og] Generadas ${catGenerated} páginas estáticas de categorías para Google Sitelinks.`);

  for (const dish of DISHES_DATA) {
    const dishDir = path.join(distDir, 'plato', String(dish.id));
    fs.mkdirSync(dishDir, { recursive: true });

    const priceText = dish.priceDisplay || `$${dish.price ? dish.price.toFixed(2) : '0.00'}`;
    const titleText = `${dish.name} (${priceText}) — Mi Barrunto`;
    const descText = dish.nameEn 
      ? `${dish.nameEn}. ¡Prueba nuestra especialidad en Mi Barrunto, auténtica comida criolla y marina en Paterson, NJ!`
      : `${dish.name} preparado al momento con la receta tradicional de Mi Barrunto en Paterson, NJ.`;

    // Resolver ruta de imagen (soporta rutas locales y URLs absolutas de Supabase Storage)
    let relImage = dish.platosImage || platosMap[dish.id] || dish.image || '/logo/logo.png';
    if (relImage.startsWith('./')) relImage = relImage.replace(/^\.\//, '/');
    const fullImageUrl = relImage.startsWith('http')
      ? relImage
      : `${baseUrl}${relImage.startsWith('/') ? '' : '/'}${relImage}`;
    const pageUrl = `${baseUrl}/plato/${dish.id}`;

    let dishHtml = baseHtml
      // Title
      .replace(/<title>.*?<\/title>/i, `<title>${titleText}</title>`)
      // Description
      .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${descText}" />`)
      // Canonical
      .replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${pageUrl}" />`)
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

        // Inyectar Schema.org MenuItem & Product para que Google y Gemini muestren tarjetas visuales con foto
    const priceNum = dish.price ? dish.price.toFixed(2) : "0.00";
    const dishSchemaJson = `  <!-- Schema.org MenuItem & Product para Visual Dishes en Google y Gemini -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["MenuItem", "Product"],
    "name": ${JSON.stringify(dish.name)},
    "alternateName": ${JSON.stringify(dish.nameEn || dish.name)},
    "image": [${JSON.stringify(fullImageUrl)}],
    "description": ${JSON.stringify(descText)},
    "url": ${JSON.stringify(pageUrl)},
    "offers": {
      "@type": "Offer",
      "price": "${priceNum}",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-12-31",
      "availability": "https://schema.org/InStock",
      "url": ${JSON.stringify(pageUrl)}
    },
    "menuAddOn": {
      "@type": "Restaurant",
      "name": "Mi Barrunto Restaurant & Grocery",
      "telephone": "+1-973-653-3749",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "21 Mill st",
        "addressLocality": "Paterson",
        "addressRegion": "NJ",
        "postalCode": "07011",
        "addressCountry": "US"
      }
    }
  }
  </script>
</head>`;
    dishHtml = dishHtml.replace('</head>', dishSchemaJson);

    const siblings = DISHES_DATA.filter((d) => d.category === dish.category && d.id !== dish.id).slice(0, 8);
    dishHtml = withBody(dishHtml, `<main><h1>${esc(dish.name)}</h1><p>${esc(dish.nameEn || '')}</p><p>Precio: ${esc(priceText)}</p><p>${esc(descText)}</p><p><a href="/categoria/${esc(dish.category)}">Más de ${esc(catNameById[dish.category] || 'nuestra carta')}</a> · <a href="/">Carta completa de Mi Barrunto</a></p>${siblings.length ? `<h2>Otros platos</h2><ul>${siblings.map(dishLink).join('')}</ul>` : ''}</main>`);
    fs.writeFileSync(path.join(dishDir, 'index.html'), dishHtml, 'utf-8');
    generatedCount++;
  }

  // Copia fallback a dist/plato/index.html
  fs.writeFileSync(path.join(distDir, 'plato', 'index.html'), baseHtml, 'utf-8');

  // Eliminar dist/sitemap.xml y dist/llms.txt estáticos para que los rewrites de vercel.json
  // sirvan siempre /api/sitemap y /api/llms en tiempo real desde Supabase
  try { fs.unlinkSync(path.join(distDir, 'sitemap.xml')); } catch (_) {}
  try { fs.unlinkSync(path.join(distDir, 'llms.txt')); } catch (_) {}

  console.log(`[prerender-og] Generadas ${generatedCount} páginas estáticas con metadatos Open Graph listos para redes sociales.`);
}

prerenderOpenGraph();
