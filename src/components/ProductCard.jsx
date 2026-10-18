import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Heart, Check } from 'lucide-react';
import { PlateIcon } from './Icons';

export function ProductCard({
  dish,
  photoMode = 'curated',
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
  viewMode = 'grid',
  index = 0,
  isFavorite = false,
  onToggleFavorite,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) {
  const hasPhoto = dish.hasImage(photoMode);
  const currentImage = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
  const isCompact = viewMode === 'compact';
  const [isRevealed, setIsRevealed] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef(null);

  // Efecto cascada escalonado por columna/fila al ir bajando por la página
  const staggerDelay = isRevealed ? `${(index % 6) * 65}ms` : '0ms';

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      setShouldLoadImage(true);
      return;
    }

    // Observer 1: Revelado progresivo con micro-escala
    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        setIsRevealed(entry.isIntersecting);
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );
    revealObserver.observe(el);

    // Observer 2: Carga diferida (Lazy Loading) de imágenes con margen de anticipación de 300px
    const imageObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadImage(true);
          imageObserver.disconnect();
        }
      },
      {
        rootMargin: '300px 0px 300px 0px'
      }
    );
    imageObserver.observe(el);

    return () => {
      revealObserver.disconnect();
      imageObserver.disconnect();
    };
  }, [dish.id, viewMode]);

  // =========================================================================
  // VISTA 2: COMPACTA / HORIZONTAL (Inspirada en el diseño enviado por el usuario)
  // Menos altura (aprox la mitad), foto a la izquierda, título y precio con botón +
  // =========================================================================
  if (isCompact) {
    return (
      <article
        ref={cardRef}
        className={`product-card product-card-compact ${hasPhoto ? 'has-photo' : 'no-photo'} ${isRevealed ? 'card-revealed' : 'card-hidden'} ${isSelected ? 'card-batch-selected' : ''}`}
        data-dish-id={dish.id}
        onClick={() => onOpenDetail(dish)}
        title="Clic para ver detalles"
        style={{ transitionDelay: staggerDelay }}
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
        {/* Imagen o Placeholder a la izquierda con Carga Diferida (Lazy Loading) */}
        <div className="compact-image-wrap">
          {hasPhoto && currentImage ? (
            shouldLoadImage ? (
              <img
                src={currentImage}
                alt={`${dish.name} — Plato peruano en Mi Barrunto`}
                className={`compact-img ${isImageLoaded ? 'img-loaded' : 'img-loading'}`}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
              />
            ) : (
              <div className="compact-img-skeleton" aria-hidden="true" />
            )
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
      ref={cardRef}
      className={`product-card ${hasPhoto ? 'has-photo' : 'no-photo'} ${isRevealed ? 'card-revealed' : 'card-hidden'} ${isSelected ? 'card-batch-selected' : ''}`}
      data-dish-id={dish.id}
      style={{ transitionDelay: staggerDelay }}
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
      {/* Zona Superior: Imagen en alta calidad con Carga Diferida (Lazy Loading) */}
      <div
        className={`product-card-image-wrap ${!hasPhoto || !currentImage ? 'product-card-placeholder' : ''}`}
        onClick={() => onOpenDetail(dish)}
        title="Ver detalle del plato"
      >
        {hasPhoto && currentImage ? (
          shouldLoadImage ? (
            <img
              src={currentImage}
              alt={`${dish.name} — Comida criolla peruana en Mi Barrunto`}
              className={`product-card-img ${isImageLoaded ? 'img-loaded' : 'img-loading'}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <div className="product-card-img-skeleton" aria-hidden="true" />
          )
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
              <Plus size={15} />
              <span>Ordenar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
