/**
 * Modelo de Dominio: Dish (Plato)
 * Arquitectura Orientada a Objetos
 */
export class Dish {
  /**
   * @param {Object} data 
   * @param {number} data.id
   * @param {string} data.name
   * @param {string} data.nameEn
   * @param {number} data.price
   * @param {string} data.priceDisplay
   * @param {string} data.category
   * @param {string} data.subcategory
   * @param {string} data.glosa
   * @param {string|null} data.image
   * @param {boolean} data.hasPhoto
   */
  constructor({ id, name, nameEn, price, priceDisplay, category, subcategory, glosa, image = null, hasPhoto = false, categoryName = '', categoryNameEn = '' }) {
    this.id = id;
    this.name = name;
    this.nameEn = nameEn || glosa || '';
    this.price = Number(price) || 0;
    this.priceDisplay = priceDisplay || `$${this.price.toFixed(2)}`;
    this.category = category;
    this.subcategory = subcategory || '';
    this.glosa = glosa || '';
    this.image = image;
    this.hasPhoto = Boolean(image) || hasPhoto;
    this.categoryName = categoryName || '';
    this.categoryNameEn = categoryNameEn || '';
  }

  /**
   * Indica si el plato tiene fotografía real de la cocina
   * @returns {boolean}
   */
  hasImage() {
    return Boolean(this.image);
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
