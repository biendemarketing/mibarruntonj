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
  onUpdateItemNote,
  onClearCart,
  photoMode = 'complete',
  onOrderPlaced
}) {
  const { showAlert } = useAlertConfirm();
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Override manual de gratuity (null = automático según comensales). Debe declararse ANTES de cualquier return temprano.
  const [gratuityManualOverride, setGratuityManualOverride] = useState(null);

  // Al cerrar el carrito, volver al comportamiento automático de la propina
  useEffect(() => {
    if (!isOpen) setGratuityManualOverride(null);
  }, [isOpen]);

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

  const items = (typeof cart?.getItems === 'function' ? cart.getItems() : cart?.items) || [];
  const isCartEmpty = typeof cart?.isEmpty === 'function' ? cart.isEmpty() : items.length === 0;
  const totalCount = typeof cart?.getTotalCount === 'function' ? cart.getTotalCount() : items.reduce((s, i) => s + (i.quantity || 1), 0);
  const customer = cart?.customer || {};

  // 1. Subtotal de platos (precios limpios sin sobrecargos en producto)
  const subtotal = items.reduce(
    (s, i) => s + (typeof i.getSubtotal === 'function' ? i.getSubtotal() : ((i.dish?.price || 0) * (i.quantity || 1))), 
    0
  );

  // 2. Impuesto Sales Tax New Jersey (6.625%)
  const TAX_RATE = 0.06625;
  const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));

  // 3. Recargo por pago con tarjeta (4%)
  const isCard = customer.paymentMethod === 'tarjeta';
  const CARD_FEE_RATE = 0.04;
  const cardFeeAmount = isCard ? Number((subtotal * CARD_FEE_RATE).toFixed(2)) : 0;

  // 4. Gratuity (16% opcional, activado automáticamente para más de 2 personas)
  const dinerCount = Number(customer.dinerCount) || 2;
  const isGratuityActive = gratuityManualOverride !== null 
    ? gratuityManualOverride 
    : (dinerCount > 2);
  const GRATUITY_RATE = 0.16;
  const gratuityAmount = isGratuityActive ? Number((subtotal * GRATUITY_RATE).toFixed(2)) : 0;

  // 5. Total Final a pagar
  const finalTotal = Number((subtotal + taxAmount + cardFeeAmount + gratuityAmount).toFixed(2));
  const totalPrice = `$${finalTotal.toFixed(2)}`;

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

      const orderItems = items.map(item => ({
        dishId: item.dish.id,
        dishName: item.dish.name,
        dishPrice: item.dish.price,
        quantity: item.quantity,
        subtotal: typeof item.getSubtotal === 'function' ? item.getSubtotal() : ((item.dish?.price || 0) * (item.quantity || 1)),
        notes: sanitizeNotes(item.note || '')
      }));

      const tableNumberStr = customer.orderType === 'mesa' ? cleanTable : `Llevar (${customer.orderType})`;

      const order = await ordersService.createOrder({
        clientUuid,
        customerName: cleanName,
        customerPhone: cleanPhone,
        tableNumber: tableNumberStr,
        items: orderItems,
        subtotal: subtotal,
        taxAmount: taxAmount,
        cardFeeAmount: cardFeeAmount,
        tipAmount: gratuityAmount,
        totalAmount: finalTotal,
        paymentMethod: customer.paymentMethod || 'efectivo',
        dinerCount: dinerCount,
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
          {isCartEmpty ? (
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
                {items.map((item) => {
                  const dishImg = item.dish.getResolvedImage
                    ? item.dish.getResolvedImage(photoMode)
                    : (item.dish.getImage ? item.dish.getImage(photoMode) : item.dish.image);

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
                              const fallback = item.dish.getLocalFallbackImage ? item.dish.getLocalFallbackImage(photoMode) : null;
                              if (fallback && e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                                return;
                              }
                              e.currentTarget.style.display = 'none';
                              const fb = e.currentTarget.parentElement?.querySelector('.cart-item-fallback-icon');
                              if (fb) fb.style.display = 'flex';
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
                            onChange={(e) => {
                              if (onUpdateItemNote) {
                                onUpdateItemNote(item.dish.id, e.target.value);
                              } else if (typeof cart?.updateItemNote === 'function') {
                                cart.updateItemNote(item.dish.id, e.target.value);
                              }
                            }}
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
        {!isCartEmpty && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-footer-inner" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Desglose Transparente de Totales y Porcentajes al Final */}
              <div
                style={{
                  backgroundColor: '#fbf8f2',
                  borderRadius: '16px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  fontSize: '0.82rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  border: 'none !important'
                }}
              >
                {/* 1. Subtotal de productos */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b635b' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 700, color: '#1f1e1c' }}>${subtotal.toFixed(2)}</span>
                </div>

                {/* 2. Sales Tax 6.625% */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b635b' }}>
                  <span>Sales Tax NJ (6.625%):</span>
                  <span style={{ fontWeight: 700, color: '#1f1e1c' }}>+${taxAmount.toFixed(2)}</span>
                </div>

                {/* 3. Recargo por tarjeta 4% */}
                {isCard && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#2563eb' }}>
                    <span>Recargo por Pago con Tarjeta (4%):</span>
                    <span style={{ fontWeight: 700 }}>+${cardFeeAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* 4. Gratuity 16% (Opcional, auto para >2 personas) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.35rem',
                    borderTop: '1px dashed #e2dbce'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: isGratuityActive ? '#059669' : '#6b635b' }}>
                        Gratuity (16%):
                      </span>
                      {dinerCount > 2 && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            color: '#059669',
                            backgroundColor: '#ecfdf5',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px'
                          }}
                        >
                          Auto +2 pers.
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#8c827a' }}>
                      {isGratuityActive ? 'Opcional (puedes quitarlo)' : 'Opcional (puedes incluirlo)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontWeight: 800, color: isGratuityActive ? '#059669' : '#8c827a' }}>
                      {isGratuityActive ? `+$${gratuityAmount.toFixed(2)}` : '$0.00'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setGratuityManualOverride(!isGratuityActive);
                      }}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '8px',
                        backgroundColor: isGratuityActive ? '#fee2e2' : '#ecfdf5',
                        color: isGratuityActive ? '#dc2626' : '#059669',
                        border: 'none !important',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isGratuityActive ? 'Quitar' : 'Incluir (16%)'}
                    </button>
                  </div>
                </div>

                {/* 5. Total Final a Pagar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.45rem',
                    borderTop: '2px solid #1f1e1c',
                    marginTop: '0.15rem'
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1f1e1c' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.22rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
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
