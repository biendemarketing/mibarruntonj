import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { MobileNavBar } from './components/MobileNavBar';
import { MobileDrawer } from './components/MobileDrawer';
import { Footer } from './components/Footer';
import { menuRepository } from './services/MenuRepository';
import { Cart } from './models/Cart';
import { CartItem } from './models/CartItem';
import { Customer } from './models/Customer';
import { Search, ShoppingBag, LayoutGrid, Rows3, ChevronUp } from 'lucide-react';

export function App() {
  // Estado Orientado a Objetos: Carrito de Compras con persistencia en localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mb-cart-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        const items = (parsed.items || [])
          .map((i) => {
            const dish = menuRepository.getDishById(i.dishId);
            if (!dish) return null;
            return new CartItem(dish, i.quantity, i.note || '');
          })
          .filter(Boolean);
        const customer = new Customer(parsed.customer || {});
        return new Cart(items, customer);
      }
    } catch (e) {
      console.error('Error al restaurar carrito de localStorage:', e);
    }
    return new Cart();
  });

  // Guardar carrito en localStorage ante cualquier modificación
  useEffect(() => {
    try {
      const serializable = {
        items: cart.items.map((i) => ({
          dishId: i.dish.id,
          quantity: i.quantity,
          note: i.note
        })),
        customer: {
          name: cart.customer.name,
          orderType: cart.customer.orderType,
          table: cart.customer.table,
          address: cart.customer.address,
          phone: cart.customer.phone,
          paymentMethod: cart.customer.paymentMethod,
          generalNotes: cart.customer.generalNotes
        }
      };
      localStorage.setItem('mb-cart-state', JSON.stringify(serializable));
    } catch (e) {
      console.error('Error al guardar carrito en localStorage:', e);
    }
  }, [cart]);

  // Estados de navegación y filtros
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    onlyWithPhoto: false,
    priceSort: 'none',
    priceRange: 'all'
  });
  const [selectedDishForDetail, setSelectedDishForDetail] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('mb-noche') === '1';
    } catch {
      return false;
    }
  });

  const handleUpdateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      onlyWithPhoto: false,
      priceSort: 'none',
      priceRange: 'all'
    });
  };

  const hasActiveFilters = Boolean(
    filters.onlyWithPhoto ||
    filters.priceSort !== 'none' ||
    filters.priceRange !== 'all'
  );

  // Tema oscuro de alto contraste
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('mb-noche', isDarkMode ? '1' : '0');
    } catch {}
  }, [isDarkMode]);

  // Botón Volver Arriba
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modo de Fotos: 'curated' (fotos seleccionadas actuales) vs 'complete' (fotos de la carpeta platos para todos los platos)
  const [photoMode, setPhotoMode] = useState(() => {
    try {
      return localStorage.getItem('mb-photo-mode') || 'curated';
    } catch {
      return 'curated';
    }
  });

  const [toastMessage, setToastMessage] = useState('');

  const handleTogglePhotoMode = () => {
    setPhotoMode((prev) => {
      const next = prev === 'curated' ? 'complete' : 'curated';
      try {
        localStorage.setItem('mb-photo-mode', next);
      } catch {}
      setToastMessage(
        next === 'complete'
          ? 'Galería Completa: Mostrando fotos de la carpeta Platos'
          : 'Mostrando versión de fotos seleccionadas'
      );
      setTimeout(() => setToastMessage(''), 3200);
      return next;
    });
  };

  // Modelos de categoría desde el repositorio OOP
  const categories = useMemo(() => menuRepository.getAllCategories(), []);

  // Catálogo agrupado según categoría o búsqueda automática y filtros
  const groupedCatalog = useMemo(() => {
    return menuRepository.getCatalogGrouped({
      categoryId: searchQuery.trim() ? 'todos' : selectedCategory,
      query: searchQuery,
      onlyWithPhoto: filters.onlyWithPhoto,
      photoMode,
      priceSort: filters.priceSort,
      priceRange: filters.priceRange
    });
  }, [selectedCategory, searchQuery, filters, photoMode]);

  // Lista plana de platos visibles actualmente para la navegación del modal (flechas anterior / siguiente)
  const currentCatalogDishes = useMemo(() => {
    return groupedCatalog.flatMap((g) => g.dishes);
  }, [groupedCatalog]);

  const handlePrevDish = () => {
    if (!selectedDishForDetail || currentCatalogDishes.length === 0) return;
    const currentIndex = currentCatalogDishes.findIndex((d) => d.id === selectedDishForDetail.id);
    if (currentIndex <= 0) {
      setSelectedDishForDetail(currentCatalogDishes[currentCatalogDishes.length - 1]);
    } else {
      setSelectedDishForDetail(currentCatalogDishes[currentIndex - 1]);
    }
  };

  const handleNextDish = () => {
    if (!selectedDishForDetail || currentCatalogDishes.length === 0) return;
    const currentIndex = currentCatalogDishes.findIndex((d) => d.id === selectedDishForDetail.id);
    if (currentIndex === -1 || currentIndex >= currentCatalogDishes.length - 1) {
      setSelectedDishForDetail(currentCatalogDishes[0]);
    } else {
      setSelectedDishForDetail(currentCatalogDishes[currentIndex + 1]);
    }
  };

  // Handlers del Carrito (OOP)
  const handleAddToCart = (dish, quantity = 1, note = '') => {
    setCart((prevCart) => prevCart.addItem(dish, quantity, note));
  };

  const handleUpdateQuantity = (dishId, quantity) => {
    setCart((prevCart) => prevCart.updateQuantity(dishId, quantity));
  };

  const handleRemoveItem = (dishId) => {
    setCart((prevCart) => prevCart.removeItem(dishId));
  };

  const handleUpdateCustomerField = (field, value) => {
    setCart((prevCart) => prevCart.updateCustomerField(field, value));
  };

  const handleClearCart = () => {
    setCart((prevCart) => prevCart.clear());
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query.trim() && window.scrollY > 350) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modo de vista: 'compact' (compacta/horizontal con cards más pequeñas) o 'grid' (cuadrícula normal)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('mb-vista-v2');
      if (saved) return saved;
      return 'compact';
    } catch {
      return 'compact';
    }
  });

  const handleToggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'compact' ? 'grid' : 'compact';
      try {
        localStorage.setItem('mb-vista-v2', next);
        localStorage.setItem('mb-vista', next);
      } catch {}
      return next;
    });
  };

  const isAnyModalOpen = Boolean(selectedDishForDetail || isCartOpen || isMobileMenuOpen);

  return (
    <div className="app-container">
      {/* 1. Header con Logo Centrado en Móvil y Botones al lado del Buscador en Escritorio */}
      <Header
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        filters={filters}
        onUpdateFilter={handleUpdateFilter}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 2. Menú Hamburguesa Móvil */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
        selectedCategory={searchQuery.trim() ? 'todos' : selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Layout Principal: Menú de Categorías (Sidebar en Escritorio) + Catálogo */}
      <div className="menu-desktop-layout">
        <CategoryPills
          categories={categories}
          selectedCategory={searchQuery.trim() ? 'todos' : selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* 4. Catálogo de Platos */}
        <main className="menu-main-layout">
        {/* Banner de búsqueda activa en vivo con botón para limpiar */}
        {searchQuery.trim() && (
          <div className="search-results-banner">
            <span>
              Buscando: <strong style={{ color: 'var(--naranja)' }}>"{searchQuery}"</strong> ({groupedCatalog.reduce((acc, g) => acc + g.dishes.length, 0)} platos encontrados)
            </span>
            <button
              type="button"
              className="search-results-clear"
              onClick={() => handleSearchChange('')}
            >
              Ver toda la carta ✕
            </button>
          </div>
        )}

        {/* Banner de filtros activos cuando no hay búsqueda por texto */}
        {!searchQuery.trim() && hasActiveFilters && (
          <div className="search-results-banner active-filter-notice">
            <span>
              Filtros activos: {filters.onlyWithPhoto && <strong>[Con foto] </strong>}
              {filters.priceRange !== 'all' && (
                <strong>
                  [Precio: {filters.priceRange === 'under10' ? '< $10' : filters.priceRange === '10to20' ? '$10 - $20' : '> $20'}]
                </strong>
              )}{' '}
              {filters.priceSort !== 'none' && (
                <strong>
                  [Orden: {filters.priceSort === 'asc' ? 'Menor a mayor' : 'Mayor a menor'}]
                </strong>
              )} ({groupedCatalog.reduce((acc, g) => acc + g.dishes.length, 0)} platos)
            </span>
            <button
              type="button"
              className="search-results-clear"
              onClick={handleResetFilters}
            >
              Quitar filtros ✕
            </button>
          </div>
        )}

        {groupedCatalog.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            color: 'var(--text-light)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              No se encontraron platos para "{searchQuery}"
            </h2>
            <p style={{ marginTop: '0.35rem', fontSize: '0.88rem' }}>
              Intenta con otro término de búsqueda o selecciona otra sección.
            </p>
            {searchQuery && (
              <button
                type="button"
                className="search-results-clear"
                onClick={() => handleSearchChange('')}
                style={{ marginTop: '1rem' }}
              >
                Limpiar búsqueda y ver carta completa
              </button>
            )}
          </div>
        ) : (
          groupedCatalog.map(({ category, dishes }) => (
            <section
              key={category.id}
              id={category.id}
              style={{ marginBottom: '2.5rem' }}
            >
              {/* Encabezado de la Categoría */}
              <div className="category-section-header">
                <h2 className="category-title">
                  <span>{category.name}</span>
                  {category.nameEn && (
                    <span className="category-title-en">{category.nameEn}</span>
                  )}
                </h2>
              </div>

              {/* Grid de Productos (Soporta vista normal y compacta horizontal) */}
              <div className={`products-grid ${viewMode === 'compact' ? 'compact-grid' : ''}`}>
                {dishes.map((dish, dishIdx) => {
                  const itemInCart = cart.getItem(dish.id);
                  const qty = itemInCart ? itemInCart.quantity : 0;

                  return (
                    <ProductCard
                      key={dish.id}
                      dish={dish}
                      index={dishIdx}
                      photoMode={photoMode}
                      quantity={qty}
                      viewMode={viewMode}
                      onAddToCart={(d) => handleAddToCart(d, 1)}
                      onUpdateQuantity={(id, q) => handleUpdateQuantity(id, q)}
                      onOpenDetail={(d) => setSelectedDishForDetail(d)}
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
      </div>

      {/* 6. Footer con Redes Sociales Oficiales y Selector de Versión de Fotos */}
      <Footer photoMode={photoMode} onTogglePhotoMode={handleTogglePhotoMode} />

      {/* 7. Barra Móvil Inferior (Menú, Búsqueda, Mi Pedido y WhatsApp) */}
      <MobileNavBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onToggleSearch={() => {
          const input = document.querySelector('.mobile-search-input') || document.querySelector('.header-search-input');
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => input.focus(), 250);
          }
        }}
      />

      {/* 8. Modal de Detalle de Producto al Clic con Flechas para Navegar */}
      {selectedDishForDetail && (
        <ProductDetailModal
          dish={selectedDishForDetail}
          photoMode={photoMode}
          initialQuantity={cart.getItemQuantity(selectedDishForDetail.id) || 1}
          initialNote={cart.getItem(selectedDishForDetail.id)?.note || ''}
          onClose={() => setSelectedDishForDetail(null)}
          onSaveToCart={(dish, qty, note) => {
            if (cart.getItem(dish.id)) {
              handleUpdateQuantity(dish.id, qty);
              if (note) {
                setCart((prev) => prev.updateItemNote(dish.id, note));
              }
            } else {
              handleAddToCart(dish, qty, note);
            }
          }}
          onPrevDish={handlePrevDish}
          onNextDish={handleNextDish}
        />
      )}

      {/* 9. Carrito y Envío a WhatsApp */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUpdateCustomerField={handleUpdateCustomerField}
        onClearCart={handleClearCart}
        photoMode={photoMode}
      />

      {/* 10. Botón Flotante de Carrito en Escritorio */}
      {cart.getTotalCount() > 0 && !isAnyModalOpen && (
        <button
          type="button"
          className="desktop-floating-cart"
          onClick={() => setIsCartOpen(true)}
          aria-label="Ver pedido"
        >
          <div className="desktop-floating-cart-icon">
            <ShoppingBag size={20} />
            <span className="desktop-floating-cart-badge">{cart.getTotalCount()}</span>
          </div>
          <div className="desktop-floating-cart-info">
            <span className="desktop-floating-cart-label">Ver Pedido</span>
            <span className="desktop-floating-cart-price">{cart.getFormattedTotal()}</span>
          </div>
        </button>
      )}

      {/* 11. Botón Volver Arriba Flotante (Oculto cuando cualquier modal o drawer está abierto) */}
      {showScrollTop && !isAnyModalOpen && (
        <button
          type="button"
          className="scroll-to-top-btn"
          onClick={handleScrollToTop}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <ChevronUp size={22} strokeWidth={2.5} />
        </button>
      )}

      {/* Toast Flotante de Notificación al cambiar versión de fotos */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#111215',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          borderRadius: '9999px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          fontFamily: 'var(--font-primary)',
          fontWeight: 700,
          fontSize: '0.88rem',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: 'none !important'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
