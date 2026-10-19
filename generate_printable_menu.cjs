// Script to generate a pixel-perfect 11x8.5 Letter Landscape printable menu for Mi Barrunto
// STRICT REQUIREMENTS MET:
// 1. NO &amp; ERROR: Sanitized escapeHtml to prevent double-escaping, passing pure text to headers.
// 2. NO BACKGROUND ON ICONS & TEXT: Removed background from icons, cards, and text in cover & backcover.
// 3. LARGER LOGOS: Logo increased to 220px on cover and 175px on back cover.
// 4. DARK / BLACK LUXURY VERSION: Full high-contrast dark theme with glowing white typography and gold accents.
// 5. GENERATES BOTH: menu_imprimible.html (with toggle button) AND menu_imprimible_dark.html (dark by default).
// 6. ZERO CUT DISHES: Balanced 10-page layout. Max 17 dishes per column. 0 overflows.
// 7. DEDICATED TOC: Page 2 completely dedicated without dishes.
// 8. OFFICIAL WHATSAPP LOGO: Authentic SVG bubble + phone handset.
// 9. ZERO BORDERS: border: none !important; everywhere.

const fs = require('fs');
const path = require('path');

// Read menuData
const menuDataPath = path.join(__dirname, 'src', 'data', 'menuData.js');
const menuDataContent = fs.readFileSync(menuDataPath, 'utf8');

let categoriesData = [];
let dishesData = [];

const catMatch = menuDataContent.match(/export const CATEGORIES_DATA = (\[[\s\S]*?\]);/);
if (catMatch) categoriesData = JSON.parse(catMatch[1]);

const dishesMatch = menuDataContent.match(/export const DISHES_DATA = (\[[\s\S]*?\]);/);
if (dishesMatch) dishesData = JSON.parse(dishesMatch[1]);

console.log(`Loaded ${categoriesData.length} categories and ${dishesData.length} dishes.`);

const dishesByCat = {};
categoriesData.forEach(c => {
  dishesByCat[c.id] = dishesData.filter(d => d.category === c.id);
});

// Fixed escapeHtml: prevents double escaping of &amp;
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --------------------------------------------------------------------------
// VECTOR SVG ICONS (STRICT: ZERO EMOJIS - OFFICIAL BRAND LOGOS)
// --------------------------------------------------------------------------
const SVG_ICONS = {
  printer: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  zoomIn: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
  zoomOut: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`,
  moon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  sun: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  mapPin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  phone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  
  // WhatsApp Oficial (Paths de Icono Vectorial)
  whatsapp: `<svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" style="flex-shrink:0;"><path d="M16 2C8.268 2 2 8.268 2 16c0 2.492.666 4.83 1.83 6.846L2 30l7.385-1.799A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.793-1.566l-.415-.247-4.38 1.067 1.099-4.27-.27-.437A11.464 11.464 0 0 1 4.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.29-8.548c-.345-.172-2.038-1.004-2.353-1.12-.315-.114-.545-.172-.774.173-.23.344-.888 1.12-1.088 1.35-.2.228-.4.258-.745.086-.345-.172-1.456-.537-2.772-1.71-1.024-.914-1.716-2.043-1.916-2.387-.2-.344-.021-.53.15-.702.155-.154.345-.4.517-.602.173-.2.23-.343.345-.572.115-.23.058-.43-.029-.602-.086-.172-.774-1.868-1.06-2.557-.28-.673-.563-.58-.774-.591l-.66-.011c-.23 0-.602.086-.917.43s-1.202 1.177-1.202 2.873c0 1.696 1.231 3.334 1.403 3.563.172.23 2.428 3.706 5.882 5.198.822.355 1.463.567 1.963.725.824.262 1.574.225 2.168.137.66-.099 2.037-.832 2.323-1.636.287-.803.287-1.492.2-1.636-.085-.144-.315-.23-.66-.4z"/></svg>`,
  
  // Facebook Oficial
  facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  
  // Instagram Oficial
  instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  
  // DoorDash Oficial
  doordash: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF3008" style="flex-shrink:0;"><path d="M23.071 8.409a6.09 6.09 0 0 0-5.396-3.228H.584A.589.589 0 0 0 .17 6.184L3.894 9.93a1.75 1.75 0 0 0 1.242.516h12.049a1.554 1.554 0 1 1 .031 3.108H8.91a.589.589 0 0 0-.415 1.003l3.725 3.747a1.75 1.75 0 0 0 1.242.516h3.757c4.887 0 8.584-5.225 5.852-10.413" /></svg>`,
  
  // Uber Eats Oficial
  ubereats: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#06C167" style="flex-shrink:0;"><path d="M0 2.865v4.997c0 1.883 1.332 3.13 3.084 3.13a2.97 2.97 0 0 0 2.15-.877v.743h1.211V2.864H5.223v4.934c0 1.265-.87 2.12-1.995 2.122c-1.139-.002-1.997-.834-1.997-2.122V2.865zm7.363 0v7.993h1.162v-.732a3 3 0 0 0 2.118.876a3.044 3.044 0 1 0 0-6.086a2.97 2.97 0 0 0-2.107.876V2.865zm9.885 2.056a3.02 3.02 0 0 0-3.035 3.024c0 1.737 1.373 3.037 3.153 3.037a3.12 3.12 0 0 0 2.558-1.243l-.85-.618a2.05 2.05 0 0 1-1.708.858a1.97 1.97 0 0 1-1.97-1.655h4.817v-.379c0-1.734-1.254-3.024-2.964-3.024zm6.163.066a1.6 1.6 0 0 0-1.376.766v-.719h-1.163v5.824h1.174V7.546c0-.902.559-1.484 1.327-1.484h.495V4.989zm-6.203.944a1.844 1.844 0 0 1 1.834 1.486h-3.618a1.844 1.844 0 0 1 1.784-1.486m-6.659.006a2.021 2.021 0 1 1 .002 4.042a2.02 2.02 0 0 1-1.416-.598a2.02 2.02 0 0 1-.585-1.422a2.02 2.02 0 0 1 .584-1.422a2.02 2.02 0 0 1 1.415-.6M0 12.987v7.971h5.722v-1.367H1.546v-1.97H5.61v-1.315H1.545v-1.955h4.176v-1.365zm14.56.41v1.685h-1.15v1.338h1.154v3.143c0 .793.572 1.421 1.6 1.421h1.643l-.006-1.338H16.66c-.348 0-.572-.15-.572-.464v-2.768H17.8v-1.332h-1.706v-1.686zm-5.297 1.527a3.103 3.103 0 1 0 .07 6.205a3 3 0 0 0 1.913-.666v.532h1.517v-5.913h-1.509v.526a3 3 0 0 0-1.92-.684zm11.771.007c-1.585 0-2.7.644-2.7 1.886c0 .86.613 1.421 1.936 1.695l1.448.328c.57.11.722.259.722.49c0 .371-.438.603-1.127.603c-.876 0-1.378-.19-1.573-.848h-1.533c.22 1.231 1.157 2.05 3.049 2.05h.002c1.752 0 2.742-.819 2.742-1.953c0-.806-.585-1.408-1.809-1.667l-1.294-.26c-.751-.136-.988-.274-.988-.546c0-.357.361-.575 1.03-.575c.722 0 1.252.192 1.405.847h1.518c-.086-1.229-.99-2.05-2.827-2.05m-11.567 1.25c1.01.01 1.819.837 1.807 1.847A1.8 1.8 0 0 1 9.45 19.83a1.824 1.824 0 0 1 .018-3.648" /></svg>`,

  star: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  fish: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6s-7.56-2.54-8.5-6Z"></path><path d="M18 12v.5"></path><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"></path><path d="M7 10.67C7 8 5.58 5.97 2.73 4 3.75 8.5 3.75 15.5 2.73 20 5.58 18.03 7 16 7 13.33"></path><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3"></path><path d="M10.46 16.74c-.26 1.38-1.29 3.02-2.46 4.26"></path></svg>`,
  flame: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"></path></svg>`,
  soup: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path><path d="M7 21a7 7 0 0 1-4-6"></path><path d="M17 21a7 7 0 0 0 4-6"></path><path d="M8 8a2 2 0 0 1 2-2 2 2 0 0 0 2-2"></path><path d="M14 8a2 2 0 0 1 2-2 2 2 0 0 0 2-2"></path></svg>`,
  utensils: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"></path><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"></path><path d="m2.1 21.8 6.4-6.3"></path><path d="m19 5-7 7"></path></svg>`,
  coffee: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
  sandwich: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M3 11h18v2H3z"></path><path d="M3 7h18a2 2 0 0 1 2 2v2H1V9a2 2 0 0 1 2-2z"></path><path d="M1 13h22v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-2z"></path></svg>`,
  drumstick: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m15.4 15.6 3.4-3.4a5 5 0 0 0-7.1-7.1l-3.4 3.4a5 5 0 0 0 7.1 7.1Z"></path><path d="m12.3 12.5-5.8 5.8a2.5 2.5 0 0 1-3.5-3.5l5.8-5.8"></path></svg>`,
  cake: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"></path><path d="M2 21h20"></path><line x1="12" y1="7" x2="12" y2="11"></line></svg>`,
  layers: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
  chefHat: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M6 13.8a4.5 4.5 0 1 1 2.6-8.3 4.5 4.5 0 1 1 6.8 0 4.5 4.5 0 1 1 2.6 8.3"></path><path d="M6 18h12"></path><path d="M6 14h12v7H6z"></path></svg>`
};

