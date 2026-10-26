/**
 * Modelo de Dominio: CartItem (Ítem de la Lista / Pedido)
 * Arquitectura Orientada a Objetos
 */
export class CartItem {
  /**
   * @param {import('./Dish').Dish} dish 
   * @param {number} quantity 
   * @param {string} note 
   * @param {Object|null} variation
   */
  constructor(dish, quantity = 1, note = '', variation = null) {
    this.dish = dish;
    this.quantity = Math.max(1, Number(quantity) || 1);
    this.note = note || '';
    this.variation = variation || null;
  }

  /**
   * Clave única del ítem en el carrito combinando plato y su variación si existe
   * @returns {string}
   */
  getCartKey() {
    if (this.variation && this.variation.id) {
      return `${this.dish.id}__var_${this.variation.id}`;
    }
    return String(this.dish.id);
  }

  /**
   * Nombre completo para impresión y cocina incluyendo la base elegida
   * @returns {string}
   */
  getDisplayName() {
    if (this.variation && this.variation.name) {
      return `${this.dish.name} (${this.variation.name})`;
    }
    return this.dish.name;
  }

  /**
   * Nombre en inglés incluyendo la variación
   * @returns {string}
   */
  getDisplayNameEn() {
    const baseEn = this.dish.nameEn || this.dish.name;
    if (this.variation && (this.variation.nameEn || this.variation.name)) {
      const varEn = this.variation.nameEn || this.variation.name;
      return `${baseEn} (${varEn})`;
    }
    return baseEn;
  }

  /**
   * Obtiene el precio unitario considerando la variación seleccionada
   * @returns {number}
   */
  getUnitPrice() {
    if (this.variation && this.variation.price !== undefined) {
      return Number(this.variation.price);
    }
    return Number(this.dish.price) || 0;
  }

  /**
   * Incrementa la cantidad pedida
   * @param {number} delta 
   * @returns {number}
   */
  increment(delta = 1) {
    this.quantity += delta;
    return this.quantity;
  }

  /**
   * Disminuye la cantidad pedida (mínimo 0)
   * @param {number} delta 
   * @returns {number}
   */
  decrement(delta = 1) {
    this.quantity = Math.max(0, this.quantity - delta);
    return this.quantity;
  }

  /**
   * Actualiza notas o preferencias (e.g. 'sin azúcar', 'bien frío')
   * @param {string} note 
   */
  setNote(note) {
    this.note = note || '';
  }

  /**
   * Subtotal del ítem
   * @returns {number}
   */
  getSubtotal() {
    return this.getUnitPrice() * this.quantity;
  }

  /**
   * Subtotal formateado
   * @returns {string}
   */
  getFormattedSubtotal() {
    return `$${this.getSubtotal().toFixed(2)}`;
  }
}
