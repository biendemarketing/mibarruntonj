import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CustomDialog } from '../components/CustomDialog';

const AlertConfirmContext = createContext(null);

export function AlertConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isConfirm: false,
    confirmButtonDanger: false,
  });

  const resolverRef = useRef(null);

  /**
   * Muestra un diálogo de confirmación que retorna una Promesa (true si confirma, false si cancela)
   * Reemplazo directo para `window.confirm(msg)`
   *
   * Ejemplo:
   * const ok = await showConfirm({
   *   title: '¿Vaciar favoritos?',
   *   message: 'Esta acción no se puede deshacer.',
   *   confirmButtonDanger: true
   * });
   */
  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        title: options.title || '¿Estás seguro?',
        message: typeof options === 'string' ? options : options.message || '',
        type: options.type || (options.confirmButtonDanger ? 'danger' : 'warning'),
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        isConfirm: true,
        confirmButtonDanger: options.confirmButtonDanger ?? (options.type === 'danger'),
      });
    });
  }, []);

  /**
   * Muestra un diálogo de alerta informativo o de éxito/error que retorna una Promesa que resuelve al cerrar
   * Reemplazo directo para `window.alert(msg)`
   *
   * Ejemplo:
   * await showAlert({ title: 'Aviso', message: 'Operación completada con éxito', type: 'success' });
   */
  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        title: options.title || 'Aviso',
        message: typeof options === 'string' ? options : options.message || '',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Entendido',
        cancelText: 'Cancelar',
        isConfirm: false,
        confirmButtonDanger: false,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  return (
    <AlertConfirmContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <CustomDialog
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        isConfirm={dialogState.isConfirm}
        confirmButtonDanger={dialogState.confirmButtonDanger}
      />
    </AlertConfirmContext.Provider>
  );
}

export function useAlertConfirm() {
  const context = useContext(AlertConfirmContext);
  if (!context) {
    throw new Error('useAlertConfirm debe ser usado dentro de AlertConfirmProvider');
  }
  return context;
}

export default AlertConfirmProvider;
