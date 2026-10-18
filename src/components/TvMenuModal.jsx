import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Maximize, Minimize, X, Tv } from 'lucide-react';
import { WhatsAppIcon, PlateIcon } from './Icons';

export function TvMenuModal({ isOpen, onClose, dishes = [], photoMode = 'curated' }) {
  // Filtrar platos que tengan imagen en alta calidad para la TV
  const tvDishes = React.useMemo(() => {
    const list = dishes.filter((d) => d.hasImage && d.hasImage(photoMode));
    return list.length > 0 ? list : dishes.slice(0, 20);
  }, [dishes, photoMode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [progress, setProgress] = useState(0);
  const modalRef = useRef(null);

  // Reloj digital en vivo para la pantalla de la TV
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Rotación automática cada 6 segundos con barra de progreso
  useEffect(() => {
    if (!isOpen || !isPlaying || tvDishes.length === 0) return;

    setProgress(0);
    const duration = 6000;
    const tickRate = 50;
    const step = (tickRate / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % tvDishes.length);
          return 0;
        }
        return prev + step;
      });
    }, tickRate);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentIndex, tvDishes.length]);

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
  }, [isOpen, tvDishes.length]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % tvDishes.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + tvDishes.length) % tvDishes.length);
  };

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
      {/* Barra Superior de la TV: Marca, Reloj en Vivo y Controles */}
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
            <Tv size={14} color="var(--rojo)" />
            <span>MODO MENÚ TV</span>
          </div>
          {currentTime && <span className="tv-live-clock">{currentTime}</span>}
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

      {/* Contenido Principal: Plato Destacado con Imagen Gigante y Ficha Gastronómica */}
      <main className="tv-menu-body">
        <div className="tv-dish-showcase" key={currentDish.id}>
          {/* Zona de Imagen HD con Efecto Sutil */}
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

          {/* Ficha Descriptiva del Plato */}
          <div className="tv-dish-details">
            <div className="tv-category-tag">
              <span>{currentDish.categoryName || 'Especialidad de la Casa'}</span>
            </div>

            <h2 className="tv-dish-name">{currentDish.name}</h2>

            {currentDish.nameEn && (
              <p className="tv-dish-name-en">{currentDish.nameEn}</p>
            )}

            <div className="tv-price-box">
              <span className="tv-price-currency">$</span>
              <span className="tv-price-value">{currentDish.price.toFixed(2)}</span>
            </div>

            {/* Banner de Pedido Rápido para comensales en la mesa */}
            <div className="tv-order-prompt-box">
              <div className="tv-prompt-icon-wrap">
                <WhatsAppIcon size={24} color="#ffffff" />
              </div>
              <div className="tv-prompt-content">
                <span className="tv-prompt-title">¡Pide directo a tu mesa o para llevar!</span>
                <span className="tv-prompt-phone">WhatsApp: (973) 653-3749</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flechas de Navegación Manual */}
        <button
          type="button"
          className="tv-nav-arrow tv-nav-prev"
          onClick={handlePrev}
          title="Plato anterior (Flecha izquierda)"
          aria-label="Anterior"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          type="button"
          className="tv-nav-arrow tv-nav-next"
          onClick={handleNext}
          title="Plato siguiente (Flecha derecha)"
          aria-label="Siguiente"
        >
          <ChevronRight size={32} />
        </button>
      </main>

      {/* Barra de Progreso Inferior y Miniaturas */}
      <footer className="tv-menu-footer">
        <div className="tv-progress-track">
          <div
            className="tv-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="tv-footer-status">
          <span className="tv-dish-counter">
            {currentIndex + 1} de {tvDishes.length} especialidades
          </span>
          <span className="tv-footer-instructions">
            Usa las flechas del teclado o presiona Espacio para pausar · Esc para salir
          </span>
        </div>
      </footer>
    </div>
  );
}

export default TvMenuModal;
