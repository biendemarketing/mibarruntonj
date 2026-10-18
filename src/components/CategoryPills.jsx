import React from 'react';
import { Utensils, Heart } from 'lucide-react';

export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
  favoritesCount = 0,
  showFavoritesOnly = false,
  onToggleFavorites
}) {
  return (
    <aside className="categories-sidebar-nav" aria-label="Categorías de la carta">
      {/* Encabezado visible únicamente en el Sidebar de Escritorio */}
      <div className="sidebar-nav-header">
        <div className="sidebar-nav-title-wrap">
          <Utensils size={17} color="var(--rojo)" />
          <h3 className="sidebar-nav-title">Categorías</h3>
        </div>
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

        {/* Opción "Mis Favoritos" con Corazón */}
        {onToggleFavorites && (
          <button
            type="button"
            className={`category-nav-item category-nav-fav-item ${showFavoritesOnly ? 'active' : ''}`}
            onClick={onToggleFavorites}
          >
            <div className="category-nav-fav-row">
              <Heart
                size={15}
                fill={showFavoritesOnly || favoritesCount > 0 ? 'var(--rojo)' : 'none'}
                color={showFavoritesOnly || favoritesCount > 0 ? 'var(--rojo)' : 'currentColor'}
              />
              <span className="category-nav-name">Mis Favoritos</span>
            </div>
            {favoritesCount > 0 && (
              <span className="category-fav-counter-badge">{favoritesCount}</span>
            )}
            <span className="category-nav-indicator" />
          </button>
        )}

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
