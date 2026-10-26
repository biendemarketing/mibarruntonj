import fs from 'fs';
import path from 'path';

// 1. Cargar Base64 optimizados
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync('scratch_logo_opt.png').toString('base64');
const bgBase64 = 'data:image/jpeg;base64,' + fs.readFileSync('scratch_bg_opt.jpg').toString('base64');

console.log('Logo Base64 length:', logoBase64.length);
console.log('BG Base64 length:', bgBase64.length);

function getPage9Col2And3(isDark = false) {
  const subLegendColor = isDark ? '#f7a044' : '#88130e';
  
  return `      <!-- Columna 2: Bebidas Típicas (7) + Postres Caseros (9) -->
      <div class="menu-col">
        
    <div class="category-header-line">
      <span class="cat-icon-wrap"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg></span>
      <span class="cat-title-text">BEBIDAS TÍPICAS</span>
      <span class="cat-line"></span>
    </div>
  
        <div class="dishes-list">
          
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Chicha morada</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$3.99</span>
      </div>
      <div class="dish-desc">Purple corn drink · glass or pitcher</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Agua de manzana</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$3.99</span>
      </div>
      <div class="dish-desc">Apple water · glass or pitcher</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Agua de maracuyá</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$3.99</span>
      </div>
      <div class="dish-desc">Passion fruit water · glass or pitcher</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Agua de piña</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$3.99</span>
      </div>
      <div class="dish-desc">Pineapple water · glass or pitcher</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Emoliente</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$3.99</span>
      </div>
      <div class="dish-desc">Peruvian warm traditional herb beverage</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Inca Kola 2 Litros</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$6.99</span>
      </div>
      <div class="dish-desc">Peruvian golden kola 2-liter bottle</div>
    </div>
  
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">Sodas en lata (12 oz)</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">$1.99</span>
      </div>
      <div class="dish-desc">Canned assorted soda</div>
    </div>
  
        </div>
        
        <!-- Postres Caseros en Columna 2 -->
        <div style="margin-top: 5px;">
          <div class="category-header-line">
            <span class="cat-icon-wrap"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path><path d="M2 21h20"></path><line x1="12" y1="7" x2="12" y2="11"></line></svg></span>
            <span class="cat-title-text">POSTRES CASEROS</span>
            <span class="cat-line"></span>
          </div>
          <div class="dishes-list">
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Crema Volteada</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$7.99</span>
              </div>
              <div class="dish-desc">Traditional caramel egg custard</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Tres Leches</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$7.99</span>
              </div>
              <div class="dish-desc">Rich sponge cake soaked in three milks</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Torta de chocolate</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$7.99</span>
              </div>
              <div class="dish-desc">Classic Peruvian chocolate cake with fudge</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Picarones</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$8.99</span>
              </div>
              <div class="dish-desc">Crispy sweet potato & squash rings with spiced syrup</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Tiramisú</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$7.99</span>
              </div>
              <div class="dish-desc">Coffee-flavoured Italian-Peruvian dessert</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Gelatina sola</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$4.99</span>
              </div>
              <div class="dish-desc">Fruit gelatin dessert</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Gelatina con flan</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$4.99</span>
              </div>
              <div class="dish-desc">Layered gelatin and vanilla flan</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Mazamorra morada</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$4.99</span>
              </div>
              <div class="dish-desc">Purple corn pudding with dried fruit</div>
            </div>
            <div class="menu-dish-item">
              <div class="dish-main-row">
                <span class="dish-name">Arroz con leche</span>
                <span class="dish-dots"></span>
                <span class="dish-price-pill">$4.99</span>
              </div>
              <div class="dish-desc">Creamy Peruvian rice pudding with cinnamon</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 3: Batidos Tradicionales, Especiales Peruanos y Jugo Natural (14 items con espacio óptimo) -->
      <div class="menu-col">
        <div class="category-header-badge-wrap">
          <div class="category-header-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
            <span>BATIDOS &amp; JUGOS NATURALES</span>
          </div>
        </div>
        
        <div class="batidos-sub-legend" style="font-size: 7.2pt; color: ${subLegendColor}; font-weight: 800; margin: 2px 0 4px 0; text-transform: uppercase; letter-spacing: 0.02em;">
          Agua o leche: $6.99 · Leche Carnation: $7.99
        </div>

        <div class="dishes-list">
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Piña</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Pineapple smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Fresa</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Strawberry smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Papaya</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Papaya smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Maracuyá</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Passion fruit smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Mango</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Mango smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Guanábana</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Soursop exotic smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Plátano</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Banana smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Chocolate</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Chocolate milk smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Vainilla</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Vanilla smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Lúcuma</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Traditional Peruvian lucuma smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido de Mora</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Blackberry wild smoothie</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido Surtido Peruano</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Papaya, strawberry, pineapple, mango, beet, banana</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Batido Especial Peruano</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$6.99 / $7.99</span>
            </div>
            <div class="dish-desc">Strawberry, pineapple, beet, banana, milk, egg, algarrobina</div>
          </div>
          <div class="menu-dish-item">
            <div class="dish-main-row">
              <span class="dish-name">Jugo de naranja natural</span>
              <span class="dish-dots"></span>
              <span class="dish-price-pill">$7.99</span>
            </div>
            <div class="dish-desc">Freshly squeezed 100% natural orange juice</div>
          </div>
        </div>
      </div>`;
}

