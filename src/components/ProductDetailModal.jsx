import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { PlateIcon } from './Icons';

export function ProductDetailModal({
  dish,
  initialQuantity = 1,
  initialNote = '',
  onClose,
  onSaveToCart
}) {
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [note, setNote] = useState(initialNote);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  // Bloquear scroll de fondo al abrir el modal
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClosing]);

  if (!dish) return null;

  const hasPhoto = dish.hasImage();
  const subtotal = (dish.price * quantity).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
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
      {/* Contenedor del modal: el botón cerrar está fijado aquí y NUNCA desaparece al hacer scroll */}
      <div
        className={`modal-card-wrapper ${isClosing ? 'modal-content-closing' : 'modal-content-opening'}`}
        onClick={(e) => e.stopPropagation()}
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
        {hasPhoto ? (
          <div className="modal-image-wrap">
            <img
              src={dish.image.startsWith('http') ? dish.image : `./${dish.image.replace(/^\//, '')}`}
              alt={dish.name}
              className="modal-image"
              onError={(e) => {
                if (!e.target.dataset.retried) {
                  e.target.dataset.retried = '1';
                  e.target.src = `${import.meta.env.BASE_URL}${dish.image.replace(/^\//, '')}`;
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
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Disminuir"
              >
                <Minus size={15} />
              </button>
              <span className="modal-qty-value">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
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

          {/* Notas */}
          <textarea
            className="modal-note-redesign"
            placeholder="Indicaciones: sin cebolla, salsa aparte..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />

          {/* Botón agregar / actualizar con icono de carrito */}
          <button
            type="button"
            className="modal-submit-btn"
            onClick={handleSubmit}
          >
            <ShoppingCart size={18} />
            <span>
              {initialQuantity > 0 ? 'Actualizar Pedido' : 'Agregar al Pedido'}
            </span>
            {dish.price > 0 && (
              <span className="modal-submit-price">${subtotal}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
