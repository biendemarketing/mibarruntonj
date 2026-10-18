import React, { useState, useEffect } from 'react';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import { WhatsAppIcon } from './Icons';

export function MobileNavBar({
  cart,
  onOpenCart,
  onOpenMobileMenu,
  onToggleSearch
}) {
  const [isCompact, setIsCompact] = useState(false);
  const totalCount = cart.getTotalCount();

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

  const handleWhatsAppClick = () => {
    window.open(
      'https://wa.me/19736533749?text=Hola%20Mi%20Barrunto%2C%20quisiera%20consultar%20la%20carta',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <nav
      className={`mobile-nav-bar ${isCompact ? 'mobile-nav-bar-compact' : ''}`}
      aria-label="Navegación móvil"
    >
      {/* 1. Menú / Categorías */}
      <button
        type="button"
        className="mobile-nav-btn"
        onClick={onOpenMobileMenu}
        aria-label="Abrir categorías"
        title="Categorías"
      >
        <Menu size={22} />
      </button>

      {/* 2. Buscar */}
      <button
        type="button"
        className="mobile-nav-btn"
        onClick={onToggleSearch}
        aria-label="Buscar en la carta"
        title="Buscar"
      >
        <Search size={22} />
      </button>

      {/* 3. WhatsApp Oficial (Mismo color de los demás botones) */}
      <button
        type="button"
        className="mobile-nav-btn mobile-whatsapp-btn"
        onClick={handleWhatsAppClick}
        aria-label="Contactar por WhatsApp"
        title="WhatsApp"
      >
        <WhatsAppIcon size={22} color="currentColor" />
      </button>

      {/* 4. Mi Pedido (Carrito de compras al final) */}
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
