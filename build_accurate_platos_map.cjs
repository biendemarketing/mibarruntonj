const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('platos');
const lista = fs.readFileSync('platos_lista.txt', 'utf8').split('\n').filter(Boolean).map(l => {
  const parts = l.split('|').map(s => s.trim());
  return { id: parseInt(parts[0]), subcat: parts[1], name: parts[2], glosa: parts[3] };
}).filter(p => !isNaN(p.id));

function normalize(s) {
  return (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

const fileTokens = files.map(f => {
  const base = f.replace(/_20261017131431(_\d+)?\.jpg$/, '').replace(/\…/g, '');
  return {
    file: f,
    clean: normalize(base),
    words: normalize(base).split(/\s+/).filter(w => w.length > 2)
  };
});

// Explicit curated mappings for maximum culinary precision:
const curated = {
  // Sandwiches & Desayunos
  1: 'Chopped_pork_chicharrón_with_cas…_20261017131431.jpg',
  2: 'Peruvian_bread_with_filling_dish_20261017131431.jpg',
  3: 'Shredded_chicken_sandwich_with_p…_20261017131431.jpg',
  4: 'Chicken_strips_with_fries_20261017131431.jpg',
  5: 'Steak_with_fries_and_rice_20261017131431.jpg',
  6: 'Chicken_milanesa_with_rice_20261017131431.jpg',
  8: 'Ham_sandwich_with_criolla_salsa_20261017131431.jpg',
  19: 'Peruvian-style_tuna_bread_20261017131431.jpg',
  23: 'Chopped_pork_chicharrón_with_cas…_20261017131431.jpg',
  25: 'Blood_sausage_with_sweet_potato_20261017131431.jpg',
  26: 'Lomo_al_jugo_Peruvian_dish_20261017131431.jpg',
  28: 'Complete_breakfast_with_chicharrón_20261017131431.jpg',
  29: 'Fish_fillet_a_la_chorrillana_20261017131431.jpg',
  30: 'Peruvian_chicken_escabeche_dish_20261017131431.jpg',
  31: 'Chicken_tamale_with_criolla_sauce_20261017131431.jpg',
  32: 'Pork_tamale_with_salsa_criolla_20261017131431.jpg',

  // Entradas
  33: 'Papa_a_la_Huancaína_dish_20261017131431.jpg',
  34: 'Yuca_a_la_huancaína_with_20261017131431.jpg',
  35: 'Papa_Huayro_a_la_huancaína_20261017131431.jpg',
  36: 'Corn_with_fresh_cheese_20261017131431.jpg',
  37: 'Potato_and_chicken_casserole_with_20261017131431.jpg',
  38: 'Potato_and_tuna_casserole_20261017131431.jpg',
  39: 'Shrimp_ceviche_marinated_in_lime_20261017131431.jpg',
  40: 'Causa_with_crab_20261017131431.jpg',
  41: 'Causa_Acevichada_topped_with_cev…_20261017131431.jpg',
  42: 'Salchipapa_topped_with_fried_egg_20261017131431.jpg',
  48: 'Choritos_a_la_chalaca_20261017131431.jpg',

  // Sopas
  50: 'fotos/050-caldo-de-gallina.jpg',
  51: 'Chicken_soup_with_potato_20261017131431.jpg',
  53: 'Beef_broth_with_noodles_20261017131431.jpg',
  54: 'Beef_soup_with_noodles_20261017131431.jpg',
  55: 'fotos/055-sancochado-de-res.jpg',
  56: 'fotos/056-menestron-de-res.jpg',
  62: 'fotos/062-aguadito-de-mariscos.jpg',
  64: 'Seafood_soup_with_cilantro_broth_20261017131431.jpg',
  65: 'Traditional_parihuela_seafood_soup_20261017131431.jpg',
  66: 'Traditional_parihuela_seafood_soup_20261017131431_2.jpg',
  67: 'Shrimp_chupe_soup_20261017131431.jpg',
  68: 'Shrimp_chupe_with_egg_and_corn_20261017131431.jpg',

  // Comida Criolla
  70: 'Classic_Lomo_Saltado_with_rice_20261017131431.jpg',
  71: 'Lomo_Saltado_with_egg_and_20261017131431.jpg',
  72: 'Lomo_Saltado_with_Huancaína_sauce_20261017131431.jpg',
  73: 'Lomo_saltado_and_chaufa_rice_20261017131431.jpg',
  74: 'Lomo_saltado_with_rice_and_fries_20261017131431.jpg',
  75: 'Lomo_Saltado_with_huancaína_sauce_20261017131431.jpg',
  76: 'Chicken_tallarín_saltado_20261017131431.jpg',
  77: 'Beef_stir-fry_noodles_with_onion_20261017131431.jpg',
  79: 'Beef_and_chicken_tallarín_saltado_20261017131431.jpg',
  80: 'Chicken_arroz_chaufa_20261017131431.jpg',
  81: 'Beef_chaufa_rice_preparation_20261017131431.jpg',
  82: 'Beef_and_chicken_chaufa_rice_20261017131431.jpg',
  83: 'Peruvian_seafood_fried_rice_platter_20261017131431.jpg',
  85: 'Pork_belly_chaufa_20261017131431.jpg',
  86: 'Duck_fried_rice_with_potatoes_20261017131431.jpg',
  88: 'Creamy_ají_de_gallina_with_20261017131431.jpg',
  90: 'Beef_rib_seco_with_sides_20261017131431.jpg',
  91: 'Northern_style_cabrito_seco_dish_20261017131431.jpg',
  95: 'Tallarin_a_la_huancaína_bistec_20261017131431.jpg',
  96: 'Tallarines_a_la_huancaína_with_20261017131431.jpg',
  97: 'Tallarín_a_la_huancaína_with_20261017131431.jpg',
  100: 'Tallarín_verde_with_lomo_saltado_20261017131431.jpg',
  102: 'Tallarín_verde_with_lomo_saltado_20261017131431.jpg',
  104: 'Tacu-tacu_with_steak_20261017131431.jpg',
  105: 'Tacu-Tacu_with_lomo_saltado_20261017131431.jpg',
  106: 'Tacu-Tacu_with_breaded_chicken_c…_20261017131431.jpg',
  107: 'Tacu-tacu_with_pork_chop_20261017131431.jpg',
  110: 'Tacu_tacu_with_seafood_sauce_20261017131431.jpg',
  113: 'Grilled_steak_with_sides_20261017131431.jpg',
  114: 'Steak_a_lo_pobre_20261017131431.jpg',
  117: 'Grilled_chicken_breast_with_fries_20261017131431.jpg',
  118: 'Breaded_chicken_breast_with_fries_20261017131431.jpg',
  120: 'Pork_chops_with_french_fries_20261017131431.jpg',
  129: 'fotos/129-pollada-con-huancaina.jpg',
  130: 'Roasted_chicken_pieces_with_sides_20261017131431.jpg',

  // Parrillas
  131: 'Anticucho_with_potato_and_corn_20261017131431.jpg',
  132: 'Anticucho_with_meats_and_potatoes_20261017131431.jpg',
  133: 'Beef_heart_anticuchos_with_potato_20261017131431.jpg',
  134: 'Chicken_anticuchos_with_potato_20261017131431.jpg',
  138: 'fotos/138-higadito-carretillero.jpg',

  // Ceviches
  150: 'Fresh_fish_ceviche_dish_20261017131431.jpg',
  151: 'Mixed_seafood_ceviche_20261017131431.jpg',
  152: 'Mixed_ceviche_with_seafood_20261017131431.jpg',
  153: 'Octopus_ceviche_in_lime_juice_20261017131431.jpg',
  154: 'Shrimp_ceviche_marinated_in_lime_20261017131431.jpg',
  155: 'Black_clam_ceviche_20261017131431.jpg',
  157: 'Peruvian_ceviche_with_fried_squid_20261017131431.jpg',
  160: 'Fish_tiradito_in_ají_sauce_20261017131431.jpg',
  161: 'White_fish_tiradito_in_cream_20261017131431.jpg',
  163: 'Tiger_milk_served_in_glass_20261017131431.jpg',
  164: 'Tiger_milk_with_fresh_shrimp_20261017131431.jpg',
  165: 'Tiger_milk_with_seafood_20261017131431.jpg',
  166: 'Tiger_milk_seafood_specialty_20261017131431.jpg',
  167: 'Chalaca_style_tiger\'s_milk_20261017131431.jpg',
  168: 'Chalaca_tiger\'s_milk_with_salsa_20261017131431.jpg',

  // Mariscos
  169: 'Peruvian_jalea_with_fried_cassava_20261017131431.jpg',
  170: 'Peruvian_jalea_with_fried_cassava_20261017131431.jpg',
  171: 'Mixed_seafood_jalea_platter_20261017131431.jpg',
  172: 'Peruvian_seafood_jalea_with_sauces_20261017131431.jpg',
  173: 'Peruvian_seafood_fried_rice_platter_20261017131431.jpg',
  174: 'Paella_style_peruvian_rice_with_20261017131431.jpg',
  175: 'Peruvian_rice_with_seafood_portion_20261017131431.jpg',
  176: 'Peruvian_shrimp_fried_rice_chaufa_20261017131431.jpg',
  177: 'Peruvian_rice_with_tender_calamari_20261017131431.jpg',
  180: 'Spaghetti_in_creamy_seafood_sauce_20261017131431.jpg',
  183: 'Peruvian_seafood_chaufa_and_ceviche_20261017131431.jpg',

  // Rondas Criollas & Combinados
  196: 'fotos/196-arroz-con-pollo-huancaina-ceviche.jpg',
  197: 'fotos/197-tallarin-rojo-huancaina-ceviche.jpg',
  198: 'Peruvian_rice_and_fish_ceviche_20261017131431.jpg',
  199: 'fotos/199-cau-cau-ceviche.jpg',
  200: 'Seco_de_costilla_with_ceviche_20261017131431.jpg',
  201: 'fotos/201-seco-de-costilla-ceviche.jpg',
  202: 'Cabrito_norteño_with_ceviche_20261017131431.jpg',

  // Broaster
  203: 'Broaster_chicken_with_fries_20261017131431.jpg',
  204: 'Crispy_fried_chicken_with_fries_20261017131431.jpg',
  205: 'Fried_chicken_with_sauce_20261017131431.jpg',
  206: 'Broaster_chicken_with_fries_and_20261017131431.jpg',
  207: 'Broaster_chicken_with_fries_and_20261017131431_2.jpg',
  208: 'fotos/208-pollo-chori-broaster.jpg',
  209: 'Broasted_wings_with_french_fries_20261017131431.jpg',
  210: 'Chicken_wings_with_french_fries_20261017131431.jpg',
  211: 'Chicken_wings_with_fries_salad_20261017131431.jpg',
  212: 'fotos/212-mostrito-a-lo-pobre.jpg',
  213: 'Broaster_chicken_with_chaufa_rice_20261017131431.jpg',
  214: 'Broaster_chicken_with_chaufa_rice_20261017131431_2.jpg',
  215: 'Fried_chicken_a_lo_pobre_20261017131431.jpg',
  216: 'BBQ_chicken_with_fries_20261017131431.jpg',
  217: 'Chicken_strips_and_fries_20261017131431.jpg',

  // Guarniciones & Bebidas
  218: 'French_fries_on_plate_20261017131431.jpg',
  222: 'Crispy_fried_green_plantain_tost…_20261017131431.jpg',
  224: 'Fried_sweet_potato_slices_20261017131431.jpg',
  226: 'Peruvian_cancha_serrana_in_bowl_20261017131431.jpg',
  228: 'Red_rocoto_hot_sauce_container_20261017131431.jpg',
  229: 'Mayonnaise_in_a_container_20261017131431.jpg',
  230: 'Homemade_crushed_olive_in_container_20261017131431.jpg',
  233: 'Peruvian_purple_corn_drink_chicha_20261017131431.jpg',
  234: 'fotos/234-agua-de-manzana.jpg',
  235: 'Glass_of_iced_passion_fruit_20261017131431.jpg',
  236: 'Pineapple_drink_served_in_glass_20261017131431.jpg',
  237: 'fotos/237-emoliente.jpg',
  238: 'fotos/238-jugo-de-naranja.jpg',
  239: 'Soda_can_on_table_20261017131431.jpg'
};

const finalMap = {};

for (const dish of lista) {
  if (curated[dish.id]) {
    finalMap[dish.id] = curated[dish.id].startsWith('fotos/') 
      ? curated[dish.id] 
      : 'platos/' + curated[dish.id];
    continue;
  }

  const nameNorm = normalize(dish.name);
  const glosaNorm = normalize(dish.glosa);
  const nameWords = nameNorm.split(/\s+/).filter(w => w.length > 2);
  const glosaWords = glosaNorm.split(/\s+/).filter(w => w.length > 2);

  let bestFile = null;
  let bestScore = 0;

  for (const ft of fileTokens) {
    let score = 0;
    if (ft.clean.includes(nameNorm) && nameNorm.length > 4) score += 30;
    if (nameNorm.includes(ft.clean) && ft.clean.length > 4) score += 25;
    if (ft.clean.includes(glosaNorm) && glosaNorm.length > 6) score += 30;
    if (glosaNorm.includes(ft.clean) && ft.clean.length > 6) score += 25;

    const matchingNameWords = nameWords.filter(w => ft.words.includes(w));
    score += matchingNameWords.length * 5;

    const matchingGlosaWords = glosaWords.filter(w => ft.words.includes(w));
    score += matchingGlosaWords.length * 4;

    if (score > bestScore) {
      bestScore = score;
      bestFile = ft.file;
    }
  }

  finalMap[dish.id] = bestFile ? 'platos/' + bestFile : null;
}

fs.writeFileSync('src/data/platosMap.json', JSON.stringify(finalMap, null, 2));
console.log('✅ Accurate platosMap.json created with', Object.keys(finalMap).length, 'dishes mapped.');
