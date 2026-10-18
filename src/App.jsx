import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { ProductCard } from './components/ProductCard';
import { MobileNavBar } from './components/MobileNavBar';
import { Footer } from './components/Footer';

// Carga diferida (Lazy Loading y Code-Splitting) para vistas y modales pesados
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const CartDrawer = lazy(() =>
  import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer }))
);
const MobileDrawer = lazy(() =>
  import('./components/MobileDrawer').then((m) => ({ default: m.MobileDrawer }))
);
import { menuRepository } from './services/MenuRepository';
import { Cart } from './models/Cart';
import { CartItem } from './models/CartItem';
import { Customer } from './models/Customer';
import { Search, ShoppingCart, LayoutGrid, Rows3, ChevronUp, ChevronLeft, RotateCcw, X, Heart, Trash2, CheckSquare, Square, CheckCircle2, Plus } from 'lucide-react';
import { TvMenuModal } from './components/TvMenuModal';
import { triggerHaptic } from './utils/haptics';
import { triggerFlyToCart } from './utils/flyToCart';
import { useAlertConfirm } from './context/AlertConfirmContext';

export function App() {
  const { showAlert, showConfirm } = useAlertConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const isDishDetailPage = location.pathname.startsWith('/plato/');
  const categories = useMemo(() => menuRepository.getAllCategories(), []);
  const allDishes = useMemo(() => menuRepository.getAllDishes(), []);
  const [isTvModeOpen, setIsTvModeOpen] = useState(false);

  // Historial de último pedido (One-Tap Reorder)
  const [lastOrder, setLastOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('mb-last-order');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [dismissedLastOrder, setDismissedLastOrder] = useState(false);

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

  // Lista de Favoritos (Persistencia en localStorage)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('mb-favoritos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFavIds, setSelectedFavIds] = useState([]);

  // Limpiar seleccionados que ya no existan en favoritos
  useEffect(() => {
    setSelectedFavIds((prev) => prev.filter((id) => favorites.includes(id)));
  }, [favorites]);

  const handleClearAllFavorites = async () => {
    if (favorites.length === 0) return;
    triggerHaptic(20);
    const confirmed = await showConfirm({
      title: '¿Vaciar todos tus favoritos?',
      message: 'Esta acción quitará todos los platos que tienes guardados en tu lista de favoritos.',
      confirmText: 'Sí, vaciar',
      cancelText: 'Cancelar',
      type: 'danger',
      confirmButtonDanger: true,
    });
    if (!confirmed) return;

    setFavorites([]);
    setSelectedFavIds([]);
    setToastMessage('Se vació tu lista de favoritos');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleToggleSelectAllFavs = () => {
    triggerHaptic(10);
    if (selectedFavIds.length === favorites.length) {
      setSelectedFavIds([]);
    } else {
      setSelectedFavIds([...favorites]);
    }
  };

  const handleToggleSelectFavDish = (dishId) => {
    triggerHaptic(8);
    setSelectedFavIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const handleAddSelectedFavsToCart = () => {
    if (selectedFavIds.length === 0) return;
    triggerHaptic(25);
    selectedFavIds.forEach((id) => {
      const dish = menuRepository.getDishById(id);
      if (dish) {
        setCart((prev) => prev.addItem(dish, 1));
      }
    });
    setToastMessage(`Se agregaron ${selectedFavIds.length} platos a tu pedido`);
    setSelectedFavIds([]);
    setTimeout(() => setToastMessage(''), 3200);
  };

  const handleRemoveSelectedFavs = async () => {
    if (selectedFavIds.length === 0) return;
    const count = selectedFavIds.length;
    if (count > 1) {
      const confirmed = await showConfirm({
        title: `¿Quitar ${count} platos de favoritos?`,
        message: 'Los platos seleccionados dejarán de figurar en tu lista de favoritos.',
        confirmText: 'Sí, quitar',
        cancelText: 'Cancelar',
        type: 'danger',
        confirmButtonDanger: true,
      });
      if (!confirmed) return;
    }
    triggerHaptic(15);
    setFavorites((prev) => prev.filter((id) => !selectedFavIds.includes(id)));
    setSelectedFavIds([]);
    setToastMessage(`Se quitaron ${count} ${count === 1 ? 'plato' : 'platos'} de tus favoritos`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem('mb-favoritos', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error guardando favoritos en localStorage:', e);
    }
  }, [favorites]);

  const handleToggleFavorite = (dishId) => {
    triggerHaptic(14);
    setFavorites((prev) => {
      const exists = prev.includes(dishId);
      return exists ? prev.filter((id) => id !== dishId) : [...prev, dishId];
    });
  };

  const handleToggleFavoritesFilter = () => {
    triggerHaptic(14);
    setShowFavoritesOnly((prev) => !prev);
    if (searchQuery) setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [selectedDishForDetail, setSelectedDishForDetail] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/plato/')) {
      const dishId = window.location.pathname.replace('/plato/', '').split('/')[0].split('?')[0].trim();
      return menuRepository.getDishById(dishId) || null;
    }
    return null;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('mb-noche') === '1';
    } catch {
      return false;
    }
  });

  const [activeScrollCategory, setActiveScrollCategory] = useState(null);

  // ScrollSpy para destacar la categoría activa en el sidebar al hacer scroll en Toda la Carta
  useEffect(() => {
    if (selectedCategory !== 'todos' || showFavoritesOnly || isDishDetailPage || searchQuery.trim()) {
      setActiveScrollCategory(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveScrollCategory(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -65% 0px',
        threshold: 0
      }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [selectedCategory, showFavoritesOnly, isDishDetailPage, searchQuery, categories]);

  // Sincronización de rutas del navegador (Browser Routing con URLs reales)
  useEffect(() => {
    const path = location.pathname;

    // 1. Ruta /plato/:id
    if (path.startsWith('/plato/')) {
      const dishId = path.replace('/plato/', '').trim();
      const foundDish = menuRepository.getDishById(dishId);
      if (foundDish) {
        setSelectedDishForDetail(foundDish);
        setIsCartOpen(false);
      }
    } else {
      setSelectedDishForDetail(null);
    }

    // 2. Ruta /pedido o /carrito
    if (path === '/pedido' || path === '/carrito') {
      setIsCartOpen(true);
      setSelectedDishForDetail(null);
    } else if (!path.startsWith('/plato/')) {
      setIsCartOpen(false);
    }

    // 3. Ruta /categoria/:slug
    if (path.startsWith('/categoria/')) {
      const catSlug = path.replace('/categoria/', '').trim();
      if (catSlug) {
        setSelectedCategory(catSlug);
      }
    } else if (path === '/' && !searchQuery.trim()) {
      if (selectedCategory !== 'todos') {
        setSelectedCategory('todos');
      }
    }
  }, [location.pathname]);

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

  // Catálogo agrupado según categoría o búsqueda automática y filtros (soporta filtro Mis Favoritos)
  const groupedCatalog = useMemo(() => {
    const rawCatalog = menuRepository.getCatalogGrouped({
      categoryId: searchQuery.trim() ? 'todos' : selectedCategory,
      query: searchQuery,
      onlyWithPhoto: filters.onlyWithPhoto,
      photoMode,
      priceSort: filters.priceSort,
      priceRange: filters.priceRange
    });

    if (showFavoritesOnly && !searchQuery.trim()) {
      return rawCatalog
        .map((group) => ({
          ...group,
          dishes: group.dishes.filter((d) => favorites.includes(d.id))
        }))
        .filter((group) => group.dishes.length > 0);
    }

    return rawCatalog;
  }, [selectedCategory, searchQuery, filters, photoMode, showFavoritesOnly, favorites]);

  // Lista plana de platos visibles actualmente para la navegación del modal (flechas anterior / siguiente)
  const currentCatalogDishes = useMemo(() => {
    return groupedCatalog.flatMap((g) => g.dishes);
  }, [groupedCatalog]);

  const handleOpenDishDetail = (dish) => {
    triggerHaptic(12);
    setSelectedDishForDetail(dish);
    navigate(`/plato/${dish.id}`);
  };

  const handleCloseDishDetail = () => {
    setSelectedDishForDetail(null);
    if (location.pathname.startsWith('/plato/')) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(selectedCategory === 'todos' ? '/' : `/categoria/${selectedCategory}`);
      }
    }
  };

  const handleOpenCart = () => {
    triggerHaptic(14);
    setIsCartOpen(true);
    navigate('/pedido');
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    if (location.pathname === '/pedido' || location.pathname === '/carrito') {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(selectedCategory === 'todos' ? '/' : `/categoria/${selectedCategory}`);
      }
    }
  };

  const handlePrevDish = () => {
    if (!selectedDishForDetail || currentCatalogDishes.length === 0) return;
    triggerHaptic(10);
    const currentIndex = currentCatalogDishes.findIndex((d) => d.id === selectedDishForDetail.id);
    const prev = currentIndex <= 0
      ? currentCatalogDishes[currentCatalogDishes.length - 1]
      : currentCatalogDishes[currentIndex - 1];
    setSelectedDishForDetail(prev);
    navigate(`/plato/${prev.id}`, { replace: true });
  };

  const handleNextDish = () => {
    if (!selectedDishForDetail || currentCatalogDishes.length === 0) return;
    triggerHaptic(10);
    const currentIndex = currentCatalogDishes.findIndex((d) => d.id === selectedDishForDetail.id);
    const next = (currentIndex === -1 || currentIndex >= currentCatalogDishes.length - 1)
      ? currentCatalogDishes[0]
      : currentCatalogDishes[currentIndex + 1];
    setSelectedDishForDetail(next);
    navigate(`/plato/${next.id}`, { replace: true });
  };

  // Handlers del Carrito (OOP) con animación Fly-To-Cart
  const handleAddToCart = (dish, quantity = 1, note = '', event = null) => {
    triggerHaptic(15);
    if (event) {
      triggerFlyToCart(event);
    }
    setCart((prevCart) => prevCart.addItem(dish, quantity, note));
  };

  const handleUpdateQuantity = (dishId, quantity) => {
    triggerHaptic(10);
    setCart((prevCart) => prevCart.updateQuantity(dishId, quantity));
  };

  const handleRemoveItem = (dishId) => {
    triggerHaptic(12);
    setCart((prevCart) => prevCart.removeItem(dishId));
  };

  const handleUpdateCustomerField = (field, value) => {
    setCart((prevCart) => prevCart.updateCustomerField(field, value));
  };

  const handleClearCart = async () => {
    if (cart.isEmpty()) return;
    const confirmed = await showConfirm({
      title: '¿Vaciar tu pedido?',
      message: 'Se eliminarán todos los platos agregados a tu carrito actual.',
      confirmText: 'Sí, vaciar pedido',
      cancelText: 'Conservar',
      type: 'danger',
      confirmButtonDanger: true,
    });
    if (!confirmed) return;
    triggerHaptic(15);
    setCart((prevCart) => prevCart.clear());
    setToastMessage('Se vació tu pedido');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleReorderLast = () => {
    if (!lastOrder || !lastOrder.items) return;
    triggerHaptic(20);
    const newItems = lastOrder.items
      .map((i) => {
        const dish = menuRepository.getDishById(i.dishId);
        if (!dish) return null;
        return new CartItem(dish, i.quantity, i.note || '');
      })
      .filter(Boolean);

    const newCustomer = new Customer(lastOrder.customer || {});
    setCart(new Cart(newItems, newCustomer));
    handleOpenCart();
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (query.trim() && window.scrollY > 350) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (catId) => {
    triggerHaptic(10);
    setSelectedCategory(catId);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (catId === 'todos') {
      navigate('/');
    } else {
      navigate(`/categoria/${catId}`);
    }
  };

  // Modo de vista: 'grid' (3 cols estándar), 'grid4' (4 cols cuadradas) o 'compact' (filas horizontales)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('mb-vista-v2');
      if (saved) return saved;
      return 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleToggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'grid' ? 'grid4' : prev === 'grid4' ? 'compact' : 'grid';
      try {
        localStorage.setItem('mb-vista-v2', next);
        localStorage.setItem('mb-vista', next);
      } catch {}
      return next;
    });
  };

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('mb-vista-v2', mode);
      localStorage.setItem('mb-vista', mode);
    } catch {}
  };

  const isAnyModalOpen = Boolean(isCartOpen || isMobileMenuOpen || isTvModeOpen);

  return (
    <div className="app-container">
      {/* 1. Header con Logo Centrado en Móvil y Botones al lado del Buscador en Escritorio (Oculto en vista detalle y en favoritos) */}
      {!isDishDetailPage && !showFavoritesOnly && (
        <Header
          cart={cart}
          onOpenCart={handleOpenCart}
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
          favoritesCount={favorites.length}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={handleToggleFavoritesFilter}
          allDishes={allDishes}
          onOpenDetail={handleOpenDishDetail}
          photoMode={photoMode}
        />
      )}

      {/* 1.1 Header Dedicado y Limpio para la Página de Favoritos (Sin video, sin banner masivo) */}
      {showFavoritesOnly && !isDishDetailPage && (
        <header className="favorites-standalone-header">
          <div className="favorites-standalone-inner">
            <div className="favorites-standalone-left">
              <button
                type="button"
                className="favorites-standalone-back-btn"
                onClick={() => {
                  triggerHaptic(12);
                  setShowFavoritesOnly(false);
                }}
                aria-label="Volver a toda la carta"
                title="Volver a la carta"
              >
                <ChevronLeft size={22} />
              </button>
            </div>

            <div className="favorites-standalone-title-wrap">
              <Heart size={22} fill="var(--rojo)" color="var(--rojo)" />
              <h1 className="favorites-standalone-title">
                Mis Favoritos
                <span className="favorites-standalone-badge">({favorites.length})</span>
              </h1>
            </div>

            <div className="favorites-standalone-actions">
              {favorites.length > 0 && (
                <>
                  <button
                    type="button"
                    className="favorites-standalone-action-btn"
                    onClick={handleToggleSelectAllFavs}
                    title={selectedFavIds.length === favorites.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  >
                    {selectedFavIds.length === favorites.length ? (
                      <>
                        <CheckSquare size={16} />
                        <span className="standalone-btn-text">Deseleccionar</span>
                      </>
                    ) : (
                      <>
                        <Square size={16} />
                        <span className="standalone-btn-text">Seleccionar todos</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="favorites-standalone-action-btn favorites-clear-danger"
                    onClick={handleClearAllFavorites}
                    title="Vaciar todos los favoritos"
                  >
                    <Trash2 size={16} />
                    <span className="standalone-btn-text">Limpiar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* 2. Menú Hamburguesa Móvil (Carga diferida) */}
      <Suspense fallback={null}>
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          categories={categories}
          selectedCategory={searchQuery.trim() ? 'todos' : selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </Suspense>

      {/* 3. Layout Principal: Detalle de Plato dedicado o Catálogo con Sidebar */}
      {isDishDetailPage ? (
        <div key={selectedDishForDetail?.id || location.pathname} className="view-transition-page">
          <Suspense fallback={
            <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-light)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Cargando plato...</p>
              </div>
            </div>
          }>
            <ProductDetailPage
              dish={selectedDishForDetail}
              photoMode={photoMode}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenCart={handleOpenCart}
              isFavorite={selectedDishForDetail ? favorites.includes(selectedDishForDetail.id) : false}
              onToggleFavorite={handleToggleFavorite}
              onBack={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(selectedCategory === 'todos' ? '/' : `/categoria/${selectedCategory}`);
                }
              }}
            />
          </Suspense>
        </div>
      ) : (
        <div key={`catalog-${selectedCategory}`} className={`menu-desktop-layout view-transition-page ${showFavoritesOnly ? 'favorites-active-layout' : ''}`}>
          {!showFavoritesOnly && (
            <CategoryPills
              categories={categories}
              selectedCategory={searchQuery.trim() ? 'todos' : selectedCategory}
              activeScrollCategory={activeScrollCategory}
              onSelectCategory={handleSelectCategory}
              favoritesCount={favorites.length}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={handleToggleFavoritesFilter}
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
              onSetViewMode={handleSetViewMode}
            />
          )}

          {/* 4. Catálogo de Platos */}
          <main className={`menu-main-layout ${showFavoritesOnly ? 'favorites-main-layout' : ''}`}>
        {/* Banner de Repetir Último Pedido (One-Tap Reorder) */}
        {lastOrder && cart.isEmpty() && !dismissedLastOrder && (
          <div className="reorder-banner">
            <div className="reorder-banner-left">
              <div className="reorder-icon-wrap">
                <RotateCcw size={18} />
              </div>
              <div className="reorder-text-wrap">
                <strong className="reorder-title">¿Deseas repetir tu último pedido?</strong>
                <span className="reorder-desc">
                  {lastOrder.items?.length || 0} {(lastOrder.items?.length || 0) === 1 ? 'plato guardado' : 'platos guardados'} de tu visita anterior
                </span>
              </div>
            </div>
            <div className="reorder-actions">
              <button
                type="button"
                className="reorder-action-btn"
                onClick={handleReorderLast}
              >
                Pedir de nuevo
              </button>
              <button
                type="button"
                className="reorder-close-btn"
                onClick={() => setDismissedLastOrder(true)}
                aria-label="Cerrar sugerencia"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

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

        {/* Barra Flotante de Acciones en Lote cuando hay platos seleccionados en Favoritos */}
        {showFavoritesOnly && selectedFavIds.length > 0 && (
          <div className="favorites-batch-actions-bar">
            <div className="batch-actions-info">
              <CheckCircle2 size={16} color="#ffffff" />
              <span>
                <strong>{selectedFavIds.length}</strong> {selectedFavIds.length === 1 ? 'plato seleccionado' : 'platos seleccionados'}
              </span>
            </div>

            <div className="batch-actions-btns">
              {/* Botón Añadir Seleccionados al Pedido */}
              <button
                type="button"
                className="batch-action-btn batch-add-cart-btn"
                onClick={handleAddSelectedFavsToCart}
              >
                <Plus size={16} />
                <span>Añadir al pedido ({selectedFavIds.length})</span>
              </button>

              {/* Botón Quitar Seleccionados de Favoritos */}
              <button
                type="button"
                className="batch-action-btn batch-remove-fav-btn"
                onClick={handleRemoveSelectedFavs}
              >
                <Trash2 size={15} />
                <span>Quitar seleccionados</span>
              </button>
            </div>
          </div>
        )}

        {groupedCatalog.length === 0 ? (
          showFavoritesOnly ? (
            <div className="favorites-empty-state">
              <div className="favorites-empty-icon">
                <Heart size={44} color="var(--rojo)" strokeWidth={1.8} />
              </div>
              <h2 className="favorites-empty-title">Aún no tienes platos en favoritos</h2>
              <p className="favorites-empty-desc">
                Guarda tus platos preferidos tocando el corazón en las tarjetas o en la vista de detalle para tenerlos siempre a mano.
              </p>
              <button
                type="button"
                className="favorites-empty-btn"
                onClick={() => setShowFavoritesOnly(false)}
              >
                Explorar toda la carta
              </button>
            </div>
          ) : (
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
          )
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

              {/* Grid de Productos (Soporta vista normal 3 cols, cuadrícula 4 cols y compacta horizontal) */}
              <div className={`products-grid ${viewMode === 'compact' ? 'compact-grid' : viewMode === 'grid4' ? 'grid4-grid' : ''}`}>
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
                      isFavorite={favorites.includes(dish.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isSelectionMode={showFavoritesOnly && favorites.length > 0}
                      isSelected={selectedFavIds.includes(dish.id)}
                      onToggleSelect={handleToggleSelectFavDish}
                      onAddToCart={(d, e) => handleAddToCart(d, 1, '', e)}
                      onUpdateQuantity={(id, q) => handleUpdateQuantity(id, q)}
                      onOpenDetail={(d) => handleOpenDishDetail(d)}
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
        </main>
        </div>
      )}

      {/* 6. Footer con Redes Sociales Oficiales y Selector de Versión de Fotos (Oculto en vista detalle) */}
      {!isDishDetailPage && (
        <Footer
          photoMode={photoMode}
          onTogglePhotoMode={handleTogglePhotoMode}
          onOpenTvMode={() => setIsTvModeOpen(true)}
        />
      )}

      {/* 7. Barra Móvil Inferior (Home, Menú, Búsqueda, TV, Favoritos y Mi Pedido) */}
      <MobileNavBar
        cart={cart}
        onOpenCart={handleOpenCart}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={handleToggleFavoritesFilter}
        onOpenTvMode={() => setIsTvModeOpen(true)}
        onToggleSearch={() => {
          if (isDishDetailPage) {
            navigate('/');
            setTimeout(() => {
              const input = document.querySelector('.mobile-search-input') || document.querySelector('.header-search-input');
              if (input) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                input.focus();
              }
            }, 100);
            return;
          }
          const input = document.querySelector('.mobile-search-input') || document.querySelector('.header-search-input');
          if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => input.focus(), 250);
          }
        }}
      />

      {/* 8. Carrito y Envío a WhatsApp (Carga diferida) */}
      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={handleCloseCart}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onUpdateCustomerField={handleUpdateCustomerField}
          onClearCart={handleClearCart}
          photoMode={photoMode}
        />
      </Suspense>

      {/* 10. Botón Flotante de Carrito en Escritorio (Solo Icono de Carrito sin texto y Badge) */}
      {cart.getTotalCount() > 0 && !isAnyModalOpen && (
        <button
          type="button"
          className="desktop-floating-cart"
          onClick={handleOpenCart}
          aria-label="Ver mi pedido"
          title={`Ver mi pedido (${cart.getTotalCount()} platos — ${cart.getFormattedTotal()})`}
        >
          <ShoppingCart size={24} />
          <span className="desktop-floating-cart-badge">{cart.getTotalCount()}</span>
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
      {/* Modal Pantalla Completa: Modo Menú TV */}
      <TvMenuModal
        isOpen={isTvModeOpen}
        onClose={() => setIsTvModeOpen(false)}
        dishes={allDishes}
        photoMode={photoMode}
      />
    </div>
  );
}

export default App;
