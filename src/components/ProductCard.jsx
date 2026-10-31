import React, { useState } from 'react';
import { Plus, Minus, Heart, Check } from 'lucide-react';
import { PlateIcon } from './Icons';

export function ProductCard({
  dish,
  photoMode = 'complete',
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
  viewMode = 'grid',
  index = 0,
  isPriority = false,
  isFavorite = false,
  onToggleFavorite,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  layoutClassName = ''
}) {
  const hasPhoto = dish.hasImage(photoMode);
  const currentImage = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
  const isCompact = viewMode === 'compact';
  const [isImageLoaded, setIsImageLoaded] = useState(isPriority);

  // =========================================================================
  // VISTA 2: COMPACTA / HORIZONTAL (Inspirada en el diseño enviado por el usuario)
  // Menos altura (aprox la mitad), foto a la izquierda, título y precio con botón +
  // =========================================================================
  if (isCompact) {
    return (
      <article
        className={`product-card product-card-compact ${layoutClassName} ${hasPhoto ? 'has-photo' : 'no-photo'} ${isSelected ? 'card-batch-selected' : ''}`.trim()}
        data-dish-id={dish.id}
        onClick={() => onOpenDetail(dish)}
        title="Clic para ver detalles"
      >
        {/* Selector Checkbox de selección múltiple (en vista de favoritos) */}
        {isSelectionMode && onToggleSelect && (
          <button
            type="button"
            className={`card-batch-select-btn compact-batch-select-btn ${isSelected ? 'is-selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(dish.id);
            }}
            aria-label={isSelected ? `Deseleccionar ${dish.name}` : `Seleccionar ${dish.name}`}
            title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
          >
            {isSelected ? <Check size={13} strokeWidth={3} /> : null}
          </button>
        )}
        {/* Imagen o Placeholder a la izquierda con Carga Diferida Nativa */}
        <div className="compact-image-wrap">
          {hasPhoto && currentImage ? (
            <img
              src={currentImage}
              alt={`${dish.name} — Plato peruano en Mi Barrunto`}
              className={`compact-img ${isImageLoaded ? 'img-loaded' : 'img-loading'}`}
              loading={isPriority ? "eager" : "lazy"}
              fetchPriority={isPriority ? "high" : "low"}
              decoding="async"
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                const fallback = dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null;
                if (fallback && e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
            />
          ) : (
            <div className="compact-placeholder">
              <PlateIcon size={34} className="compact-placeholder-icon" />
            </div>
          )}
        </div>

        {/* Contenido a la derecha */}
        <div className="compact-content">
          <div className="compact-header">
            <h3 className="compact-title">{dish.name}</h3>
            {dish.nameEn && (
              <p className="compact-en">{dish.nameEn}</p>
            )}
          </div>

          <div className="compact-footer" onClick={(e) => e.stopPropagation()}>
            <span className="compact-price">
              {dish.getFormattedPrice()}
            </span>

            <div className="compact-footer-actions">
              {/* Botón de favoritos al lado del botón de añadir */}
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`card-fav-btn compact-fav-footer-btn ${isFavorite ? 'is-fav' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(dish.id);
                  }}
                  aria-label={isFavorite ? `Quitar ${dish.name} de favoritos` : `Guardar ${dish.name} en favoritos`}
                  title={isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
                >
                  <Heart
                    size={16}
                    fill={isFavorite ? 'var(--rojo)' : 'none'}
                    color={isFavorite ? 'var(--rojo)' : 'currentColor'}
                  />
                </button>
              )}

              {quantity > 0 ? (
                <div className="qty-stepper compact-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(dish.id, quantity - 1)}
                    title="Disminuir"
                    aria-label={`Disminuir cantidad de ${dish.name}`}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="qty-count">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(dish.id, quantity + 1)}
                    title="Aumentar"
                    aria-label={`Aumentar cantidad de ${dish.name}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="compact-add-btn"
                  onClick={(e) => onAddToCart(dish, e)}
                  title="Agregar a mi pedido"
                  aria-label={`Agregar ${dish.name}`}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // =========================================================================
  // VISTA 1: NORMAL / GRID (Vertical con imagen superior)
  // =========================================================================
  return (
    <article
      className={`product-card ${layoutClassName} ${hasPhoto ? 'has-photo' : 'no-photo'} ${isSelected ? 'card-batch-selected' : ''}`.trim()}
      data-dish-id={dish.id}
    >
      {/* Selector Checkbox de selección múltiple (en vista de favoritos) */}
      {isSelectionMode && onToggleSelect && (
        <button
          type="button"
          className={`card-batch-select-btn ${isSelected ? 'is-selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(dish.id);
          }}
          aria-label={isSelected ? `Deseleccionar ${dish.name}` : `Seleccionar ${dish.name}`}
          title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
        >
          {isSelected ? <Check size={14} strokeWidth={3} /> : null}
        </button>
      )}
      {/* Zona Superior: Imagen en alta calidad con Carga Diferida Nativa */}
      <div
        className={`product-card-image-wrap ${!hasPhoto || !currentImage ? 'product-card-placeholder' : ''}`}
        onClick={() => onOpenDetail(dish)}
        title="Ver detalle del plato"
      >
        {hasPhoto && currentImage ? (
          <img
            src={currentImage}
            alt={`${dish.name} — Comida criolla peruana en Mi Barrunto`}
            className={`product-card-img ${isPriority || isImageLoaded ? 'img-loaded' : 'img-loading'}`}
            width="350"
            height="195"
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "low"}
            decoding="async"
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              const fallback = dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null;
              if (fallback && e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        ) : (
          <div className="product-placeholder-icon-wrap">
            <PlateIcon size={44} className="product-placeholder-icon" />
          </div>
        )}
      </div>

      {/* Cuerpo de la tarjeta: Título y descripción */}
      <div
        className="product-card-body"
        onClick={() => onOpenDetail(dish)}
        title="Clic para ver detalles"
      >
        <h3 className="product-card-title">{dish.name}</h3>
        {dish.nameEn && (
          <p className="product-card-en">{dish.nameEn}</p>
        )}
      </div>

      {/* Pie de tarjeta: Precio y Botones de Acción (Favorito + Carrito juntos) */}
      <div className="product-card-footer">
        <span className="product-price-tag">
          {dish.getFormattedPrice()}
        </span>

        <div className="product-card-footer-actions">
          {/* Botón de favoritos al lado del botón de añadir */}
          {onToggleFavorite && (
            <button
              type="button"
              className={`card-fav-btn card-fav-footer-btn ${isFavorite ? 'is-fav' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(dish.id);
              }}
              aria-label={isFavorite ? `Quitar ${dish.name} de favoritos` : `Guardar ${dish.name} en favoritos`}
              title={isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
            >
              <Heart
                size={18}
                fill={isFavorite ? 'var(--rojo)' : 'none'}
                color={isFavorite ? 'var(--rojo)' : 'currentColor'}
              />
            </button>
          )}

          {/* Controles de Lista / Carrito */}
          {quantity > 0 ? (
            <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="qty-btn"
                onClick={() => onUpdateQuantity(dish.id, quantity - 1)}
                title="Disminuir"
                aria-label={`Disminuir cantidad de ${dish.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="qty-count">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => onUpdateQuantity(dish.id, quantity + 1)}
                title="Aumentar"
                aria-label={`Aumentar cantidad de ${dish.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-add-cart"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(dish, e);
              }}
              title="Agregar a mi pedido"
              aria-label={`Agregar ${dish.name}`}
            >
              <Plus size={13} className="btn-add-cart-icon" />
              <span className="btn-add-cart-text">Ordenar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
