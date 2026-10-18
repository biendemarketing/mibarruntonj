import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Moon, Sun, Menu, LayoutGrid, Grid2X2, Rows3, MapPin, Phone, SlidersHorizontal, Heart } from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, PlateIcon } from './Icons';

const POPULAR_SEARCHES = [
  'Ceviche Mi Barrunto',
  'Lomo Saltado',
  'Pan con chicharrón',
  'Anticuchos',
  'Chicha Morada',
  'Alfajores'
];

export function Header({
  cart,
  onOpenCart,
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenMobileMenu,
  viewMode = 'grid',
  onToggleViewMode,
  filters = { onlyWithPhoto: false, priceSort: 'none', priceRange: 'all' },
  onUpdateFilter,
  onResetFilters,
  hasActiveFilters = false,
  favoritesCount = 0,
  showFavoritesOnly = false,
  onToggleFavorites,
  allDishes = [],
  onOpenDetail,
  photoMode = 'curated'
}) {
  const totalCount = cart.getTotalCount();
  const formattedTotal = cart.getFormattedTotal();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterPopoverRef = useRef(null);
  const searchBoxRef = useRef(null);

  // Platos que coinciden en vivo con la búsqueda para el dropdown con imágenes
  const matchingDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !allDishes || allDishes.length === 0) return [];
    return allDishes
      .filter((dish) => {
        const nameMatch = dish.name && dish.name.toLowerCase().includes(q);
        const nameEnMatch = dish.nameEn && dish.nameEn.toLowerCase().includes(q);
        const catMatch = (dish.categoryName && dish.categoryName.toLowerCase().includes(q)) ||
                         (dish.category && dish.category.toLowerCase().includes(q));
        return nameMatch || nameEnMatch || catMatch;
      })
      .slice(0, 8);
  }, [searchQuery, allDishes]);

  // Cerrar popovers al hacer clic fuera (compatible con mouse y touch)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(e.target) &&
        !e.target.closest('.header-search-filter-btn')
      ) {
        setIsFilterOpen(false);
      }
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="brand-header">
      {/* Video de Fondo en Bucle Continuo - Totalmente Limpio Sin Overlay */}
      <div className="brand-header-video-wrap" aria-hidden="true">
        <video
          className="brand-header-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="./header-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Barra Superior con Dirección y Redes Sociales Oficiales */}
      <div className="header-top-bar">
        <div className="header-top-bar-inner">
          <div className="header-top-info">
            <a
              href="https://maps.google.com/?q=21+Mill+St+%239,+Paterson,+NJ"
              target="_blank"
              rel="noopener noreferrer"
              className="header-top-address-link"
              title="Abrir ubicación en Google Maps"
            >
              <MapPin size={13} color="var(--naranja)" />
              <span>21 Mill St, #9, Paterson, NJ</span>
            </a>
            <span className="header-top-divider">·</span>
            <a href="tel:9736533749" className="header-top-phone-link" title="Llamar a Mi Barrunto">
              <Phone size={13} color="var(--naranja)" />
              <span>(973) 653-3749</span>
            </a>
          </div>

          <div className="header-top-socials">
            <a
              href="https://www.facebook.com/people/Mi-barrunto-NJ/100063740263668/"
              target="_blank"
              rel="noopener noreferrer"
              className="header-top-social-circle"
              aria-label="Facebook"
              title="Facebook Mi Barrunto NJ"
            >
              <FacebookIcon size={14} />
            </a>
            <a
              href="https://www.instagram.com/miibarruntonj/"
              target="_blank"
              rel="noopener noreferrer"
              className="header-top-social-circle"
              aria-label="Instagram"
              title="Instagram @miibarruntonj"
            >
              <InstagramIcon size={14} />
            </a>
            <a
              href="https://wa.me/19736533749"
              target="_blank"
              rel="noopener noreferrer"
              className="header-top-social-circle"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="brand-header-inner">
        {/* Logo y Marca (Centrado en Móvil con Logo Grande, Izquierda en Escritorio) */}
        <div className="brand-logo-container">
          <img
            src="./logo/logo.png"
            alt="Mi Barrunto - Restaurante Peruano en Paterson NJ"
            className="brand-logo-img"
          />
          <div className="brand-titles">
            <h1 className="brand-name">Mi Barrunto</h1>
            <p className="brand-tagline">Comida criolla peruana</p>
          </div>
        </div>

        {/* Controles de Búsqueda y Acciones del Header */}
        <div className="header-main-controls-row">
          {/* Barra de Búsqueda Integrada en el Header */}
          <div className="header-search-bar-wrap" ref={searchBoxRef}>
          <div className="header-search-box">
            <Search className="header-search-icon" size={17} />
            <input
              type="text"
              className="header-search-input"
              placeholder="Buscar platos en la carta..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label="Buscar en la carta"
            />
            {searchQuery && (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}

            {/* Botón de Filtro DENTRO de la barra de búsqueda */}
            {onUpdateFilter && (
              <button
                type="button"
                className={`header-search-filter-btn ${hasActiveFilters ? 'active' : ''} ${isFilterOpen ? 'open' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen((prev) => !prev);
                  setIsSearchFocused(false);
                }}
                title={hasActiveFilters ? 'Filtros activos (clic para ver)' : 'Filtrar platos'}
                aria-label="Filtros de la carta"
              >
                <SlidersHorizontal size={15} />
                {hasActiveFilters && <span className="header-filter-dot" />}
              </button>
            )}
          </div>

          {/* Sugerencias Rápidas: Búsquedas Populares al hacer clic con buscador vacío */}
          {isSearchFocused && !searchQuery.trim() && (
            <div className="header-popular-searches-popover">
              <div className="popular-searches-header">
                <span>Búsquedas populares</span>
              </div>
              <div className="popular-searches-chips">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="popular-search-chip"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSearchChange(term);
                      setIsSearchFocused(false);
                    }}
                  >
                    <Search size={12} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de Búsqueda en Vivo con Imágenes en el Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="header-search-results-popover">
              <div className="search-results-popover-header">
                <Search size={14} color="var(--rojo)" />
                <span>Resultados de la carta ({matchingDishes.length})</span>
              </div>

              {matchingDishes.length > 0 ? (
                <div className="search-results-popover-list">
                  {matchingDishes.map((dish) => {
                    const img = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
                    return (
                      <div
                        key={dish.id}
                        className="search-result-popover-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsSearchFocused(false);
                          if (onOpenDetail) {
                            onOpenDetail(dish);
                          }
                        }}
                      >
                        <div className="search-result-thumb-wrap">
                          {img ? (
                            <img
                              src={img}
                              alt={dish.name}
                              className="search-result-thumb-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="search-result-thumb-placeholder">
                              <PlateIcon size={20} />
                            </div>
                          )}
                        </div>

                        <div className="search-result-info">
                          <h4 className="search-result-name">{dish.name}</h4>
                          {dish.nameEn && (
                            <span className="search-result-name-en">{dish.nameEn}</span>
                          )}
                          {dish.categoryName && (
                            <span className="search-result-category">{dish.categoryName}</span>
                          )}
                        </div>

                        <div className="search-result-price-wrap">
                          <span className="search-result-price">{dish.getFormattedPrice()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="search-results-popover-empty">
                  <p>No se encontraron platos para "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Popover Flotante de Filtros de la Carta */}
          {isFilterOpen && onUpdateFilter && (
            <div className="header-filter-popover" ref={filterPopoverRef}>
              <div className="filter-popover-header">
                <div className="filter-popover-title-row">
                  <SlidersHorizontal size={14} color="var(--naranja)" />
                  <span className="filter-popover-title">Filtros de la Carta</span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="filter-popover-reset-btn"
                    onClick={onResetFilters}
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* Opción 1: Solo con foto */}
              <div className="filter-popover-group">
                <label className="filter-popover-toggle">
                  <input
                    type="checkbox"
                    checked={filters.onlyWithPhoto || false}
                    onChange={(e) => onUpdateFilter('onlyWithPhoto', e.target.checked)}
                  />
                  <span>Solo platos con foto</span>
                </label>
              </div>

              {/* Opción 2: Rango de Precio */}
              <div className="filter-popover-group">
                <span className="filter-popover-label">Rango de precio:</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceRange === 'all' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceRange', 'all')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceRange === 'under10' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceRange', 'under10')}
                  >
                    &lt; $10
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceRange === '10to20' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceRange', '10to20')}
                  >
                    $10 - $20
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceRange === 'over20' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceRange', 'over20')}
                  >
                    &gt; $20
                  </button>
                </div>
              </div>

              {/* Opción 3: Ordenar por Precio */}
              <div className="filter-popover-group">
                <span className="filter-popover-label">Ordenar por precio:</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'none' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'none')}
                  >
                    Por defecto
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'asc' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'asc')}
                  >
                    $ Menor a Mayor
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'desc' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'desc')}
                  >
                    $ Mayor a Menor
                  </button>
                </div>
              </div>

              <div className="filter-popover-footer">
                <button
                  type="button"
                  className="filter-popover-close-btn"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botones a la derecha de la barra de búsqueda */}
        <div className="header-search-actions">
            {/* Botón Circular de Cambio de Vista (Rojo) */}
            {onToggleViewMode && (
              <button
                type="button"
                className={`header-view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={onToggleViewMode}
                title={
                  viewMode === 'grid'
                    ? 'Cambiar a 4 columnas cuadradas'
                    : viewMode === 'grid4'
                    ? 'Cambiar a vista compacta'
                    : 'Cambiar a cuadrícula estándar'
                }
                aria-label="Alternar vista de la carta"
              >
                {viewMode === 'grid' ? (
                  <Grid2X2 size={19} />
                ) : viewMode === 'grid4' ? (
                  <Rows3 size={19} />
                ) : (
                  <LayoutGrid size={19} />
                )}
              </button>
            )}

            {/* Botón de Modo Oscuro / Claro */}
            <button
              type="button"
              className="header-ctrl-btn header-theme-toggle-btn"
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              aria-label="Alternar tema de color"
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Botón Hamburguesa / Menú de Categorías */}
            <button
              type="button"
              className="header-ctrl-btn header-menu-trigger-btn"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menú de categorías"
              title="La Carta"
            >
              <Menu size={21} />
            </button>

            {/* Botón Mis Favoritos Desktop: Al lado del carrito del header */}
            {onToggleFavorites && (
              <button
                type="button"
                className={`header-ctrl-btn header-desktop-fav-btn ${showFavoritesOnly ? 'active' : ''} ${favoritesCount > 0 ? 'has-items' : ''}`}
                onClick={onToggleFavorites}
                aria-label="Ver mis favoritos"
                title={favoritesCount > 0 ? `Mis Favoritos (${favoritesCount} guardados)` : 'Mis Favoritos'}
              >
                <Heart
                  size={19}
                  fill={showFavoritesOnly || favoritesCount > 0 ? '#ffffff' : 'none'}
                  color="#ffffff"
                />
                {favoritesCount > 0 && (
                  <span className="header-cart-badge header-fav-badge">{favoritesCount}</span>
                )}
              </button>
            )}

            {/* Botón de Carrito Desktop: Al lado del botón de favoritos, mismo tamaño, solo icono y badge (solo escritorio) */}
            <button
              type="button"
              className={`header-ctrl-btn header-desktop-cart-btn ${totalCount > 0 ? 'has-items' : ''}`}
              onClick={onOpenCart}
              aria-label="Ver mi pedido"
              title={totalCount > 0 ? `Ver mi pedido (${totalCount} platos — ${formattedTotal})` : 'Ver mi pedido'}
            >
              <ShoppingCart size={19} />
              {totalCount > 0 && (
                <span className="header-cart-badge">{totalCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
