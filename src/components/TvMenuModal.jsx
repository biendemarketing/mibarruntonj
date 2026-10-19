import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Maximize, Minimize, X, Tv } from 'lucide-react';
import { PlateIcon } from './Icons';

export function TvMenuModal({ isOpen, onClose, dishes = [], photoMode = 'complete' }) {
  // Filtrar platos que tengan imagen en alta calidad para la TV
  const tvDishes = React.useMemo(() => {
    const list = dishes.filter((d) => d.hasImage && d.hasImage(photoMode));
    return list.length > 0 ? list : dishes.slice(0, 30);
  }, [dishes, photoMode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const modalRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // Navegación siguiente y anterior
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tvDishes.length);
  }, [tvDishes.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tvDishes.length) % tvDishes.length);
  }, [tvDishes.length]);

  // Rotación automática cada 6.5 segundos
  useEffect(() => {
    if (!isOpen || !isPlaying || tvDishes.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6500);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, handleNext, tvDishes.length]);

  // Ocultar controles superiores automáticamente tras 2.5s de inactividad
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    handleUserActivity();

    const handleMouseMove = () => handleUserActivity();
    const handleTouchStart = () => handleUserActivity();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isOpen, handleUserActivity]);

  // Manejo de teclas: Esc para cerrar, Espacio para pausar, Flechas para navegar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      handleUserActivity();
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, handleUserActivity]);

  const toggleFullscreen = () => {
    handleUserActivity();
    if (!document.fullscreenElement) {
      if (modalRef.current?.requestFullscreen) {
        modalRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!isOpen || tvDishes.length === 0) return null;

  const currentDish = tvDishes[currentIndex];
  // Obtener la mejor resolución posible de la fotografía
  const image = currentDish.getResolvedImage
    ? (currentDish.getResolvedImage(photoMode) || currentDish.getResolvedImage('complete') || currentDish.getResolvedImage('curated'))
    : (currentDish.getImage(photoMode) || currentDish.getImage('complete') || currentDish.getImage('curated'));

  return (
    <div
      ref={modalRef}
      className={`tv-menu-overlay ${showControls ? 'tv-controls-active' : 'tv-controls-hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Modo Pantalla Completa TV - Mi Barrunto"
      onMouseMove={handleUserActivity}
    >
      {/* 1. Fondo Ambiental del Plato: llena toda la pantalla con la calidez del plato sin cortes */}
      <div className="tv-ambient-backdrop" key={`bg-${currentDish.id}`}>
        {image && (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="tv-ambient-bg-image"
            onError={(e) => {
              const fallback = currentDish.getLocalFallbackImage ? currentDish.getLocalFallbackImage(photoMode) : null;
              if (fallback && e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        )}
      </div>

      {/* 2. Escenario del Plato Principal: 100% visible, sin cortes y sin zoom excesivo */}
      <div className="tv-dish-stage" key={`media-${currentDish.id}`}>
        {image ? (
          <img
            src={image}
            alt={currentDish.name}
            className="tv-dish-hero-image"
            onError={(e) => {
              const fallback = currentDish.getLocalFallbackImage ? currentDish.getLocalFallbackImage(photoMode) : null;
              if (fallback && e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
          />
        ) : (
          <div className="tv-fullscreen-placeholder">
            <PlateIcon size={120} />
          </div>
        )}
      </div>

      {/* 3. Overlay Negro Gradual en la Foto para Contraste y Legibilidad */}
      <div className="tv-overlay-gradient" />

      {/* 4. Ficha con Título, Descripción y Precio en la Parte Derecha */}
      <aside className="tv-dish-sidebar" key={`info-${currentDish.id}`}>
        {currentDish.categoryName && (
          <div className="tv-sidebar-badge">
            <span>{currentDish.categoryName}</span>
          </div>
        )}

        <h2 className="tv-sidebar-title">{currentDish.name}</h2>

        {currentDish.nameEn && (
          <p className="tv-sidebar-name-en">{currentDish.nameEn}</p>
        )}

        {currentDish.glosa && currentDish.glosa !== currentDish.nameEn && (
          <p className="tv-sidebar-desc">{currentDish.glosa}</p>
        )}

        <div className="tv-sidebar-price-row">
          <span className="tv-sidebar-currency">$</span>
          <span className="tv-sidebar-price">{currentDish.price.toFixed(2)}</span>
        </div>
      </aside>

      {/* 5. Barra Superior Autocultable: solo aparece al mover el mouse */}
      <header className={`tv-menu-header ${showControls ? 'is-visible' : 'is-hidden'}`}>
        <div className="tv-header-brand">
          <img
            src="./logo/logo.png"
            alt="Mi Barrunto"
            className="tv-header-logo"
          />
          <div className="tv-header-text">
            <h1 className="tv-header-title">Mi Barrunto</h1>
            <span className="tv-header-sub">Paterson, NJ · Carta Oficial</span>
          </div>
        </div>

        <div className="tv-header-center">
          <div className="tv-live-badge">
            <span className="tv-live-dot" />
            <Tv size={14} color="#ffffff" />
            <span>MODO TV</span>
          </div>
        </div>

        <div className="tv-header-actions">
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => {
              handleUserActivity();
              setIsPlaying((p) => !p);
            }}
            title={isPlaying ? 'Pausar rotación (Espacio)' : 'Reanudar rotación (Espacio)'}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
          <button
            type="button"
            className="tv-ctrl-btn tv-close-btn"
            onClick={onClose}
            title="Cerrar Menú TV (Esc)"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {/* 6. Zonas de Clic Invisibles para navegar Anterior / Siguiente */}
      <div
        className="tv-nav-invisible-zone tv-nav-invisible-prev"
        onClick={() => {
          handleUserActivity();
          handlePrev();
        }}
        title="Plato anterior"
        aria-label="Anterior"
      />
      <div
        className="tv-nav-invisible-zone tv-nav-invisible-next"
        onClick={() => {
          handleUserActivity();
          handleNext();
        }}
        title="Plato siguiente"
        aria-label="Siguiente"
      />
    </div>
  );
}

export default TvMenuModal;
