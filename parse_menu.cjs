const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, 'platos_lista.txt'), 'utf8');
const lines = fileContent.split('\n');

const photosMap = {
  50: 'fotos/050-caldo-de-gallina.jpg',
  55: 'fotos/055-sancochado-de-res.jpg',
  56: 'fotos/056-menestron-de-res.jpg',
  62: 'fotos/062-aguadito-de-mariscos.jpg',
  129: 'fotos/129-pollada-con-huancaina.jpg',
  138: 'fotos/138-higadito-carretillero.jpg',
  196: 'fotos/196-arroz-con-pollo-huancaina-ceviche.jpg',
  197: 'fotos/197-tallarin-rojo-huancaina-ceviche.jpg',
  199: 'fotos/199-cau-cau-ceviche.jpg',
  201: 'fotos/201-seco-de-costilla-ceviche.jpg',
  208: 'fotos/208-pollo-chori-broaster.jpg',
  212: 'fotos/212-mostrito-a-lo-pobre.jpg',
  234: 'fotos/234-agua-de-manzana.jpg',
  235: 'fotos/235-agua-de-maracuya.jpg',
  236: 'fotos/236-agua-de-pina.jpg',
  237: 'fotos/237-emoliente.jpg',
  238: 'fotos/238-jugo-de-naranja.jpg',
};

const categoryDefinitions = [
  { id: 'sandwiches', name: 'Sandwiches', nameEn: 'Sandwiches y panes de la casa', icon: 'Sandwich' },
  { id: 'desayuno', name: 'Desayuno peruano', nameEn: 'Desayunos criollos tradicionales', icon: 'Sunrise' },
  { id: 'entradas', name: 'Entradas', nameEn: 'Huancaína, causas y piqueos', icon: 'UtensilsCrossed' },
  { id: 'sopas', name: 'Sopas', nameEn: 'Caldos, chupe y parihuela', icon: 'Soup' },
  { id: 'criolla', name: 'Comida criolla', nameEn: 'Lomo saltado, bistec y clásicos', icon: 'Flame' },
  { id: 'parrillas', name: 'Parrillas', nameEn: 'Anticuchos y cortes al carbón', icon: 'Beef' },
  { id: 'ceviches', name: 'Ceviches', nameEn: 'Ceviches, tiraditos y leche de tigre', icon: 'Fish' },
  { id: 'mariscos', name: 'Mariscos', nameEn: 'Jaleas, arroces y pastas marinas', icon: 'Fish' },
  { id: 'rondas', name: 'Rondas criollas', nameEn: 'Combinados para compartir', icon: 'Layers' },
  { id: 'bares', name: 'Bares Mi Barrunto', nameEn: 'Combos mar y parrilla', icon: 'Wine' },
  { id: 'broaster', name: 'Broaster', nameEn: 'Pollo crujiente, alitas y mostritos', icon: 'Drumstick' },
  { id: 'sides', name: 'Guarniciones', nameEn: 'Porciones y salsas artesanales', icon: 'Utensils' },
  { id: 'bebidas', name: 'Bebidas', nameEn: 'Chicha morada, jugos y sodas', icon: 'Coffee' }
];

function getCategoryId(id) {
  if (id >= 1 && id <= 22) return 'sandwiches';
  if (id >= 23 && id <= 32) return 'desayuno';
  if (id >= 33 && id <= 49) return 'entradas';
  if (id >= 50 && id <= 69) return 'sopas';
  if (id >= 70 && id <= 130) return 'criolla';
  if (id >= 131 && id <= 149) return 'parrillas';
  if (id >= 150 && id <= 168) return 'ceviches';
  if (id >= 169 && id <= 195) return 'mariscos';
  if (id >= 196 && id <= 202) return 'rondas';
  if (id >= 203 && id <= 217) return 'broaster';
  if (id >= 218 && id <= 232) return 'sides';
  if (id >= 233 && id <= 239) return 'bebidas';
  return 'criolla';
}

const dishes = [];

for (const line of lines) {
  const parts = line.split('|').map(s => s.trim());
  if (parts.length >= 5) {
    const id = parseInt(parts[0], 10);
    const subcatRaw = parts[1];
    const name = parts[2];
    const glosa = parts[3];
    const priceRaw = parts[4];
    
    // Parse price
    let price = 0;
    const match = priceRaw.match(/\$([0-9]+(?:\.[0-9]+)?)/);
    if (match) {
      price = parseFloat(match[1]);
    }

    const catId = getCategoryId(id);
    const image = photosMap[id] || null;

    dishes.push({
      id,
      name,
      nameEn: glosa,
      glosa,
      price,
      priceDisplay: priceRaw,
      category: catId,
      subcategory: subcatRaw,
      image,
      hasPhoto: Boolean(image)
    });
  }
}

// Ensure src/data exists
fs.mkdirSync(path.join(__dirname, 'src', 'data'), { recursive: true });

const outputJs = `// Auto-generated full menu data for Mi Barrunto
export const CATEGORIES_DATA = ${JSON.stringify(categoryDefinitions, null, 2)};

export const DISHES_DATA = ${JSON.stringify(dishes, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'menuData.js'), outputJs, 'utf8');
console.log(`Parsed ${dishes.length} dishes successfully into src/data/menuData.js`);
