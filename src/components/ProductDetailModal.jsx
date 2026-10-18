import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, ShoppingCart, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';
import { PlateIcon } from './Icons';
import { menuRepository } from '../services/MenuRepository';
import { triggerHaptic } from '../utils/haptics';

export function ProductDetailModal({
  dish,
  photoMode = 'curated',
  initialQuantity = 1,
  initialNote = '',
  onClose,
  onSaveToCart,
  onPrevDish,
  onNextDish,
  onQuickAddPairing
}) {
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [note, setNote] = useState(initialNote);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);

  useEffect(() => {
    setQuantity(initialQuantity > 0 ? initialQuantity : 1);
    setNote(initialNote || '');
    setCopiedShare(false);
  }, [dish?.id]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  // Sugerencias de Maridaje inteligente (Bebidas típicas peruanas si no es categoría bebidas)
  const pairingDishes = useMemo(() => {
    if (!dish || dish.category === 'bebidas') return [];
    const p1 = menuRepository.getDishById(233); // Chicha Morada
    const p2 = menuRepository.getDishById(235); // Agua de Maracuyá
    return [p1, p2].filter(Boolean);
  }, [dish]);

  // Compartir plato mediante Web Share API o copiar URL directa
  const handleShare = async () => {
    triggerHaptic(15);
    const shareUrl = `${window.location.origin}/plato/${dish.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish.name} — Mi Barrunto`,
          text: `¡Mira este delicioso plato en Mi Barrunto! ${dish.name} (${dish.getFormattedPrice()})`,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback a portapapeles
        }
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    } catch {
      // Fallback si clipboard falla
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    }
  };

  // Gesto táctil Swipe-Down para cerrar en móviles
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (diffY > 80) {
      triggerHaptic(12);
      handleClose();
    }
    setTouchStartY(null);
  };

  // Bloquear scroll de fondo al abrir el modal y navegación con flechas de teclado
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft' && onPrevDish) onPrevDish();
      if (e.key === 'ArrowRight' && onNextDish) onNextDish();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClosing, onPrevDish, onNextDish]);

  if (!dish) return null;

  const hasPhoto = dish.hasImage(photoMode);
  const currentImage = dish.getImage(photoMode);
  const subtotal = (dish.price * quantity).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerHaptic(18);
    onSaveToCart(dish, quantity, note);
    handleClose();
  };

  return (
    <div
      className={`modal-overlay ${isClosing ? 'modal-closing' : 'modal-opening'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-container-vertical" onClick={(e) => e.stopPropagation()}>
        {/* Contenedor del modal */}
        <div
          className={`modal-card-wrapper ${isClosing ? 'modal-content-closing' : 'modal-content-opening'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Botón cerrar flotante: fijo en esquina superior derecha sin desplazarse por el scroll */}
          <button
            type="button"
            className="modal-close-floating"
            onClick={handleClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="modal-content">

          {/* Imagen o Placeholder con icono de plato */}
          {hasPhoto && currentImage ? (
            <div className="modal-image-wrap">
              <img
                src={currentImage.startsWith('http') ? currentImage : `./${currentImage.replace(/^\//, '')}`}
                alt={`${dish.name} — Especialidad tradicional de Mi Barrunto`}
                className="modal-image"
                onError={(e) => {
                  if (!e.target.dataset.retried) {
                    e.target.dataset.retried = '1';
                    e.target.src = `${import.meta.env.BASE_URL}${currentImage.replace(/^\//, '')}`;
                  }
                }}
              />
            </div>
          ) : (
            <div className="modal-image-wrap modal-placeholder-wrap">
              <PlateIcon size={60} className="modal-placeholder-icon" />
            </div>
          )}

          {/* Contenido principal */}
          <div className="modal-body-redesign">
            {/* Título del plato */}
            <h2 className="modal-dish-title-lg">{dish.name}</h2>

            {/* Nombre en inglés */}
            {dish.nameEn && (
              <p className="modal-dish-en-lg">{dish.nameEn}</p>
            )}

            {/* Precio grande + selector cantidad en una fila */}
            <div className="modal-price-qty-row">
              <span className="modal-price-lg">{dish.getFormattedPrice()}</span>
              <div className="modal-qty-stepper">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => {
                    triggerHaptic(10);
                    setQuantity(Math.max(1, quantity - 1));
                  }}
                  aria-label="Disminuir"
                >
                  <Minus size={15} />
                </button>
                <span className="modal-qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => {
                    triggerHaptic(10);
                    setQuantity(quantity + 1);
                  }}
                  aria-label="Aumentar"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Subtotal si hay más de 1 */}
            {dish.price > 0 && quantity > 1 && (
              <div className="modal-subtotal-line">
                <span>Subtotal ({quantity}x)</span>
                <span className="modal-subtotal-amount">${subtotal}</span>
              </div>
            )}

            {/* Venta cruzada inteligente: Maridaje sugerido */}
            {pairingDishes.length > 0 && (
              <div className="modal-pairing-box">
                <span className="modal-pairing-header">Acompáñalo con:</span>
                <div className="modal-pairing-chips">
                  {pairingDishes.map((pDish) => (
                    <button
                      key={pDish.id}
                      type="button"
                      className="modal-pairing-btn"
                      onClick={() => {
                        triggerHaptic(15);
                        if (onQuickAddPairing) {
                          onQuickAddPairing(pDish);
                        } else {
                          onSaveToCart(pDish, 1, '');
                        }
                      }}
                      title={`Añadir ${pDish.name} al pedido`}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      <span className="modal-pairing-name">{pDish.name}</span>
                      <span className="modal-pairing-price">{pDish.getFormattedPrice()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            <textarea
              className="modal-note-redesign"
              placeholder="Indicaciones: sin cebolla, salsa aparte..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />

            {/* Fila de acciones: Compartir y Agregar al Pedido */}
            <div className="modal-actions-row">
              <button
                type="button"
                className={`modal-share-btn ${copiedShare ? 'copied' : ''}`}
                onClick={handleShare}
                title="Compartir este plato"
                aria-label="Compartir este plato"
              >
                {copiedShare ? <Check size={16} /> : <Share2 size={16} />}
                <span>{copiedShare ? '¡Copiado!' : 'Compartir'}</span>
              </button>

              <button
                type="button"
                className="modal-submit-btn"
                onClick={handleSubmit}
              >
                <ShoppingCart size={18} />
                <span>
                  {initialQuantity > 0 ? 'Actualizar' : 'Agregar al Pedido'}
                </span>
                {dish.price > 0 && (
                  <span className="modal-submit-price">${subtotal}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flechas de navegación en la parte inferior fuera del modal */}
      {(onPrevDish || onNextDish) && (
        <div className="modal-bottom-nav">
          <button
            type="button"
            className="modal-nav-bottom-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onPrevDish) onPrevDish();
            }}
            aria-label="Plato anterior"
            title="Plato anterior (Flecha izquierda)"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            <span>Anterior</span>
          </button>

          <button
            type="button"
            className="modal-nav-bottom-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onNextDish) onNextDish();
            }}
            aria-label="Siguiente plato"
            title="Siguiente plato (Flecha derecha)"
          >
            <span>Siguiente</span>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
