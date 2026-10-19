export const SUPABASE_CDN_BASE = 'https://scvlxcgmhbwjmvycrttf.supabase.co/storage/v1/object/public/dishes';

/**
 * Modelo de Dominio: Dish (Plato)
 * Arquitectura Orientada a Objetos
 */
export class Dish {
  /**
   * @param {Object} data 
   * @param {number|string} data.id
   * @param {string} data.name
   * @param {string} data.nameEn
   * @param {number} data.price
   * @param {string} data.priceDisplay
   * @param {string} data.category
   * @param {string} data.subcategory
   * @param {string} data.glosa
   * @param {string|null} data.image
   * @param {string|null} data.platosImage
   * @param {Array<string>} [data.images]
   * @param {boolean} [data.isAvailable]
   * @param {boolean} [data.isActive]
   * @param {boolean} data.hasPhoto
   * @param {string} [data.categoryName]
   * @param {string} [data.categoryNameEn]
   */
  constructor({
    id,
    name,
    nameEn,
    price,
    priceDisplay,
    category,
    subcategory,
    glosa,
    image = null,
    platosImage = null,
    images = [],
    isAvailable = true,
    isActive = true,
    hasPhoto = false,
    categoryName = '',
    categoryNameEn = ''
  }) {
    this.id = id;
    this.name = name;
    this.nameEn = nameEn || glosa || '';
    this.price = Number(price) || 0;
    this.priceDisplay = priceDisplay || `$${this.price.toFixed(2)}`;
    this.category = category;
    this.subcategory = subcategory || '';
    this.glosa = glosa || '';
    this.image = image;
    this.platosImage = platosImage || null;
    this.images = Array.isArray(images) && images.length > 0 ? images : [];
    this.isAvailable = isAvailable !== false;
    this.isActive = isActive !== false;
    this.hasPhoto = Boolean(this.getImage('complete')) || Boolean(image) || hasPhoto || (this.images.length > 0);
    this.categoryName = categoryName || '';
    this.categoryNameEn = categoryNameEn || '';
  }

  /**
   * Indica si el plato tiene fotografía según el modo activo ('complete' v2 o 'curated')
   * @param {'curated'|'complete'} photoMode
   * @returns {boolean}
   */
  hasImage(photoMode = 'complete') {
    if (photoMode === 'curated') {
      return Boolean(this.image || (this.images.length > 0));
    }
    return Boolean(this.platosImage || this.image || (this.images.length > 0));
  }

  /**
   * Obtiene la ruta base de la fotografía según el modo activo ('complete' v2 o 'curated')
   * @param {'curated'|'complete'} photoMode
   * @returns {string|null}
   */
  getImage(photoMode = 'complete') {
    if (this.images.length > 0 && this.images[0]) {
      return this.images[0];
    }
    if (photoMode === 'curated') {
      return this.image || this.platosImage;
    }
    return this.platosImage || this.image;
  }

  /**
   * Obtiene la URL pública del plato servida desde el CDN de Supabase Storage para máxima velocidad y caché global.
   * @param {'curated'|'complete'} photoMode
   * @returns {string|null}
   */
  getResolvedImage(photoMode = 'complete') {
    const raw = this.getImage(photoMode);
    if (!raw) return null;

    // Si ya es una URL completa (HTTP o HTTPS, ej: Supabase Storage CDN)
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    const clean = raw.replace(/^(\.\/|\/)+/, '');

    // Si es una ruta que pertenece a platos_webp/
    if (clean.startsWith('platos_webp/')) {
      return `${SUPABASE_CDN_BASE}/${clean}`;
    }

    // Si es un archivo con nombre webp, mapear al CDN de Supabase Storage
    const filename = clean.split('/').pop();
    if (filename && filename.toLowerCase().endsWith('.webp')) {
      return `${SUPABASE_CDN_BASE}/platos_webp/${filename}`;
    }

    // Si es un asset en la carpeta assets/
    if (clean.startsWith('assets/')) {
      return `${SUPABASE_CDN_BASE}/${clean}`;
    }

    // Fallback relativo para otros recursos
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    return `${base.endsWith('/') ? base : base + '/'}${clean}`;
  }

  /**
   * Obtiene la ruta local relativa de respaldo en caso de desconexión o fallo del CDN
   * @param {'curated'|'complete'} photoMode
   * @returns {string|null}
   */
  getLocalFallbackImage(photoMode = 'complete') {
    const raw = this.getImage(photoMode);
    if (!raw) return null;

    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    const baseClean = base.endsWith('/') ? base : base + '/';

    // Si es una URL de Supabase CDN, extraer la subruta dentro del bucket
    if (raw.includes('/storage/v1/object/public/dishes/')) {
      const storagePath = raw.split('/storage/v1/object/public/dishes/')[1];
      return `${baseClean}${storagePath}`;
    }

    const clean = raw.replace(/^(\.\/|\/)+/, '');
    return `${baseClean}${clean}`;
  }

  /**
   * Obtiene la lista completa de URLs de la galería del plato
   * @returns {string[]}
   */
  getGalleryImages() {
    const primary = this.getResolvedImage();
    const result = primary ? [primary] : [];

    if (Array.isArray(this.images)) {
      this.images.forEach(img => {
        if (!img) return;
        let resolved = img;
        if (!img.startsWith('http://') && !img.startsWith('https://')) {
          const clean = img.replace(/^(\.\/|\/)+/, '');
          resolved = `${SUPABASE_CDN_BASE}/${clean}`;
        }
        if (!result.includes(resolved)) {
          result.push(resolved);
        }
      });
    }

    return result;
  }

  /**
   * Retorna el precio formateado en dólares
   * @returns {string}
   */
  getFormattedPrice() {
    if (this.priceDisplay && this.priceDisplay.includes('·')) {
      return this.priceDisplay;
    }
    return `$${this.price.toFixed(2)}`;
  }

  /**
   * Búsqueda inteligente automática por nombre, inglés, descripción, categoría y variantes (plurales / ortografía)
   * @param {string} query 
   * @returns {boolean}
   */
  matchesQuery(query) {
    if (!query) return true;
    const normalize = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
    const qNorm = normalize(query);
    if (!qNorm) return true;

    // Generar variantes y lemas (ej. cebiche <-> ceviche, plurales)
    const getVariants = word => {
      const variants = new Set([word]);
      if (word.includes('cebich')) variants.add(word.replace(/cebich/g, 'cevich'));
      if (word.includes('cevich')) variants.add(word.replace(/cevich/g, 'cebich'));
      if (word.endsWith('es') && word.length > 3) variants.add(word.slice(0, -2));
      if (word.endsWith('s') && word.length > 3) variants.add(word.slice(0, -1));
      return Array.from(variants);
    };

    const corpus = normalize(
      [
        this.name,
        this.nameEn,
        this.glosa,
        this.category,
        this.subcategory,
        this.categoryName,
        this.categoryNameEn
      ].join(' ')
    );

    const tokens = qNorm.split(/\s+/).filter(Boolean);
    return tokens.every(token => {
      const variants = getVariants(token);
      return variants.some(v => corpus.includes(v));
    });
  }

  /**
   * Verifica pertenencia a categoría
   * @param {string} categoryId 
   * @returns {boolean}
   */
  belongsToCategory(categoryId) {
    if (!categoryId || categoryId === 'todos') return true;
    return this.category === categoryId;
  }
}
