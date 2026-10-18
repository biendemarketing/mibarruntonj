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
   * Agrega un plato al carrito o incrementa su cantidad
   * @param {import('./Dish').Dish} dish 
   * @param {number} quantity 
   * @param {string} note 
   * @returns {Cart} nuevo carrito inmutable
   */
  addItem(dish, quantity = 1, note = '') {
    const existingIndex = this.items.findIndex(i => i.dish.id === dish.id);
    let newItems = [...this.items];

    if (existingIndex > -1) {
      const existing = this.items[existingIndex];
      const updatedItem = new CartItem(
        existing.dish,
        existing.quantity + quantity,
        note || existing.note
      );
      newItems[existingIndex] = updatedItem;
    } else {
      newItems.push(new CartItem(dish, quantity, note));
    }

    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Elimina un plato del carrito
   * @param {number} dishId 
   * @returns {Cart}
   */
  removeItem(dishId) {
    const newItems = this.items.filter(i => i.dish.id !== dishId);
    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Actualiza la cantidad de un ítem
   * @param {number} dishId 
   * @param {number} qty 
   * @returns {Cart}
   */
  updateQuantity(dishId, qty) {
    const quantity = Number(qty);
    if (quantity <= 0) {
      return this.removeItem(dishId);
    }
    const newItems = this.items.map(item => {
      if (item.dish.id === dishId) {
        return new CartItem(item.dish, quantity, item.note);
      }
      return item;
    });
    return new Cart(newItems, this.customer.clone());
  }

  /**
   * Actualiza la nota especial de un ítem
   * @param {number} dishId 
   * @param {string} note 
   * @returns {Cart}
   */
  updateItemNote(dishId, note) {
    const newItems = this.items.map(item => {
      if (item.dish.id === dishId) {
        return new CartItem(item.dish, item.quantity, note);
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
   * Obtiene un ítem por id de plato
   * @param {number} dishId 
   * @returns {CartItem|undefined}
   */
  getItem(dishId) {
    return this.items.find(i => i.dish.id === dishId);
  }

  /**
   * Retorna cantidad del plato en el carrito (0 si no está)
   * @param {number} dishId 
   * @returns {number}
   */
  getItemQuantity(dishId) {
    const item = this.getItem(dishId);
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
   * Total a pagar en dólares
   * @returns {number}
   */
  getTotalPrice() {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  /**
   * Total formateado
   * @returns {string}
   */
  getFormattedTotal() {
    return `$${this.getTotalPrice().toFixed(2)}`;
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
    const clonedItems = this.items.map(i => new CartItem(i.dish, i.quantity, i.note));
    return new Cart(clonedItems, this.customer.clone());
  }
}