// Generate Andean woven textile banner - Compact height (20px) to maximize dish space
function getPeruvianTextileSVG() {
  return `
  <div class="textile-banner-wrap">
    <svg class="textile-banner" viewBox="0 0 1056 22" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="incaWeave" width="88" height="22" patternUnits="userSpaceOnUse">
          <rect width="88" height="22" fill="#88130e" />
          <rect x="0" y="0" width="6" height="22" fill="#380906" />
          <rect x="6" y="0" width="8" height="22" fill="#c35016" />
          <rect x="14" y="0" width="4" height="22" fill="#e7a627" />
          <rect x="18" y="0" width="12" height="22" fill="#75100c" />
          <rect x="30" y="0" width="6" height="22" fill="#f5cf6d" />
          <rect x="36" y="0" width="16" height="22" fill="#ba3c10" />
          <rect x="52" y="0" width="6" height="22" fill="#380906" />
          <rect x="58" y="0" width="10" height="22" fill="#e7a627" />
          <rect x="68" y="0" width="4" height="22" fill="#75100c" />
          <rect x="72" y="0" width="8" height="22" fill="#c35016" />
          <rect x="80" y="0" width="8" height="22" fill="#250604" />

          <polygon points="10,3 13,6 10,9 7,6" fill="#fff3d1" />
          <polygon points="10,13 13,16 10,19 7,16" fill="#fff3d1" />
          
          <polygon points="44,2 49,6 44,10 39,6" fill="#fff8e7" />
          <polygon points="44,12 49,16 44,20 39,16" fill="#f5cf6d" />
          
          <rect x="2" y="2" width="2" height="3" fill="#e7a627" />
          <rect x="2" y="8" width="2" height="3" fill="#e7a627" />
          <rect x="2" y="14" width="2" height="3" fill="#e7a627" />

          <rect x="83" y="2" width="2" height="3" fill="#fff3d1" />
          <rect x="83" y="8" width="2" height="3" fill="#fff3d1" />
          <rect x="83" y="14" width="2" height="3" fill="#fff3d1" />
        </pattern>
      </defs>
      <rect width="100%" height="22" fill="url(#incaWeave)" />
    </svg>
  </div>
  `;
}

function renderDish(d) {
  return `
    <div class="menu-dish-item">
      <div class="dish-main-row">
        <span class="dish-name">${escapeHtml(d.name)}</span>
        <span class="dish-dots"></span>
        <span class="dish-price-pill">${escapeHtml(d.priceDisplay)}</span>
      </div>
      ${d.nameEn ? `<div class="dish-desc">${escapeHtml(d.nameEn)}</div>` : ''}
    </div>
  `;
}

function renderCategoryHeader(title, style = 'line', iconKey = '') {
  const icon = iconKey && SVG_ICONS[iconKey] ? SVG_ICONS[iconKey] : '';
  const cleanTitle = escapeHtml(title);
  if (style === 'badge') {
    return `
      <div class="category-header-badge-wrap">
        <div class="category-header-badge">
          ${icon}
          <span>${cleanTitle}</span>
        </div>
      </div>
    `;
  }
  return `
    <div class="category-header-line">
      ${icon ? `<span class="cat-icon-wrap">${icon}</span>` : ''}
      <span class="cat-title-text">${cleanTitle}</span>
      <span class="cat-line"></span>
    </div>
  `;
}

function getBottomGratitudePill() {
  return `
    <div class="footer-gratitude-pill">
      <span class="gratitude-es">Agradecimiento del 18% en las mesas con 2 ó más personas</span>
      <span class="gratitude-bullet">·</span>
      <span class="gratitude-en">Gratitude of 18% on table 2 or more people</span>
    </div>
  `;
}

