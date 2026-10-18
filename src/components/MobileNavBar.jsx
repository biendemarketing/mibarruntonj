import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, Search, ShoppingCart, Heart } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export function MobileNavBar({
  cart,
  onOpenCart,
  onOpenMobileMenu,
  onToggleSearch,
  favoritesCount = 0,
  showFavoritesOnly = false,
  onToggleFavorites
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompact, setIsCompact] = useState(false);
  const totalCount = cart.getTotalCount();
  const isHome = location.pathname === '/' || location.pathname.startsWith('/categoria/');

  // Detección de scroll estilo Apple (Safari iOS): compacto al bajar, normal al subir
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Cerca de la cima de la página siempre tamaño normal
          if (currentScrollY <= 40) {
            setIsCompact(false);
          } else if (currentScrollY > lastScrollY + 8) {
            // Scroll hacia abajo -> modo compacto
            setIsCompact(true);
          } else if (currentScrollY < lastScrollY - 8) {
            // Scroll hacia arriba -> tamaño normal
            setIsCompact(false);
          }

          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = () => {
    triggerHaptic(12);
    if (showFavoritesOnly && onToggleFavorites) {
      onToggleFavorites();
    }
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoritesClick = () => {
    triggerHaptic(14);
    if (onToggleFavorites) {
      onToggleFavorites();
    }
  };

  return (
    <nav
      className={`mobile-nav-bar ${isCompact ? 'mobile-nav-bar-compact' : ''}`}
      aria-label="Navegación móvil"
    >
      {/* 0. Home / Inicio al inicio de la barra */}
      <button
        type="button"
        className={`mobile-nav-btn ${isHome && !showFavoritesOnly ? 'active' : ''}`}
        onClick={handleHomeClick}
        aria-label="Ir al inicio de la carta"
        title="Inicio"
      >
        <Home size={22} />
      </button>

      {/* 1. Menú / Categorías */}
      <button
        type="button"
        className="mobile-nav-btn"
        onClick={() => {
          triggerHaptic(12);
          if (showFavoritesOnly && onToggleFavorites) {
            onToggleFavorites();
          }
          if (onOpenMobileMenu) onOpenMobileMenu();
        }}
        aria-label="Abrir categorías"
        title="Categorías"
      >
        <Menu size={22} />
      </button>

      {/* 2. Buscar */}
      <button
        type="button"
        className="mobile-nav-btn"
        onClick={() => {
          triggerHaptic(12);
          if (showFavoritesOnly && onToggleFavorites) {
            onToggleFavorites();
          }
          if (onToggleSearch) onToggleSearch();
        }}
        aria-label="Buscar en la carta"
        title="Buscar"
      >
        <Search size={22} />
      </button>



      {/* 4. Favoritos (Corazón) */}
      <button
        type="button"
        className={`mobile-nav-btn mobile-fav-nav-btn ${showFavoritesOnly ? 'active is-favorites-page' : ''}`}
        onClick={handleFavoritesClick}
        aria-label="Ver mis platos favoritos"
        title="Mis Favoritos"
      >
        <Heart
          size={22}
          fill={showFavoritesOnly || favoritesCount > 0 ? 'var(--rojo)' : 'none'}
          color={showFavoritesOnly || favoritesCount > 0 ? 'var(--rojo)' : 'currentColor'}
        />
        {favoritesCount > 0 && (
          <span className="mobile-cart-badge mobile-fav-badge">{favoritesCount}</span>
        )}
      </button>

      {/* 5. Mi Pedido (Carrito de compras al final) */}
      <button
        type="button"
        className="mobile-nav-btn"
        onClick={onOpenCart}
        aria-label="Ver mi pedido"
        title="Mi Pedido"
      >
        <ShoppingCart size={22} />
        {totalCount > 0 && (
          <span className="mobile-cart-badge">{totalCount}</span>
        )}
      </button>
    </nav>
  );
}

export default MobileNavBar;
