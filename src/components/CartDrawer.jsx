import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  FileText,
  User,
  MapPin,
  UtensilsCrossed,
  MessageSquare
} from 'lucide-react';
import { whatsAppService } from '../services/MenuRepository';
import { WhatsAppIcon } from './Icons';

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomerField,
  onClearCart
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [phoneInput, setPhoneInput] = useState('19736533749'); // WhatsApp oficial: (973) 653-3749
  const [isClosing, setIsClosing] = useState(false);

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

  const handleSendWhatsApp = () => {
    whatsAppService.setPhone(phoneInput);
    whatsAppService.sendOrder(cart);
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
        {/* Encabezado Moderno con Rojo Peruano */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-inner">
            <div className="cart-drawer-title-group">
              <div className="cart-drawer-icon-wrap">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="cart-drawer-heading">Mi Pedido</h2>
                <span className="cart-drawer-count-badge">
                  {totalCount} {totalCount === 1 ? 'plato' : 'platos'}
                </span>
              </div>
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
                <ShoppingBag size={42} />
              </div>
              <h3 className="cart-empty-title">Tu carrito está vacío</h3>
              <p className="cart-empty-text">
                Explora nuestra carta criolla y marina y añade tus platos favoritos para enviarlos directamente por WhatsApp.
              </p>
              <button
                type="button"
                className="cart-empty-action-btn"
                onClick={onClose}
              >
                Ver la carta
              </button>
            </div>
          ) : (
            <>
              {/* Encabezado de la lista con acción de vaciar */}
              <div className="cart-items-section-header">
                <span className="cart-section-title">Platos Seleccionados</span>
                <button
                  type="button"
                  className="cart-clear-btn"
                  onClick={onClearCart}
                  title="Vaciar carrito"
                >
                  <Trash2 size={13} />
                  <span>Vaciar</span>
                </button>
              </div>

              {/* Lista de productos en el carrito */}
              <div className="cart-items-list">
                {cart.items.map((item) => (
                  <div key={item.dish.id} className="cart-item-card">
                    <div className="cart-item-main">
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.dish.name}</h4>
                        {item.dish.nameEn && (
                          <span className="cart-item-sub">{item.dish.nameEn}</span>
                        )}
                        <span className="cart-item-unit-price">
                          {item.dish.getFormattedPrice()} c/u
                        </span>
                      </div>
                      <span className="cart-item-subtotal">
                        {item.getFormattedSubtotal()}
                      </span>
                    </div>

                    {/* Nota del plato si existe */}
                    {item.note && (
                      <div className="cart-item-note-pill">
                        <MessageSquare size={12} />
                        <span>{item.note}</span>
                      </div>
                    )}

                    {/* Controles: Stepper y botón de eliminar */}
                    <div className="cart-item-actions">
                      <div className="cart-stepper">
                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => onUpdateQuantity(item.dish.id, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="cart-stepper-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-stepper-btn"
                          onClick={() => onUpdateQuantity(item.dish.id, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => onRemoveItem(item.dish.id)}
                        aria-label="Eliminar plato"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Datos de Entrega y Pedido */}
              <div className="cart-checkout-card">
                <span className="cart-checkout-title">Datos del Pedido</span>

                {/* Nombre del cliente */}
                <div className="cart-field-group">
                  <label className="cart-field-label">
                    <User size={13} />
                    <span>Tu Nombre:</span>
                  </label>
                  <input
                    type="text"
                    className="cart-text-input"
                    placeholder="Ej: Juan Pérez"
                    value={customer.name}
                    onChange={(e) => onUpdateCustomerField('name', e.target.value)}
                  />
                </div>

                {/* Modalidad de Pedido: Segmented Pills */}
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
                    <label className="cart-field-label">Número de Mesa:</label>
                    <input
                      type="text"
                      className="cart-text-input"
                      placeholder="Ej: Mesa 4"
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

                {/* Método de Pago */}
                <div className="cart-field-group">
                  <label className="cart-field-label">Forma de Pago:</label>
                  <select
                    className="cart-select-input"
                    value={customer.paymentMethod}
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

              {/* Botón para previsualizar mensaje WhatsApp */}
              <button
                type="button"
                className="cart-preview-toggle-btn"
                onClick={() => setShowPreview(!showPreview)}
              >
                <FileText size={14} />
                <span>{showPreview ? 'Ocultar vista previa del mensaje' : 'Ver mensaje que se enviará'}</span>
              </button>

              {showPreview && (
                <pre className="cart-preview-box">
                  {whatsAppService.buildMessage(cart)}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Footer Fijo con Total y Envío Oficial a WhatsApp */}
        {!cart.isEmpty() && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-footer-inner">
              <div className="cart-summary-row">
                <span className="cart-summary-label">Total a Pagar:</span>
                <span className="cart-summary-total">{totalPrice}</span>
              </div>

              <button
                type="button"
                className="cart-submit-whatsapp-btn"
                onClick={handleSendWhatsApp}
              >
                <WhatsAppIcon size={22} color="#ffffff" />
                <span>Enviar Pedido a WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
