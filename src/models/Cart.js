import { CartItem } from './CartItem';
import { Customer } from './Customer';

/**
 * Modelo de Dominio: Cart (Lista / Carrito de Compras)
 * Arquitectura Orientada a Objetos
 */
export class Cart {
  /**
   * @param {CartItem[]} items 
   * @param {Customer} customer 
   */
  constructor(items = [], customer = new Customer()) {
    this.items = items;
    this.customer = customer instanceof Customer ? customer : new Customer(customer);
  }

  /**
   * Agrega un plato al carrito o incrementa su cantidad considerando variaciones
   * @param {import('./Dish').Dish} dish 
   * @param {number} quantity 
   * @param {string} note 
   * @param {Object|null} variation
   * @returns {Cart} nuevo carrito inmutable
   */
  addItem(dish, quantity = 1, note = '', variation = null) {
    const targetKey = variation && variation.id
      ? `${dish.id}__var_${variation.id}`
      : String(dish.id);

    const existingIndex = this.items.findIndex(i => i.getCartKey() === targetKey);
    let newItems = [...this.items];

    if (existingIndex > -1) {
      const existing = this.items[existingIndex];
      const updatedItem = new CartItem(
        existing.dish,
        existing.quantity + quantity,
        note || existing.note,
        existing.variation || variation
      );
      newItems[existingIndex] = updatedItem;
    } else {
      newItems.push(new CartItem(dish, quantity, note, variation));
    }

    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Elimina un ítem del carrito por id de plato o clave de variación
   * @param {string|number} identifier 
   * @returns {Cart}
   */
  removeItem(identifier) {
    const strId = String(identifier);
    const newItems = this.items.filter(i => i.getCartKey() !== strId && String(i.dish.id) !== strId);
    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Actualiza la cantidad de un ítem
   * @param {string|number} identifier 
   * @param {number} qty 
   * @returns {Cart}
   */
  updateQuantity(identifier, qty) {
    const quantity = Number(qty);
    const strId = String(identifier);

    if (quantity <= 0) {
      return this.removeItem(identifier);
    }

    const newItems = this.items.map(item => {
      if (item.getCartKey() === strId || String(item.dish.id) === strId) {
        return new CartItem(item.dish, quantity, item.note, item.variation);
      }
      return item;
    });

    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Actualiza la nota especial de un ítem
   * @param {string|number} identifier 
   * @param {string} note 
   * @returns {Cart}
   */
  updateItemNote(identifier, note) {
    const strId = String(identifier);
    const newItems = this.items.map(item => {
      if (item.getCartKey() === strId || String(item.dish.id) === strId) {
        return new CartItem(item.dish, item.quantity, note, item.variation);
      }
      return item;
    });
    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Actualiza datos del cliente
   * @param {string} field 
   * @param {any} value 
   * @returns {Cart}
   */
  updateCustomerField(field, value) {
    const newCustomer = this.customer.clone();
    newCustomer[field] = value;
    return new Cart([...this.items], newCustomer);
  }

  /**
   * Vacía el carrito
   * @returns {Cart}
   */
  clear() {
    return new Cart([], this.customer.clone());
  }

  /**
   * Obtiene la lista completa de ítems
   * @returns {CartItem[]}
   */
  getItems() {
    return this.items || [];
  }

  /**
   * Obtiene un ítem por id de plato o clave completa
   * @param {string|number} identifier 
   * @param {string|null} [variationId]
   * @returns {CartItem|undefined}
   */
  getItem(identifier, variationId = null) {
    if (variationId) {
      return this.items.find(i => String(i.dish.id) === String(identifier) && i.variation?.id === variationId);
    }
    const strId = String(identifier);
    return this.items.find(i => i.getCartKey() === strId || String(i.dish.id) === strId);
  }

  /**
   * Retorna cantidad del plato en el carrito (0 si no está)
   * @param {string|number} identifier 
   * @param {string|null} [variationId]
   * @returns {number}
   */
  getItemQuantity(identifier, variationId = null) {
    const item = this.getItem(identifier, variationId);
    return item ? item.quantity : 0;
  }

  /**
   * Total de unidades de productos en el carrito
   * @returns {number}
   */
  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Total a pagar en dólares sumando cada ítem con su variación respectiva
   * @returns {number}
   */
  getTotalPrice() {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  /**
   * Alias de subtotal
   * @returns {number}
   */
  getSubtotal() {
    return this.getTotalPrice();
  }

  /**
   * Propina (0 por defecto a menos que se aplique)
   * @returns {number}
   */
  getTipAmount() {
    return 0;
  }

  /**
   * Sales Tax New Jersey (6.625%)
   * @returns {number}
   */
  getTaxAmount() {
    return Number((this.getSubtotal() * 0.06625).toFixed(2));
  }

  /**
   * Recargo por procesamiento con tarjeta (4%)
   * @param {boolean} isCard 
   * @returns {number}
   */
  getCardFeeAmount(isCard = false) {
    return isCard ? Number((this.getSubtotal() * 0.04).toFixed(2)) : 0;
  }

  /**
   * Gratuity / Propina (16%)
   * @param {boolean} enabled 
   * @returns {number}
   */
  getGratuityAmount(enabled = false) {
    return enabled ? Number((this.getSubtotal() * 0.16).toFixed(2)) : 0;
  }

  /**
   * Total general calculado con desglose al final
   * @param {Object} options
   * @param {boolean} [options.isCard]
   * @param {boolean} [options.gratuityEnabled]
   * @returns {number}
   */
  getCalculatedTotal({ isCard = false, gratuityEnabled = false } = {}) {
    return Number((
      this.getSubtotal() + 
      this.getTaxAmount() + 
      this.getCardFeeAmount(isCard) + 
      this.getGratuityAmount(gratuityEnabled)
    ).toFixed(2));
  }

  /**
   * Total formateado
   * @param {Object} options
   * @returns {string}
   */
  getFormattedTotal(options = {}) {
    return `$${this.getCalculatedTotal(options).toFixed(2)}`;
  }

  /**
   * Indica si la lista está vacía
   * @returns {boolean}
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Clona la instancia
   * @returns {Cart}
   */
  clone() {
    const clonedItems = this.items.map(i => new CartItem(i.dish, i.quantity, i.note, i.variation));
    return new Cart(clonedItems, this.customer.clone());
  }
}
