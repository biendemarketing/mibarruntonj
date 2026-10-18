import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

/**
 * CustomDialog: Sistema de alertas y confirmaciones nativo para Mi Barrunto.
 * Reemplaza completamente los alert() y confirm() por defecto del navegador.
 *
 * Cumple estrictamente con:
 * - CERO BORDES / TRAZOS (border: none !important; outline: none !important;)
 * - PROHIBICIÓN TOTAL DE EMOJIS (100% iconos vectoriales Lucide SVG)
 * - Sombras volumétricas, backdrop-filter y animaciones fluidas
 */
export function CustomDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'danger' | 'warning' | 'success' | 'info'
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isConfirm = false,
  onConfirm,
  confirmButtonDanger = false,
  autoFocusConfirm = true,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerHaptic(16);

      // Prevenir scroll de fondo mientras el diálogo esté abierto
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Auto-enfoque accesible
      const timer = setTimeout(() => {
        if (autoFocusConfirm && confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          triggerHaptic(10);
          onClose();
        } else if (e.key === 'Enter' && !isConfirm) {
          e.preventDefault();
          handleConfirm();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, isConfirm, autoFocusConfirm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHaptic(14);
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    triggerHaptic(10);
    onClose();
  };

  const renderIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={26} color="var(--rojo)" strokeWidth={2.2} />;
      case 'warning':
        return <AlertTriangle size={26} color="#f59e0b" strokeWidth={2.2} />;
      case 'success':
        return <CheckCircle2 size={26} color="#10b981" strokeWidth={2.2} />;
      case 'info':
      default:
        return <Info size={26} color="#3b82f6" strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className="custom-dialog-overlay"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dialog-title"
      aria-describedby="custom-dialog-desc"
    >
      <div
        className="custom-dialog-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre superior */}
        <button
          type="button"
          className="custom-dialog-close-btn"
          onClick={handleCancel}
          aria-label="Cerrar diálogo"
        >
          <X size={18} />
        </button>

        {/* Icono temático vectorial */}
        <div className={`custom-dialog-icon-wrap custom-dialog-icon-${type}`}>
          {renderIcon()}
        </div>

        {/* Contenido */}
        <div className="custom-dialog-body">
          {title && (
            <h3 id="custom-dialog-title" className="custom-dialog-title">
              {title}
            </h3>
          )}
          {message && (
            <p id="custom-dialog-desc" className="custom-dialog-message">
              {message}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="custom-dialog-actions">
          {isConfirm && (
            <button
              type="button"
              className="custom-dialog-btn custom-dialog-cancel-btn"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            className={`custom-dialog-btn custom-dialog-confirm-btn ${
              confirmButtonDanger || type === 'danger' ? 'custom-dialog-btn-danger' : ''
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomDialog;
