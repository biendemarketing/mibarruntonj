import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Share2, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PlateIcon } from '../components/Icons';
import { menuRepository } from '../services/MenuRepository';
import { triggerHaptic } from '../utils/haptics';

export function ProductDetailPage({
  dish: propDish,
  photoMode = 'curated',
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  onBack
}) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  // Resolver ID de forma robusta: param de router, prop o extracción de pathname
  const resolvedId = useMemo(() => {
    if (paramId) return paramId;
    if (propDish && propDish.id) return String(propDish.id);
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/plato\/([^/?#]+)/);
      if (match && match[1]) return match[1];
    }
    return null;
  }, [paramId, propDish]);

  // Resolver plato desde props o desde repositorio OOP
  const dish = useMemo(() => {
    if (propDish && (!resolvedId || String(propDish.id) === String(resolvedId))) {
      return propDish;
    }
    if (resolvedId) {
      return menuRepository.getDishById(resolvedId) || null;
    }
    return null;
  }, [propDish, resolvedId]);

  const cartItem = dish && cart ? cart.getItem(dish.id) : null;
  const initialQty = cartItem ? cartItem.quantity : 1;
  const [quantity, setQuantity] = useState(initialQty > 0 ? initialQty : 1);
  const [note, setNote] = useState(cartItem?.note || '');
  const [copiedShare, setCopiedShare] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (dish) {
      document.title = `${dish.name} — Mi Barrunto`;
      const currentInCart = cart ? cart.getItem(dish.id) : null;
      setQuantity(currentInCart ? currentInCart.quantity : 1);
      setNote(currentInCart?.note || '');
      setCopiedShare(false);
    }
  }, [dish?.id]);

  // Platos de la misma categoría para la sección "Otros platos recomendados"
  const relatedDishes = useMemo(() => {
    if (!dish) return [];
    const list = (menuRepository.getDishesByCategory && menuRepository.getDishesByCategory(dish.category)) || [];
    return list
      .filter((d) => d.id !== dish.id)
      .slice(0, 4);
  }, [dish]);

  // Bebidas recomendadas para maridar este plato
  const recommendedBeverages = useMemo(() => {
    if (!dish) return [];
    if (dish.category === 'bebidas') {
      const ceviches = (menuRepository.getDishesByCategory && menuRepository.getDishesByCategory('ceviches')) || [];
      return ceviches.slice(0, 4);
    }
    const bevIds = [238, 235, 234, 236]; // Inca Kola 2L, Agua de Maracuyá, Agua de Manzana, Agua de Piña
    return bevIds.map((bid) => menuRepository.getDishById(bid)).filter(Boolean);
  }, [dish]);

  // Navegación anterior / siguiente entre platos
  const { prevDish, nextDish } = useMemo(() => {
    if (!dish) return { prevDish: null, nextDish: null };
    const all = menuRepository.getAllDishes();
    const idx = all.findIndex((d) => d.id === dish.id);
    return {
      prevDish: idx > 0 ? all[idx - 1] : all[all.length - 1],
      nextDish: idx < all.length - 1 ? all[idx + 1] : all[0]
    };
  }, [dish]);

  const handleShare = async () => {
    triggerHaptic(15);
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish.name} — Mi Barrunto`,
          text: `¡Mira este delicioso plato en Mi Barrunto! ${dish.name} (${dish.getFormattedPrice()})`,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {}
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    } catch {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    }
  };

  const handleMainAddToCart = () => {
    triggerHaptic(20);
    onAddToCart(dish, quantity, note);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleQuickAdd = (targetDish) => {
    triggerHaptic(15);
    onAddToCart(targetDish, 1, '');
  };

  const handleNavigateDish = (targetDish) => {
    triggerHaptic(12);
    navigate(`/plato/${targetDish.id}`);
  };

  const handleBackToCatalog = () => {
    triggerHaptic(10);
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (!dish) {
    return (
      <div className="product-page-container">
        <div className="product-page-not-found">
          <h2>Plato no encontrado</h2>
          <p>El plato seleccionado no está disponible en la carta actual.</p>
          <button
            type="button"
            className="product-page-back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={18} />
            <span>Volver a la Carta Principal</span>
          </button>
        </div>
      </div>
    );
  }

  const hasPhoto = dish.hasImage(photoMode);
  const currentImage = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
  const subtotal = (dish.price * quantity).toFixed(2);
  const isDishInCart = cart && cart.getItem(dish.id);

  return (
    <div className="product-page-container">
      {/* 1. Barra Superior de Navegación y Acciones */}
      <div className="product-page-top-bar">
        <button
          type="button"
          className="product-page-back-btn"
          onClick={handleBackToCatalog}
          aria-label="Volver a la carta"
        >
          <ArrowLeft size={18} />
          <span>Volver a la Carta</span>
        </button>

        <div className="product-page-top-actions">
          <button
            type="button"
            className={`product-page-share-btn ${copiedShare ? 'copied' : ''}`}
            onClick={handleShare}
            aria-label="Compartir este plato"
            title="Compartir este plato"
          >
            {copiedShare ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedShare ? '¡Enlace Copiado!' : 'Compartir'}</span>
          </button>

          {/* Flechas de navegación entre platos */}
          <div className="product-page-stepper-nav">
            {prevDish && (
              <button
                type="button"
                className="product-page-nav-arrow"
                onClick={() => handleNavigateDish(prevDish)}
                title={`Anterior: ${prevDish.name}`}
                aria-label="Plato anterior"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {nextDish && (
              <button
                type="button"
                className="product-page-nav-arrow"
                onClick={() => handleNavigateDish(nextDish)}
                title={`Siguiente: ${nextDish.name}`}
                aria-label="Siguiente plato"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sección Principal del Plato (Hero Showcase) */}
      <div className="product-page-hero-grid">
        {/* Columna Izquierda: Imagen en Alta Calidad */}
        <div className="product-page-media">
          {hasPhoto && currentImage ? (
            <div className="product-page-image-box">
              <img
                src={currentImage}
                alt={`${dish.name} — Especialidad de Mi Barrunto en Paterson, NJ`}
                className="product-page-img"
                loading="eager"
              />
              <span className="product-page-category-tag">
                {dish.categoryName || dish.category}
              </span>
            </div>
          ) : (
            <div className="product-page-placeholder-box">
              <PlateIcon size={88} className="product-page-placeholder-icon" />
              <span className="product-page-category-tag">
                {dish.categoryName || dish.category}
              </span>
            </div>
          )}
        </div>

        {/* Columna Derecha: Información y Configuración del Pedido */}
        <div className="product-page-details-card">
          <div className="product-page-header-group">
            <h1 className="product-page-title">{dish.name}</h1>
            {dish.nameEn && (
              <p className="product-page-subtitle-en">{dish.nameEn}</p>
            )}
          </div>

          <div className="product-page-price-row">
            <div className="product-page-price-main">
              <span className="product-page-price-amount">{dish.getFormattedPrice()}</span>
              {dish.price > 0 && quantity > 1 && (
                <span className="product-page-subtotal-badge">
                  Subtotal: ${subtotal}
                </span>
              )}
            </div>

            {/* Stepper de Cantidad */}
            <div className="product-page-qty-control">
              <button
                type="button"
                className="product-page-qty-btn"
                onClick={() => {
                  triggerHaptic(10);
                  setQuantity(Math.max(1, quantity - 1));
                }}
                aria-label="Disminuir cantidad"
              >
                <Minus size={16} />
              </button>
              <span className="product-page-qty-number">{quantity}</span>
              <button
                type="button"
                className="product-page-qty-btn"
                onClick={() => {
                  triggerHaptic(10);
                  setQuantity(quantity + 1);
                }}
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Indicaciones especiales / Notas */}
          <div className="product-page-notes-block">
            <label htmlFor="dish-note" className="product-page-notes-label">
              Indicaciones especiales para cocina (opcional):
            </label>
            <textarea
              id="dish-note"
              className="product-page-textarea"
              placeholder="Ejemplo: sin cebolla, salsa de ají aparte, bien cocido..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botón Principal de Agregar al Pedido */}
          <button
            type="button"
            className="product-page-add-btn"
            onClick={handleMainAddToCart}
          >
            <ShoppingCart size={20} />
            <span>
              {isDishInCart ? 'Actualizar en Mi Pedido' : 'Agregar a Mi Pedido'}
            </span>
            {dish.price > 0 && (
              <span className="product-page-add-total">${subtotal}</span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Sección: Bebidas Recomendadas para Acompañar (Maridaje) */}
      {recommendedBeverages.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <Sparkles size={20} className="product-page-section-icon" />
              <h2 className="product-page-section-title">
                {dish.category === 'bebidas' ? 'Platos ideales para acompañar' : 'Bebidas peruanas para acompañar'}
              </h2>
            </div>
            <span className="product-page-section-sub">
              El complemento tradicional para disfrutar tu experiencia
            </span>
          </div>

          <div className="product-page-cards-grid">
            {recommendedBeverages.map((bev) => {
              const bevHasPhoto = bev.hasImage(photoMode);
              const bevImage = bev.getResolvedImage ? bev.getResolvedImage(photoMode) : bev.getImage(photoMode);
              const inCartCount = cart ? cart.getItemQuantity(bev.id) : 0;

              return (
                <div key={bev.id} className="product-page-recom-card">
                  <div
                    className="product-page-recom-img-box"
                    onClick={() => handleNavigateDish(bev)}
                    title={`Ver detalle de ${bev.name}`}
                  >
                    {bevHasPhoto && bevImage ? (
                      <img
                        src={bevImage}
                        alt={bev.name}
                        className="product-page-recom-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-page-recom-placeholder">
                        <PlateIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="product-page-recom-info">
                    <h3
                      className="product-page-recom-name"
                      onClick={() => handleNavigateDish(bev)}
                    >
                      {bev.name}
                    </h3>
                    {bev.nameEn && (
                      <p className="product-page-recom-name-en">{bev.nameEn}</p>
                    )}
                    <div className="product-page-recom-bottom">
                      <span className="product-page-recom-price">{bev.getFormattedPrice()}</span>
                      <button
                        type="button"
                        className="product-page-recom-add-btn"
                        onClick={() => handleQuickAdd(bev)}
                        title={`Añadir ${bev.name} a mi pedido`}
                      >
                        <Plus size={14} />
                        <span>{inCartCount > 0 ? `Añadir (+${inCartCount})` : 'Añadir'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Sección: Otros Platos Recomendados de la misma Categoría */}
      {relatedDishes.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <h2 className="product-page-section-title">
                Más especialidades de {dish.categoryName || dish.category}
              </h2>
            </div>
            <span className="product-page-section-sub">
              Otras opciones deliciosas que te pueden encantar
            </span>
          </div>

          <div className="product-page-cards-grid">
            {relatedDishes.map((relDish) => {
              const relHasPhoto = relDish.hasImage(photoMode);
              const relImage = relDish.getResolvedImage ? relDish.getResolvedImage(photoMode) : relDish.getImage(photoMode);

              return (
                <div
                  key={relDish.id}
                  className="product-page-recom-card"
                  onClick={() => handleNavigateDish(relDish)}
                  title={`Ver detalle de ${relDish.name}`}
                >
                  <div className="product-page-recom-img-box">
                    {relHasPhoto && relImage ? (
                      <img
                        src={relImage}
                        alt={relDish.name}
                        className="product-page-recom-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-page-recom-placeholder">
                        <PlateIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="product-page-recom-info">
                    <h3 className="product-page-recom-name">{relDish.name}</h3>
                    {relDish.nameEn && (
                      <p className="product-page-recom-name-en">{relDish.nameEn}</p>
                    )}
                    <div className="product-page-recom-bottom">
                      <span className="product-page-recom-price">{relDish.getFormattedPrice()}</span>
                      <button
                        type="button"
                        className="product-page-recom-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(relDish);
                        }}
                        title={`Añadir ${relDish.name} al pedido`}
                      >
                        <Plus size={14} />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Toast Flotante de confirmación de agregado */}
      {addedToast && (
        <div className="product-page-floating-toast">
          <Check size={18} />
          <span>¡Plato agregado a tu pedido con éxito!</span>
        </div>
      )}
    </div>
  );
}
