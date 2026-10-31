import { Dish } from '../models/Dish';
import { Category } from '../models/Category';
import { CATEGORIES_DATA, INITIAL_DISHES_DATA, BATIDOS_VARIATIONS } from '../data/initialMenuData';
import { WhatsAppService } from './WhatsAppService';

/**
 * Repositorio de Menú y Catálogo
 * Arquitectura Orientada a Objetos con Hidratación Progresiva para LCP instantáneo
 */
export class MenuRepository {
  constructor() {
    this.categories = [];
    this.dishes = [];
    this.dishesMap = new Map();
    this.categoriesMap = new Map();
    this.fullCatalogLoaded = false;
    this.fullCatalogPromise = null;
    this.listeners = new Set();
    this.init();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try { fn(); } catch {}
    });
  }

  init() {
    this.categories = CATEGORIES_DATA.map(c => new Category(c));
    this.categories.forEach(cat => {
      this.categoriesMap.set(cat.id, cat);
    });

    this.populateDishes(INITIAL_DISHES_DATA, {});

    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '/';
      const hasSavedState = Boolean(
        localStorage.getItem('mb-cart-state') ||
        localStorage.getItem('mb-favoritos') ||
        localStorage.getItem('mb-last-order')
      );
      if (path !== '/' || hasSavedState) {
        this.loadFullCatalog();
      } else {
        const triggerLoad = () => {
          window.removeEventListener('scroll', triggerLoad);
          window.removeEventListener('touchstart', triggerLoad);
          window.removeEventListener('pointerdown', triggerLoad);
          window.removeEventListener('mousemove', triggerLoad);
          window.removeEventListener('keydown', triggerLoad);
          this.loadFullCatalog();
        };
        window.addEventListener('scroll', triggerLoad, { once: true, passive: true });
        window.addEventListener('touchstart', triggerLoad, { once: true, passive: true });
        window.addEventListener('pointerdown', triggerLoad, { once: true, passive: true });
        window.addEventListener('mousemove', triggerLoad, { once: true, passive: true });
        window.addEventListener('keydown', triggerLoad, { once: true, passive: true });
      }
    }
  }

  populateDishes(dishesArray, platosMapObj = {}) {
    this.categories.forEach(cat => {
      cat.dishes = [];
    });
    this.dishes = dishesArray.map(d => {
      const cat = this.categoriesMap.get(d.category);
      return new Dish({
        ...d,
        platosImage: d.platosImage || platosMapObj[d.id] || null,
        categoryName: cat ? cat.name : '',
        categoryNameEn: cat ? cat.nameEn : ''
      });
    });
    this.dishesMap.clear();
    this.dishes.forEach(dish => {
      this.dishesMap.set(dish.id, dish);
      const cat = this.categoriesMap.get(dish.category);
      if (cat) {
        cat.addDish(dish);
      }
    });
  }

  async loadFullCatalog() {
    if (this.fullCatalogLoaded) return;
    if (this.fullCatalogPromise) return this.fullCatalogPromise;

    this.fullCatalogPromise = (async () => {
      try {
        const [{ DISHES_DATA }, platosMapModule] = await Promise.all([
          import('../data/menuData'),
          import('../data/platosMap.json')
        ]);
        const platosMap = platosMapModule.default || platosMapModule || {};
        this.populateDishes(DISHES_DATA, platosMap);
        this.fullCatalogLoaded = true;
        this.notifyListeners();
        this.syncWithSupabase();
      } catch (e) {}
    })();

    return this.fullCatalogPromise;
  }

  async syncWithSupabase() {
    try {
      const { menuService } = await import('./supabase');
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
          if ((!existing.variations || existing.variations.length === 0) && existing.category === 'batidos' && Number(existing.id) >= 250) {
            existing.variations = BATIDOS_VARIATIONS;
          }
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
            categoryNameEn: cat ? cat.nameEn : '',
            variations: (remote.category_id === 'batidos' && Number(remote.id) >= 250) ? BATIDOS_VARIATIONS : []
          });
          this.dishes.push(newDish);
          this.dishesMap.set(numId, newDish);
          if (cat) cat.addDish(newDish);
        }
      });
      this.notifyListeners();
    } catch (e) {
      // Modo offline seguro
    }
  }

  getAllCategories() {
    return this.categories;
  }

  getCategoryById(id) {
    return this.categoriesMap.get(id);
  }

  getAllDishes() {
    return this.dishes;
  }

  getDishById(id) {
    if (!id && id !== 0) return undefined;
    const num = Number(id);
    if (!isNaN(num) && this.dishesMap.has(num)) {
      return this.dishesMap.get(num);
    }
    const strId = String(id).trim();
    const direct = this.dishes.find(d => String(d.id) === strId);
    if (direct) return direct;

    const cleanId = strId.toLowerCase().replace(/^[0-9]+-/, '');
    return this.dishes.find(d => {
      const slug = (d.name || '').toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return slug === cleanId || slug.includes(cleanId) || cleanId.includes(slug);
    });
  }

  getDishesByCategory(categoryId) {
    const cat = this.categoriesMap.get(categoryId);
    if (cat && cat.dishes && cat.dishes.length > 0) {
      return cat.dishes;
    }
    return this.dishes.filter(d => d.category === categoryId);
  }

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

export const menuRepository = new MenuRepository();
export const whatsAppService = new WhatsAppService('19736533749');
