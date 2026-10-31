import React from 'react';
import { Utensils, LayoutGrid, Grid2X2, Rows3, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useLanguage } from '../utils/i18n';

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
  activeScrollCategory = null,
  showFavoritesOnly = false,
  onToggleFavorites,
  viewMode = 'grid',
  onToggleViewMode,
  onSetViewMode
}) {
  const { isEn } = useLanguage();
  // Auto-scroll del botón activo dentro del contenedor del sidebar
  React.useEffect(() => {
    if (activeScrollCategory) {
      const activeBtn = document.getElementById(`cat-btn-${activeScrollCategory}`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeScrollCategory]);

  const handleCategoryClick = (catId) => {
    triggerHaptic(10);
    if (showFavoritesOnly && onToggleFavorites) onToggleFavorites();
    onSelectCategory(catId);
  };

  return (
    <aside className="categories-sidebar-nav" aria-label="Categorías de la carta">
      {/* Encabezado visible únicamente en el Sidebar de Escritorio */}
      <div className="sidebar-nav-header">
        <div className="sidebar-nav-title-wrap">
          <Utensils size={17} color="var(--rojo)" />
          <h2 className="sidebar-nav-title">{isEn ? 'Categories' : 'Categorías'}</h2>
        </div>

        {/* Selector de Vistas en el Sidebar de Escritorio */}
        {(onSetViewMode || onToggleViewMode) && (
          <div className="sidebar-view-selector" role="group" aria-label="Cambiar modo de vista">
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(8);
                if (onSetViewMode) onSetViewMode('grid');
                else if (onToggleViewMode) onToggleViewMode();
              }}
              title="Vista estándar (3 columnas)"
              aria-label="Vista 3 columnas"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'grid4' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(8);
                if (onSetViewMode) onSetViewMode('grid4');
                else if (onToggleViewMode) onToggleViewMode();
              }}
              title="Vista cuadrícula densa (4 columnas cuadradas)"
              aria-label="Vista 4 columnas cuadradas"
            >
              <Grid2X2 size={15} />
            </button>
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic(8);
                if (onSetViewMode) onSetViewMode('compact');
                else if (onToggleViewMode) onToggleViewMode();
              }}
              title="Vista compacta (filas horizontales)"
              aria-label="Vista compacta"
            >
              <Rows3 size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="categories-nav-list">
        {/* Opción "Toda la Carta" */}
        <button
          type="button"
          className={`category-nav-item ${(selectedCategory === 'todos' && !activeScrollCategory && !showFavoritesOnly) ? 'active' : ''}`}
          onClick={() => handleCategoryClick('todos')}
        >
          <span className="category-nav-name">{isEn ? 'Full Menu' : 'Toda la Carta'}</span>
          <ChevronRight size={15} className="category-nav-arrow" />
        </button>

        {/* Cada una de las categorías */}
        {categories.map((cat) => {
          const isCurrentActive =
            (selectedCategory === 'todos' && activeScrollCategory === cat.id && !showFavoritesOnly) ||
            (selectedCategory === cat.id && !showFavoritesOnly);

          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              type="button"
              className={`category-nav-item ${isCurrentActive ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span className="category-nav-name">{isEn && cat.nameEn ? cat.nameEn : cat.name}</span>
              <ChevronRight size={15} className="category-nav-arrow" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default CategoryPills;
