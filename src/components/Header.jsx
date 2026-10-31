import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Moon, Sun, Menu, LayoutGrid, Grid2X2, Rows3, MapPin, Phone, SlidersHorizontal, Heart, Clock } from 'lucide-react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, PlateIcon } from './Icons';
import { useLanguage } from '../utils/i18n';

const POPULAR_SEARCHES_ES = [
  'Ceviche Mi Barrunto',
  'Lomo Saltado',
  'Pan con chicharrón',
  'Anticuchos',
  'Chicha Morada',
  'Alfajores'
];

const POPULAR_SEARCHES_EN = [
  'Fish Ceviche',
  'Lomo Saltado',
  'Fried pork',
  'Anticuchos',
  'Purple corn drink',
  'Picarones'
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
  photoMode = 'complete'
}) {
  const { isEn, toggleLang } = useLanguage();
  const totalCount = cart.getTotalCount();
  const formattedTotal = cart.getFormattedTotal();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterPopoverRef = useRef(null);
  const searchBoxRef = useRef(null);

  const popularTerms = isEn ? POPULAR_SEARCHES_EN : POPULAR_SEARCHES_ES;

  // Platos que coinciden en vivo con la búsqueda para el dropdown con imágenes
  const matchingDishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !allDishes || allDishes.length === 0) return [];
    return allDishes
      .filter((dish) => {
        const nameMatch = dish.name && dish.name.toLowerCase().includes(q);
        const nameEnMatch = dish.nameEn && dish.nameEn.toLowerCase().includes(q);
        const catMatch = (dish.categoryName && dish.categoryName.toLowerCase().includes(q)) ||
                         (dish.categoryNameEn && dish.categoryNameEn.toLowerCase().includes(q)) ||
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

  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    let activated = false;
    const enableVideo = () => {
      if (!activated) {
        activated = true;
        setShouldLoadVideo(true);
      }
    };
    window.addEventListener('scroll', enableVideo, { once: true, passive: true });
    window.addEventListener('touchstart', enableVideo, { once: true, passive: true });
    window.addEventListener('pointerdown', enableVideo, { once: true, passive: true });
    window.addEventListener('mousemove', enableVideo, { once: true, passive: true });
    window.addEventListener('keydown', enableVideo, { once: true, passive: true });
    return () => {
      window.removeEventListener('scroll', enableVideo);
      window.removeEventListener('touchstart', enableVideo);
      window.removeEventListener('pointerdown', enableVideo);
      window.removeEventListener('mousemove', enableVideo);
      window.removeEventListener('keydown', enableVideo);
    };
  }, []);

  return (
    <header className="brand-header">
      {/* Imagen LCP descubrible con fetchpriority="high" + Video diferido tras interacción */}
      <div className="brand-header-video-wrap" aria-hidden="true">
        <img
          src="/bg-restaurant.webp"
          alt=""
          width="540"
          height="302"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          className="brand-header-video"
        />
        {shouldLoadVideo && (
          <video
            className="brand-header-video"
            style={{ position: 'absolute', inset: 0 }}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/header-bg.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* Barra Superior con Dirección y Redes Sociales Oficiales */}
      <div className="header-top-bar">
        <div className="header-top-bar-inner">
          <div className="header-top-info">
            <a
              href="https://maps.google.com/?q=21+Mill+st,+Paterson,+NJ+07011"
              target="_blank"
              rel="noopener noreferrer"
              className="header-top-address-link"
              title={isEn ? 'Open location in Google Maps' : 'Abrir ubicación en Google Maps'}
            >
              <MapPin size={12} color="var(--naranja)" />
              <span className="header-address-text">21 Mill st, Paterson, NJ 07011</span>
            </a>
            <span className="header-top-divider">·</span>
            <span className="header-top-hours" title={isEn ? 'Open 24/7' : 'Horario de atención continuo'}>
              <Clock size={12} color="var(--naranja)" />
              <span className="header-hours-full">{isEn ? 'Open 24 Hours' : 'Atención 24 Horas'}</span>
              <span className="header-hours-short">{isEn ? '24/7' : '24 Horas'}</span>
            </span>
            <span className="header-top-divider">·</span>
            <a href="tel:9736533749" className="header-top-phone-link" title={isEn ? 'Call Mi Barrunto' : 'Llamar a Mi Barrunto'}>
              <Phone size={12} color="var(--naranja)" />
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
            <button
              type="button"
              onClick={toggleLang}
              aria-label={isEn ? 'Cambiar idioma a Español' : 'Switch language to English'}
              title={isEn ? 'Cambiar a Español' : 'Switch to English'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '24px',
                minWidth: '46px',
                padding: '0 6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                gap: '3px',
                cursor: 'pointer',
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))'
              }}
            >
              <span style={{ color: !isEn ? 'var(--naranja)' : 'rgba(255,255,255,0.65)', textDecoration: !isEn ? 'underline' : 'none' }}>ES</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
              <span style={{ color: isEn ? 'var(--naranja)' : 'rgba(255,255,255,0.65)', textDecoration: isEn ? 'underline' : 'none' }}>EN</span>
            </button>
          </div>
        </div>
      </div>

      <div className="brand-header-inner">
        {/* Logo y Marca (Centrado en Móvil con Logo Grande, Izquierda en Escritorio) */}
        <div className="brand-logo-container">
          <img
            src="/logo/logo.webp"
            width="110"
            height="110"
            fetchPriority="high"
            decoding="async"
            alt="Mi Barrunto - Restaurante Peruano en Paterson NJ"
            className="brand-logo-img"
            onError={(e) => {
              const fallback = '/logo/logo.png';
              if (!e.currentTarget.src.endsWith(fallback)) {
                e.currentTarget.src = fallback;
              }
            }}
          />
          <h1 className="brand-titles" style={{ margin: 0 }}>
            <span className="brand-name">Mi Barrunto</span>
            <span className="brand-tagline" style={{ textTransform: 'none' }}>
              {isEn ? 'Authentic Peruvian Cuisine' : 'Comida criolla peruana'}
              <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                {isEn ? ' — Peruvian Restaurant & Cevichería in Paterson, NJ' : ' — Restaurante Peruano y Cevichería en Paterson, NJ'}
              </span>
            </span>
          </h1>
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
              placeholder={isEn ? 'Search dishes on the menu...' : 'Buscar platos en la carta...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label={isEn ? 'Search menu' : 'Buscar en la carta'}
            />
            {searchQuery && (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => onSearchChange('')}
                aria-label={isEn ? 'Clear search' : 'Limpiar búsqueda'}
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
                title={hasActiveFilters ? (isEn ? 'Active filters (click to view)' : 'Filtros activos (clic para ver)') : (isEn ? 'Filter dishes' : 'Filtrar platos')}
                aria-label={isEn ? 'Menu filters' : 'Filtros de la carta'}
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
                <span>{isEn ? 'Popular searches' : 'Búsquedas populares'}</span>
              </div>
              <div className="popular-searches-chips">
                {popularTerms.map((term) => (
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
                <span>{isEn ? `Menu results (${matchingDishes.length})` : `Resultados de la carta (${matchingDishes.length})`}</span>
              </div>

              {matchingDishes.length > 0 ? (
                <div className="search-results-popover-list">
                  {matchingDishes.map((dish) => {
                    const img = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
                    const primaryDishName = isEn && dish.nameEn ? dish.nameEn : dish.name;
                    const secondaryDishName = isEn && dish.nameEn ? dish.name : dish.nameEn;
                    const catLabel = isEn && dish.categoryNameEn ? dish.categoryNameEn : dish.categoryName;
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
                              alt={primaryDishName}
                              className="search-result-thumb-img"
                              loading="lazy"
                              onError={(e) => {
                                const fallback = dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null;
                                if (fallback && e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback;
                                }
                              }}
                            />
                          ) : (
                            <div className="search-result-thumb-placeholder">
                              <PlateIcon size={20} />
                            </div>
                          )}
                        </div>

                        <div className="search-result-info">
                          <h4 className="search-result-name">{primaryDishName}</h4>
                          {secondaryDishName && (
                            <span className="search-result-name-en">{secondaryDishName}</span>
                          )}
                          {catLabel && (
                            <span className="search-result-category">{catLabel}</span>
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
                  <p>{isEn ? `No dishes found for "${searchQuery}"` : `No se encontraron platos para "${searchQuery}"`}</p>
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
                  <span className="filter-popover-title">{isEn ? 'Menu Filters' : 'Filtros de la Carta'}</span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="filter-popover-reset-btn"
                    onClick={onResetFilters}
                  >
                    {isEn ? 'Reset' : 'Restablecer'}
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
                  <span>{isEn ? 'Only dishes with photo' : 'Solo platos con foto'}</span>
                </label>
              </div>

              {/* Opción 2: Rango de Precio */}
              <div className="filter-popover-group">
                <span className="filter-popover-label">{isEn ? 'Price range:' : 'Rango de precio:'}</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceRange === 'all' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceRange', 'all')}
                  >
                    {isEn ? 'All' : 'Todos'}
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
                <span className="filter-popover-label">{isEn ? 'Sort by price:' : 'Ordenar por precio:'}</span>
                <div className="filter-chips-grid">
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'none' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'none')}
                  >
                    {isEn ? 'Default' : 'Por defecto'}
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'asc' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'asc')}
                  >
                    {isEn ? '$ Low to High' : '$ Menor a Mayor'}
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${filters.priceSort === 'desc' ? 'active' : ''}`}
                    onClick={() => onUpdateFilter('priceSort', 'desc')}
                  >
                    {isEn ? '$ High to Low' : '$ Mayor a Menor'}
                  </button>
                </div>
              </div>

              <div className="filter-popover-footer">
                <button
                  type="button"
                  className="filter-popover-close-btn"
                  onClick={() => setIsFilterOpen(false)}
                >
                  {isEn ? 'Done' : 'Listo'}
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
                    ? (isEn ? 'Switch to 4-column grid' : 'Cambiar a 4 columnas cuadradas')
                    : viewMode === 'grid4'
                    ? (isEn ? 'Switch to compact view' : 'Cambiar a vista compacta')
                    : (isEn ? 'Switch to standard grid' : 'Cambiar a cuadrícula estándar')
                }
                aria-label={isEn ? 'Toggle menu view' : 'Alternar vista de la carta'}
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
              title={isDarkMode ? (isEn ? 'Light Mode' : 'Modo Claro') : (isEn ? 'Dark Mode' : 'Modo Oscuro')}
              aria-label={isEn ? 'Toggle color theme' : 'Alternar tema de color'}
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Botón Hamburguesa / Menú de Categorías */}
            <button
              type="button"
              className="header-ctrl-btn header-menu-trigger-btn"
              onClick={onOpenMobileMenu}
              aria-label={isEn ? 'Open categories menu' : 'Abrir menú de categorías'}
              title={isEn ? 'Menu' : 'La Carta'}
            >
              <Menu size={21} />
            </button>

            {/* Botón Mis Favoritos Desktop: Al lado del carrito del header */}
            {onToggleFavorites && (
              <button
                type="button"
                className={`header-ctrl-btn header-desktop-fav-btn ${showFavoritesOnly ? 'active' : ''} ${favoritesCount > 0 ? 'has-items' : ''}`}
                onClick={onToggleFavorites}
                aria-label={isEn ? 'View my favorites' : 'Ver mis favoritos'}
                title={favoritesCount > 0 ? (isEn ? `My Favorites (${favoritesCount} saved)` : `Mis Favoritos (${favoritesCount} guardados)`) : (isEn ? 'My Favorites' : 'Mis Favoritos')}
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
              aria-label={isEn ? 'View my order' : 'Ver mi pedido'}
              title={totalCount > 0 ? (isEn ? `View my order (${totalCount} items — ${formattedTotal})` : `Ver mi pedido (${totalCount} platos — ${formattedTotal})`) : (isEn ? 'View my order' : 'Ver mi pedido')}
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
