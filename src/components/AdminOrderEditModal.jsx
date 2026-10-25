import React, { useState, useMemo } from 'react';
import { 
  X, Plus, Minus, Trash2, Edit3, Save, 
  Utensils, User, Phone, MessageSquare, AlertCircle, 
  Search, Check, DollarSign, ChefHat
} from 'lucide-react';
import { ordersService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

export function AdminOrderEditModal(props) {
  // Wrapper: monta el contenido (con todos sus hooks) solo cuando hay pedido y el modal está abierto.
  if (!props.isOpen || !props.order) return null;
  return <AdminOrderEditModalContent {...props} />;
}

function AdminOrderEditModalContent({
  isOpen,
  onClose,
  order,
  dishes = [],
  tables = [],
  onOrderUpdated
}) {

  const { showAlert } = useAlertConfirm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState(order.customer_name || 'Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || '');
  const [tableNumber, setTableNumber] = useState(order.table_number || '1');
  const [status, setStatus] = useState(order.status || 'pending');
  const [notes, setNotes] = useState(order.notes || '');

  // Items list
  const [items, setItems] = useState(() => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(it => ({
        id: it.id || Math.random().toString(),
        dish_id: it.dish_id || null,
        name: it.dish?.name || it.name || 'Plato',
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || it.dish?.price || 0),
        notes: it.notes || ''
      }));
    }
    return [];
  });

  // Selector para agregar plato existente del menú
  const [dishSearch, setDishSearch] = useState('');
  const [showDishSelector, setShowDishSelector] = useState(false);

  // Selector para plato manual personalizado
  const [showManualItem, setShowManualItem] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState(1);

  // Filtrado de platos del menú
  const filteredDishes = useMemo(() => {
    if (!dishSearch.trim()) return dishes.slice(0, 8);
    const q = dishSearch.toLowerCase();
    return dishes.filter(d => 
      d.name?.toLowerCase().includes(q) || 
      d.description?.toLowerCase().includes(q)
    );
  }, [dishes, dishSearch]);

  // Cálculos matemáticos
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
  }, [items]);

  // Cálculos fiscales y adicionales
  const hasTax = order.tax_enabled !== false && (Number(order.tax_amount) > 0 || order.tax_enabled);
  const taxAmount = useMemo(() => {
    if (!hasTax) return 0;
    return Number((subtotal * 0.06625).toFixed(2));
  }, [subtotal, hasTax]);

  const isCard = order.payment_method === 'tarjeta' || Number(order.card_fee_amount) > 0;
  const cardFeeAmount = useMemo(() => {
    if (!isCard) return 0;
    return Number((subtotal * 0.04).toFixed(2));
  }, [subtotal, isCard]);

  const hasTip = Number(order.tip_amount) > 0 || Number(order.diner_count) > 2;
  const tipAmount = useMemo(() => {
    if (!hasTip) return 0;
    return Number((subtotal * 0.16).toFixed(2));
  }, [subtotal, hasTip]);

  const deliveryAmount = Number(order.delivery_amount) || 0;

  const totalAmount = useMemo(() => {
    return Number((subtotal + taxAmount + cardFeeAmount + tipAmount + deliveryAmount).toFixed(2));
  }, [subtotal, taxAmount, cardFeeAmount, tipAmount, deliveryAmount]);

  // Manejadores de ítems
  const handleUpdateItemQty = (idx, delta) => {
    triggerHaptic(6);
    setItems(prev => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      copy[idx] = { ...copy[idx], quantity: newQty };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    triggerHaptic(8);
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItemNotes = (idx, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], notes: val };
      return copy;
    });
  };

  const handleAddMenuDish = (dish) => {
    triggerHaptic(8);
    setItems(prev => {
      const existingIdx = prev.findIndex(it => it.dish_id === dish.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { 
          ...copy[existingIdx], 
          quantity: copy[existingIdx].quantity + 1 
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: Math.random().toString(),
          dish_id: dish.id,
          name: dish.name,
          quantity: 1,
          unit_price: Number(dish.price || 0),
          notes: ''
        }
      ];
    });
    setDishSearch('');
    setShowDishSelector(false);
  };

  const handleAddManualItem = (e) => {
    e.preventDefault();
    if (!manualName.trim() || isNaN(Number(manualPrice))) return;
    triggerHaptic(8);
    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        dish_id: null,
        name: manualName.trim(),
        quantity: Math.max(1, Number(manualQty) || 1),
        unit_price: Number(manualPrice) || 0,
        notes: ''
      }
    ]);
    setManualName('');
    setManualPrice('');
    setManualQty(1);
    setShowManualItem(false);
  };

  // Guardar cambios
  const handleSaveOrder = async () => {
    if (items.length === 0) {
      await showAlert({
        title: 'Pedido Vacío',
        message: 'El pedido debe contener al menos un plato o ítem.',
        type: 'warning'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic(12);

      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: tableNumber,
        status,
        subtotal,
        tax_enabled: hasTax,
        tax_amount: taxAmount,
        card_fee_amount: cardFeeAmount,
        tip_amount: tipAmount,
        delivery_enabled: Boolean(order.delivery_enabled),
        delivery_amount: deliveryAmount,
        payment_method: order.payment_method || 'efectivo',
        total_amount: totalAmount,
        notes
      };

      const updated = await ordersService.updateOrderFull(order.id, orderData, items);
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error('Error guardando pedido editado:', err);
      await showAlert({
        title: 'Error al Guardar',
        message: 'No se pudo guardar la modificación del pedido. Inténtalo nuevamente.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
          border: 'none !important',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                  Editar Pedido #{order.order_number || order.id?.slice(0, 6)}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '8px',
                    backgroundColor: status === 'pending' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                    color: status === 'pending' ? '#b45309' : '#2563eb'
                  }}
                >
                  {status.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#78716c' }}>
                Modifica platos, cantidades, mesa, cliente o notas de cocina en vivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: '#f5efe4',
              color: '#78716c',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            backgroundColor: '#faf7f2'
          }}
        >
          {/* Fila 1: Cliente, Teléfono, Mesa y Estado */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.85rem',
              backgroundColor: '#ffffff',
              padding: '1.15rem',
              borderRadius: '20px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                Teléfono
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(201) 000-0000"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                Mesa / Ubicación
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#1f1e1c',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                Estado del Pedido
              </label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'in_kitchen', label: 'En Cocina' },
                  { value: 'ready', label: 'Listo para Servir' },
                  { value: 'delivered', label: 'Entregado' },
                  { value: 'paid', label: 'Pagado' },
                  { value: 'cancelled', label: 'Cancelado' }
                ]}
                buttonStyle={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          {/* Fila 2: Lista de Platos e Ítems del Pedido */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '1.25rem',
              borderRadius: '20px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Utensils size={18} color="var(--rojo, #d91c2b)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1f1e1c' }}>
                  Platos del Pedido ({items.length})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setShowDishSelector(!showDishSelector);
                    setShowManualItem(false);
                  }}
                  style={{
                    backgroundColor: showDishSelector ? '#1f1e1c' : '#f5efe4',
                    color: showDishSelector ? '#ffffff' : '#1f1e1c',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none !important',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={15} />
                  <span>Plato del Menú</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setShowManualItem(!showManualItem);
                    setShowDishSelector(false);
                  }}
                  style={{
                    backgroundColor: showManualItem ? '#1f1e1c' : '#f5efe4',
                    color: showManualItem ? '#ffffff' : '#1f1e1c',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none !important',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={15} />
                  <span>Ítem Manual</span>
                </button>
              </div>
            </div>

            {/* Dropdown / Buscador de platos de la carta */}
            {showDishSelector && (
              <div
                style={{
                  backgroundColor: '#f8f4ec',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#78716c" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    placeholder="Buscar plato en la carta..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: 'none !important',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#1f1e1c',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {filteredDishes.map(dish => (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => handleAddMenuDish(dish)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: 'none !important',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dish.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                        ${Number(dish.price).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario para agregar plato manual personalizado */}
            {showManualItem && (
              <form
                onSubmit={handleAddManualItem}
                style={{
                  backgroundColor: '#f8f4ec',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr auto',
                  gap: '0.5rem',
                  alignItems: 'end'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Nombre del Ítem
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Porción Extra Cancha"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualQty}
                    onChange={(e) => setManualQty(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Añadir
                </button>
              </form>
            )}

            {/* Lista actual de ítems */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#faf7f2',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f1e1c' }}>
                        {it.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716c' }}>
                        (${Number(it.unit_price).toFixed(2)} c/u)
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Nota de cocina (ej: sin cebolla, bien picante)..."
                      value={it.notes}
                      onChange={(e) => handleUpdateItemNotes(idx, e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '0.35rem',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: 'none !important',
                        fontSize: '0.76rem',
                        color: '#44403c',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Controles de Cantidad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ffffff', padding: '0.2rem', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, -1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          backgroundColor: '#f5efe4',
                          border: 'none !important',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1f1e1c'
                        }}
                      >
                        <Minus size={13} />
                      </button>

                      <span style={{ fontSize: '0.85rem', fontWeight: 900, minWidth: '22px', textAlign: 'center' }}>
                        {it.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, 1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          backgroundColor: '#f5efe4',
                          border: 'none !important',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1f1e1c'
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1f1e1c', minWidth: '60px', textAlign: 'right' }}>
                      ${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none !important',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fila 3: Notas Generales del Pedido */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '1.15rem',
              borderRadius: '20px',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.03)'
            }}
          >
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
              Instrucciones / Observaciones Generales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas generales para todo el servicio o mesa..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                backgroundColor: '#f5efe4',
                border: 'none !important',
                fontSize: '0.85rem',
                color: '#1f1e1c',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
          </div>
        </div>

        {/* Barra Inferior con Total y Botón Guardar */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#78716c', fontWeight: 700, marginBottom: '0.2rem' }}>
              <span>Subtotal: ${subtotal.toFixed(2)}</span>
              {hasTax && <span>+ Tax (6.625%): ${taxAmount.toFixed(2)}</span>}
              {isCard && <span>+ Tarjeta (4%): ${cardFeeAmount.toFixed(2)}</span>}
              {hasTip && <span>+ Gratuity (16%): ${tipAmount.toFixed(2)}</span>}
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
              ${totalAmount.toFixed(2)} USD
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: '#f5efe4',
                color: '#78716c',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none !important',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveOrder}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '14px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(217, 28, 43, 0.3)'
              }}
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios del Pedido'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
