import './ProductDetailPage.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Minus, ShoppingCart, Share2, 
  Check, ChevronLeft, ChevronRight, Utensils, Heart,
  Search, X, Maximize2
} from 'lucide-react';
import { PlateIcon } from '../components/Icons';
import { menuRepository } from '../services/MenuRepository';
import { triggerHaptic } from '../utils/haptics';
import { useLanguage } from '../utils/i18n';

export function ProductDetailPage({
  dish: propDish,
  photoMode = 'complete',
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  onBack,
  isFavorite = false,
  onToggleFavorite
}) {
  const { isEn } = useLanguage();
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  // Resolver ID de forma robusta: param de router, prop o extracción de pathname
  const resolvedId = useMemo(() => {
    if (paramId) return paramId;
    if (propDish && propDish.id) return String(propDish.id);
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const cleanPath = pathname.split('?')[0].split('#')[0];
      const match = cleanPath.match(/\/plato\/([^/?#]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).replace(/\/$/, '').trim();
      }
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Estados de la Barra de Búsqueda superior
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Estados del Lightbox de imágenes a pantalla completa
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxActiveSrc, setLightboxActiveSrc] = useState(null);

  // Variación seleccionada para platos configurables (ej: batidos)
  const [selectedVariation, setSelectedVariation] = useState(() => {
    if (cartItem && cartItem.variation) return cartItem.variation;
    if (dish && dish.variations && dish.variations.length > 0) return dish.variations[0];
    return null;
  });

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
    setSelectedImageIndex(0);
    setSelectedVariation(currentInCart?.variation || (dish?.variations && dish.variations.length > 0 ? dish.variations[0] : null));
  }, [dish?.id, photoMode]);

  // Lista de Acompañamientos Recomendados según tipo de plato y con rotación dinámica
  const accompaniments = useMemo(() => {
    if (!dish) return [];
    
    const isDrinkOrBatido = 
      dish.category === 'bebidas' || 
      dish.category === 'batidos' || 
      dish.subcategory?.toLowerCase().includes('jugo') || 
      dish.subcategory?.toLowerCase().includes('batido') ||
      dish.subcategory?.toLowerCase().includes('bebida');

    const isDessert = dish.category === 'postres';

    let pool = [];

    if (isDrinkOrBatido) {
      pool = [
        196, // Arroz con pollo huancaína + ceviche
        197, // Tallarín Rojo huancaína + ceviche
        199, // Cau-Cau con huancaína + ceviche
        201, // Seco de Costilla + ceviche
        129, // Pollada con huancaína y ensalada
        208, // Pollo chori-broaster
        212, // Pollo broaster mostrito a lo pobre
        50,  // Caldo de gallina con papa amarilla
        62,  // Aguadito de mariscos
        240, // Crema Volteada
        241, // Tres Leches
        242, // Torta de chocolate
        243  // Picarones
      ];
    } else if (isDessert) {
      pool = [
        237, // Emoliente
        238, // Inca Kola 2L
        249, // Jugo de naranja natural
        259, // Batido de Lúcuma
        250, // Batido de Piña
        253, // Batido de Maracuyá
        251, // Batido de Fresa
        254  // Batido de Mango
      ];
    } else {
      pool = [
        250, // Batido de Piña
        251, // Batido de Fresa
        252, // Batido de Papaya
        253, // Batido de Maracuyá
        254, // Batido de Mango
        259, // Batido de Lúcuma
        261, // Batido Surtido Peruano
        249, // Jugo de naranja natural
        238, // Inca Kola 2L
        235, // Agua de maracuyá
        236, // Agua de piña
        237, // Emoliente
        240, // Crema Volteada
        241, // Tres Leches
        242, // Torta de chocolate
        243  // Picarones
      ];
    }

    const offset = Math.abs((dish.id * 5) % pool.length);
    const rotatedPool = [...pool.slice(offset), ...pool.slice(0, offset)];

    return rotatedPool
      .filter((id) => id !== dish.id)
      .map((id) => menuRepository.getDishById(id))
      .filter(Boolean)
      .slice(0, 8);
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

  // Cálculo en tiempo real de subtotales considerando la variación elegida
  const activeUnitPrice = selectedVariation && selectedVariation.price !== undefined
    ? Number(selectedVariation.price)
    : (Number(dish?.price) || 0);
  const activeFormattedPrice = `$${activeUnitPrice.toFixed(2)}`;
  const mainDishSubtotal = activeUnitPrice * quantity;
  
  const accompanimentsSubtotal = useMemo(() => {
    return selectedAccompanimentsList.reduce((sum, item) => sum + item.itemSubtotal, 0);
  }, [selectedAccompanimentsList]);

  const grandTotal = mainDishSubtotal + accompanimentsSubtotal;

  const handleShare = async () => {
    triggerHaptic(15);
    const origin = window.location.origin;
    const shareUrl = `${origin}/plato/${dish ? dish.id : ''}`;
    const shareText = dish 
      ? `¡Mira este delicioso plato en Mi Barrunto! ${dish.name} (${dish.getFormattedPrice()}) - ${dish.nameEn || ''}`
      : '¡Explora la carta oficial de Mi Barrunto!';
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
    onAddToCart(dish, quantity, note, e, selectedVariation);

    for (const item of selectedAccompanimentsList) {
      onAddToCart(item, item.qty, '', e);
    }

    const dishTitle = isEn && dish.nameEn ? dish.nameEn : dish.name;
    const addedItemsSummary = selectedAccompanimentsList
      .map((item) => `${isEn && item.nameEn ? item.nameEn : item.name}${item.qty > 1 ? ` (x${item.qty})` : ''}`)
      .join(', ');

    const varLabel = selectedVariation ? ` (${isEn && selectedVariation.nameEn ? selectedVariation.nameEn : selectedVariation.name})` : '';
    const toastText = addedItemsSummary
      ? (isEn ? `${dishTitle}${varLabel} + ${addedItemsSummary} added to your order!` : `¡${dishTitle}${varLabel} + ${addedItemsSummary} agregados a tu pedido!`)
      : (isEn ? `${dishTitle}${varLabel} added to your order!` : `¡${dishTitle}${varLabel} agregado a tu pedido!`);

    setAddedToast(toastText);
    setTimeout(() => setAddedToast(''), 3000);
    setSelectedAccompaniments({});
  };

  const handleQuickAddRelated = (targetDish, e) => {
    triggerHaptic(15);
    onAddToCart(targetDish, 1, '', e);
    const title = isEn && targetDish.nameEn ? targetDish.nameEn : targetDish.name;
    setAddedToast(isEn ? `${title} added to your order!` : `¡${title} agregado a tu pedido!`);
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

  const handleBack = () => {
    triggerHaptic(12);
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    if (typeof window !== 'undefined' && (window.history.state?.idx > 0 || window.history.length > 1)) {
      navigate(-1);
    } else if (dish?.category && dish.category !== 'todos') {
      navigate(`/categoria/${dish.category}`);
    } else {
      navigate('/');
    }
  };

  const handleBackToHome = () => {
    triggerHaptic(12);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allDishes = useMemo(() => {
    return menuRepository.getAllDishes() || [];
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allDishes
      .filter((d) => {
        const nameMatch = d.name && d.name.toLowerCase().includes(q);
        const nameEnMatch = d.nameEn && d.nameEn.toLowerCase().includes(q);
        const catMatch = (d.categoryName && d.categoryName.toLowerCase().includes(q)) ||
                         (d.categoryNameEn && d.categoryNameEn.toLowerCase().includes(q)) ||
                         (d.category && d.category.toLowerCase().includes(q));
        return nameMatch || nameEnMatch || catMatch;
      })
      .slice(0, 8);
  }, [searchQuery, allDishes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectSearchResult = (targetDish) => {
    triggerHaptic(14);
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(`/plato/${targetDish.id}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleSelectSearchResult(searchResults[0]);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  if (!dish) {
    return (
      <div className="product-page-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(217, 28, 43, 0.12)', display: 'grid', placeItems: 'center', marginBottom: '1.25rem', color: 'var(--rojo)' }}>
          <Utensils size={32} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.6rem', color: '#1f1e1c', letterSpacing: '-0.3px' }}>
          {isEn ? 'Dish not found' : 'Plato no encontrado'}
        </h2>
        <p style={{ color: '#78716c', fontSize: '0.92rem', maxWidth: '380px', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          {isEn ? 'The dish you are looking for is not available. Explore our full menu.' : 'El plato que buscas no se encuentra disponible o el enlace ha cambiado. Te invitamos a explorar nuestra carta oficial completa.'}
        </p>
        <button
          type="button"
          onClick={handleBackToHome}
          style={{
            backgroundColor: 'var(--rojo, #d91c2b)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.95rem',
            padding: '0.9rem 1.8rem',
            borderRadius: '16px',
            border: 'none !important',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(217, 28, 43, 0.35)'
          }}
        >
          {isEn ? 'Explore Full Menu' : 'Explorar Carta Completa'}
        </button>
      </div>
    );
  }

  const hasPhoto = dish.hasImage(photoMode);
  const currentImage = dish.getResolvedImage ? dish.getResolvedImage(photoMode) : dish.getImage(photoMode);

  const galleryImages = useMemo(() => {
    if (!dish) return [];
    const list = [];
    if (currentImage) list.push(currentImage);
    if (Array.isArray(dish.images)) {
      dish.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(dish.variations)) {
      dish.variations.forEach(v => {
        const vImg = v.image || v.localImage;
        if (vImg && !list.includes(vImg)) list.push(vImg);
      });
    }
    return list;
  }, [dish, currentImage]);

  const openLightbox = (index = 0, specificSrc = null) => {
    triggerHaptic(12);
    const safeIdx = index >= 0 && index < galleryImages.length ? index : 0;
    setLightboxIndex(safeIdx);
    const targetSrc = specificSrc || galleryImages[safeIdx] || currentImage || (dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null);
    setLightboxActiveSrc(targetSrc);
    setIsLightboxOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    triggerHaptic(10);
    setIsLightboxOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  const handlePrevLightboxImage = () => {
    triggerHaptic(10);
    setLightboxIndex((prev) => {
      const nextIdx = prev <= 0 ? galleryImages.length - 1 : prev - 1;
      setLightboxActiveSrc(galleryImages[nextIdx] || currentImage);
      return nextIdx;
    });
  };

  const handleNextLightboxImage = () => {
    triggerHaptic(10);
    setLightboxIndex((prev) => {
      const nextIdx = prev >= galleryImages.length - 1 ? 0 : prev + 1;
      setLightboxActiveSrc(galleryImages[nextIdx] || currentImage);
      return nextIdx;
    });
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && galleryImages.length > 1) {
        handlePrevLightboxImage();
      } else if (e.key === 'ArrowRight' && galleryImages.length > 1) {
        handleNextLightboxImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, galleryImages.length]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  const displayImage = galleryImages[selectedImageIndex] || currentImage;
  const cartTotalCount = cart ? cart.getTotalCount() : 0;

  const primaryDishTitle = isEn && dish.nameEn ? dish.nameEn : dish.name;
  const secondaryDishSubtitle = isEn && dish.nameEn ? dish.name : dish.nameEn;
  const dishCategoryLabel = isEn && dish.categoryNameEn ? dish.categoryNameEn : (dish.categoryName || dish.category);

  return (
    <div className="product-page-container">
      {/* 1. Barra Superior: Flecha Volver, Barra de Búsqueda y Acciones Rápidas */}
      <div className="product-page-top-bar">
        <div className="product-page-top-nav-group">
          <button
            type="button"
            className="product-page-back-arrow-btn"
            onClick={handleBack}
            aria-label={isEn ? 'Back to menu' : 'Volver a la carta'}
            title={isEn ? 'Back to menu' : 'Volver a la carta'}
          >
            <ArrowLeft size={22} color="var(--rojo)" strokeWidth={2.6} />
          </button>
        </div>

        {/* Centro: Barra de Búsqueda Interactiva en la Vista de Plato */}
        <div className="product-page-search-container" ref={searchContainerRef}>
          <div className="product-page-search-box">
            <Search size={16} className="product-page-search-icon" />
            <input
              type="text"
              className="product-page-search-input"
              placeholder={isEn ? 'Search other dishes on the menu...' : 'Buscar otros platos en la carta...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              aria-label={isEn ? 'Search menu' : 'Buscar platos en la carta'}
            />
            {searchQuery && (
              <button
                type="button"
                className="product-page-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label={isEn ? 'Clear search' : 'Limpiar búsqueda'}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Flotante de Resultados en Tiempo Real */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="product-page-search-dropdown">
              <div className="product-page-search-dropdown-header">
                <Search size={13} color="var(--rojo)" />
                <span>{isEn ? `Menu results (${searchResults.length})` : `Resultados de la carta (${searchResults.length})`}</span>
              </div>
              {searchResults.length > 0 ? (
                <div className="product-page-search-results-list">
                  {searchResults.map((item) => {
                    const itemImg = item.getResolvedImage ? item.getResolvedImage(photoMode) : item.getImage(photoMode);
                    const itemPrimary = isEn && item.nameEn ? item.nameEn : item.name;
                    const itemSecondary = isEn && item.nameEn ? item.name : item.nameEn;
                    const itemCat = isEn && item.categoryNameEn ? item.categoryNameEn : (item.categoryName || item.category);
                    return (
                      <div
                        key={item.id}
                        className="product-page-search-item"
                        onClick={() => handleSelectSearchResult(item)}
                      >
                        <div className="product-page-search-item-thumb">
                          {itemImg ? (
                            <img src={itemImg} alt={itemPrimary} loading="lazy" />
                          ) : (
                            <PlateIcon size={18} />
                          )}
                        </div>
                        <div className="product-page-search-item-info">
                          <span className="product-page-search-item-name">{itemPrimary}</span>
                          {itemSecondary && (
                            <span className="product-page-search-item-sub">{itemSecondary}</span>
                          )}
                          <span className="product-page-search-item-cat">{itemCat}</span>
                        </div>
                        <span className="product-page-search-item-price">{item.getFormattedPrice()}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="product-page-search-empty">
                  <span>{isEn ? `No dishes found for "${searchQuery}"` : `No se encontraron platos para "${searchQuery}"`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lado Derecho: Acciones de Plato y Navegación Stepper */}
        <div className="product-page-top-actions-group">
          <button
            type="button"
            className={`product-page-top-cart-icon-btn ${cartTotalCount > 0 ? 'has-items' : ''}`}
            onClick={onOpenCart}
            aria-label={isEn ? 'View my order' : 'Ver mi pedido'}
            title={isEn ? 'View my order' : 'Ver mi pedido'}
          >
            <ShoppingCart size={20} />
            {cartTotalCount > 0 && (
              <span className="product-page-top-cart-badge">{cartTotalCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`product-page-top-share-icon-btn ${copiedShare ? 'copied' : ''}`}
            onClick={handleShare}
            aria-label={isEn ? 'Share this dish' : 'Compartir este plato'}
            title={isEn ? 'Share this dish' : 'Compartir este plato'}
          >
            {copiedShare ? <Check size={19} /> : <Share2 size={19} />}
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              className={`product-page-top-fav-btn ${isFavorite ? 'is-fav' : ''}`}
              onClick={() => onToggleFavorite(dish.id)}
              aria-label={isFavorite ? (isEn ? 'Remove from favorites' : 'Quitar de favoritos') : (isEn ? 'Save to favorites' : 'Guardar en favoritos')}
              title={isFavorite ? (isEn ? 'In your favorites' : 'En tus favoritos') : (isEn ? 'Save to favorites' : 'Guardar en favoritos')}
            >
              <Heart
                size={19}
                fill={isFavorite ? 'var(--rojo)' : 'none'}
                color={isFavorite ? 'var(--rojo)' : 'currentColor'}
              />
            </button>
          )}

          <div className="product-page-stepper-nav">
            {prevDish && (
              <button
                type="button"
                className="product-page-nav-arrow"
                onClick={() => handleNavigateDish(prevDish)}
                title={`${isEn ? 'Previous' : 'Anterior'}: ${isEn && prevDish.nameEn ? prevDish.nameEn : prevDish.name}`}
                aria-label={isEn ? 'Previous dish' : 'Plato anterior'}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {nextDish && (
              <button
                type="button"
                className="product-page-nav-arrow"
                onClick={() => handleNavigateDish(nextDish)}
                title={`${isEn ? 'Next' : 'Siguiente'}: ${isEn && nextDish.nameEn ? nextDish.nameEn : nextDish.name}`}
                aria-label={isEn ? 'Next dish' : 'Siguiente plato'}
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hero Showcase del Plato Principal */}
      <div className="product-page-hero-grid">
        {/* Imagen en Alta Resolución con Badge y Galería */}
        <div className="product-page-media">
          {hasPhoto && displayImage ? (
            <div
              className="product-page-image-box"
              onClick={(e) => {
                const imgEl = e.currentTarget.querySelector('img');
                const loadedSrc = (imgEl && imgEl.currentSrc) || (imgEl && imgEl.src) || displayImage;
                openLightbox(selectedImageIndex, loadedSrc);
              }}
              style={{ cursor: 'zoom-in', position: 'relative' }}
              title={isEn ? 'Click to enlarge photo' : 'Haz clic para ampliar la foto'}
            >
              <img
                src={displayImage}
                alt={`${primaryDishTitle} — Mi Barrunto`}
                className="product-page-img"
                loading="eager"
                onError={(e) => {
                  const fallback = dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null;
                  if (fallback && e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
              <span className="product-page-category-tag">
                {dishCategoryLabel}
              </span>

              <button
                type="button"
                className="product-page-image-zoom-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  const container = e.currentTarget.closest('.product-page-image-box');
                  const imgEl = container ? container.querySelector('img') : null;
                  const loadedSrc = (imgEl && imgEl.currentSrc) || (imgEl && imgEl.src) || displayImage;
                  openLightbox(selectedImageIndex, loadedSrc);
                }}
                title={isEn ? 'Enlarge image fullscreen' : 'Ampliar imagen a pantalla completa'}
                aria-label={isEn ? 'Enlarge image' : 'Ampliar imagen'}
              >
                <Maximize2 size={14} />
                <span>{isEn ? 'Zoom' : 'Ampliar'}</span>
              </button>
            </div>
          ) : (
            <div className="product-page-placeholder-box">
              <PlateIcon size={88} className="product-page-placeholder-icon" />
              <span className="product-page-category-tag">
                {dishCategoryLabel}
              </span>
            </div>
          )}

          {galleryImages.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem'
              }}
            >
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setSelectedImageIndex(idx);
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#1c1d22',
                    cursor: 'pointer',
                    border: 'none !important',
                    boxShadow: selectedImageIndex === idx 
                      ? '0 0 0 2px var(--rojo, #d91c2b), 0 4px 12px rgba(217, 28, 43, 0.4)' 
                      : '0 2px 8px rgba(0,0,0,0.25)',
                    opacity: selectedImageIndex === idx ? 1 : 0.6,
                    padding: 0,
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                  title={isEn ? `View photo ${idx + 1}` : `Ver foto ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${primaryDishTitle} foto ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles, Precio, Cantidad e Indicaciones */}
        <div className="product-page-details-card">
          <div className="product-page-header-group">
            <h1 className="product-page-title">{primaryDishTitle}</h1>
            {secondaryDishSubtitle && (
              <p className="product-page-subtitle-en">{secondaryDishSubtitle}</p>
            )}
            {dish.category !== 'batidos' && dish.glosa && dish.glosa !== dish.nameEn && (
              <p className="product-page-glosa-text">{dish.glosa}</p>
            )}
          </div>

          {/* Variaciones de Base (Batidos: Agua/Leche regular vs Leche Carnation) */}
          {dish.variations && dish.variations.length > 0 && (
            <div className="product-page-variations-section">
              <h3 className="product-page-variations-title">
                <span>{isEn ? 'Choose your base' : 'Elige tu base'}</span>
                <span className="product-page-variations-sub-title">{isEn ? '(Elige tu base)' : '(Choose your base)'}</span>
              </h3>
              <div className="product-page-variations-list">
                {dish.variations.map((v) => {
                  const isSelected = selectedVariation?.id === v.id;
                  const varImg = v.image || v.localImage;
                  const vPrimary = isEn && v.nameEn ? v.nameEn : v.name;
                  const vSecondary = isEn && v.nameEn ? v.name : v.nameEn;
                  return (
                    <div
                      key={v.id}
                      className={`product-page-variation-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        triggerHaptic(12);
                        setSelectedVariation(v);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          triggerHaptic(12);
                          setSelectedVariation(v);
                        }
                      }}
                    >
                      <div className="variation-radio-indicator">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <circle cx="11" cy="11" r="10" stroke={isSelected ? 'var(--rojo, #d91c2b)' : 'var(--text-muted, #8e8e93)'} strokeWidth="2" />
                          {isSelected && (
                            <circle cx="11" cy="11" r="5.5" fill="var(--rojo, #d91c2b)" />
                          )}
                        </svg>
                      </div>

                      {varImg && (
                        <div className="variation-thumbnail-box">
                          <img
                            src={varImg}
                            alt={vPrimary}
                            className="variation-thumbnail-img"
                            onError={(e) => {
                              if (v.localImage && e.currentTarget.src !== v.localImage) {
                                e.currentTarget.src = v.localImage;
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="variation-text-col">
                        <span className="variation-name">{vPrimary}</span>
                        {vSecondary && vSecondary !== vPrimary && (
                          <span className="variation-en-desc">{vSecondary}</span>
                        )}
                      </div>

                      <div className="variation-price-col">
                        <span className="variation-price-tag">
                          {v.priceDisplay || `$${Number(v.price).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="product-page-price-row">
            <div className="product-page-price-main">
              <span className="product-page-price-amount">{activeFormattedPrice}</span>
              {activeUnitPrice > 0 && quantity > 1 && (
                <span className="product-page-subtotal-badge">
                  Subtotal: ${(activeUnitPrice * quantity).toFixed(2)}
                </span>
              )}
            </div>

            <div className="product-page-qty-control">
              <button
                type="button"
                className="product-page-qty-btn"
                onClick={() => {
                  triggerHaptic(10);
                  setQuantity(Math.max(1, quantity - 1));
                }}
                aria-label={isEn ? 'Decrease quantity' : 'Disminuir cantidad'}
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
                aria-label={isEn ? 'Increase quantity' : 'Aumentar cantidad'}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Indicaciones especiales para cocina */}
          <div className="product-page-notes-block">
            <label htmlFor="dish-note" className="product-page-notes-label">
              {isEn ? 'Special instructions for the kitchen (optional):' : 'Indicaciones especiales para cocina (opcional):'}
            </label>
            <textarea
              id="dish-note"
              className="product-page-textarea"
              placeholder={isEn ? 'Example: no onions, sauce on the side, medium rare...' : 'Ejemplo: sin cebolla, ají de huacatay aparte, término medio...'}
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
                  <span>{primaryDishTitle}{selectedVariation ? ` (${isEn && selectedVariation.nameEn ? selectedVariation.nameEn : selectedVariation.name})` : ''} (x{quantity})</span>
                  <span>${mainDishSubtotal.toFixed(2)}</span>
                </div>
                {selectedAccompanimentsList.map((item) => (
                  <div key={item.id} className="breakdown-line breakdown-line-accompaniment">
                    <span className="breakdown-item-name">{isEn && item.nameEn ? item.nameEn : item.name} (x{item.qty})</span>
                    <span className="breakdown-item-price">+${item.itemSubtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="product-page-add-btn"
              onClick={handleMainAddToCart}
            >
              <ShoppingCart size={20} />
              <span>{isEn ? 'Order' : 'Ordenar'}</span>
              <span className="product-page-add-total">${grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sección: Acompáñalo con */}
      {accompaniments.length > 0 && (
        <section className="product-page-section">
          <div className="product-page-section-header">
            <div className="product-page-section-title-wrap">
              <h2 className="product-page-section-title">{isEn ? 'Pair it with' : 'Acompáñalo con'}</h2>
            </div>
            <div className="product-page-section-sub-row">
              <span className="product-page-section-sub">
                {isEn ? 'Tap the photo to add traditional drinks and desserts to your order' : 'Toca la foto para añadir bebidas y postres tradicionales a tu pedido'}
              </span>
              <div className="product-page-carousel-controls">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => handleScrollCarousel('left')}
                  aria-label={isEn ? 'Scroll left' : 'Desplazar a la izquierda'}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => handleScrollCarousel('right')}
                  aria-label={isEn ? 'Scroll right' : 'Desplazar a la derecha'}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="product-page-accompaniments-carousel" ref={carouselRef}>
            {accompaniments.map((accItem) => {
              const accHasPhoto = accItem.hasImage(photoMode);
              const accImage = accItem.getResolvedImage ? accItem.getResolvedImage(photoMode) : accItem.getImage(photoMode);
              const selectedCount = selectedAccompaniments[accItem.id] || 0;
              const isSelected = selectedCount > 0;
              const accTitle = isEn && accItem.nameEn ? accItem.nameEn : accItem.name;

              return (
                <div
                  key={accItem.id}
                  className={`accompaniment-circular-card-clean ${isSelected ? 'is-selected' : ''}`}
                >
                  <div
                    className="accompaniment-circle-avatar-wrap clickable-avatar"
                    onClick={() => handleToggleAccompaniment(accItem, 1)}
                    title={isEn ? `Tap to add ${accTitle}` : `Toca para añadir ${accTitle}`}
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
                        alt={accTitle}
                        className="accompaniment-circle-avatar"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const fallback = accItem.getLocalFallbackImage ? accItem.getLocalFallbackImage(photoMode) : null;
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="accompaniment-circle-placeholder">
                        <PlateIcon size={34} />
                      </div>
                    )}
                    <div 
                      className={`accompaniment-circle-overlay ${isSelected ? 'is-in-cart' : 'is-plus'}`}
                      aria-label={isSelected ? `${accTitle} in order` : `Add ${accTitle}`}
                    >
                      {isSelected ? (
                        <ShoppingCart size={32} strokeWidth={2.4} className="overlay-cart-icon" />
                      ) : (
                        <Plus size={34} strokeWidth={3} className="overlay-plus-icon" />
                      )}
                    </div>
                  </div>

                  <div className="accompaniment-circle-meta">
                    <h4 
                      className="accompaniment-circle-name"
                      onClick={() => handleToggleAccompaniment(accItem, 1)}
                    >
                      {accTitle}
                    </h4>
                    <span className="accompaniment-circle-price">{accItem.getFormattedPrice()}</span>
                  </div>

                  {isSelected && (
                    <div className="accompaniment-circle-actions">
                      <div className="accompaniment-stepper">
                        <button
                          type="button"
                          className="acc-stepper-btn"
                          onClick={() => handleToggleAccompaniment(accItem, -1)}
                          aria-label={`Remove ${accTitle}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="acc-stepper-count">{selectedCount}</span>
                        <button
                          type="button"
                          className="acc-stepper-btn"
                          onClick={() => handleToggleAccompaniment(accItem, 1)}
                          aria-label={`Add another ${accTitle}`}
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
                {isEn ? `More ${dishCategoryLabel} & specialties` : `Más ${dish.categoryName || dish.category} y especialidades`}
              </h2>
            </div>
            <span className="product-page-section-sub">
              {isEn ? 'Other dishes prepared with authentic Peruvian Criollo & seafood flavor' : 'Otras delicias preparadas con el auténtico sazón criollo y marino'}
            </span>
          </div>

          <div className="product-page-editorial-grid-2col">
            {relatedDishes.map((relDish) => {
              const relHasPhoto = relDish.hasImage(photoMode);
              const relImage = relDish.getResolvedImage ? relDish.getResolvedImage(photoMode) : relDish.getImage(photoMode);
              const relItemInCart = cart ? cart.getItem(relDish.id) : null;
              const relQty = relItemInCart ? relItemInCart.quantity : 0;
              const relPrimary = isEn && relDish.nameEn ? relDish.nameEn : relDish.name;
              const relSecondary = isEn && relDish.nameEn ? relDish.name : relDish.nameEn;
              const relCat = isEn && relDish.categoryNameEn ? relDish.categoryNameEn : (relDish.categoryName || relDish.category);

              return (
                <article
                  key={relDish.id}
                  className="product-page-editorial-card-2col"
                  onClick={() => handleNavigateDish(relDish)}
                  title={isEn ? `View details of ${relPrimary}` : `Ver detalle de ${relPrimary}`}
                >
                  <div className="editorial-card-media-2col">
                    {relHasPhoto && relImage ? (
                      <img
                        src={relImage}
                        alt={relPrimary}
                        className="editorial-card-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const fallback = relDish.getLocalFallbackImage ? relDish.getLocalFallbackImage(photoMode) : null;
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    ) : (
                      <div className="editorial-card-placeholder">
                        <PlateIcon size={32} />
                      </div>
                    )}
                    <span className="editorial-card-tag-2col">
                      {relCat}
                    </span>
                  </div>

                  <div className="editorial-card-content-2col">
                    <h3 className="editorial-card-title-2col">{relPrimary}</h3>
                    {relSecondary && (
                      <p className="editorial-card-desc-2col">{relSecondary}</p>
                    )}
                    <div className="editorial-card-footer-2col" onClick={(e) => e.stopPropagation()}>
                      <span className="editorial-card-price-2col">{relDish.getFormattedPrice()}</span>
                      {relQty > 0 ? (
                        <div className="editorial-card-stepper-2col">
                          <button
                            type="button"
                            className="editorial-stepper-btn"
                            onClick={() => handleUpdateRelatedQuantity(relDish, relQty - 1)}
                            title={isEn ? `Decrease quantity of ${relPrimary}` : `Disminuir cantidad de ${relPrimary}`}
                            aria-label={`Disminuir ${relPrimary}`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="editorial-stepper-count">{relQty}</span>
                          <button
                            type="button"
                            className="editorial-stepper-btn"
                            onClick={() => handleUpdateRelatedQuantity(relDish, relQty + 1)}
                            title={isEn ? `Increase quantity of ${relPrimary}` : `Aumentar cantidad de ${relPrimary}`}
                            aria-label={`Aumentar ${relPrimary}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="editorial-card-btn-2col"
                          onClick={(e) => handleQuickAddRelated(relDish, e)}
                          title={isEn ? `Add ${relPrimary} to order` : `Agregar ${relPrimary} al pedido`}
                        >
                          <Plus size={14} />
                          <span>{isEn ? 'Order' : 'Ordenar'}</span>
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

      {addedToast && (
        <div className="product-page-floating-toast">
          <Check size={18} />
          <span>{addedToast}</span>
        </div>
      )}

      {/* 5. LIGHTBOX MODAL PARA IMÁGENES A PANTALLA COMPLETA USANDO PORTAL */}
      {isLightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="product-lightbox-overlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Visualizador de fotos de ${primaryDishTitle}`}
        >
          <div className="product-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="product-lightbox-title-group">
              <h3 className="product-lightbox-title">{primaryDishTitle}</h3>
              {secondaryDishSubtitle && (
                <span className="product-lightbox-subtitle">{secondaryDishSubtitle}</span>
              )}
            </div>

            <div className="product-lightbox-controls">
              {galleryImages.length > 1 && (
                <span className="product-lightbox-counter">
                  {lightboxIndex + 1} / {galleryImages.length}
                </span>
              )}
              <button
                type="button"
                className="product-lightbox-close-btn"
                onClick={closeLightbox}
                aria-label={isEn ? 'Close viewer' : 'Cerrar visor'}
                title={isEn ? 'Close viewer (Esc)' : 'Cerrar visor (Esc)'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="product-lightbox-body" onClick={(e) => e.stopPropagation()}>
            {galleryImages.length > 1 && (
              <button
                type="button"
                className="product-lightbox-nav-btn prev"
                onClick={handlePrevLightboxImage}
                aria-label={isEn ? 'Previous photo' : 'Foto anterior'}
                title={isEn ? 'Previous photo' : 'Foto anterior'}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div className="product-lightbox-stage">
              <img
                src={lightboxActiveSrc || galleryImages[lightboxIndex] || displayImage}
                alt={`${primaryDishTitle} foto ${lightboxIndex + 1}`}
                className="product-lightbox-img"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const fallback = dish.getLocalFallbackImage ? dish.getLocalFallbackImage(photoMode) : null;
                  if (fallback && e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="product-lightbox-nav-btn next"
                onClick={handleNextLightboxImage}
                aria-label={isEn ? 'Next photo' : 'Foto siguiente'}
                title={isEn ? 'Next photo' : 'Foto siguiente'}
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="product-lightbox-footer" onClick={(e) => e.stopPropagation()}>
              <div className="product-lightbox-thumbs-track">
                {galleryImages.map((thumbUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`product-lightbox-thumb ${idx === lightboxIndex ? 'active' : ''}`}
                    onClick={() => {
                      triggerHaptic(8);
                      setLightboxIndex(idx);
                      setSelectedImageIndex(idx);
                      setLightboxActiveSrc(thumbUrl);
                    }}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img src={thumbUrl} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
