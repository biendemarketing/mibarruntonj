import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';

const supabase = createClient(supabaseUrl, supabaseKey);

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function loadAppShellHtml() {
  const candidates = [
    path.join(process.cwd(), 'dist', 'plato', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'plato', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    } catch (_) {}
  }
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Mi Barrunto</title><meta name="description" content="" /><link rel="canonical" href="https://mibarruntonj.com/" /><meta property="og:title" content="" /><meta property="og:description" content="" /><meta property="og:image" content="" /><meta property="og:image:secure_url" content="" /><meta property="og:url" content="" /><meta name="twitter:title" content="" /><meta name="twitter:description" content="" /><meta name="twitter:image" content="" /></head><body><div id="root"></div></body></html>`;
}

export default async function handler(req, res) {
  try {
    const rawId = String(req.query?.id || '').trim().replace(/\/+$/, '');
    const baseUrl = 'https://mibarruntonj.com';
    let html = loadAppShellHtml();

    if (!rawId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // Buscar el plato en Supabase por id exacto o por prefijo numérico (ej. "263-ceviche")
    const numericPrefix = rawId.match(/^(\d+)-/)?.[1];
    let { data: dish } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', rawId)
      .maybeSingle();

    if (!dish && numericPrefix) {
      const resByNum = await supabase
        .from('dishes')
        .select('*')
        .eq('id', numericPrefix)
        .maybeSingle();
      dish = resByNum.data;
    }

    if (!dish) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    const priceNum = Number(dish.price || 0).toFixed(2);
    const priceText = `$${priceNum}`;
    const titleText = `${dish.name} (${priceText}) — Mi Barrunto`;
    const descSource = dish.description || dish.name_en || dish.description_en || '';
    const descText = descSource
      ? `${descSource}. ¡Prueba nuestra especialidad en Mi Barrunto, auténtica comida criolla y marina en Paterson, NJ!`
      : `${dish.name} preparado al momento con la receta tradicional de Mi Barrunto en Paterson, NJ.`;

    let rawImg = (Array.isArray(dish.images) && dish.images[0]) || dish.platos_image || dish.image_url || '/logo/logo.png';
    if (rawImg.startsWith('./')) rawImg = rawImg.replace(/^\.\//, '/');
    const fullImageUrl = rawImg.startsWith('http')
      ? rawImg
      : `${baseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
    const pageUrl = `${baseUrl}/plato/${dish.id}`;

    html = html
      .replace(/<title>.*?<\/title>/i, `<title>${esc(titleText)}</title>`)
      .replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${esc(descText)}" />`)
      .replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${esc(pageUrl)}" />`)
      .replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${esc(titleText)}" />`)
      .replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${esc(descText)}" />`)
      .replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image" content="${esc(fullImageUrl)}" />`)
      .replace(/<meta\s+property=["']og:image:secure_url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:image:secure_url" content="${esc(fullImageUrl)}" />`)
      .replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${esc(pageUrl)}" />`)
      .replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${esc(titleText)}" />`)
      .replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${esc(descText)}" />`)
      .replace(/<meta\s+name=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:image" content="${esc(fullImageUrl)}" />`);

    const dishSchemaJson = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["MenuItem", "Product"],
    "name": ${JSON.stringify(dish.name)},
    "alternateName": ${JSON.stringify(dish.name_en || dish.name)},
    "image": [${JSON.stringify(fullImageUrl)}],
    "description": ${JSON.stringify(descText)},
    "url": ${JSON.stringify(pageUrl)},
    "offers": {
      "@type": "Offer",
      "price": "${priceNum}",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-12-31",
      "availability": ${JSON.stringify(dish.is_available === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock')},
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

    html = html.replace('</head>', dishSchemaJson);

    const seoBody = `<main><h1>${esc(dish.name)}</h1><p>${esc(dish.name_en || dish.description || '')}</p><p>Precio: ${esc(priceText)}</p><p>${esc(descText)}</p><p><a href="/categoria/${esc(dish.category_id || 'criolla')}">Ver categoría</a> · <a href="/">Carta completa de Mi Barrunto</a></p></main>`;
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${seoBody}</div>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error in api/plato-seo:', err);
    return res.status(500).send('Internal Server Error');
  }
}

