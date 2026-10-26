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

const links = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts', 'batidos_links.json'), 'utf-8'));

const batidos = [
  {
    id: '250',
    code: 'BAT-01',
    name: 'Batido de Piña',
    name_en: 'Pineapple Smoothie',
    description: 'Piña dorada seleccionada licuada con hielo al punto perfecto. Elige entre agua/leche regular o leche Carnation.',
    description_en: 'Fresh golden pineapple blended with ice to perfection. Choose between water/regular milk or Carnation milk.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.pina,
    platos_image: './platos_webp/batido_de_pina.webp',
    images: [links.pina],
    is_active: true,
    is_available: true,
    badge: 'Fresco y Natural',
    sort_order: 250
  },
  {
    id: '251',
    code: 'BAT-02',
    name: 'Batido de Fresa',
    name_en: 'Strawberry Smoothie',
    description: 'Fresas frescas seleccionadas licuadas con la base de tu preferencia: agua, leche regular o leche Carnation.',
    description_en: 'Fresh hand-picked strawberries blended with your choice of base: water, regular milk or Carnation milk.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.fresa,
    platos_image: './platos_webp/batido_de_fresa.webp',
    images: [links.fresa],
    is_active: true,
    is_available: true,
    badge: 'Popular',
    sort_order: 251
  },
  {
    id: '252',
    code: 'BAT-03',
    name: 'Batido de Papaya',
    name_en: 'Papaya Smoothie',
    description: 'Papaya fresca licuada a tu gusto.',
    description_en: 'Fresh sweet papaya blended to your liking.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.papaya,
    platos_image: './platos_webp/batido_de_papaya.webp',
    images: [links.papaya],
    is_active: true,
    is_available: true,
    badge: 'Clásico Limeño',
    sort_order: 252
  },
  {
    id: '253',
    code: 'BAT-04',
    name: 'Batido de Maracuyá',
    name_en: 'Passion Fruit Smoothie',
    description: 'Pura pulpa aromática de maracuyá fresca y refrescante.',
    description_en: 'Aromatic and refreshing pure passion fruit smoothie.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.maracuya,
    platos_image: './platos_webp/batido_de_maracuya.webp',
    images: [links.maracuya],
    is_active: true,
    is_available: true,
    badge: 'Tropical',
    sort_order: 253
  },
  {
    id: '254',
    code: 'BAT-05',
    name: 'Batido de Mango',
    name_en: 'Mango Smoothie',
    description: 'Mango maduro dulce y cremoso licuado al instante.',
    description_en: 'Sweet and creamy ripe mango blended to order.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.mango,
    platos_image: './platos_webp/batido_de_mango.webp',
    images: [links.mango],
    is_active: true,
    is_available: true,
    badge: 'Tropical',
    sort_order: 254
  },
  {
    id: '255',
    code: 'BAT-06',
    name: 'Batido de Guanábana',
    name_en: 'Soursop Smoothie',
    description: 'Deliciosa pulpa exótica de guanábana natural, cremosa y digestiva.',
    description_en: 'Exotic and velvety natural soursop fruit smoothie.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.guanabana,
    platos_image: './platos_webp/batido_de_guanabana.webp',
    images: [links.guanabana],
    is_active: true,
    is_available: true,
    badge: 'Exótico',
    sort_order: 255
  },
  {
    id: '256',
    code: 'BAT-07',
    name: 'Batido de Plátano',
    name_en: 'Banana Smoothie',
    description: 'Plátanos de seda maduros licuados, nutritivo y energizante.',
    description_en: 'Creamy and nutritious ripe silk banana smoothie.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.platano,
    platos_image: './platos_webp/batido_de_platano.webp',
    images: [links.platano],
    is_active: true,
    is_available: true,
    badge: 'Energético',
    sort_order: 256
  },
  {
    id: '257',
    code: 'BAT-08',
    name: 'Batido de Chocolate',
    name_en: 'Chocolate Smoothie',
    description: 'Cremoso y tentador batido de chocolate preparado con selecto cacao.',
    description_en: 'Rich and creamy chocolate smoothie made with premium cocoa.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.chocolate,
    platos_image: './platos_webp/batido_de_chocolate.webp',
    images: [links.chocolate],
    is_active: true,
    is_available: true,
    badge: 'Favorito',
    sort_order: 257
  },
  {
    id: '258',
    code: 'BAT-09',
    name: 'Batido de Vainilla',
    name_en: 'Vanilla Smoothie',
    description: 'Clásico y suave batido con esencia aromática de vainilla.',
    description_en: 'Classic, smooth vanilla smoothie with rich natural aroma.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.vainilla,
    platos_image: './platos_webp/batido_de_vainilla.webp',
    images: [links.vainilla],
    is_active: true,
    is_available: true,
    badge: 'Clásico',
    sort_order: 258
  },
  {
    id: '259',
    code: 'BAT-10',
    name: 'Batido de Lúcuma',
    name_en: 'Lucuma Smoothie',
    description: 'El auténtico oro de los Incas: lúcuma peruana cremosa y de sabor inigualable.',
    description_en: 'The gold of the Incas: creamy Peruvian lucuma fruit smoothie.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.lucuma,
    platos_image: './platos_webp/batido_de_lucuma.webp',
    images: [links.lucuma],
    is_active: true,
    is_available: true,
    badge: '100% Peruano',
    sort_order: 259
  },
  {
    id: '260',
    code: 'BAT-11',
    name: 'Batido de Mora',
    name_en: 'Blackberry Smoothie',
    description: 'Moras silvestres frescas con el balance ideal de acidez y dulzor.',
    description_en: 'Fresh wild blackberries with the perfect sweet and tangy balance.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.mora,
    platos_image: './platos_webp/batido_de_mora.webp',
    images: [links.mora],
    is_active: true,
    is_available: true,
    badge: 'Antioxidante',
    sort_order: 260
  },
  {
    id: '261',
    code: 'BAT-12',
    name: 'Batido Surtido Peruano',
    name_en: 'Peruvian Mixed Fruit Smoothie',
    description: 'El tradicional surtido de las juguerías peruanas: papaya, fresa, piña, mango, beterraga y plátano.',
    description_en: 'Traditional Peruvian market blend: papaya, strawberry, pineapple, mango, beet and banana.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.surtido,
    platos_image: './platos_webp/batido_surtido_peruano.webp',
    images: [links.surtido],
    is_active: true,
    is_available: true,
    badge: 'Especialidad Criolla',
    sort_order: 261
  },
  {
    id: '262',
    code: 'BAT-13',
    name: 'Batido Especial Peruano',
    name_en: 'Peruvian Special Rich Smoothie',
    description: 'El clásico reconstituyente peruano: fresa, piña, mango, beterraga, plátano, leche, huevo y algarrobina.',
    description_en: 'Peruvian powerhouse special: strawberry, pineapple, mango, beet, banana, milk, egg and carob syrup.',
    price: 6.99,
    category_id: 'batidos',
    image_url: links.especial,
    platos_image: './platos_webp/batido_especial_peruano.webp',
    images: [links.especial],
    is_active: true,
    is_available: true,
    badge: 'Pura Energía',
    sort_order: 262
  }
];

async function run() {
  console.log(`Upsertando ${batidos.length} batidos en Supabase...`);
  for (const b of batidos) {
    const { data, error } = await supabase
      .from('dishes')
      .upsert(b, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`Error en batido ${b.id} (${b.name}):`, error.message);
    } else {
      console.log(`✔ Plato ${b.id}: ${b.name} (${b.name_en}) guardado correctamente.`);
    }
  }
}

run();
