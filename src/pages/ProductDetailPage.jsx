import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Minus, ShoppingCart, Share2, 
  Check, ChevronLeft, ChevronRight, Utensils, Heart
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
  onBack,
  isFavorite = false,
  onToggleFavorite
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

  // Lista de acompañamientos seleccionados con sus datos completos y subtotales
  const selectedAccompanimentsList = useMemo(() => {
    return Object.entries(selectedAccompaniments)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => {
        const item = menuRepository.getDishById(idStr);
        return item ? { ...item, qty, itemSubtotal: item.price * qty } : null;
      })
      .filter(Boolean);
  }, [selectedAccompaniments]);

  // Cálculo en tiempo real de subtotales
  const mainDishSubtotal = dish ? dish.price * quantity : 0;
  
  const accompanimentsSubtotal = useMemo(() => {
    return selectedAccompanimentsList.reduce((sum, item) => sum + item.itemSubtotal, 0);
  }, [selectedAccompanimentsList]);

  const totalSelectedAccompanimentsCount = useMemo(() => {
    return selectedAccompanimentsList.reduce((sum, item) => sum + item.qty, 0);
  }, [selectedAccompanimentsList]);

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

  const handleMainAddToCart = (e) => {
    triggerHaptic(20);
    // 1. Agregar plato principal
    onAddToCart(dish, quantity, note, e);

    // 2. Agregar cada acompañamiento seleccionado
    for (const item of selectedAccompanimentsList) {
      onAddToCart(item, item.qty, '', e);
    }

    const addedItemsSummary = selectedAccompanimentsList
      .map((item) => `${item.name}${item.qty > 1 ? ` (x${item.qty})` : ''}`)
      .join(', ');

    const toastText = addedItemsSummary
      ? `¡${dish.name} + ${addedItemsSummary} agregados a tu pedido!`
      : `¡${dish.name} agregado a tu pedido!`;

    setAddedToast(toastText);
    setTimeout(() => setAddedToast(''), 3000);

    // Limpiar acompañamientos seleccionados para el siguiente plato
    setSelectedAccompaniments({});
  };

  const handleQuickAddRelated = (targetDish, e) => {
    triggerHaptic(15);
    onAddToCart(targetDish, 1, '', e);
    setAddedToast(`¡${targetDish.name} agregado a tu pedido!`);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const handleUpdateRelatedQuantity = (targetDish, newQty) => {
    triggerHaptic(12);
    if (onUpdateQuantity) {
      onUpdateQuantity(targetDish.id, newQty);
    }
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

  // Botón volver a la carta conecta directamente al Home (/)
  const handleBackToHome = () => {
    triggerHaptic(12);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!dish) {
    return (
      <div className="product-page-container">
        <div className="product-page-not-found">
          <h2>Plato no encontrado</h2>
          <p>El plato seleccionado no está disponible en la carta actual.</p>
          <button
            type="button"
            className="product-page-back-arrow-btn"
            onClick={handleBackToHome}
            aria-label="Volver a la carta principal"
          >
            <ArrowLeft size={22} color="var(--rojo)" strokeWidth={2.6} />
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
      {/* 1. Barra Superior: Flecha Roja al Home al lado de Mi Pedido (solo iconos, sin texto) */}
      <div className="product-page-top-bar">
        <div className="product-page-top-nav-group">
          {/* Botón Volver a la Carta: Solo Flecha Roja que conecta directamente a Home */}
          <button
            type="button"
            className="product-page-back-arrow-btn"
            onClick={handleBackToHome}
            aria-label="Volver a la carta principal"
            title="Volver a la carta principal"
          >
            <ArrowLeft size={22} color="var(--rojo)" strokeWidth={2.6} />
          </button>

          {/* Botón Mi Pedido: Al lado de la flecha roja, solo icono de carrito */}
          <button
            type="button"
            className={`product-page-top-cart-icon-btn ${cartTotalCount > 0 ? 'has-items' : ''}`}
            onClick={onOpenCart}
            aria-label="Ver mi pedido"
            title="Ver mi pedido"
          >
            <ShoppingCart size={20} />
            {cartTotalCount > 0 && (
              <span className="product-page-top-cart-badge">{cartTotalCount}</span>
            )}
          </button>

          {/* Botón Compartir: Solo icono */}
          <button
            type="button"
            className={`product-page-top-share-icon-btn ${copiedShare ? 'copied' : ''}`}
            onClick={handleShare}
            aria-label="Compartir este plato"
            title="Compartir este plato"
          >
            {copiedShare ? <Check size={19} /> : <Share2 size={19} />}
          </button>

          {/* Botón Favoritos: Solo icono */}
          {onToggleFavorite && (
            <button
              type="button"
              className={`product-page-top-fav-btn ${isFavorite ? 'is-fav' : ''}`}
              onClick={() => onToggleFavorite(dish.id)}
              aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              title={isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
            >
              <Heart
                size={19}
                fill={isFavorite ? 'var(--rojo)' : 'none'}
                color={isFavorite ? 'var(--rojo)' : 'currentColor'}
              />
            </button>
          )}
        </div>

        {/* Flechas de navegación entre platos a la derecha */}
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

          {/* Resumen de Inversión y Botón de Ordenar */}
          <div className="product-page-action-box">
            {selectedAccompanimentsList.length > 0 && (
              <div className="product-page-combined-breakdown">
                <div className="breakdown-line">
                  <span>{dish.name} (x{quantity})</span>
                  <span>${mainDishSubtotal.toFixed(2)}</span>
                </div>
                {selectedAccompanimentsList.map((item) => (
                  <div key={item.id} className="breakdown-line breakdown-line-accompaniment">
                    <span className="breakdown-item-name">{item.name} (x{item.qty})</span>
                    <span className="breakdown-item-price">+${item.itemSubtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Botón Ordenar con Icono de Carrito y Total */}
            <button
              type="button"
              className="product-page-add-btn"
              onClick={handleMainAddToCart}
            >
              <ShoppingCart size={20} />
              <span>Ordenar</span>
              <span className="product-page-add-total">${grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sección: Acompáñalo con (Sin fondo en las cards, clic directo en la foto para añadir) */}
      {accompaniments.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <h2 className="product-page-section-title">Acompáñalo con</h2>
            </div>
            <div className="product-page-section-sub-row">
              <span className="product-page-section-sub">
                Toca la foto para añadir bebidas y postres tradicionales a tu pedido
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
                  className={`accompaniment-circular-card-clean ${isSelected ? 'is-selected' : ''}`}
                >
                  {/* Foto Circular: Clic directo para añadir / incrementar */}
                  <div
                    className="accompaniment-circle-avatar-wrap clickable-avatar"
                    onClick={() => handleToggleAccompaniment(accItem, 1)}
                    title={`Toca para añadir ${accItem.name}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleAccompaniment(accItem, 1);
                      }
                    }}
                  >
                    {accHasPhoto && accImage ? (
                      <img
                        src={accImage}
                        alt={accItem.name}
                        className="accompaniment-circle-avatar"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="accompaniment-circle-placeholder">
                        <PlateIcon size={34} />
                      </div>
                    )}
                    {/* Overlay centrado: Signo + centrado por defecto; Overlay rojo con carrito blanco al seleccionarse */}
                    <div 
                      className={`accompaniment-circle-overlay ${isSelected ? 'is-in-cart' : 'is-plus'}`}
                      aria-label={isSelected ? `${accItem.name} en el pedido` : `Añadir ${accItem.name}`}
                    >
                      {isSelected ? (
                        <ShoppingCart size={32} strokeWidth={2.4} className="overlay-cart-icon" />
                      ) : (
                        <Plus size={34} strokeWidth={3} className="overlay-plus-icon" />
                      )}
                    </div>
                  </div>

                  {/* Nombre y Precio */}
                  <div className="accompaniment-circle-meta">
                    <h4 
                      className="accompaniment-circle-name"
                      onClick={() => handleToggleAccompaniment(accItem, 1)}
                    >
                      {accItem.name}
                    </h4>
                    <span className="accompaniment-circle-price">{accItem.getFormattedPrice()}</span>
                  </div>

                  {/* Stepper para quitar o sumar si ya está seleccionado */}
                  {isSelected && (
                    <div className="accompaniment-circle-actions">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Sección: Más especialidades de la Categoría en 2 Columnas */}
      {relatedDishes.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <Utensils size={20} className="product-page-section-icon" />
              <h2 className="product-page-section-title">
                Más {dish.categoryName || dish.category} y especialidades
              </h2>
            </div>
            <span className="product-page-section-sub">
              Otras delicias preparadas con el auténtico sazón criollo y marino
            </span>
          </div>

          <div className="product-page-editorial-grid-2col">
            {relatedDishes.map((relDish) => {
              const relHasPhoto = relDish.hasImage(photoMode);
              const relImage = relDish.getResolvedImage ? relDish.getResolvedImage(photoMode) : relDish.getImage(photoMode);
              const relItemInCart = cart ? cart.getItem(relDish.id) : null;
              const relQty = relItemInCart ? relItemInCart.quantity : 0;

              return (
                <article
                  key={relDish.id}
                  className="product-page-editorial-card-2col"
                  onClick={() => handleNavigateDish(relDish)}
                  title={`Ver detalle de ${relDish.name}`}
                >
                  <div className="editorial-card-media-2col">
                    {relHasPhoto && relImage ? (
                      <img
                        src={relImage}
                        alt={relDish.name}
                        className="editorial-card-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="editorial-card-placeholder">
                        <PlateIcon size={32} />
                      </div>
                    )}
                    <span className="editorial-card-tag-2col">
                      {relDish.categoryName || relDish.category}
                    </span>
                  </div>

                  <div className="editorial-card-content-2col">
                    <h3 className="editorial-card-title-2col">{relDish.name}</h3>
                    {relDish.nameEn && (
                      <p className="editorial-card-desc-2col">{relDish.nameEn}</p>
                    )}
                    <div className="editorial-card-footer-2col" onClick={(e) => e.stopPropagation()}>
                      <span className="editorial-card-price-2col">{relDish.getFormattedPrice()}</span>
                      {relQty > 0 ? (
                        <div className="editorial-card-stepper-2col">
                          <button
                            type="button"
                            className="editorial-stepper-btn"
                            onClick={() => handleUpdateRelatedQuantity(relDish, relQty - 1)}
                            title={`Disminuir cantidad de ${relDish.name}`}
                            aria-label={`Disminuir ${relDish.name}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="editorial-stepper-count">{relQty}</span>
                          <button
                            type="button"
                            className="editorial-stepper-btn"
                            onClick={() => handleUpdateRelatedQuantity(relDish, relQty + 1)}
                            title={`Aumentar cantidad de ${relDish.name}`}
                            aria-label={`Aumentar ${relDish.name}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="editorial-card-btn-2col"
                          onClick={(e) => handleQuickAddRelated(relDish, e)}
                          title={`Agregar ${relDish.name} al pedido`}
                        >
                          <Plus size={14} />
                          <span>Añadir</span>
                        </button>
                      )}
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
