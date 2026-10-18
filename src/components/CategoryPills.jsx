import React from 'react';
import { Utensils, LayoutGrid, Grid2X2, Rows3 } from 'lucide-react';

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
  showFavoritesOnly = false,
  onToggleFavorites,
  viewMode = 'grid',
  onToggleViewMode,
  onSetViewMode
}) {
  return (
    <aside className="categories-sidebar-nav" aria-label="Categorías de la carta">
      {/* Encabezado visible únicamente en el Sidebar de Escritorio */}
      <div className="sidebar-nav-header">
        <div className="sidebar-nav-title-wrap">
          <Utensils size={17} color="var(--rojo)" />
          <h3 className="sidebar-nav-title">Categorías</h3>
        </div>

        {/* Selector de Vistas en el Sidebar de Escritorio */}
        {(onSetViewMode || onToggleViewMode) && (
          <div className="sidebar-view-selector" role="group" aria-label="Cambiar modo de vista">
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => (onSetViewMode ? onSetViewMode('grid') : onToggleViewMode && onToggleViewMode())}
              title="Vista estándar (3 columnas)"
              aria-label="Vista 3 columnas"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'grid4' ? 'active' : ''}`}
              onClick={() => (onSetViewMode ? onSetViewMode('grid4') : onToggleViewMode && onToggleViewMode())}
              title="Vista cuadrícula densa (4 columnas cuadradas)"
              aria-label="Vista 4 columnas cuadradas"
            >
              <Grid2X2 size={15} />
            </button>
            <button
              type="button"
              className={`sidebar-view-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => (onSetViewMode ? onSetViewMode('compact') : onToggleViewMode && onToggleViewMode())}
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
          className={`category-nav-item ${selectedCategory === 'todos' && !showFavoritesOnly ? 'active' : ''}`}
          onClick={() => {
            if (showFavoritesOnly && onToggleFavorites) onToggleFavorites();
            onSelectCategory('todos');
          }}
        >
          <span className="category-nav-name">Toda la Carta</span>
          <span className="category-nav-indicator" />
        </button>

        {/* Cada una de las categorías */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id && !showFavoritesOnly;

          return (
            <button
              key={cat.id}
              type="button"
              className={`category-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (showFavoritesOnly && onToggleFavorites) onToggleFavorites();
                onSelectCategory(cat.id);
              }}
            >
              <span className="category-nav-name">{cat.name}</span>
              {cat.nameEn && <span className="category-nav-sub">{cat.nameEn}</span>}
              <span className="category-nav-indicator" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default CategoryPills;
