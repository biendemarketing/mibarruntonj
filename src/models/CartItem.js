/**
 * Modelo de Dominio: CartItem (Ítem de la Lista / Pedido)
 * Arquitectura Orientada a Objetos
 */
export class CartItem {
  /**
   * @param {import('./Dish').Dish} dish 
   * @param {number} quantity 
   * @param {string} note 
   */
  constructor(dish, quantity = 1, note = '') {
    this.dish = dish;
    this.quantity = Math.max(1, Number(quantity) || 1);
    this.note = note || '';
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
   * Actualiza notas o preferencias (e.g. 'sin picante', 'término medio')
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
    return this.dish.price * this.quantity;
  }

  /**
   * Subtotal formateado
   * @returns {string}
   */
  getFormattedSubtotal() {
    return `$${this.getSubtotal().toFixed(2)}`;
  }
}
