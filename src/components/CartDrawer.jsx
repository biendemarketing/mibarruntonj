import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  FileText,
  User,
  MapPin,
  UtensilsCrossed,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { PlateIcon } from './Icons';
import { ordersService } from '../services/supabase';
import { 
  getClientUuid, 
  getSavedCustomerInfo, 
  saveCustomerInfo, 
  checkOrderRateLimit, 
  recordOrderTimestamp 
} from '../utils/clientIdentity';
import { sanitizeCustomerName, sanitizePhone, sanitizeNotes } from '../utils/sanitizer';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomerField,
  onClearCart,
  photoMode = 'complete',
  onOrderPlaced
}) {
  const { showAlert } = useAlertConfirm();
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-cargar datos recordados del cliente (o mesa desde la URL ?mesa=X)
  useEffect(() => {
    if (isOpen) {
      const savedInfo = getSavedCustomerInfo();
      if (savedInfo.name && !cart.customer.name) {
        onUpdateCustomerField('name', savedInfo.name);
      }
      if (savedInfo.tableNumber && !cart.customer.table) {
        onUpdateCustomerField('table', savedInfo.tableNumber);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 220);
  };

  // Bloquear scroll de fondo al abrir el drawer
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isClosing]);

  if (!isOpen) return null;

  const totalCount = cart.getTotalCount();
  const totalPrice = cart.getFormattedTotal();
  const customer = cart.customer;

  // Enviar pedido en vivo a Supabase (Cocina & Panel Administrativo)
  const handleConfirmOrder = async () => {
    // 1. Rate Limiting Check
    const rateCheck = checkOrderRateLimit(45);
    if (!rateCheck.allowed) {
      triggerHaptic(15);
      showAlert({
        title: 'Espera un momento',
        message: `Acabamos de recibir un pedido desde este dispositivo. Por favor espera ${rateCheck.secondsLeft} segundos antes de enviar otra orden para evitar duplicados.`,
        type: 'warning'
      });
      return;
    }

    if (!customer.name.trim()) {
      triggerHaptic(15);
      showAlert({
        title: 'Tu Nombre es Requerido',
        message: 'Por favor escribe tu nombre para identificar tu pedido en cocina y sala.',
        type: 'warning'
      });
      return;
    }

    if (customer.orderType === 'mesa' && !customer.table.trim()) {
      triggerHaptic(15);
      showAlert({
        title: 'Número de Mesa Requerido',
        message: 'Por favor indica tu número de mesa (ej: Mesa 4).',
        type: 'warning'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic(12);

      const cleanName = sanitizeCustomerName(customer.name);
      const cleanPhone = sanitizePhone(customer.phone);
      const cleanTable = customer.orderType === 'mesa' ? customer.table.trim().slice(0, 15) : '';
      const cleanNotes = sanitizeNotes(customer.generalNotes);

      const clientUuid = getClientUuid();
      saveCustomerInfo({
        name: cleanName,
        phone: cleanPhone,
        tableNumber: cleanTable
      });

      const items = cart.getItems().map(item => ({
        dishId: item.dish.id,
        dishName: item.dish.name,
        dishPrice: item.dish.price,
        quantity: item.quantity,
        subtotal: item.getSubtotal(),
        notes: sanitizeNotes(item.note || '')
      }));

      const tableNumberStr = customer.orderType === 'mesa' ? cleanTable : `Llevar (${customer.orderType})`;

      const order = await ordersService.createOrder({
        clientUuid,
        customerName: cleanName,
        customerPhone: cleanPhone,
        tableNumber: tableNumberStr,
        items,
        subtotal: cart.getSubtotal(),
        tipAmount: cart.getTipAmount(),
        totalAmount: cart.getTotal(),
        paymentMethod: customer.paymentMethod || 'efectivo',
        dinerCount: Number(customer.dinerCount) || 2,
        notes: cleanNotes
      });

      // Registrar timestamp de orden para Rate Limiting
      recordOrderTimestamp();

      triggerHaptic([30, 80, 50]);
      showAlert({
        title: '¡Pedido Recibido en Cocina!',
        message: `Tu pedido #${order.order_number} ya fue recibido por el equipo. Podrás ver su preparación y tiempo de espera en vivo aquí abajo.`,
        type: 'success'
      });

      if (onOrderPlaced) {
        onOrderPlaced(order);
      }

      onClearCart();
      handleClose();
    } catch (err) {
      console.error('Error enviando pedido a Supabase:', err);
      showAlert({
        title: 'Error de Conexión',
        message: err.message || 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`cart-drawer-overlay ${isClosing ? 'cart-drawer-closing' : 'cart-drawer-opening'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`cart-drawer ${isClosing ? 'cart-drawer-content-closing' : 'cart-drawer-content-opening'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Moderno con Rojo Peruano Centrado */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-inner">
            <div className="cart-drawer-header-left" />
            <div className="cart-drawer-title-group">
              <div className="cart-drawer-icon-wrap">
                <ShoppingCart size={19} />
              </div>
              <h2 className="cart-drawer-heading">Mi Pedido</h2>
              <span className="cart-drawer-count-badge">
                {totalCount} {totalCount === 1 ? 'plato' : 'platos'}
              </span>
            </div>
            <button
              type="button"
              className="cart-drawer-close-btn"
              onClick={handleClose}
              aria-label="Cerrar pedido"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido / Lista de Ítems */}
        <div className="cart-drawer-body">
          {cart.isEmpty() ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon-wrap">
                <ShoppingCart size={42} />
              </div>
              <p className="cart-empty-title">Tu pedido está vacío</p>
              <p className="cart-empty-desc">
                Explora nuestra carta y agrega los mejores platos peruanos.
              </p>
            </div>
          ) : (
            <>
              {/* Acciones superiores: Limpiar pedido */}
              <div className="cart-drawer-actions-top">
                <span className="cart-items-count-text">
                  {totalCount} {totalCount === 1 ? 'ítem seleccionado' : 'ítems seleccionados'}
                </span>
                <button
                  type="button"
                  className="cart-clear-btn"
                  onClick={onClearCart}
                  title="Vaciar todo el pedido"
                >
                  <Trash2 size={13} />
                  <span>Vaciar</span>
                </button>
              </div>

              {/* Lista de Platos en el Carrito */}
              <div className="cart-items-list">
                {cart.getItems().map((item) => {
                  const dishImg = item.dish.getImage(photoMode) || item.dish.getImage('complete') || item.dish.getImage('curated');

                  return (
                    <div key={item.dish.id} className="cart-item-card">
                      {/* Miniatura del plato */}
                      <div className="cart-item-image-wrap">
                        {dishImg ? (
                          <img
                            src={dishImg}
                            alt={item.dish.name}
                            className="cart-item-image"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.cart-item-fallback-icon');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="cart-item-fallback-icon"
                          style={{ display: dishImg ? 'none' : 'flex' }}
                        >
                          <PlateIcon size={20} />
                        </div>
                      </div>

                      {/* Información del Ítem */}
                      <div className="cart-item-info">
                        <div className="cart-item-header-row">
                          <h4 className="cart-item-name">{item.dish.name}</h4>
                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            onClick={() => onRemoveItem(item.dish.id)}
                            aria-label={`Eliminar ${item.dish.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <span className="cart-item-unit-price">
                          ${item.dish.price.toFixed(2)} c/u
                        </span>

                        {/* Controles de Cantidad y Subtotal */}
                        <div className="cart-item-footer-row">
                          <div className="cart-qty-controls">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => onUpdateQuantity(item.dish.id, item.quantity - 1)}
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="cart-qty-display">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => onUpdateQuantity(item.dish.id, item.quantity + 1)}
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="cart-item-subtotal">
                            {item.getFormattedSubtotal()}
                          </span>
                        </div>

                        {/* Campo de notas específicas para este plato */}
                        <div className="cart-item-note-row">
                          <MessageSquare size={11} className="cart-item-note-icon" />
                          <input
                            type="text"
                            className="cart-item-note-input"
                            placeholder="Indicación para este plato (ej: sin cebolla)..."
                            value={item.note || ''}
                            onChange={(e) => cart.updateItemNote(item.dish.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Datos de Entrega y Pedido */}
              <div className="cart-checkout-card">
                <span className="cart-checkout-title">Datos para tu Mesa y Cocina</span>

                {/* Nombre del cliente */}
                <div className="cart-field-group">
                  <label className="cart-field-label">
                    <User size={13} />
                    <span>Tu Nombre *:</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="cart-text-input"
                    placeholder="Ej: Juan Pérez"
                    value={customer.name}
                    onChange={(e) => onUpdateCustomerField('name', e.target.value)}
                  />
                </div>

                {/* Modalidad de Pedido */}
                <div className="cart-field-group">
                  <label className="cart-field-label">
                    <UtensilsCrossed size={13} />
                    <span>Modalidad:</span>
                  </label>
                  <div className="cart-order-type-segmented">
                    <button
                      type="button"
                      className={`cart-order-type-btn ${customer.orderType === 'mesa' ? 'active' : ''}`}
                      onClick={() => onUpdateCustomerField('orderType', 'mesa')}
                    >
                      En Mesa
                    </button>
                    <button
                      type="button"
                      className={`cart-order-type-btn ${customer.orderType === 'llevar' ? 'active' : ''}`}
                      onClick={() => onUpdateCustomerField('orderType', 'llevar')}
                    >
                      Para Llevar
                    </button>
                    <button
                      type="button"
                      className={`cart-order-type-btn ${customer.orderType === 'delivery' ? 'active' : ''}`}
                      onClick={() => onUpdateCustomerField('orderType', 'delivery')}
                    >
                      Delivery
                    </button>
                  </div>
                </div>

                {/* Campo condicional según modalidad */}
                {customer.orderType === 'mesa' && (
                  <div className="cart-field-group">
                    <label className="cart-field-label">Número de Mesa *:</label>
                    <input
                      type="text"
                      required
                      className="cart-text-input"
                      placeholder="Ej: Mesa 4 o 4"
                      value={customer.table}
                      onChange={(e) => onUpdateCustomerField('table', e.target.value)}
                    />
                  </div>
                )}

                {customer.orderType === 'delivery' && (
                  <div className="cart-field-group">
                    <label className="cart-field-label">
                      <MapPin size={13} />
                      <span>Dirección de Entrega:</span>
                    </label>
                    <input
                      type="text"
                      className="cart-text-input"
                      placeholder="Ej: 21 Mill St, Paterson NJ"
                      value={customer.address}
                      onChange={(e) => onUpdateCustomerField('address', e.target.value)}
                    />
                  </div>
                )}

                {/* Cantidad de personas / comensales */}
                <div className="cart-field-group">
                  <label className="cart-field-label">¿Cuántas personas son en la mesa?</label>
                  <select
                    className="cart-select-input"
                    value={customer.dinerCount || 2}
                    onChange={(e) => onUpdateCustomerField('dinerCount', parseInt(e.target.value, 10))}
                  >
                    <option value={1}>1 persona (Individual)</option>
                    <option value={2}>2 personas</option>
                    <option value={3}>3 personas</option>
                    <option value={4}>4 personas (Mesa estándar)</option>
                    <option value={5}>5 personas</option>
                    <option value={6}>6 personas o más (Grupo)</option>
                  </select>
                </div>

                {/* Método de Pago */}
                <div className="cart-field-group">
                  <label className="cart-field-label">Forma de Pago:</label>
                  <select
                    className="cart-select-input"
                    value={customer.paymentMethod || 'efectivo'}
                    onChange={(e) => onUpdateCustomerField('paymentMethod', e.target.value)}
                  >
                    <option value="efectivo">Efectivo al recibir</option>
                    <option value="yape">Zelle / Yape / Plin</option>
                    <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                  </select>
                </div>

                {/* Notas generales */}
                <div className="cart-field-group">
                  <label className="cart-field-label">Indicaciones especiales (opcional):</label>
                  <textarea
                    className="cart-textarea-input"
                    placeholder="Ej: salsa de ají aparte, cubiertos descartables..."
                    value={customer.generalNotes}
                    onChange={(e) => onUpdateCustomerField('generalNotes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

            </>
          )}
        </div>

        {/* Footer Fijo con Total y Envío Oficial a Cocina */}
        {!cart.isEmpty() && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-footer-inner" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="cart-summary-row">
                <span className="cart-summary-label">Total a Pagar:</span>
                <span className="cart-summary-total">{totalPrice}</span>
              </div>

              {/* Botón Principal Único: Confirmar y Enviar a Cocina (Supabase en Vivo) */}
              <button
                type="button"
                disabled={isSubmitting}
                className="cart-submit-btn"
                onClick={handleConfirmOrder}
                style={{
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  padding: '0.95rem 1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  border: 'none !important',
                  boxShadow: '0 8px 25px rgba(217, 28, 43, 0.45)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="spin-icon" />
                ) : (
                  <Send size={18} />
                )}
                <span>{isSubmitting ? 'Enviando comanda a cocina...' : 'Confirmar y Enviar Pedido a Cocina'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
