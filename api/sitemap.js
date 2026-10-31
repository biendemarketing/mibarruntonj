import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const baseUrl = 'https://mibarruntonj.com';
    const lastmod = new Date().toISOString().split('T')[0];

    // URLs estáticas base
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/menu_imprimible.html`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/menu_imprimible_dark.html`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/menu_mi_barrunto.pdf`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/llms.txt`, priority: '0.7', changefreq: 'weekly' },
      { loc: `${baseUrl}/llms-full.txt`, priority: '0.7', changefreq: 'weekly' }
    ];

    // Consultar platos activos directamente en Supabase en tiempo real
    const { data: dishes, error } = await supabase
      .from('dishes')
      .select('id, updated_at, is_active')
      .neq('is_active', false);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    for (const item of staticUrls) {
      xml += `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>
`;
    }

    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        const dishDate = dish.updated_at ? dish.updated_at.split('T')[0] : lastmod;
        xml += `  <url>
    <loc>${baseUrl}/plato/${dish.id}</loc>
    <lastmod>${dishDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Cache de 1 hora en CDN perimetral, se revalida al fondo
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return res.status(500).send('Error generating sitemap');
  }
}

