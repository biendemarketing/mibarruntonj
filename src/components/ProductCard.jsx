import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { PlateIcon } from './Icons';

export function ProductCard({
  dish,
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetail,
  viewMode = 'grid'
}) {
  const hasPhoto = dish.hasImage();
  const isCompact = viewMode === 'compact';
  const [isRevealed, setIsRevealed] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '60px 0px -20px 0px'
      }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
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
        className={`product-card product-card-compact ${hasPhoto ? 'has-photo' : 'no-photo'} ${isRevealed ? 'card-revealed' : 'card-hidden'}`}
        data-dish-id={dish.id}
        onClick={() => onOpenDetail(dish)}
        title="Clic para ver detalles"
      >
        {/* Imagen o Placeholder a la izquierda */}
        <div className="compact-image-wrap">
          {hasPhoto ? (
            <img
              src={`/${dish.image}`}
              alt={dish.name}
              className="compact-img"
              loading="lazy"
              decoding="async"
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
                onClick={() => onAddToCart(dish)}
                title="Agregar a mi pedido"
                aria-label={`Agregar ${dish.name}`}
              >
                <Plus size={16} />
              </button>
            )}
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
      className={`product-card ${hasPhoto ? 'has-photo' : 'no-photo'} ${isRevealed ? 'card-revealed' : 'card-hidden'}`}
      data-dish-id={dish.id}
    >
      {/* Zona Superior: Imagen en alta calidad o placeholder gris con icono de plato */}
      {hasPhoto ? (
        <div
          className="product-card-image-wrap"
          onClick={() => onOpenDetail(dish)}
          title="Ver detalle del plato"
        >
          <img
            src={`/${dish.image}`}
            alt={dish.name}
            className="product-card-img"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div
          className="product-card-image-wrap product-card-placeholder"
          onClick={() => onOpenDetail(dish)}
          title="Ver detalle del plato"
        >
          <div className="product-placeholder-icon-wrap">
            <PlateIcon size={44} className="product-placeholder-icon" />
          </div>
        </div>
      )}

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

      {/* Pie de tarjeta: Precio y Selección de Lista */}
      <div className="product-card-footer">
        <span className="product-price-tag">
          {dish.getFormattedPrice()}
        </span>

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
              onAddToCart(dish);
            }}
            title="Agregar a mi pedido"
            aria-label={`Agregar ${dish.name}`}
          >
            <Plus size={15} />
            <span>Elegir</span>
          </button>
        )}
      </div>
    </article>
  );
}
