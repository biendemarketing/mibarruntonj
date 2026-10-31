import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

async function generateSeoFiles() {
  const { DISHES_DATA, CATEGORIES_DATA } = await import('../src/data/menuData.js');
  const baseUrl = 'https://mibarruntonj.com';
  const lastmod = new Date().toISOString().split('T')[0];

  // 1. GENERAR SITEMAP.XML
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/menu_imprimible.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/menu_imprimible_dark.html`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/menu_mi_barrunto.pdf`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/llms.txt`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${baseUrl}/llms-full.txt`, priority: '0.7', changefreq: 'weekly' }
  ];

  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const item of staticUrls) {
    sitemapXml += `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>
`;
  }

  for (const dish of DISHES_DATA) {
    sitemapXml += `  <url>
    <loc>${baseUrl}/plato/${dish.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  sitemapXml += `</urlset>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`[generate_seo_files] sitemap.xml generado con ${staticUrls.length + DISHES_DATA.length} URLs.`);

  // 2. GENERAR LLMS.TXT (Estándar para LLMs y Agentes de IA)
  let llmsTxt = `# Mi Barrunto Restaurant & Grocery — Paterson, NJ
> Auténtica Cocina Criolla & Marina Peruana en New Jersey. Servicio 24 Horas los 7 días de la semana.

## Descripción del Negocio
- **Nombre:** Mi Barrunto Restaurant & Grocery
- **Tipo de Cocina:** Comida Peruana Criolla, Cevichería, Pescados y Mariscos, Parrillas al Carbón, Pollo Broaster, Postres Tradicionales y Jugos Naturales.
- **Dirección Física:** 21 Mill St, Paterson, NJ 07011, Estados Unidos
- **Teléfono de Pedidos / Atención:** +1-973-653-3749 / (973) 653-3749
- **Horario:** Abierto 24 Horas / 7 Días (Lunes a Domingo continuo)
- **Sitio Web Oficial:** https://mibarruntonj.com
- **Carta Imprimible Horizontal (11x8.5):** https://mibarruntonj.com/menu_imprimible.html
- **Carta PDF Oficial Descargable:** https://mibarruntonj.com/menu_mi_barrunto.pdf
- **Pedidos:** Atención en salón, Retiro en local (Takeout) y pedidos directos por WhatsApp (+1-973-653-3749).
- **Rango de Precios:** $$ (Accesible y porciones abundantes tradicionales).
- **Total de Platos y Especialidades:** ${DISHES_DATA.length} platos catalogados y actualizados.

## Categorías Principales de la Carta
`;

  for (const cat of CATEGORIES_DATA) {
    const dishesInCat = DISHES_DATA.filter(d => d.category === cat.id);
    llmsTxt += `- [${cat.name}](https://mibarruntonj.com/?category=${cat.id}): ${dishesInCat.length} platos disponibles.\n`;
  }

  llmsTxt += `
## Especialidades Estrella
- **Ceviche de Pescado:** Pescado blanco fresco curado en zumo de limón sutil, ají limo, cebolla roja, camote glaseado y choclo tierno ($18.99).
- **Ceviche Carretillero con Huancaína:** Ceviche tradicional acompañado de chicharrón crocante de calamar y salsa a la huancaína ($25.99).
- **Lomo Saltado:** Tiras de res saltadas al wok con cebolla, tomate, ají amarillo y sillao sobre papas fritas crocantes y arroz blanco ($21.99).
- **Anticuchos de Corazón:** Brochetas de corazón de res marinadas en ají panca, ajo y comino, asadas a la brasa con papas doradas y choclo ($16.99).
- **Arroz con Mariscos:** Arroz al wok sazonado con pasta de ají amarillo, mariscos mixtos, pimientos y salsa criolla ($24.99).
- **Chaufa Especial:** Arroz frito al wok al estilo chifa peruano con carnes mixtas, cebollita china y tortilla de huevo.
- **Tacu Tacu con Lomo o Mariscos:** Mezcla dorada de frijoles canario y arroz, coronada con salsa de mariscos o lomo saltado.
- **Pollo Broaster & Mostritos:** Pollo frito extra crujiente servido con chaufa y papas fritas.
- **Postres Caseros:** Crema volteada ($7.99), Torta tres leches ($7.99), Picarones ($8.99), Arroz con leche y Mazamorra morada ($4.99).
- **Bebidas Tradicionales:** Chicha morada de maíz morado hervido con piña, canela y clavo ($3.99), Inca Kola (lata y 2 Litros), y batidos de lúcuma, maracuyá, guanábana y mango ($6.99 / $7.99).

## Enlaces Clave
- [Carta Interactiva Online](https://mibarruntonj.com/): Exploración por categorías, fotos en alta resolución, personalización y carrito directo a cocina por WhatsApp.
- [Carta Menú Imprimible 11x8.5](https://mibarruntonj.com/menu_imprimible.html): Versión completa para ver e imprimir con diseño de 10 páginas.
- [Documentación LLM Completa (llms-full.txt)](https://mibarruntonj.com/llms-full.txt): Listado detallado de los 262 platos con precios, ingredientes y descripciones bilingües.
`;

  fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsTxt, 'utf-8');
  console.log('[generate_seo_files] llms.txt generado exitosamente.');

  // 3. GENERAR LLMS-FULL.TXT (Listado exhaustivo de todos los 262 platos con detalles bilingües y precios)
  let llmsFullTxt = `# Mi Barrunto Restaurant & Grocery — Carta Completa Exhaustiva
> Información detallada para sistemas de IA, asistentes de búsqueda y modelos de lenguaje (LLMs).
> URL Canónica: https://mibarruntonj.com/
> Dirección: 21 Mill St, Paterson, NJ 07011 | Tel: +1-973-653-3749 | Horario: 24 Horas

`;

  for (const cat of CATEGORIES_DATA) {
    const dishesInCat = DISHES_DATA.filter(d => d.category === cat.id);
    if (dishesInCat.length === 0) continue;

    llmsFullTxt += `\n## Categoría: ${cat.name.toUpperCase()} (${dishesInCat.length} platos)\n\n`;

    for (const dish of dishesInCat) {
      const priceStr = dish.priceDisplay || `$${dish.price ? dish.price.toFixed(2) : '0.00'}`;
      llmsFullTxt += `### ${dish.name} — ${priceStr}\n`;
      llmsFullTxt += `- **ID:** ${dish.id}\n`;
      llmsFullTxt += `- **URL:** https://mibarruntonj.com/plato/${dish.id}\n`;
      if (dish.nameEn) llmsFullTxt += `- **Descripción en Inglés:** ${dish.nameEn}\n`;
      if (dish.glosa && dish.glosa !== dish.nameEn) llmsFullTxt += `- **Detalle / Glosa:** ${dish.glosa}\n`;
      llmsFullTxt += `\n`;
    }
  }

  fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullTxt, 'utf-8');
  console.log('[generate_seo_files] llms-full.txt generado con los 262 platos.');
}

generateSeoFiles().catch(console.error);

