/**
 * Modelo de Dominio: Category (Sección de la Carta)
 * Arquitectura Orientada a Objetos
 */
export class Category {
  /**
   * @param {Object} param0 
   * @param {string} param0.id
   * @param {string} param0.name
   * @param {string} param0.nameEn
   * @param {string} param0.icon
   */
  constructor({ id, name, nameEn, icon }) {
    this.id = id;
    this.name = name;
    this.nameEn = nameEn;
    this.icon = icon || 'UtensilsCrossed';
    this.dishes = [];
  }

  /**
   * Agrega un plato a la categoría
   * @param {import('./Dish').Dish} dish 
   */
  addDish(dish) {
    this.dishes.push(dish);
  }

  /**
   * Obtiene todos los platos de la categoría
   * @returns {import('./Dish').Dish[]}
   */
  getDishes() {
    return this.dishes;
  }

  /**
   * Cantidad de platos en esta sección
   * @returns {number}
   */
  getDishesCount() {
    return this.dishes.length;
  }

  /**
   * Filtra platos con fotografía
   * @returns {import('./Dish').Dish[]}
   */
  getDishesWithPhotos() {
    return this.dishes.filter(d => d.hasImage());
  }

  /**
   * Obtiene subcategorías únicas presentes
   * @returns {string[]}
   */
  getSubcategories() {
    const set = new Set();
    this.dishes.forEach(d => {
      if (d.subcategory) set.add(d.subcategory);
    });
    return Array.from(set);
  }
}
