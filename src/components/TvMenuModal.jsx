import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Minimize, X, Tv } from 'lucide-react';
import { PlateIcon } from './Icons';

export function TvMenuModal({ isOpen, onClose, dishes = [], photoMode = 'curated' }) {
  // Filtrar platos que tengan imagen en alta calidad para la TV
  const tvDishes = React.useMemo(() => {
    const list = dishes.filter((d) => d.hasImage && d.hasImage(photoMode));
    return list.length > 0 ? list : dishes.slice(0, 30);
  }, [dishes, photoMode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef(null);

  // Navegación siguiente y anterior
  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tvDishes.length);
  }, [tvDishes.length]);

  const handlePrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tvDishes.length) % tvDishes.length);
  }, [tvDishes.length]);

  // Rotación automática invisible cada 6.5 segundos
  useEffect(() => {
    if (!isOpen || !isPlaying || tvDishes.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6500);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, handleNext, tvDishes.length]);

  // Manejo de teclas: Esc para cerrar, Espacio para pausar, Flechas para navegar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
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
  }, [isOpen, handleNext, handlePrev, onClose]);

  const toggleFullscreen = () => {
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
  const image = currentDish.getResolvedImage
    ? currentDish.getResolvedImage(photoMode)
    : currentDish.getImage(photoMode);

  return (
    <div
      ref={modalRef}
      className="tv-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Menú TV - Mi Barrunto"
    >
      {/* Luz ambiental de fondo basada en el plato */}
      <div className="tv-ambient-glow" />

      {/* Barra Superior Minimalista: Marca a la izquierda y Controles a la derecha */}
      <header className="tv-menu-header">
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
            <span>MODO MENÚ TV</span>
          </div>
        </div>

        <div className="tv-header-actions">
          <button
            type="button"
            className="tv-ctrl-btn"
            onClick={() => setIsPlaying((p) => !p)}
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

      {/* Contenido Principal: Plato Destacado con Imagen Gigante y Tipografía Gourmet */}
      <main className="tv-menu-body">
        <div className="tv-dish-showcase" key={currentDish.id}>
          {/* Zona de Imagen HD Cinematográfica */}
          <div className="tv-image-container">
            {image ? (
              <img
                src={image}
                alt={currentDish.name}
                className="tv-dish-image"
              />
            ) : (
              <div className="tv-image-placeholder">
                <PlateIcon size={84} />
              </div>
            )}
            <div className="tv-image-gradient-overlay" />
          </div>

          {/* Ficha Descriptiva de Lujo */}
          <div className="tv-dish-details">
            <div className="tv-tags-row">
              <span className="tv-category-tag">
                {currentDish.categoryName || 'Especialidad'}
              </span>
              {currentDish.subcategory && (
                <span className="tv-subcategory-tag">
                  {currentDish.subcategory}
                </span>
              )}
            </div>

            <h2 className="tv-dish-name">{currentDish.name}</h2>

            {currentDish.nameEn && (
              <p className="tv-dish-name-en">{currentDish.nameEn}</p>
            )}

            {currentDish.glosa && currentDish.glosa !== currentDish.nameEn && (
              <p className="tv-dish-glosa">{currentDish.glosa}</p>
            )}

            <div className="tv-price-box">
              <span className="tv-price-currency">$</span>
              <span className="tv-price-value">{currentDish.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Zonas de Clic Invisibles para navegar Anterior / Siguiente sin ensuciar la pantalla */}
        <div
          className="tv-nav-invisible-zone tv-nav-invisible-prev"
          onClick={handlePrev}
          title="Plato anterior"
          aria-label="Anterior"
        />
        <div
          className="tv-nav-invisible-zone tv-nav-invisible-next"
          onClick={handleNext}
          title="Plato siguiente"
          aria-label="Siguiente"
        />
      </main>

      {/* Footer Minimalista: Solo Contador Elegante y Limpio */}
      <footer className="tv-menu-footer">
        <div className="tv-footer-status">
          <span className="tv-dish-counter">
            {String(currentIndex + 1).padStart(2, '0')} / {String(tvDishes.length).padStart(2, '0')} Especialidades
          </span>
          <span className="tv-footer-instructions">
            {isPlaying ? 'Rotación automática activa' : 'Pausado'} · Espacio para alternar · Flechas para navegar · Esc para salir
          </span>
        </div>
      </footer>
    </div>
  );
}

export default TvMenuModal;
