import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Si la app ya se ejecuta en modo PWA instalada, no mostrar nada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      return;
    }

    // Verificar si el usuario lo descartó recientemente (3 días de pausa)
    const dismissedUntil = localStorage.getItem('mb_pwa_dismissed');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIPhoneOrIPad && isSafari) {
      setIsIOS(true);
      // Mostrar con retardo para no interrumpir la primera interacción
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
    }

    // Capturar evento de instalación nativo (Android Chrome, Edge, Desktop Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    // Snooze por 3 días
    localStorage.setItem('mb_pwa_dismissed', String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  if (!isVisible) return null;

  return (
    <aside
      className="pwa-install-banner"
      role="region"
      aria-label="Instalación de Aplicación Web"
    >
      <div className="pwa-install-content">
        <img
          src="/LogoPWA/icon-192x192.png"
          alt="Mi Barrunto App"
          className="pwa-install-app-icon"
          width="48"
          height="48"
        />

        <div className="pwa-install-text">
          <strong className="pwa-install-title">Instalar Mi Barrunto</strong>
          <span className="pwa-install-subtitle">
            {isIOS ? 'Agrega la app a tu pantalla de inicio' : 'Acceso instantáneo sin descargas pesadas'}
          </span>
        </div>

        <div className="pwa-install-actions">
          <button
            type="button"
            className="pwa-btn-install"
            onClick={handleInstallClick}
            aria-label="Instalar aplicación Mi Barrunto"
          >
            <Download size={15} />
            <span>Instalar</span>
          </button>

          <button
            type="button"
            className="pwa-btn-close"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Guía modal / popup especial para usuarios de iPhone / iOS Safari */}
      {showIOSGuide && (
        <div className="pwa-ios-guide-box">
          <p className="pwa-ios-step">
            1. Toca el botón <strong>Compartir</strong> <Share size={14} className="inline-icon" /> en la barra inferior de Safari.
          </p>
          <p className="pwa-ios-step">
            2. Desplázate hacia abajo y selecciona <strong>"Agregar a Inicio"</strong> <PlusSquare size={14} className="inline-icon" />.
          </p>
          <button
            type="button"
            className="pwa-ios-done-btn"
            onClick={handleDismiss}
          >
            Entendido
          </button>
        </div>
      )}
    </aside>
  );
}
