import React, { useEffect } from 'react';
import { X, ChevronRight, Utensils, MapPin, Phone, Printer, Clock } from 'lucide-react';

export function MobileDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory
}) {
  // Bloquear scroll de fondo al abrir el drawer móvil
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera elegante y moderna */}
        <div className="mobile-drawer-header-clean">
          <div className="mobile-drawer-header-inner">
            <div className="mobile-drawer-brand">
              <img
                src="./logo/logo.png"
                alt="Mi Barrunto - Comida Criolla y Marina Paterson NJ"
                className="mobile-drawer-logo"
              />
              <div className="mobile-drawer-brand-text">
                <span className="mobile-drawer-brand-name">Mi Barrunto</span>
                <span className="mobile-drawer-brand-sub">Paterson, NJ</span>
              </div>
            </div>
            <button
              type="button"
              className="mobile-drawer-close-btn"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Lista de categorías refinada */}
        <div className="mobile-drawer-list">
          <button
            type="button"
            className={`mobile-drawer-item ${selectedCategory === 'todos' ? 'active' : ''}`}
            onClick={() => {
              onSelectCategory('todos');
              onClose();
            }}
          >
            <span className="mobile-drawer-item-label">
              <Utensils size={16} className="mobile-drawer-icon" />
              <span>Toda la Carta</span>
            </span>
            <ChevronRight size={16} className="mobile-drawer-arrow" />
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`mobile-drawer-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(cat.id);
                onClose();
              }}
            >
              <span className="mobile-drawer-item-label">
                <span>{cat.name}</span>
              </span>
              <div className="mobile-drawer-item-end">
                {cat.dishes && cat.dishes.length > 0 && (
                  <span className="mobile-drawer-count">{cat.dishes.length}</span>
                )}
                <ChevronRight size={16} className="mobile-drawer-arrow" />
              </div>
            </button>
          ))}
        </div>

        {/* Enlace directo a Carta Imprimible 11x8.5 */}
        <div style={{ padding: '0.75rem 1.25rem 0' }}>
          <a
            href="./menu_imprimible.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-drawer-item"
            style={{
              backgroundColor: 'var(--rojo)',
              color: '#ffffff',
              borderRadius: '9999px',
              justifyContent: 'center',
              fontWeight: 700,
              gap: '0.5rem',
              textAlign: 'center',
              display: 'flex'
            }}
          >
            <Printer size={16} />
            <span>Carta Imprimible (11x8.5)</span>
          </a>
        </div>

        {/* Pie de navegación rápida */}
        <div className="mobile-drawer-footer">
          <div className="mobile-drawer-footer-inner" style={{ flexDirection: 'column', gap: '0.45rem', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--rojo)', fontWeight: 800 }}>
              <Clock size={13} color="var(--rojo)" />
              <span>Atención 24 Horas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <a
                href="https://maps.google.com/?q=21+Mill+st,+Paterson,+NJ+07011"
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-drawer-info-link"
              >
                <MapPin size={13} color="var(--naranja)" />
                <span>21 Mill st, Paterson, NJ 07011</span>
              </a>
              <span style={{ opacity: 0.4 }}>·</span>
              <a href="tel:9736533749" className="mobile-drawer-info-link">
                <Phone size={13} color="var(--naranja)" />
                <span>(973) 653-3749</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