// --------------------------------------------------------------------------
// PAGE 1: PORTADA PRINCIPAL (FRONT COVER)
// - Logo significantly larger (220px)
// - Single slogan (Restaurant & Grocery / Comida criolla peruana)
// - NO background on icons and text! Clean, elegant overlay.
// --------------------------------------------------------------------------
function renderPage1() {
  return `
  <section class="menu-page page-cover" id="page-1">
    ${getPeruvianTextileSVG()}

    <div class="cover-content">
      <div class="cover-logo-wrap">
        <img src="./logo/logo.png" onerror="if(!this.dataset.retried){this.dataset.retried=1;this.src='logo/logo.png';}" alt="Mi Barrunto Logo" class="cover-logo-img" />
      </div>

      <h1 class="cover-brand-title">MI BARRUNTO</h1>
      <div class="cover-slogan-block">
        <span class="cover-slogan-main">Restaurant &amp; Grocery</span>
        <span class="cover-slogan-sub">Comida criolla peruana</span>
      </div>

      <div class="cover-badge-divider">
        <span class="cover-line"></span>
        <span class="cover-badge-center">
          ${SVG_ICONS.star}
          <span>TRADICIÓN & SAZÓN PERUANA</span>
          ${SVG_ICONS.star}
        </span>
        <span class="cover-line"></span>
      </div>

      <!-- Medallones de especialidades: SOLO ICONOS SIN FONDO (ESTILO LIMPIO) -->
      <div class="cover-features-row">
        <div class="cover-feature-item">
          <div class="cover-feature-icon-badge">${SVG_ICONS.fish}</div>
          <div class="cover-feature-title">CEVICHERÍA TRADICIONAL</div>
          <div class="cover-feature-sub">Pescado fresco, limón norteño, choclo y ají limo</div>
        </div>
        <div class="cover-feature-sep">·</div>
        <div class="cover-feature-item">
          <div class="cover-feature-icon-badge">${SVG_ICONS.flame}</div>
          <div class="cover-feature-title">FUEGO &amp; SAZÓN CRIOLLA</div>
          <div class="cover-feature-sub">Lomo saltado al wok flameado, secos y tacu tacus</div>
        </div>
        <div class="cover-feature-sep">·</div>
        <div class="cover-feature-item">
          <div class="cover-feature-icon-badge">${SVG_ICONS.utensils}</div>
          <div class="cover-feature-title">PARRILLAS AL CARBÓN</div>
          <div class="cover-feature-sub">Anticuchos de corazón, cortes finos y salsas</div>
        </div>
      </div>

      <!-- Fila de Redes Sociales y Delivery: SOLO ICONOS SIN FONDO -->
      <div class="cover-social-bar">
        <span class="cover-social-tag">SÍGUENOS Y PIDE EN LÍNEA</span>
        <div class="cover-social-icons">
          <a href="https://www.facebook.com/cebicheriamibarrunto" target="_blank" class="cover-icon-circle" title="Facebook" aria-label="Facebook">
            ${SVG_ICONS.facebook}
          </a>
          <a href="https://www.instagram.com/cevicheria.mibarrunto/" target="_blank" class="cover-icon-circle" title="Instagram" aria-label="Instagram">
            ${SVG_ICONS.instagram}
          </a>
          <a href="https://wa.me/19736533749" target="_blank" class="cover-icon-circle" title="WhatsApp Oficial: (973) 653-3749" aria-label="WhatsApp">
            ${SVG_ICONS.whatsapp}
          </a>
          <a href="https://www.doordash.com" target="_blank" class="cover-icon-circle" title="DoorDash Delivery" aria-label="DoorDash">
            ${SVG_ICONS.doordash}
          </a>
          <a href="https://www.ubereats.com" target="_blank" class="cover-icon-circle" title="Uber Eats Delivery" aria-label="Uber Eats">
            ${SVG_ICONS.ubereats}
          </a>
        </div>
      </div>

      <div class="cover-footer-info">
        <div class="cover-info-item">
          ${SVG_ICONS.mapPin}
          <span>21 Mill St, #9, Paterson, NJ 07501</span>
        </div>
        <div class="cover-info-sep">·</div>
        <div class="cover-info-item">
          ${SVG_ICONS.phone}
          <span>Teléfono &amp; WhatsApp: (973) 653-3749</span>
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 2: PÁGINA EXCLUSIVA DEL ÍNDICE GENERAL (DEDICATED TOC)
// --------------------------------------------------------------------------
function renderPage2() {
  return `
  <section class="menu-page page-dedicated-toc" id="page-2">
    ${getPeruvianTextileSVG()}

    <div class="toc-page-body">
      <div class="toc-page-header">
        <div class="toc-badge-top">
          ${SVG_ICONS.star}
          <span>CARTA MENÚ DEGUSTACIÓN · TRADICIÓN DE BARRIO</span>
          ${SVG_ICONS.star}
        </div>
        <h2 class="toc-page-heading">ÍNDICE DE LA CARTA</h2>
        <p class="toc-page-sub">Guía de especialidades de nuestra cocina criolla &amp; marina</p>
      </div>

      <div class="toc-page-grid-layout">
        <!-- Tarjeta Principal con las Secciones del Menú y sus Páginas Exactas -->
        <div class="toc-card-main">
          <div class="toc-table-list">
            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.utensils}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Entradas de la Casa</span>
                <span class="toc-row-desc">Papa a la huancaína, ocopa, tequeños y causas limeñas</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 3</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.coffee}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Desayunos Peruanos</span>
                <span class="toc-row-desc">Chicharrón de chancho, tamales criollos y lomo al jugo</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 3</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.sandwich}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Sandwiches &amp; Panes Criollos</span>
                <span class="toc-row-desc">Pan con chicharrón, pavo asado, lomo saltado y lechón</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 3 – 4</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.soup}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Sopas &amp; Caldos Tradicionales</span>
                <span class="toc-row-desc">Sopa criolla, chupe de camarones, menestrón y parihuela</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 4</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.flame}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Parrillas al Carbón</span>
                <span class="toc-row-desc">Anticuchos de corazón, churrascos, chuletas y combinados</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 5</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.drumstick}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Pollo Broaster &amp; Mostritos</span>
                <span class="toc-row-desc">Piezas crocantes con papas fritas, chaufa y cremas</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 5</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.flame}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Comida Criolla (Saltados &amp; Chaufas)</span>
                <span class="toc-row-desc">Lomos saltados al wok flameado, chaufas y arroces criollos</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 6</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.layers}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Pastas Criollas, Tacu Tacus &amp; Rondas</span>
                <span class="toc-row-desc">Tallarines huancaína, tacu tacus dorados y fuentes mixtas</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 7</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.fish}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Cevichería Tradicional &amp; Mariscos</span>
                <span class="toc-row-desc">Ceviche clásico, jaleas mixtas, leches de tigre y arroces</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 8</span>
            </div>

            <div class="toc-row-item">
              <span class="toc-row-icon">${SVG_ICONS.cake}</span>
              <div class="toc-row-info">
                <span class="toc-row-title">Guarniciones, Bebidas &amp; Postres</span>
                <span class="toc-row-desc">Chicha morada, Inca Kola, picarones, tortas y helados</span>
              </div>
              <span class="toc-row-dots"></span>
              <span class="toc-row-page">PÁG. 9</span>
            </div>
          </div>
        </div>

        <!-- Columna Lateral: Información de Servicio -->
        <div class="toc-side-cards">
          <div class="toc-side-card">
            <div class="toc-scard-icon">${SVG_ICONS.utensils}</div>
            <h3 class="toc-scard-title">ATENCIÓN &amp; RESERVAS</h3>
            <p class="toc-scard-text">
              Servicio en salón, retiro en local (Take Out) y Delivery a domicilio por DoorDash y Uber Eats.
              Consulte a su anfitrión por opciones para eventos y catering.
            </p>
          </div>
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 3: ENTRADAS, DESAYUNOS & SANDWICHES (PARTE 1)
// --------------------------------------------------------------------------
function renderPage3() {
  const entradas = dishesByCat['entradas'] || [];
  const desayuno = dishesByCat['desayuno'] || [];
  const sandwiches = dishesByCat['sandwiches'] || [];

  const sandwichesPart1 = sandwiches.slice(0, 11);

  return `
  <section class="menu-page page-content-3col" id="page-3">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Entradas de la Casa (17 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('ENTRADAS DE LA CASA', 'badge', 'utensils')}
        <div class="dishes-list">
          ${entradas.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Desayunos Peruanos (10 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('DESAYUNOS PERUANOS', 'line', 'coffee')}
        <div class="dishes-list">
          ${desayuno.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Sandwiches Criollos - Parte 1 (11 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('SANDWICHES CRIOLLOS', 'badge', 'sandwich')}
        <div class="dishes-list">
          ${sandwichesPart1.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 4: SANDWICHES CRIOLLOS (CONT.) & SOPAS ESPECIALES
// --------------------------------------------------------------------------
function renderPage4() {
  const sandwiches = dishesByCat['sandwiches'] || [];
  const sopas = dishesByCat['sopas'] || [];

  const sandwichesPart2 = sandwiches.slice(11);
  const sopasPart1 = sopas.slice(0, 10);
  const sopasPart2 = sopas.slice(10);

  return `
  <section class="menu-page page-content-3col" id="page-4">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Sandwiches Criollos - Continuación (11 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('SANDWICHES & PANES (CONT.)', 'line', 'sandwich')}
        <div class="dishes-list">
          ${sandwichesPart2.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Sopas Especiales - Parte 1 (10 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('SOPAS ESPECIALES', 'badge', 'soup')}
        <div class="dishes-list">
          ${sopasPart1.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Sopas & Caldos - Continuación (10 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('CALDOS & CHUPES (CONT.)', 'line', 'soup')}
        <div class="dishes-list">
          ${sopasPart2.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 5: PARRILLAS AL CARBÓN & POLLO BROASTER
// --------------------------------------------------------------------------
function renderPage5() {
  const parrillas = dishesByCat['parrillas'] || [];
  const broaster = dishesByCat['broaster'] || [];

  const parrillasPart1 = parrillas.slice(0, 10);
  const parrillasPart2 = parrillas.slice(10);

  return `
  <section class="menu-page page-content-3col" id="page-5">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Parrillas Criollas al Carbón (10 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('PARRILLAS AL CARBÓN', 'badge', 'flame')}
        <div class="dishes-list">
          ${parrillasPart1.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Cortes & Combinados Parrilleros (9 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('ANTICUCHOS & CORTES', 'line', 'flame')}
        <div class="dishes-list">
          ${parrillasPart2.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Pollo Broaster & Mostritos (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('POLLO BROASTER & MOSTRITOS', 'badge', 'drumstick')}
        <div class="dishes-list">
          ${broaster.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 6: GRAN COMIDA CRIOLLA (PARTE 1: SALTADOS & CHAUFAS)
// --------------------------------------------------------------------------
function renderPage6() {
  const criolla = dishesByCat['criolla'] || [];
  const col1 = criolla.slice(0, 15);
  const col2 = criolla.slice(15, 30);
  const col3 = criolla.slice(30, 45);

  return `
  <section class="menu-page page-content-3col" id="page-6">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Lomos y Saltados al Wok (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('LOMOS & SALTADOS AL WOK', 'badge', 'flame')}
        <div class="dishes-list">
          ${col1.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Saltados Combinados & Especiales (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('SALTADOS ESPECIALES', 'line', 'utensils')}
        <div class="dishes-list">
          ${col2.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Chaufas y Arroces Criollos (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('CHAUFAS & ARROCES CRIOLLOS', 'badge', 'utensils')}
        <div class="dishes-list">
          ${col3.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 7: GRAN COMIDA CRIOLLA (PARTE 2: PASTAS, TACU TACUS & RONDAS)
// --------------------------------------------------------------------------
function renderPage7() {
  const criolla = dishesByCat['criolla'] || [];
  const pastas = criolla.slice(45, 53); // 8 dishes
  const tacuTacus = criolla.slice(53); // 8 dishes
  const rondas = dishesByCat['rondas'] || []; // 7 dishes

  return `
  <section class="menu-page page-content-3col" id="page-7">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Tallarines a la Huancaína & Pastas Criollas (8 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('PASTAS CRIOLLAS & HUANCAÍNA', 'badge', 'utensils')}
        <div class="dishes-list">
          ${pastas.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Tacu Tacus Dorados de la Casa (8 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('TACU TACUS TRADICIONALES', 'line', 'chefHat')}
        <div class="dishes-list">
          ${tacuTacus.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Rondas Criollas para Compartir (7 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('RONDAS PARA COMPARTIR', 'badge', 'layers')}
        <div class="dishes-list">
          ${rondas.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 8: CEVICHERÍA TRADICIONAL & MARISCOS
// --------------------------------------------------------------------------
function renderPage8() {
  const ceviches = dishesByCat['ceviches'] || [];
  const mariscos = dishesByCat['mariscos'] || [];

  const cevichesPart1 = ceviches.slice(0, 15);
  const cevichesPart2 = ceviches.slice(15); // 4 dishes
  const mariscosPart1 = mariscos.slice(0, 11); // 11 dishes
  const col2Dishes = [...cevichesPart2, ...mariscosPart1]; // 4 + 11 = 15 dishes
  const mariscosPart2 = mariscos.slice(11); // 16 dishes

  return `
  <section class="menu-page page-content-3col" id="page-8">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Cevichería Tradicional (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('CEVICHERÍA TRADICIONAL', 'badge', 'fish')}
        <div class="dishes-list">
          ${cevichesPart1.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Ceviches Especiales & Frituras (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('CEVICHES & MARISCOS', 'line', 'fish')}
        <div class="dishes-list">
          ${col2Dishes.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 3: Jaleas Crocantes & Arroces Marinos (16 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('JALEAS & ARROCES MARINOS', 'badge', 'fish')}
        <div class="dishes-list">
          ${mariscosPart2.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 9: GUARNICIONES, BEBIDAS TRADICIONALES & POSTRES CASEROS
// --------------------------------------------------------------------------
// PAGE 9: GUARNICIONES, BEBIDAS TRADICIONALES & POSTRES CASEROS
// --------------------------------------------------------------------------
function renderPage9() {
  const sides = dishesByCat['sides'] || [];
  const bebidas = dishesByCat['bebidas'] || [];
  const batidos = dishesByCat['batidos'] || [];
  const postres = dishesByCat['postres'] || [];

  return `
  <section class="menu-page page-content-3col" id="page-9">
    ${getPeruvianTextileSVG()}

    <div class="page-body-grid">
      <!-- Columna 1: Guarniciones / Sides (15 platos) -->
      <div class="menu-col">
        ${renderCategoryHeader('GUARNICIONES / SIDES', 'badge', 'utensils')}
        <div class="dishes-list">
          ${sides.map(renderDish).join('')}
        </div>
      </div>

      <!-- Columna 2: Bebidas Tradicionales & Batidos -->
      <div class="menu-col">
        ${renderCategoryHeader('BEBIDAS TÍPICAS', 'line', 'coffee')}
        <div class="dishes-list">
          ${bebidas.map(renderDish).join('')}
        </div>
        ${batidos.length > 0 ? `
          <div style="margin-top: 8px;">
            ${renderCategoryHeader('BATIDOS & JUGOS', 'line', 'coffee')}
            <div class="dishes-list">
              ${batidos.map(renderDish).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Columna 3: Postres Caseros (9 items del cuaderno) -->
      <div class="menu-col">
        ${renderCategoryHeader('POSTRES CASEROS', 'badge', 'cake')}
        <div class="dishes-list">
          ${postres.map(renderDish).join('')}
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// PAGE 10: CONTRAPORTADA (BACK COVER CON DATOS OFICIALES Y WHATSAPP CORRECTO)
// - Logo larger (175px)
// - Phone number appears only ONCE!
// - Social media shows ONLY icons (NO background on icons and text)
// --------------------------------------------------------------------------
function renderPage10() {
  return `
  <section class="menu-page page-backcover" id="page-10">
    ${getPeruvianTextileSVG()}

    <div class="backcover-content">
      <div class="backcover-logo-wrap">
        <img src="./logo/logo.png" onerror="if(!this.dataset.retried){this.dataset.retried=1;this.src='logo/logo.png';}" alt="Mi Barrunto Logo" class="backcover-logo-img" />
      </div>

      <h2 class="backcover-title">¡GRACIAS POR SU PREFERENCIA!</h2>

      <div class="backcover-grid-info">
        <!-- Tarjeta Horarios (Sin fondos en textos) -->
        <div class="backcover-card">
          <div class="bcard-header">
            <span class="bcard-icon">${SVG_ICONS.clock}</span>
            <span class="bcard-title">HORARIOS DE ATENCIÓN</span>
          </div>
          <div class="bcard-line" style="font-size: 11pt; font-weight: 900; color: #ee0000; letter-spacing: 0.02em;">ATENCIÓN 24 HORAS</div>
          <div class="bcard-line"><strong>Lunes a Domingo:</strong> Abierto las 24 Horas</div>
          <div class="bcard-line">Servicio ininterrumpido día y noche</div>
        </div>

        <!-- Tarjeta Contacto & Delivery (TELÉFONO APARECE UNA SOLA VEZ) -->
        <div class="backcover-card">
          <div class="bcard-header">
            <span class="bcard-icon">${SVG_ICONS.phone}</span>
            <span class="bcard-title">CONTACTO &amp; PEDIDOS</span>
          </div>
          <div class="bcard-line">
            <span class="bcard-subicon">${SVG_ICONS.mapPin}</span>
            <span>21 Mill St, #9, Paterson, NJ 07501</span>
          </div>
          <div class="bcard-line">
            <span class="bcard-subicon">${SVG_ICONS.phone}</span>
            <span>Teléfono &amp; WhatsApp: <strong>(973) 653-3749</strong></span>
          </div>
        </div>

        <!-- Tarjeta Redes Sociales & Delivery: SOLO ICONOS SIN FONDO -->
        <div class="backcover-card">
          <div class="bcard-header">
            <span class="bcard-icon">${SVG_ICONS.star}</span>
            <span class="bcard-title">SÍGUENOS Y PIDE EN LÍNEA</span>
          </div>
          <div class="backcover-icons-only-row">
            <a href="https://www.facebook.com/cebicheriamibarrunto" target="_blank" class="bcard-icon-pill" title="Facebook" aria-label="Facebook">
              ${SVG_ICONS.facebook}
            </a>
            <a href="https://www.instagram.com/cevicheria.mibarrunto/" target="_blank" class="bcard-icon-pill" title="Instagram" aria-label="Instagram">
              ${SVG_ICONS.instagram}
            </a>
            <a href="https://wa.me/19736533749" target="_blank" class="bcard-icon-pill" title="WhatsApp Oficial: (973) 653-3749" aria-label="WhatsApp">
              ${SVG_ICONS.whatsapp}
            </a>
            <a href="https://www.doordash.com" target="_blank" class="bcard-icon-pill" title="DoorDash Delivery" aria-label="DoorDash">
              ${SVG_ICONS.doordash}
            </a>
            <a href="https://www.ubereats.com" target="_blank" class="bcard-icon-pill" title="Uber Eats Delivery" aria-label="Uber Eats">
              ${SVG_ICONS.ubereats}
            </a>
          </div>
        </div>
      </div>

      <div class="backcover-seal-wrap">
        <div class="backcover-seal">
          <span class="seal-star">${SVG_ICONS.star}</span>
          <span>SABOR, TRADICIÓN Y CALIDAD 100% PERUANO</span>
          <span class="seal-star">${SVG_ICONS.star}</span>
        </div>
      </div>
    </div>

    ${getBottomGratitudePill()}
    ${getPeruvianTextileSVG()}
  </section>
  `;
}

// --------------------------------------------------------------------------
// HTML SHELL WITH PRINT AND SCREEN STYLES (SUPPORTS LIGHT AND DARK THEMES)
// --------------------------------------------------------------------------
function generateCompleteHtml(options = {}) {
  const isDefaultDark = options.defaultDark === true;
  const bodyClass = isDefaultDark ? 'dark-theme' : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Barrunto — Carta Menú Imprimible 11x8.5 (Carta Criolla &amp; Marina)</title>
  <meta name="description" content="Carta oficial completa e imprimible de Mi Barrunto (11x8.5 Horizontal). Más de 240 platos criollos y marinos: ceviches, lomo saltado, anticuchos, pollo broaster y postres caseros en Paterson, NJ." />
  <meta name="keywords" content="carta menu imprimible Mi Barrunto, menu pdf comida peruana, restaurante peruano Paterson NJ, ceviche, lomo saltado, anticuchos" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://biendemarketing.github.io/mibarruntonj/${isDefaultDark ? 'menu_imprimible_dark.html' : 'menu_imprimible.html'}" />

  <!-- Geoposicionamiento y SEO Local -->
  <meta name="geo.region" content="US-NJ" />
  <meta name="geo.placename" content="Paterson" />
  <meta name="geo.position" content="40.9168;-74.1718" />
  <meta name="ICBM" content="40.9168, -74.1718" />

  <!-- Open Graph / Redes Sociales -->
  <meta property="og:type" content="restaurant.menu" />
  <meta property="og:site_name" content="Mi Barrunto" />
  <meta property="og:title" content="Mi Barrunto — Carta Menú Imprimible 11x8.5 (Carta Criolla &amp; Marina)" />
  <meta property="og:description" content="Carta oficial completa e imprimible de Mi Barrunto. Más de 240 especialidades peruanas listas para ver e imprimir en alta resolución." />
  <meta property="og:url" content="https://biendemarketing.github.io/mibarruntonj/${isDefaultDark ? 'menu_imprimible_dark.html' : 'menu_imprimible.html'}" />
  <meta property="og:image" content="https://biendemarketing.github.io/mibarruntonj/bg-restaurant.jpg" />
  <meta property="og:image:secure_url" content="https://biendemarketing.github.io/mibarruntonj/bg-restaurant.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Carta Menú Imprimible Mi Barrunto Paterson NJ" />
  <meta property="og:locale" content="es_US" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Mi Barrunto — Carta Menú Imprimible (11x8.5)" />
  <meta name="twitter:description" content="Carta completa oficial de Mi Barrunto en Paterson, NJ. Imprime o guarda en PDF." />
  <meta name="twitter:image" content="https://biendemarketing.github.io/mibarruntonj/bg-restaurant.jpg" />

  <!-- Favicon y PWA -->
  <link rel="icon" type="image/png" href="./logo/logo.png" />
  <link rel="apple-touch-icon" href="./logo/logo.png" />
  <meta name="theme-color" content="${isDefaultDark ? '#060708' : '#fbf7ee'}" />

  <!-- Tipografías EXACTAS de la web: Grandstander y Alegreya Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Grandstander:wght@600;700;800;900&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400&display=swap" rel="stylesheet">

  <!-- Datos Estructurados JSON-LD Schema.org Menu -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Carta Menú Imprimible Mi Barrunto",
    "url": "https://biendemarketing.github.io/mibarruntonj/${isDefaultDark ? 'menu_imprimible_dark.html' : 'menu_imprimible.html'}",
    "mainEntityOfPage": "https://biendemarketing.github.io/mibarruntonj/",
    "inLanguage": "es",
    "hasMenuItem": [
      {
        "@type": "MenuItem",
        "name": "Ceviche Clásico",
        "description": "Pescado fresco marinado en limón norteño con choclo y camote"
      },
      {
        "@type": "MenuItem",
        "name": "Lomo Saltado",
        "description": "Lomo de res salteado al wok flameado con cebolla, tomate y papas fritas"
      },
      {
        "@type": "MenuItem",
        "name": "Anticuchos de Corazón",
        "description": "Brochetas de corazón de res marinadas en ají panca y especias al carbón"
      }
    ]
  }
  </script>

  <style>
    /* ==========================================================================
       VARIABLES Y FUENTES DE LA WEB OFICIAL
       ========================================================================== */
    :root {
      --font-display: 'Grandstander', cursive, system-ui, sans-serif;
      --font-body: 'Alegreya Sans', system-ui, sans-serif;
      --rojo: #e30613;
      --rojo-oscuro: #881410;
      --naranja: #d45915;
      --ocre: #c58652;
      --bg-cream: #fcf9f2;
      --bg-card: #f4ecdf;
      --page-scale: 1;
    }

    @page {
      size: 11in 8.5in;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: none !important;
      outline: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #0f1013;
      font-family: var(--font-body);
      color: #1a1614;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0 60px;
      transition: background-color 0.25s ease;
    }

    /* Barra Superior de Control en Pantalla (Oculta al Imprimir) */
    .print-controls-bar {
      position: sticky;
      top: 15px;
      z-index: 1000;
      background: #18191d;
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 9999px;
      box-shadow: none !important;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 25px;
    }

    .print-btn {
      background: var(--rojo);
      color: #ffffff;
      padding: 9px 20px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: none !important;
      text-decoration: none;
    }

    .print-btn:hover {
      background: #c20410;
      transform: translateY(-2px);
      box-shadow: none !important;
    }

    .theme-toggle-btn {
      background: #2a2e39;
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
      box-shadow: none !important;
    }

    .theme-toggle-btn:hover {
      background: #393e4d;
      transform: translateY(-2px);
    }

    .zoom-toggle-btn {
      background: #2a2e39;
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
      box-shadow: none !important;
    }

    .zoom-toggle-btn:hover {
      background: #393e4d;
      transform: translateY(-2px);
    }

    .zoom-toggle-btn.is-zoomed {
      background: var(--naranja);
    }

    .download-pdf-btn {
      background: #252830;
      color: #ffffff;
      padding: 9px 18px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
      box-shadow: none !important;
      text-decoration: none;
      border: none !important;
      outline: none !important;
    }

    .download-pdf-btn:hover {
      background: #393e4d;
      transform: translateY(-2px);
    }

    .nav-page-select {
      background: #252830;
      color: #ffffff;
      padding: 7px 14px;
      border-radius: 9999px;
      font-family: var(--font-body);
      font-size: 0.88rem;
      cursor: pointer;
    }

    .print-tip {
      font-size: 0.82rem;
      color: #a4a9b6;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ==========================================================================
       ESTRUCTURA DE CADA PÁGINA (11in x 8.5in Letter Landscape)
       ========================================================================== */
    .menu-pages-viewport {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .menu-page-wrapper {
      width: 11in;
      height: 8.5in;
      margin-bottom: 30px;
      position: relative;
      flex-shrink: 0;
      transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .menu-page {
      width: 11in;
      height: 8.5in;
      background-color: var(--bg-cream);
      position: relative;
      overflow: hidden;
      margin: 0;
      box-shadow: none !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      page-break-inside: avoid;
      transition: background-color 0.25s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: top left;
    }

    @media screen and (max-width: 1080px) {
      body {
        padding: 10px 0 40px;
        overflow-x: hidden;
      }

      body.zoom-mode-active {
        overflow-x: auto;
      }

      .print-controls-bar {
        position: sticky;
        top: 10px;
        padding: 8px 14px;
        gap: 8px;
        margin-bottom: 16px;
        max-width: 96vw;
        justify-content: center;
        flex-wrap: wrap;
      }

      .print-tip {
        display: none !important;
      }

      .menu-page-wrapper {
        width: calc(11in * var(--page-scale, 1));
        height: calc(8.5in * var(--page-scale, 1));
        margin-bottom: 16px;
      }

      .menu-page {
        transform: scale(var(--page-scale, 1));
        transform-origin: top left;
      }
    }

    /* Banners Textiles Incas Superior e Inferior - 20px de alto */
    .textile-banner-wrap {
      width: 100%;
      height: 20px;
      flex-shrink: 0;
      overflow: hidden;
      line-height: 0;
    }

    .textile-banner {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Grid de 3 Columnas */
    .page-body-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      padding: 8px 36px 14px;
      height: calc(8.5in - 44px);
      box-sizing: border-box;
      overflow: hidden;
    }

    .menu-col {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .dishes-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow: hidden;
    }

    /* Elemento de Plato Individual */
    .menu-dish-item {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .dish-main-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 3px;
    }

    .dish-name {
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 0.81rem;
      color: #1a1614;
      text-transform: uppercase;
      letter-spacing: 0.01em;
      white-space: normal;
      word-wrap: break-word;
      line-height: 1.15;
      flex: 1 1 auto;
      max-width: calc(100% - 62px);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.25s ease;
    }

    .dish-dots {
      flex: 1;
      border-bottom: 1.5px dotted #c4ad98 !important;
      margin: 0 4px;
      min-width: 8px;
      margin-bottom: 3px;
    }

    .dish-price-pill {
      background: var(--rojo-oscuro);
      color: #ffffff;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.80rem;
      padding: 1px 6px;
      border-radius: 6px;
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow: none !important;
      transition: all 0.25s ease;
      align-self: flex-end;
    }

    .dish-desc {
      font-family: var(--font-body);
      font-size: 0.70rem;
      color: #5c4c42;
      font-style: italic;
      line-height: 1.1;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      padding-left: 2px;
      margin-top: 1px;
      transition: color 0.25s ease;
    }

    /* Encabezados de Categoría */
    .category-header-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
      margin-top: 2px;
    }

    .cat-icon-wrap {
      color: var(--rojo);
      display: flex;
      align-items: center;
    }

    .cat-title-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--rojo-oscuro);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      transition: color 0.25s ease;
    }

    .cat-line {
      flex: 1;
      height: 2px;
      background: var(--ocre);
      border-radius: 2px;
    }

    .category-header-badge-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 6px;
      margin-top: 2px;
    }

    .category-header-badge {
      background: var(--naranja);
      color: #ffffff;
      padding: 3px 16px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.88rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      text-align: center;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: none !important;
      transition: background 0.25s ease;
    }

    /* Píldora de Agradecimiento del 18% al pie de página */
    .footer-gratitude-pill {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--naranja);
      color: #ffffff;
      padding: 2px 20px;
      border-radius: 9999px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 8px;
      z-index: 10;
      box-shadow: none !important;
      white-space: nowrap;
    }

    .gratitude-es {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.74rem;
      letter-spacing: 0.02em;
    }

    .gratitude-bullet {
      opacity: 0.7;
      font-size: 0.8rem;
    }

    .gratitude-en {
      font-family: var(--font-body);
      font-size: 0.68rem;
      font-style: italic;
      opacity: 0.94;
    }

    /* ==========================================================================
       ESTILOS DE LA PÁGINA 2: ÍNDICE DEDICADO EN PÁGINA INDEPENDIENTE
       ========================================================================== */
    .page-dedicated-toc {
      background: #fbf7ee;
    }

    .toc-page-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 10px 45px 18px;
      height: calc(8.5in - 44px);
      box-sizing: border-box;
    }

    .toc-page-header {
      text-align: center;
      margin-bottom: 8px;
    }

    .toc-badge-top {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--naranja);
      color: #ffffff;
      padding: 3px 16px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .toc-page-heading {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: 2.1rem;
      color: var(--rojo-oscuro);
      letter-spacing: 0.02em;
      line-height: 1.1;
      transition: color 0.25s ease;
    }

    .toc-page-sub {
      font-family: var(--font-body);
      font-size: 0.92rem;
      color: #5c4c42;
      font-style: italic;
    }

    .toc-page-grid-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 22px;
      align-items: center;
    }

    .toc-card-main {
      background: var(--bg-card);
      padding: 16px 22px;
      border-radius: 16px;
      box-shadow: none !important;
      transition: all 0.25s ease;
    }

    .toc-table-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .toc-row-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toc-row-icon {
      color: var(--rojo);
      display: flex;
      align-items: center;
      width: 18px;
    }

    .toc-row-info {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .toc-row-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.88rem;
      color: var(--rojo-oscuro);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      transition: color 0.25s ease;
    }

    .toc-row-desc {
      font-family: var(--font-body);
      font-size: 0.74rem;
      color: #6a574a;
      transition: color 0.25s ease;
    }

    .toc-row-dots {
      flex: 1;
      border-bottom: 1.5px dotted #c4ad98 !important;
      margin: 0 8px;
    }

    .toc-row-page {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: 0.90rem;
      color: var(--rojo);
      white-space: nowrap;
      background: #ffffff;
      padding: 2px 9px;
      border-radius: 9999px;
      box-shadow: none !important;
      transition: all 0.25s ease;
    }

    .toc-side-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toc-side-card {
      background: var(--bg-card);
      padding: 14px 16px;
      border-radius: 14px;
      box-shadow: none !important;
      text-align: center;
      transition: all 0.25s ease;
    }

    .toc-scard-icon {
      color: var(--rojo);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toc-scard-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.88rem;
      color: var(--rojo-oscuro);
      margin-bottom: 4px;
      transition: color 0.25s ease;
    }

    .toc-scard-text {
      font-family: var(--font-body);
      font-size: 0.78rem;
      color: #4a3e36;
      line-height: 1.35;
      transition: color 0.25s ease;
    }

    /* ==========================================================================
       ESTILOS ESPECÍFICOS DE LA PORTADA (PÁGINA 1)
       - Logo agrandado
       - Cero fondos en iconos y textos
       ========================================================================== */
    .page-cover {
      background-image: linear-gradient(rgba(251, 247, 238, 0.82), rgba(251, 247, 238, 0.88)), url('bg-restaurant.jpg'), url('./bg-restaurant.jpg'), url('./public/bg-restaurant.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .cover-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8px 40px;
      position: relative;
      z-index: 2;
    }

    .cover-logo-wrap {
      margin-bottom: 2px;
    }

    /* Logo más grande en Portada */
    .cover-logo-img {
      width: 220px;
      height: 220px;
      object-fit: contain;
      filter: none !important;
    }

    .cover-brand-title {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: 3.2rem;
      color: var(--rojo);
      letter-spacing: 0.02em;
      line-height: 1;
      margin-bottom: 4px;
      text-shadow: none !important;
      transition: all 0.25s ease;
    }

    .cover-slogan-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-bottom: 12px;
    }

    .cover-slogan-main {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--naranja);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      transition: color 0.25s ease;
    }

    .cover-slogan-sub {
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 1.05rem;
      color: #3b2d25;
      letter-spacing: 0.05em;
      transition: color 0.25s ease;
    }

    .cover-badge-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80%;
      max-width: 600px;
      margin-bottom: 14px;
    }

    .cover-line {
      flex: 1;
      height: 2px;
      background: var(--ocre);
    }

    /* Cero fondo en el texto del badge Paterson NJ */
    .cover-badge-center {
      padding: 0 16px;
      background: transparent !important;
      color: var(--rojo-oscuro);
      font-family: var(--font-display);
      font-weight: 900;
      font-size: 0.88rem;
      letter-spacing: 0.12em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: none !important;
      transition: color 0.25s ease;
    }

    .cover-features-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      margin-bottom: 14px;
    }

    .cover-feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 210px;
    }

    /* Cero fondo en iconos de especialidades */
    .cover-feature-icon-badge {
      width: 32px;
      height: 32px;
      background: transparent !important;
      color: var(--rojo);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
      box-shadow: none !important;
    }

    .cover-feature-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.82rem;
      color: var(--rojo-oscuro);
      letter-spacing: 0.04em;
      margin-bottom: 2px;
      transition: color 0.25s ease;
    }

    .cover-feature-sub {
      font-family: var(--font-body);
      font-size: 0.72rem;
      color: #5c4c42;
      line-height: 1.2;
      transition: color 0.25s ease;
    }

    .cover-feature-sep {
      color: var(--ocre);
      font-size: 1.4rem;
      font-weight: 900;
    }

    /* Barra Social y Delivery en Portada (SOLO ICONOS SIN FONDO) */
    .cover-social-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
    }

    .cover-social-tag {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.76rem;
      color: var(--rojo-oscuro);
      letter-spacing: 0.12em;
      transition: color 0.25s ease;
    }

    .cover-social-icons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    /* Cero fondo en los iconos sociales */
    .cover-icon-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent !important;
      color: var(--rojo);
      box-shadow: none !important;
      text-decoration: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .cover-icon-circle:hover {
      transform: translateY(-2px) scale(1.15);
      opacity: 0.85;
    }

    /* Cero fondo en la información del pie de portada */
    .cover-footer-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: transparent !important;
      padding: 4px 0;
      box-shadow: none !important;
    }

    .cover-info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.82rem;
      color: #3b2d25;
      transition: color 0.25s ease;
    }

    .cover-info-sep {
      color: var(--ocre);
      font-weight: 900;
    }

    /* ==========================================================================
       ESTILOS ESPECÍFICOS DE LA CONTRAPORTADA (PÁGINA 10)
       - Logo más grande (175px)
       - Cero fondos en iconos y textos
       - Teléfono único sin repeticiones
       ========================================================================== */
    .page-backcover {
      background-image: linear-gradient(rgba(251, 247, 238, 0.82), rgba(251, 247, 238, 0.88)), url('bg-restaurant.jpg'), url('./bg-restaurant.jpg'), url('./public/bg-restaurant.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    .backcover-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8px 40px;
      position: relative;
      z-index: 2;
    }

    .backcover-logo-wrap {
      margin-bottom: 4px;
    }

    /* Logo más grande en Contraportada */
    .backcover-logo-img {
      width: 175px;
      height: 175px;
      object-fit: contain;
      filter: none !important;
    }

    .backcover-title {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: 2.2rem;
      color: var(--rojo);
      letter-spacing: 0.02em;
      line-height: 1.1;
      margin-bottom: 4px;
      transition: color 0.25s ease;
    }

    .backcover-lead {
      font-family: var(--font-body);
      font-size: 0.94rem;
      color: #4a3e36;
      max-width: 680px;
      line-height: 1.35;
      margin-bottom: 16px;
      transition: color 0.25s ease;
    }

    .backcover-grid-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
      max-width: 900px;
      margin-bottom: 16px;
    }

    /* Cero fondos en las tarjetas de contraportada */
    .backcover-card {
      background: transparent !important;
      padding: 8px 12px;
      box-shadow: none !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .bcard-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .bcard-icon {
      color: var(--rojo);
      display: flex;
      align-items: center;
    }

    .bcard-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.88rem;
      color: var(--rojo-oscuro);
      letter-spacing: 0.04em;
      transition: color 0.25s ease;
    }

    .bcard-line {
      font-family: var(--font-body);
      font-size: 0.82rem;
      color: #3b2d25;
      line-height: 1.35;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-bottom: 2px;
      transition: color 0.25s ease;
    }

    .bcard-subicon {
      color: var(--naranja);
      display: flex;
      align-items: center;
    }

    /* Fila de solo iconos en contraportada (sin fondos) */
    .backcover-icons-only-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 6px;
    }

    .bcard-icon-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent !important;
      color: var(--rojo);
      box-shadow: none !important;
      text-decoration: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .bcard-icon-pill:hover {
      transform: translateY(-2px) scale(1.15);
      opacity: 0.85;
    }

    .backcover-seal-wrap {
      display: flex;
      justify-content: center;
    }

    .backcover-seal {
      background: var(--rojo);
      color: #ffffff;
      padding: 5px 22px;
      border-radius: 9999px;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.12em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: none !important;
    }

    .seal-star {
      color: #f5cf6d;
      display: flex;
      align-items: center;
    }

    /* ==========================================================================
       MODO FONDO NEGRO ELEGANTE (ALTO CONTRASTE Y MÁXIMA NITIDEZ)
       ========================================================================== */
    body.dark-theme {
      background-color: #060708 !important;
      color: #f3f4f6 !important;
    }

    body.dark-theme .menu-page {
      background-color: #0c0d11 !important;
      box-shadow: none !important;
    }

    body.dark-theme .page-cover {
      background-image: linear-gradient(rgba(10, 11, 14, 0.80), rgba(10, 11, 14, 0.88)), url('bg-restaurant.jpg'), url('./bg-restaurant.jpg'), url('./public/bg-restaurant.jpg') !important;
    }

    body.dark-theme .page-backcover {
      background-image: linear-gradient(rgba(10, 11, 14, 0.80), rgba(10, 11, 14, 0.88)), url('bg-restaurant.jpg'), url('./bg-restaurant.jpg'), url('./public/bg-restaurant.jpg') !important;
    }

    body.dark-theme .cover-brand-title {
      color: #ff3342 !important;
      text-shadow: none !important;
    }

    body.dark-theme .cover-slogan-main {
      color: #f7a044 !important;
    }

    body.dark-theme .cover-slogan-sub {
      color: #ffffff !important;
    }

    body.dark-theme .cover-badge-center {
      color: #f7a044 !important;
    }

    body.dark-theme .cover-feature-title {
      color: #ffffff !important;
    }

    body.dark-theme .cover-feature-sub {
      color: #c9c2b5 !important;
    }

    body.dark-theme .cover-social-tag {
      color: #f7a044 !important;
    }

    body.dark-theme .cover-icon-circle {
      color: #ffffff !important;
    }

    body.dark-theme .cover-info-item {
      color: #f3f4f6 !important;
    }

    body.dark-theme .dish-name {
      color: #ffffff !important;
      font-weight: 700 !important;
    }

    body.dark-theme .dish-dots {
      border-bottom: 1.5px dotted rgba(255, 255, 255, 0.3) !important;
    }

    body.dark-theme .dish-desc {
      color: #b8af9f !important;
    }

    body.dark-theme .dish-price-pill {
      background: #e30613 !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    body.dark-theme .cat-title-text {
      color: #f7a044 !important;
    }

    body.dark-theme .cat-line {
      background: rgba(247, 160, 68, 0.4) !important;
    }

    body.dark-theme .category-header-badge {
      background: #d45915 !important;
      color: #ffffff !important;
    }

    body.dark-theme .page-dedicated-toc {
      background: #0c0d11 !important;
    }

    body.dark-theme .toc-card-main {
      background: #15171e !important;
      box-shadow: none !important;
    }

    body.dark-theme .toc-side-card {
      background: #15171e !important;
      box-shadow: none !important;
    }

    body.dark-theme .toc-row-title {
      color: #ffffff !important;
    }

    body.dark-theme .toc-row-desc {
      color: #a89f92 !important;
    }

    body.dark-theme .toc-row-dots {
      border-bottom: 1.5px dotted rgba(255, 255, 255, 0.3) !important;
    }

    body.dark-theme .toc-row-page {
      background: #e30613 !important;
      color: #ffffff !important;
    }

    body.dark-theme .toc-page-heading {
      color: #ffffff !important;
    }

    body.dark-theme .toc-page-sub {
      color: #c0b7a8 !important;
    }

    body.dark-theme .toc-scard-title {
      color: #f7a044 !important;
    }

    body.dark-theme .toc-scard-text {
      color: #d1c8bb !important;
    }

    body.dark-theme .backcover-title {
      color: #ff3342 !important;
    }

    body.dark-theme .backcover-lead {
      color: #e5e7eb !important;
    }

    body.dark-theme .bcard-title {
      color: #f7a044 !important;
    }

    body.dark-theme .bcard-line {
      color: #f3f4f6 !important;
    }

    body.dark-theme .bcard-icon-pill {
      color: #ffffff !important;
    }

    body.dark-theme .footer-gratitude-pill {
      background: #d45915 !important;
      color: #ffffff !important;
      box-shadow: none !important;
    }

    /* ==========================================================================
       REGLAS ESTRICTAS PARA IMPRESIÓN (PRINT MEDIA)
       ========================================================================== */
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
      }

      .print-controls-bar {
        display: none !important;
      }

      .menu-pages-viewport {
        display: block !important;
        width: 11in !important;
      }

      .menu-page-wrapper {
        width: 11in !important;
        height: 8.5in !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }

      .menu-page {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
        height: 8.5in !important;
        width: 11in !important;
        transform: none !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body class="${bodyClass}">

  <!-- BARRA DE CONTROL EN PANTALLA (OCULTA AL IMPRIMIR) -->
  <header class="print-controls-bar">
    <button type="button" class="print-btn" onclick="window.print();">
      ${SVG_ICONS.printer}
      <span>Imprimir</span>
    </button>

    <button type="button" class="theme-toggle-btn" onclick="toggleTheme();" id="themeToggleBtn">
      <span id="themeIcon">${isDefaultDark ? SVG_ICONS.sun : SVG_ICONS.moon}</span>
      <span id="themeBtnText">${isDefaultDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
    </button>

    <button type="button" class="zoom-toggle-btn" onclick="toggleZoom();" id="zoomToggleBtn" title="Alternar Zoom">
      <span id="zoomIcon">${SVG_ICONS.zoomIn}</span>
      <span id="zoomBtnText">Zoom</span>
    </button>

    <a href="${isDefaultDark ? './menu_mi_barrunto_dark.pdf' : './menu_mi_barrunto.pdf'}" download="Carta_Menu_Mi_Barrunto_11x8.5.pdf" class="download-pdf-btn" title="Descargar archivo PDF directo (11x8.5)">
      ${SVG_ICONS.download}
      <span>Descargar PDF</span>
    </a>

    <label for="pageJump" style="font-size: 0.84rem; font-weight: 600;">Ir a página:</label>
    <select id="pageJump" class="nav-page-select" onchange="location.href = this.value;">
      <option value="#page-1">Pág 1 — Portada Principal</option>
      <option value="#page-2">Pág 2 — Índice General (Exclusivo)</option>
      <option value="#page-3">Pág 3 — Entradas, Desayunos &amp; Sandwiches</option>
      <option value="#page-4">Pág 4 — Sandwiches (Cont.) &amp; Sopas</option>
      <option value="#page-5">Pág 5 — Parrillas al Carbón &amp; Pollo Broaster</option>
      <option value="#page-6">Pág 6 — Comida Criolla: Saltados &amp; Chaufas</option>
      <option value="#page-7">Pág 7 — Pastas Criollas, Tacu Tacus &amp; Rondas</option>
      <option value="#page-8">Pág 8 — Cevichería Tradicional &amp; Mariscos</option>
      <option value="#page-9">Pág 9 — Guarniciones, Bebidas &amp; Postres</option>
      <option value="#page-10">Pág 10 — Contraportada &amp; Pedidos</option>
    </select>
    <span style="opacity: 0.5;">|</span>
    <span class="print-tip">
      ${SVG_ICONS.info}
      <span>Al imprimir: Formato <strong>Horizontal (Landscape)</strong> · Márgenes: <strong>Ninguno</strong> · Gráficos de fondo: <strong>Activado</strong></span>
    </span>
  </header>

  <!-- PÁGINAS DEL MENÚ IMPRIMIBLE (11 x 8.5 in) -->
  <main class="menu-pages-viewport" id="menuPagesViewport">
    <div class="menu-page-wrapper">${renderPage1()}</div>
    <div class="menu-page-wrapper">${renderPage2()}</div>
    <div class="menu-page-wrapper">${renderPage3()}</div>
    <div class="menu-page-wrapper">${renderPage4()}</div>
    <div class="menu-page-wrapper">${renderPage5()}</div>
    <div class="menu-page-wrapper">${renderPage6()}</div>
    <div class="menu-page-wrapper">${renderPage7()}</div>
    <div class="menu-page-wrapper">${renderPage8()}</div>
    <div class="menu-page-wrapper">${renderPage9()}</div>
    <div class="menu-page-wrapper">${renderPage10()}</div>
  </main>

  <script>
    let isZoomed = false;

    function calcScale() {
      if (window.innerWidth > 1080) {
        return 1;
      }
      if (isZoomed) {
        return 1;
      }
      const availableWidth = Math.max(280, window.innerWidth - 16);
      return Math.min(1, availableWidth / 1056);
    }

    function applyScale() {
      const scale = calcScale();
      document.documentElement.style.setProperty('--page-scale', scale);
      if (isZoomed && window.innerWidth <= 1080) {
        document.body.classList.add('zoom-mode-active');
      } else {
        document.body.classList.remove('zoom-mode-active');
      }
    }

    function toggleZoom() {
      isZoomed = !isZoomed;
      const zoomBtn = document.getElementById('zoomToggleBtn');
      const zoomText = document.getElementById('zoomBtnText');
      const zoomIcon = document.getElementById('zoomIcon');

      if (isZoomed) {
        if (zoomBtn) zoomBtn.classList.add('is-zoomed');
        if (zoomText) zoomText.textContent = 'Ajustar';
        if (zoomIcon) zoomIcon.innerHTML = ${JSON.stringify(SVG_ICONS.zoomOut)};
      } else {
        if (zoomBtn) zoomBtn.classList.remove('is-zoomed');
        if (zoomText) zoomText.textContent = 'Zoom';
        if (zoomIcon) zoomIcon.innerHTML = ${JSON.stringify(SVG_ICONS.zoomIn)};
      }
      applyScale();
    }

    window.addEventListener('resize', applyScale);
    window.addEventListener('orientationchange', () => {
      setTimeout(applyScale, 150);
    });
    document.addEventListener('DOMContentLoaded', applyScale);
    applyScale();

    function toggleTheme() {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      const btnText = document.getElementById('themeBtnText');
      if (btnText) {
        btnText.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
      }
      const iconSpan = document.getElementById('themeIcon');
      if (iconSpan) {
        iconSpan.innerHTML = isDark ? ${JSON.stringify(SVG_ICONS.sun)} : ${JSON.stringify(SVG_ICONS.moon)};
      }
      try {
        localStorage.setItem('mb-print-theme', isDark ? 'dark' : 'light');
      } catch (e) {}
    }

    // Auto-detect saved theme preference or query param
    (function() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasDarkParam = urlParams.has('dark');
        const savedTheme = localStorage.getItem('mb-print-theme');
        if (hasDarkParam || savedTheme === 'dark') {
          document.body.classList.add('dark-theme');
          const btnText = document.getElementById('themeBtnText');
          if (btnText) btnText.textContent = 'Modo Claro';
          const iconSpan = document.getElementById('themeIcon');
          if (iconSpan) iconSpan.innerHTML = ${JSON.stringify(SVG_ICONS.sun)};
        }

        if (urlParams.has('print') || urlParams.get('action') === 'print') {
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 400);
          });
        }
      } catch (e) {}
    })();
  </script>

</body>
</html>
`;
}

// 1. Generate Standard Menu (with 1-click toggle to black)
const lightHtml = generateCompleteHtml({ defaultDark: false });
fs.writeFileSync(path.join(__dirname, 'public', 'menu_imprimible.html'), lightHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'menu_imprimible.html'), lightHtml, 'utf8');

// 2. Generate Dedicated Dark Luxury Menu (Black Background by Default)
const darkHtml = generateCompleteHtml({ defaultDark: true });
fs.writeFileSync(path.join(__dirname, 'public', 'menu_imprimible_dark.html'), darkHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'menu_imprimible_dark.html'), darkHtml, 'utf8');

console.log('✅ Generated 10-page printable menus successfully!');
console.log('   - public/menu_imprimible.html (Standard with 1-click Dark Toggle)');
console.log('   - public/menu_imprimible_dark.html (Black Background Luxury Version)');
