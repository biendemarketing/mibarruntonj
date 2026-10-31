import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    const { data: dishes } = await supabase
      .from('dishes')
      .select('id, name, name_en, description, description_en, price, category_id, is_active')
      .neq('is_active', false)
      .order('id', { ascending: true });

    let txt = `# Mi Barrunto Restaurant & Grocery — Paterson, NJ
> Auténtica Cocina Criolla & Marina Peruana en New Jersey. Servicio 24 Horas los 7 días de la semana.

## Información General
- **Nombre:** Mi Barrunto Restaurant & Grocery
- **Dirección Física:** 21 Mill St, Paterson, NJ 07011, Estados Unidos
- **Teléfono de Pedidos:** +1-973-653-3749 / (973) 653-3749
- **Horario:** Abierto 24 Horas / 7 Días
- **Dominio Canónico Oficial:** https://mibarruntonj.com
- **Carta Imprimible Horizontal (11x8.5):** https://mibarruntonj.com/menu_imprimible.html
- **Carta PDF Descargable:** https://mibarruntonj.com/menu_mi_barrunto.pdf
- **Pedidos:** Salón, Takeout y pedidos directos por WhatsApp (+1-973-653-3749).
- **Platos Activos en Tiempo Real:** ${dishes ? dishes.length : 0} platos disponibles.

## Especialidades Principales y Precios
`;

    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        const desc = dish.description_en || dish.description || dish.name_en || '';
        txt += `- [${dish.name}](https://mibarruntonj.com/plato/${dish.id}): $${Number(dish.price || 0).toFixed(2)}${desc ? ` - ${desc}` : ''}\n`;
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(txt);
  } catch (err) {
    console.error('Error generating dynamic llms.txt:', err);
    return res.status(500).send('Error generating llms.txt');
  }
}

