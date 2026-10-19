import { Dish } from '../models/Dish';
import { Category } from '../models/Category';
import { CATEGORIES_DATA, DISHES_DATA } from '../data/menuData';
import platosMap from '../data/platosMap.json';
import { WhatsAppService } from './WhatsAppService';
import { menuService } from './supabase';

/**
 * Repositorio de Menú y Catálogo
 * Arquitectura Orientada a Objetos
 */
export class MenuRepository {
  constructor() {
    this.categories = [];
    this.dishes = [];
    this.dishesMap = new Map();
    this.categoriesMap = new Map();
    this.init();
  }

  /**
   * Inicializa e indexa los modelos de dominio
   */
  init() {
    // Instanciar categorías
    this.categories = CATEGORIES_DATA.map(c => new Category(c));
    this.categories.forEach(cat => {
      this.categoriesMap.set(cat.id, cat);
    });

    // Instanciar platos con metadatos de categoría y fotos completas de la carpeta platos
    this.dishes = DISHES_DATA.map(d => {
      const cat = this.categoriesMap.get(d.category);
      return new Dish({
        ...d,
        platosImage: d.platosImage || platosMap[d.id] || null,
        categoryName: cat ? cat.name : '',
        categoryNameEn: cat ? cat.nameEn : ''
      });
    });
    this.dishes.forEach(dish => {
      this.dishesMap.set(dish.id, dish);
      const cat = this.categoriesMap.get(dish.category);
      if (cat) {
        cat.addDish(dish);
      }
    });

    // Iniciar sincronización de fondo con Supabase
    if (typeof window !== 'undefined') {
      setTimeout(() => this.syncWithSupabase(), 100);
    }
  }

  /**
   * Sincroniza el catálogo en caliente con la base de datos de Supabase
   * Aprovecha el CDN de Storage y refleja cambios en vivo realizados desde el Admin Panel
   */
  async syncWithSupabase() {
    try {
      const remoteDishes = await menuService.getDishes();
      if (!remoteDishes || remoteDishes.length === 0) return;

      remoteDishes.forEach(remote => {
        const numId = Number(remote.id);
        const existing = this.dishesMap.get(numId) || this.dishesMap.get(String(remote.id));
        if (existing) {
          if (remote.name) existing.name = remote.name;
          if (remote.name_en) existing.nameEn = remote.name_en;
          if (remote.price !== undefined) existing.price = Number(remote.price);
          if (remote.priceDisplay) existing.priceDisplay = remote.priceDisplay;
          if (remote.platos_image) existing.platosImage = remote.platos_image;
          if (remote.image_url) existing.image = remote.image_url;
          if (Array.isArray(remote.images) && remote.images.length > 0) {
            existing.images = remote.images;
          }
          if (remote.is_available !== undefined) existing.isAvailable = remote.is_available;
          if (remote.is_active !== undefined) existing.isActive = remote.is_active;
        } else {
          const cat = this.categoriesMap.get(remote.category_id);
          const newDish = new Dish({
            id: remote.id,
            name: remote.name,
            nameEn: remote.name_en || '',
            price: remote.price,
            category: remote.category_id,
            platosImage: remote.platos_image,
            image: remote.image_url,
            images: remote.images,
            isAvailable: remote.is_available,
            isActive: remote.is_active,
            categoryName: cat ? cat.name : '',
            categoryNameEn: cat ? cat.nameEn : ''
          });
          this.dishes.push(newDish);
          this.dishesMap.set(numId, newDish);
          if (cat) cat.addDish(newDish);
        }
      });
    } catch (e) {
      // Modo offline seguro
    }
  }

  /**
   * Todas las categorías
   * @returns {Category[]}
   */
  getAllCategories() {
    return this.categories;
  }

  /**
   * Obtiene una categoría por su identificador
   * @param {string} id 
   * @returns {Category|undefined}
   */
  getCategoryById(id) {
    return this.categoriesMap.get(id);
  }

  /**
   * Todos los platos
   * @returns {Dish[]}
   */
  getAllDishes() {
    return this.dishes;
  }

  /**
   * Obtiene plato por ID
   * @param {number} id 
   * @returns {Dish|undefined}
   */
  getDishById(id) {
    return this.dishesMap.get(Number(id));
  }

  /**
   * Obtiene todos los platos pertenecientes a una categoría
   * @param {string} categoryId 
   * @returns {Dish[]}
   */
  getDishesByCategory(categoryId) {
    const cat = this.categoriesMap.get(categoryId);
    if (cat && cat.dishes && cat.dishes.length > 0) {
      return cat.dishes;
    }
    return this.dishes.filter(d => d.category === categoryId);
  }

  /**
   * Filtra platos por criterios de búsqueda y filtros
   * @param {Object} filters
   * @param {string} [filters.categoryId]
   * @param {string} [filters.query]
   * @param {boolean} [filters.onlyWithPhoto]
   * @param {'none'|'asc'|'desc'} [filters.priceSort]
   * @param {'all'|'under10'|'10to20'|'over20'} [filters.priceRange]
   * @returns {Dish[]}
   */
  searchDishes({
    categoryId = 'todos',
    query = '',
    onlyWithPhoto = false,
    photoMode = 'complete',
    priceSort = 'none',
    priceRange = 'all'
  } = {}) {
    let result = this.dishes.filter(dish => {
      if (categoryId && categoryId !== 'todos' && dish.category !== categoryId) {
        return false;
      }
      if (onlyWithPhoto && !dish.hasImage(photoMode)) {
        return false;
      }
      if (query && !dish.matchesQuery(query)) {
        return false;
      }
      if (priceRange === 'under10' && dish.price >= 10) {
        return false;
      }
      if (priceRange === '10to20' && (dish.price < 10 || dish.price > 20)) {
        return false;
      }
      if (priceRange === 'over20' && dish.price <= 20) {
        return false;
      }
      return true;
    });

    if (priceSort === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  /**
   * Agrupa los platos filtrados por categoría para renderizar la carta completa
   * @param {Object} filters 
   * @returns {Array<{ category: Category, dishes: Dish[] }>}
   */
  getCatalogGrouped(filters = {}) {
    const filteredDishes = this.searchDishes(filters);
    const groups = [];

    this.categories.forEach(cat => {
      let catDishes = filteredDishes.filter(d => d.category === cat.id);
      if (filters.priceSort === 'asc') {
        catDishes.sort((a, b) => a.price - b.price);
      } else if (filters.priceSort === 'desc') {
        catDishes.sort((a, b) => b.price - a.price);
      }
      if (catDishes.length > 0) {
        groups.push({
          category: cat,
          dishes: catDishes
        });
      }
    });

    return groups;
  }
}

// Singleton para toda la aplicación
export const menuRepository = new MenuRepository();
export const whatsAppService = new WhatsAppService('15551234567');