function processFile(filePath) {
  console.log('Processing:', filePath);
  let html = fs.readFileSync(filePath, 'utf8');
  const isDark = filePath.includes('_dark');

  // Inyectar CSS variable única para background Base64
  html = html.replace(':root {', `:root {\n      --bg-restaurant-base64: url('${bgBase64}');`);

  // Reemplazar background-image de portada y contraportada con la variable CSS
  html = html.replace(/background-image:[^;]*bg-restaurant\.jpg[^;]*;/g, (match) => {
    if (match.includes('rgba(10, 11, 14')) {
      return `background-image: linear-gradient(rgba(10, 11, 14, 0.80), rgba(10, 11, 14, 0.88)), var(--bg-restaurant-base64) !important;`;
    }
    return `background-image: linear-gradient(rgba(251, 247, 238, 0.82), rgba(251, 247, 238, 0.88)), var(--bg-restaurant-base64) !important;`;
  });

  // Reemplazar Logo por Base64 (portada y contraportada)
  html = html.replace(/<img[^>]+src=["'](?:\.\/)?logo\/logo\.png["'][^>]*class="cover-logo-img"[^>]*>/gi, 
    `<img src="${logoBase64}" alt="Mi Barrunto Logo" class="cover-logo-img" />`
  );
  html = html.replace(/<img[^>]+class="cover-logo-img"[^>]*>/gi, 
    `<img src="${logoBase64}" alt="Mi Barrunto Logo" class="cover-logo-img" />`
  );
  html = html.replace(/<img[^>]+src=["'](?:\.\/)?logo\/logo\.png["'][^>]*class="backcover-logo-img"[^>]*>/gi,
    `<img src="${logoBase64}" alt="Mi Barrunto Logo" class="backcover-logo-img" />`
  );
  html = html.replace(/<img[^>]+class="backcover-logo-img"[^>]*>/gi,
    `<img src="${logoBase64}" alt="Mi Barrunto Logo" class="backcover-logo-img" />`
  );

  // Asegurar clase .page en TODAS las páginas (1 al 10) para el extractor
  html = html.replace(/<section\s+class="([^"]*)"\s+id="page-(\d+)"/g, (match, classes, pageNum) => {
    const classList = classes.split(/\s+/).filter(c => c);
    if (!classList.includes('page')) classList.push('page');
    if (!classList.includes('menu-page')) classList.push('menu-page');
    return `<section class="${classList.join(' ')}" id="page-${pageNum}"`;
  });

  // Asegurar clase .page-wrapper
  html = html.replace(/class="menu-page-wrapper"/g, 'class="menu-page-wrapper page-wrapper"');

  // Asegurar regla CSS para .page
  html = html.replace('.menu-page {', '.menu-page, .page {\n      box-sizing: border-box;\n      border: none !important;\n');

  // Estilos de precisión para Página 9 y modo oscuro
  const page9Styles = `
    /* Regla exacta para extractores que buscan .page */
    .page {
      box-sizing: border-box !important;
      border: none !important;
    }
    /* Ajuste de precisión Página 9 para distribución balanceada sin desborde */
    #page-9 .page-body-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr 1fr !important;
      gap: 16px !important;
      align-items: start !important;
      max-height: 575px !important;
      overflow: hidden !important;
    }
    #page-9 .menu-dish-item {
      margin-bottom: 2.2px !important;
      line-height: 1.12 !important;
    }
    #page-9 .dish-main-row {
      line-height: 1.15 !important;
    }
    #page-9 .dish-desc {
      font-size: 6.9pt !important;
      line-height: 1.08 !important;
      margin-top: 1px !important;
    }
    #page-9 .dish-price-pill {
      font-size: 0.74rem !important;
      padding: 1px 5px !important;
    }
    #page-9 .dish-name {
      font-size: 0.77rem !important;
    }
    body.dark-theme #page-9 .batidos-sub-legend {
      color: #f7a044 !important;
    }
  `;

  html = html.replace('</style>', `${page9Styles}\n  </style>`);

  // Reemplazar columnas 2 y 3 en Página 9
  const page9StartIdx = html.indexOf('id="page-9"');
  if (page9StartIdx !== -1) {
    const col2CommentIdx = html.indexOf('<!-- Columna 2:', page9StartIdx);
    const gratitudePillIdx = html.indexOf('class="footer-gratitude-pill"', col2CommentIdx);
    
    if (col2CommentIdx !== -1 && gratitudePillIdx !== -1) {
      const lastDivBeforeGratitude = html.lastIndexOf('</div>', gratitudePillIdx);
      if (lastDivBeforeGratitude > col2CommentIdx) {
        const newCol2And3 = getPage9Col2And3(isDark);
        html = html.slice(0, col2CommentIdx) + newCol2And3 + '\n    </div>\n    \n    ' + html.slice(gratitudePillIdx);
        console.log('Successfully replaced Page 9 columns 2 & 3 in', filePath);
      }
    }
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Finished updating:', filePath, 'Size in MB:', (fs.statSync(filePath).size / (1024*1024)).toFixed(2));
}

const files = [
  'public/menu_imprimible.html',
  'public/menu_imprimible_dark.html',
  'menu_imprimible.html',
  'menu_imprimible_dark.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    processFile(f);
  }
});

// Limpiar archivos scratch temporales
try { fs.unlinkSync('scratch_bg_opt.jpg'); } catch(e) {}
try { fs.unlinkSync('scratch_logo_opt.png'); } catch(e) {}

console.log('ALL FILES PROCESSED AND OPTIMIZED SUCCESSFULLY');
