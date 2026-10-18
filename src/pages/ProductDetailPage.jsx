import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Minus, ShoppingBag, ShoppingCart, Share2, 
  Check, ChevronLeft, ChevronRight, Sparkles, Utensils
} from 'lucide-react';
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
  const [addedToast, setAddedToast] = useState('');

  // Estado de acompañamientos seleccionados en la página: { [dishId]: quantity }
  const [selectedAccompaniments, setSelectedAccompaniments] = useState({});

  // Referencia al contenedor del carrusel para botones de desplazamiento suave
  const carouselRef = useRef(null);

  // Sincronización de Open Graph y Metadatos en el <head>
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!dish) return;

    const priceText = dish.getFormattedPrice();
    const ogTitle = `${dish.name} (${priceText}) — Mi Barrunto`;
    const ogDesc = dish.nameEn 
      ? `${dish.nameEn}. ¡Pruébalo en Mi Barrunto, auténtica comida criolla y marina en Paterson, NJ!`
      : `${dish.name} preparado al momento con los mejores ingredientes en Mi Barrunto. ¡Pide en línea!`;
    
    // Obtener imagen absoluta
    const imagePath = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);
    const ogImage = imagePath 
      ? (imagePath.startsWith('http') ? imagePath : `${window.location.origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`)
      : `${window.location.origin}/logo/logo.png`;
    
    const pageUrl = window.location.href;

    document.title = ogTitle;

    const setMetaTag = (attr, key, content) => {
      let meta = document.querySelector(`meta[${attr}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('name', 'description', ogDesc);
    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDesc);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:image:secure_url', ogImage);
    setMetaTag('property', 'og:url', pageUrl);
    setMetaTag('property', 'og:type', 'restaurant.menu_item');
    setMetaTag('property', 'product:price:amount', dish.price ? dish.price.toFixed(2) : '0.00');
    setMetaTag('property', 'product:price:currency', 'USD');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', ogTitle);
    setMetaTag('name', 'twitter:description', ogDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // Resetear estados locales para el nuevo plato
    const currentInCart = cart ? cart.getItem(dish.id) : null;
    setQuantity(currentInCart ? currentInCart.quantity : 1);
    setNote(currentInCart?.note || '');
    setCopiedShare(false);
    setSelectedAccompaniments({});
  }, [dish?.id, photoMode]);

  // Lista de Acompañamientos Recomendados (Bebidas + Postres Tradicionales Peruanos)
  const accompaniments = useMemo(() => {
    if (!dish) return [];
    
    // IDs de bebidas auténticas y postres caseros de alta demanda
    let targetIds;
    if (dish.category === 'bebidas') {
      targetIds = [240, 241, 242, 243, 247, 248, 170, 71];
    } else if (dish.category === 'postres') {
      targetIds = [238, 235, 233, 234, 236, 237];
    } else {
      targetIds = [238, 235, 233, 234, 240, 241, 242, 243, 247, 248, 236, 237];
    }

    return targetIds
      .filter((id) => id !== dish.id)
      .map((id) => menuRepository.getDishById(id))
      .filter(Boolean);
  }, [dish]);

  // Platos de la misma categoría para la sección "Más especialidades de..."
  const relatedDishes = useMemo(() => {
    if (!dish) return [];
    const list = (menuRepository.getDishesByCategory && menuRepository.getDishesByCategory(dish.category)) || [];
    return list
      .filter((d) => d.id !== dish.id)
      .slice(0, 6);
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

  // Manejador para agregar / quitar acompañamiento en el carrusel
  const handleToggleAccompaniment = (accDish, delta) => {
    triggerHaptic(12);
    setSelectedAccompaniments((prev) => {
      const current = prev[accDish.id] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[accDish.id];
      } else {
        copy[accDish.id] = next;
      }
      return copy;
    });
  };

  // Cálculo en tiempo real de subtotales
  const mainDishSubtotal = dish ? dish.price * quantity : 0;
  
  const accompanimentsSubtotal = useMemo(() => {
    let sum = 0;
    for (const [idStr, qty] of Object.entries(selectedAccompaniments)) {
      if (qty > 0) {
        const item = menuRepository.getDishById(idStr);
        if (item) sum += item.price * qty;
      }
    }
    return sum;
  }, [selectedAccompaniments]);

  const totalSelectedAccompanimentsCount = useMemo(() => {
    return Object.values(selectedAccompaniments).reduce((a, b) => a + b, 0);
  }, [selectedAccompaniments]);

  const grandTotal = mainDishSubtotal + accompanimentsSubtotal;

  const handleShare = async () => {
    triggerHaptic(15);
    const shareUrl = window.location.href;
    const shareText = `¡Mira este delicioso plato en Mi Barrunto! ${dish.name} (${dish.getFormattedPrice()}) - ${dish.nameEn || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dish.name} (${dish.getFormattedPrice()}) — Mi Barrunto`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {}
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    } catch {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
    }
  };

  const handleMainAddToCart = () => {
    triggerHaptic(20);
    // 1. Agregar plato principal
    onAddToCart(dish, quantity, note);

    // 2. Agregar cada acompañamiento seleccionado
    for (const [idStr, qty] of Object.entries(selectedAccompaniments)) {
      if (qty > 0) {
        const accItem = menuRepository.getDishById(idStr);
        if (accItem) {
          onAddToCart(accItem, qty, '');
        }
      }
    }

    const toastText = totalSelectedAccompanimentsCount > 0
      ? `¡${dish.name} y ${totalSelectedAccompanimentsCount} acompañamiento(s) agregados al pedido!`
      : `¡${dish.name} agregado a tu pedido!`;

    setAddedToast(toastText);
    setTimeout(() => setAddedToast(''), 3000);

    // Limpiar acompañamientos seleccionados para el siguiente plato
    setSelectedAccompaniments({});
  };

  const handleQuickAddRelated = (targetDish) => {
    triggerHaptic(15);
    onAddToCart(targetDish, 1, '');
    setAddedToast(`¡${targetDish.name} agregado a tu pedido!`);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const handleNavigateDish = (targetDish) => {
    triggerHaptic(12);
    navigate(`/plato/${targetDish.id}`);
  };

  const handleScrollCarousel = (direction) => {
    triggerHaptic(10);
    if (!carouselRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
  const isDishInCart = cart && cart.getItem(dish.id);
  const cartTotalCount = cart ? cart.getTotalCount() : 0;

  return (
    <div className="product-page-container">
      {/* 1. Barra Superior Autónoma y Minimalista */}
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
          {/* Botón Mi Pedido rápido con contador */}
          <button
            type="button"
            className={`product-page-top-cart-btn ${cartTotalCount > 0 ? 'has-items' : ''}`}
            onClick={onOpenCart}
            aria-label="Abrir mi pedido"
            title="Abrir mi pedido"
          >
            <ShoppingBag size={17} />
            <span className="product-page-top-cart-text">Mi Pedido</span>
            {cartTotalCount > 0 && (
              <span className="product-page-top-cart-badge">{cartTotalCount}</span>
            )}
          </button>

          {/* Botón Compartir con soporte Open Graph */}
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

          {/* Navegación anterior / siguiente entre platos */}
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

      {/* 2. Hero Showcase del Plato Principal */}
      <div className="product-page-hero-grid">
        {/* Imagen en Alta Resolución con Badge */}
        <div className="product-page-media">
          {hasPhoto && currentImage ? (
            <div className="product-page-image-box">
              <img
                src={currentImage}
                alt={`${dish.name} — Mi Barrunto`}
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

        {/* Detalles, Precio, Cantidad e Indicaciones */}
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
                  Subtotal: ${(dish.price * quantity).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stepper de Cantidad para el Plato Principal */}
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

          {/* Indicaciones especiales para cocina */}
          <div className="product-page-notes-block">
            <label htmlFor="dish-note" className="product-page-notes-label">
              Indicaciones especiales para cocina (opcional):
            </label>
            <textarea
              id="dish-note"
              className="product-page-textarea"
              placeholder="Ejemplo: sin cebolla, ají de huacatay aparte, término medio..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Resumen de Inversión y Botón de Agregar Todo al Pedido */}
          <div className="product-page-action-box">
            {totalSelectedAccompanimentsCount > 0 && (
              <div className="product-page-combined-breakdown">
                <div className="breakdown-line">
                  <span>{dish.name} (x{quantity})</span>
                  <span>${mainDishSubtotal.toFixed(2)}</span>
                </div>
                <div className="breakdown-line">
                  <span>{totalSelectedAccompanimentsCount} acompañamiento(s)</span>
                  <span>+${accompanimentsSubtotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="product-page-add-btn"
              onClick={handleMainAddToCart}
            >
              <ShoppingCart size={20} />
              <span>
                {totalSelectedAccompanimentsCount > 0
                  ? `Agregar Todo a Mi Pedido (${1 + totalSelectedAccompanimentsCount})`
                  : isDishInCart
                    ? 'Actualizar en Mi Pedido'
                    : 'Agregar a Mi Pedido'}
              </span>
              <span className="product-page-add-total">${grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sección: Acompáñalo con (Carrusel Dinámico de Bebidas & Postres con Imagen Circular) */}
      {accompaniments.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <Sparkles size={20} className="product-page-section-icon" />
              <h2 className="product-page-section-title">Acompáñalo con</h2>
            </div>
            <div className="product-page-section-sub-row">
              <span className="product-page-section-sub">
                Bebidas y postres peruanos para complementar tu plato. Selecciona varios y se sumarán a tu pedido.
              </span>
              <div className="product-page-carousel-controls">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => handleScrollCarousel('left')}
                  aria-label="Desplazar a la izquierda"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => handleScrollCarousel('right')}
                  aria-label="Desplazar a la derecha"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Track del Carrusel */}
          <div className="product-page-accompaniments-carousel" ref={carouselRef}>
            {accompaniments.map((accItem) => {
              const accHasPhoto = accItem.hasImage(photoMode);
              const accImage = accItem.getResolvedImage ? accItem.getResolvedImage(photoMode) : accItem.getImage(photoMode);
              const selectedCount = selectedAccompaniments[accItem.id] || 0;
              const isSelected = selectedCount > 0;

              return (
                <div
                  key={accItem.id}
                  className={`accompaniment-circular-card ${isSelected ? 'is-selected' : ''}`}
                >
                  {/* Imagen Circular */}
                  <div className="accompaniment-circle-avatar-wrap">
                    {accHasPhoto && accImage ? (
                      <img
                        src={accImage}
                        alt={accItem.name}
                        className="accompaniment-circle-avatar"
                        loading="lazy"
                      />
                    ) : (
                      <div className="accompaniment-circle-placeholder">
                        <PlateIcon size={34} />
                      </div>
                    )}
                    {isSelected && (
                      <span className="accompaniment-circle-check">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Nombre y Precio */}
                  <div className="accompaniment-circle-meta">
                    <h4 className="accompaniment-circle-name">{accItem.name}</h4>
                    <span className="accompaniment-circle-price">{accItem.getFormattedPrice()}</span>
                  </div>

                  {/* Controles de Selección Directa (Poner / Quitar) */}
                  <div className="accompaniment-circle-actions">
                    {isSelected ? (
                      <div className="accompaniment-stepper">
                        <button
                          type="button"
                          className="acc-stepper-btn"
                          onClick={() => handleToggleAccompaniment(accItem, -1)}
                          aria-label={`Quitar ${accItem.name}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="acc-stepper-count">{selectedCount}</span>
                        <button
                          type="button"
                          className="acc-stepper-btn"
                          onClick={() => handleToggleAccompaniment(accItem, 1)}
                          aria-label={`Añadir otro ${accItem.name}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="accompaniment-add-pill-btn"
                        onClick={() => handleToggleAccompaniment(accItem, 1)}
                        aria-label={`Añadir ${accItem.name}`}
                      >
                        <Plus size={14} />
                        <span>Añadir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Sección: Más especialidades de la Categoría con Nuevo Diseño Editorial de Card */}
      {relatedDishes.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <Utensils size={20} className="product-page-section-icon" />
              <h2 className="product-page-section-title">
                Más especialidades de {dish.categoryName || dish.category}
              </h2>
            </div>
            <span className="product-page-section-sub">
              Otras delicias preparadas con el auténtico sazón criollo y marino
            </span>
          </div>

          <div className="product-page-editorial-grid">
            {relatedDishes.map((relDish) => {
              const relHasPhoto = relDish.hasImage(photoMode);
              const relImage = relDish.getResolvedImage ? relDish.getResolvedImage(photoMode) : relDish.getImage(photoMode);

              return (
                <article
                  key={relDish.id}
                  className="product-page-editorial-card"
                  onClick={() => handleNavigateDish(relDish)}
                  title={`Ver detalle de ${relDish.name}`}
                >
                  <div className="editorial-card-media">
                    {relHasPhoto && relImage ? (
                      <img
                        src={relImage}
                        alt={relDish.name}
                        className="editorial-card-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="editorial-card-placeholder">
                        <PlateIcon size={36} />
                      </div>
                    )}
                    <span className="editorial-card-tag">
                      {relDish.categoryName || relDish.category}
                    </span>
                  </div>

                  <div className="editorial-card-content">
                    <h3 className="editorial-card-title">{relDish.name}</h3>
                    {relDish.nameEn && (
                      <p className="editorial-card-desc">{relDish.nameEn}</p>
                    )}
                    <div className="editorial-card-footer">
                      <span className="editorial-card-price">{relDish.getFormattedPrice()}</span>
                      <button
                        type="button"
                        className="editorial-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAddRelated(relDish);
                        }}
                        title={`Agregar ${relDish.name} al pedido`}
                      >
                        <Plus size={15} />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Toast Flotante de confirmación de agregado */}
      {addedToast && (
        <div className="product-page-floating-toast">
          <Check size={18} />
          <span>{addedToast}</span>
        </div>
      )}
    </div>
  );
}
