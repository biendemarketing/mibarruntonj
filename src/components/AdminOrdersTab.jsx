import React, { useState, useMemo } from 'react';
import { 
  Clock, ChefHat, CheckCircle2, AlertCircle, User, 
  Check, RefreshCw, Volume2, VolumeX, Utensils, 
  MessageSquare, Phone, UserCheck, CreditCard, 
  DollarSign, Kanban, LayoutGrid, CheckCheck, 
  Users, Search, Calendar, FileText, Star, X
} from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { getClientShortCode } from '../utils/clientIdentity';

export function AdminOrdersTab({
  orders = [],
  waiters = [],
  onUpdateStatus,
  onAssignWaiter,
  onMarkOrderPaid,
  soundEnabled,
  onToggleSound,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'grid' | 'history'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeInputs, setTimeInputs] = useState({});

  // Calcular clientes recurrentes agregando el número de órdenes por identificador
  const customerStats = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const key = o.client_uuid || (o.customer_phone ? o.customer_phone.replace(/\D/g, '') : null) || o.customer_name?.toLowerCase().trim();
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  const getClientInfo = (order) => {
    const key = order.client_uuid || (order.customer_phone ? order.customer_phone.replace(/\D/g, '') : null) || order.customer_name?.toLowerCase().trim();
    const count = (key && customerStats[key]) || 1;
    const clientCode = getClientShortCode(order.client_uuid);
    return {
      clientCode,
      orderCount: count,
      isRecurring: count > 1
    };
  };

  const handleTimeChange = (orderId, value) => {
    setTimeInputs(prev => ({ ...prev, [orderId]: value }));
  };

  const handleQuickTime = (orderId, minutes) => {
    const text = `${minutes} min`;
    setTimeInputs(prev => ({ ...prev, [orderId]: text }));
  };

  const handleAcceptOrder = async (order) => {
    triggerHaptic(12);
    const estTime = timeInputs[order.id] || order.estimated_time || '20 min';
    await onUpdateStatus(order.id, 'in_kitchen', estTime);
    showAlert({
      title: 'Pedido Aceptado',
      message: `El pedido ${order.order_number} ha pasado a cocina con tiempo estimado de ${estTime}.`,
      type: 'success'
    });
  };

  const handleReadyOrder = async (order) => {
    triggerHaptic(12);
    await onUpdateStatus(order.id, 'ready', order.estimated_time);
    showAlert({
      title: '¡Pedido Listo para Servir!',
      message: `El pedido ${order.order_number} está listo para ser servido en Mesa ${order.table_number}.`,
      type: 'success'
    });
  };

  const handleDeliverOrder = async (order) => {
    triggerHaptic(12);
    const confirmed = await showConfirm({
      title: '¿Confirmar Entrega de Pedido?',
      message: `¿Marcar el pedido ${order.order_number} de la Mesa ${order.table_number} como entregado a los comensales?`,
      confirmText: 'Sí, Entregado',
      cancelText: 'Volver'
    });
    if (confirmed) {
      await onUpdateStatus(order.id, 'delivered', order.estimated_time);
    }
  };

  const handleCancelOrder = async (order) => {
    triggerHaptic(15);
    const confirmed = await showConfirm({
      title: '¿Rechazar / Cancelar Pedido?',
      message: `¿Estás seguro de cancelar el pedido ${order.order_number}? El cliente verá la orden cancelada en su pantalla.`,
      confirmText: 'Sí, Cancelar Pedido',
      cancelText: 'No, Mantener',
      isDestructive: true
    });
    if (confirmed) {
      await onUpdateStatus(order.id, 'cancelled', order.estimated_time);
      showAlert({
        title: 'Pedido Cancelado',
        message: `La orden ${order.order_number} fue cancelada.`,
        type: 'warning'
      });
    }
  };

  const handleTogglePaid = async (order) => {
    triggerHaptic(12);
    const nextIsPaid = !order.is_paid;
    const confirmed = await showConfirm({
      title: nextIsPaid ? '¿Marcar Orden como Pagada?' : '¿Revertir Estado de Pago?',
      message: nextIsPaid
        ? `¿Confirmas que la orden ${order.order_number} (Mesa ${order.table_number}) fue pagada por $${Number(order.total_amount || 0).toFixed(2)} mediante ${order.payment_method || 'efectivo'}?`
        : `¿Deseas desmarcar el pago de la orden ${order.order_number}?`,
      confirmText: nextIsPaid ? 'Sí, Marcar Pagada' : 'Revertir',
      cancelText: 'Cancelar'
    });

    if (confirmed && onMarkOrderPaid) {
      await onMarkOrderPaid(order.id, nextIsPaid);
      showAlert({
        title: nextIsPaid ? 'Orden Pagada' : 'Pago Revertido',
        message: `La orden ${order.order_number} fue actualizada correctamente.`,
        type: 'success'
      });
    }
  };

  // Contadores de estado
  const countPending = orders.filter(o => o.status === 'pending').length;
  const countKitchen = orders.filter(o => o.status === 'in_kitchen' || o.status === 'accepted').length;
  const countReady = orders.filter(o => o.status === 'ready').length;
  const countDelivered = orders.filter(o => o.status === 'delivered').length;

  // Filtrado de pedidos según término de búsqueda y filtro de estado
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Filtro por estado
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && o.status !== 'pending') return false;
        if (filterStatus === 'in_kitchen' && o.status !== 'in_kitchen' && o.status !== 'accepted') return false;
        if (filterStatus === 'ready' && o.status !== 'ready') return false;
        if (filterStatus === 'delivered' && o.status !== 'delivered') return false;
        if (filterStatus === 'cancelled' && o.status !== 'cancelled') return false;
        if (filterStatus === 'paid' && !o.is_paid) return false;
        if (filterStatus === 'unpaid' && o.is_paid) return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = (o.order_number || '').toLowerCase().includes(q);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
        const tableMatch = String(o.table_number || '').toLowerCase().includes(q);
        const phoneMatch = (o.customer_phone || '').includes(q);
        const codeMatch = getClientShortCode(o.client_uuid).toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !tableMatch && !phoneMatch && !codeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  // Columnas para el Pipeline / Kanban
  const pipelineColumns = [
    {
      id: 'pending',
      title: 'Pendientes',
      icon: Clock,
      color: '#d97706',
      bgLight: '#fef3c7',
      orders: orders.filter(o => o.status === 'pending')
    },
    {
      id: 'in_kitchen',
      title: 'En Cocina',
      icon: ChefHat,
      color: '#2563eb',
      bgLight: '#eff6ff',
      orders: orders.filter(o => o.status === 'in_kitchen' || o.status === 'accepted')
    },
    {
      id: 'ready',
      title: 'Listos para Servir',
      icon: CheckCircle2,
      color: '#059669',
      bgLight: '#ecfdf5',
      orders: orders.filter(o => o.status === 'ready')
    },
    {
      id: 'delivered',
      title: 'Entregados / Pagados',
      icon: Utensils,
      color: '#4b5563',
      bgLight: '#f3f4f6',
      orders: orders.filter(o => o.status === 'delivered')
    }
  ];

  // Renderizado de tarjeta de pedido en tema Light Luxury
  const renderOrderCard = (order, isCompact = false) => {
    const isPending = order.status === 'pending';
    const isKitchen = order.status === 'in_kitchen' || order.status === 'accepted';
    const isReady = order.status === 'ready';
    const isDelivered = order.status === 'delivered';
    const isPaid = Boolean(order.is_paid || order.payment_status === 'paid');

    const cardColor = isPending
      ? '#d97706'
      : isKitchen
      ? '#2563eb'
      : isReady
      ? '#059669'
      : '#4b5563';

    const formattedTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { clientCode, orderCount, isRecurring } = getClientInfo(order);

    return (
      <div
        key={order.id}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: isCompact ? '1rem' : '1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: 'none !important',
          display: 'flex',
          flexDirection: 'column',
          gap: isCompact ? '0.75rem' : '0.9rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Franja superior de color de fase */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: cardColor
          }}
        />

        {/* Cabecera del Pedido */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                backgroundColor: `${cardColor}18`,
                color: cardColor,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 800
              }}
            >
              {order.order_number}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#6b635b', fontWeight: 600 }}>
              {formattedTime}
            </span>
          </div>

          {/* Mesa Destacada */}
          <div
            style={{
              backgroundColor: 'rgba(217, 28, 43, 0.1)',
              color: 'var(--rojo, #d91c2b)',
              padding: '0.25rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800
            }}
          >
            Mesa {order.table_number}
          </div>
        </div>

        {/* Info Cliente & Identificador Recurrente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: '#1f1e1c', fontSize: '0.92rem' }}>
              <User size={15} color="var(--rojo, #d91c2b)" />
              <span>{order.customer_name}</span>
            </div>

            {/* Código Único de Cliente para evitar confusión de nombres */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#6b635b',
                backgroundColor: '#f5efe4',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px'
              }}
              title="Código único de cliente en dispositivo"
            >
              {clientCode}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
            {/* Badge de Cliente Frecuente o Nuevo */}
            {isRecurring ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px'
                }}
              >
                <Star size={11} fill="#b45309" />
                Cliente Frecuente ({orderCount} visitas)
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px'
                }}
              >
                Primera Visita
              </span>
            )}

            {order.customer_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6b635b', fontSize: '0.75rem' }}>
                <Phone size={12} />
                <span>{order.customer_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fila de Método de Pago y Cantidad de Comensales */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fcf9f2',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#1f1e1c', fontWeight: 700 }}>
            <Users size={14} color="var(--rojo, #d91c2b)" />
            <span>{order.diner_count || 2} comensales</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#1f1e1c', fontWeight: 700 }}>
            <CreditCard size={14} color="#059669" />
            <span style={{ textTransform: 'capitalize' }}>{order.payment_method || 'Efectivo'}</span>
          </div>
        </div>

        {/* Lista de Platos Solicitados */}
        <div
          style={{
            backgroundColor: '#f5efe4',
            borderRadius: '12px',
            padding: '0.65rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            maxHeight: isCompact ? '130px' : '180px',
            overflowY: 'auto'
          }}
        >
          {(order.order_items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.82rem' }}>
              <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: cardColor, minWidth: '18px' }}>
                    {item.quantity}x
                  </span>
                  <span style={{ color: '#1f1e1c', fontWeight: 700 }}>
                    {item.dish_name}
                  </span>
                </div>
                {item.notes && (
                  <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '0.1rem', fontStyle: 'italic', paddingLeft: '1.4rem' }}>
                    Nota: "{item.notes}"
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 800, color: '#6b635b', fontSize: '0.8rem' }}>
                ${Number(item.subtotal || item.dish_price * item.quantity || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Indicaciones Generales */}
        {order.notes && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#b45309',
              backgroundColor: '#fef3c7',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MessageSquare size={13} style={{ flexShrink: 0 }} />
            <span>Indicaciones: {order.notes}</span>
          </div>
        )}

        {/* Fila de Total y Mesero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b635b' }}>Total:</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
              ${Number(order.total_amount || 0).toFixed(2)}
            </span>
          </div>

          {/* Asignación de Mesero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <UserCheck size={14} color="#6b635b" />
            <select
              value={order.waiter_id || ''}
              onChange={(e) => onAssignWaiter(order.id, e.target.value || null)}
              style={{
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.3rem 0.5rem',
                borderRadius: '8px',
                border: 'none !important',
                cursor: 'pointer'
              }}
            >
              <option value="">Sin mesero</option>
              {waiters.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estado de Pago (Pagada / Marcar como Pagada) */}
        <div>
          {isPaid ? (
            <button
              type="button"
              onClick={() => handleTogglePaid(order)}
              style={{
                width: '100%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                border: 'none !important'
              }}
              title="Click para cambiar estado de pago"
            >
              <CheckCheck size={15} />
              <span>ORDEN PAGADA (${Number(order.total_amount || 0).toFixed(2)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTogglePaid(order)}
              style={{
                width: '100%',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                border: 'none !important'
              }}
              title="Marcar orden como pagada por el cliente"
            >
              <CreditCard size={14} />
              <span>Pendiente de Pago · Marcar Pagada</span>
            </button>
          )}
        </div>

        {/* Control de Tiempo de Espera (para pendientes o en cocina) */}
        {(isPending || isKitchen) && (
          <div
            style={{
              backgroundColor: '#fcf9f2',
              padding: '0.55rem',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b635b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} />
                Tiempo de Espera:
              </span>
              <strong style={{ fontSize: '0.8rem', color: cardColor }}>
                {timeInputs[order.id] || order.estimated_time || '15-20 min'}
              </strong>
            </div>

            {/* Presets de Tiempo rápido */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['10 min', '15 min', '20 min', '30 min'].map(timePreset => (
                <button
                  key={timePreset}
                  type="button"
                  onClick={() => handleQuickTime(order.id, parseInt(timePreset))}
                  style={{
                    flex: 1,
                    backgroundColor: (timeInputs[order.id] || order.estimated_time) === timePreset ? '#dbeafe' : '#f5efe4',
                    color: (timeInputs[order.id] || order.estimated_time) === timePreset ? '#1d4ed8' : '#1f1e1c',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.25rem 0',
                    borderRadius: '6px',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  {timePreset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botones de Acción de Estado del Pedido con Confirmación Estricta */}
        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.2rem' }}>
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => handleAcceptOrder(order)}
                style={{
                  flex: 2,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)'
                }}
              >
                <Check size={15} />
                <span>Aceptar Pedido</span>
              </button>

              <button
                type="button"
                onClick={() => handleCancelOrder(order)}
                style={{
                  flex: 1,
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '0.65rem 0.65rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                Rechazar
              </button>
            </>
          )}

          {isKitchen && (
            <>
              <button
                type="button"
                onClick={() => handleReadyOrder(order)}
                style={{
                  flex: 2,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)'
                }}
              >
                <ChefHat size={15} />
                <span>Marcar Listo</span>
              </button>

              <button
                type="button"
                onClick={() => handleCancelOrder(order)}
                style={{
                  flex: 1,
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                Cancelar
              </button>
            </>
          )}

          {isReady && (
            <button
              type="button"
              onClick={() => handleDeliverOrder(order)}
              style={{
                width: '100%',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Marcar como Entregado</span>
            </button>
          )}

          {isDelivered && (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: '#059669',
                fontWeight: 800,
                padding: '0.5rem',
                backgroundColor: '#ecfdf5',
                borderRadius: '8px'
              }}
            >
              Orden completada y servida
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Métricas Superiores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {/* Métrica: Pendientes */}
        <div
          onClick={() => {
            triggerHaptic(8);
            setFilterStatus('pending');
          }}
          style={{
            backgroundColor: filterStatus === 'pending' ? '#fef3c7' : '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#d97706' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Pendientes</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1f1e1c', marginTop: '0.35rem' }}>
            {countPending}
          </div>
        </div>

        {/* Métrica: En Cocina */}
        <div
          onClick={() => {
            triggerHaptic(8);
            setFilterStatus('in_kitchen');
          }}
          style={{
            backgroundColor: filterStatus === 'in_kitchen' ? '#eff6ff' : '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#2563eb' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>En Cocina</span>
            <ChefHat size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1f1e1c', marginTop: '0.35rem' }}>
            {countKitchen}
          </div>
        </div>

        {/* Métrica: Listos */}
        <div
          onClick={() => {
            triggerHaptic(8);
            setFilterStatus('ready');
          }}
          style={{
            backgroundColor: filterStatus === 'ready' ? '#ecfdf5' : '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Listos</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1f1e1c', marginTop: '0.35rem' }}>
            {countReady}
          </div>
        </div>

        {/* Métrica: Entregados */}
        <div
          onClick={() => {
            triggerHaptic(8);
            setFilterStatus('delivered');
          }}
          style={{
            backgroundColor: filterStatus === 'delivered' ? '#f3f4f6' : '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#4b5563' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Entregados</span>
            <Utensils size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1f1e1c', marginTop: '0.35rem' }}>
            {countDelivered}
          </div>
        </div>
      </div>

      {/* Barra de Controles: Selector de Vista, Buscador y Alerta */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
          padding: '0.75rem 1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: 'none !important'
        }}
      >
        {/* Selector de Modo de Vista */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f5efe4', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setViewMode('pipeline');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: viewMode === 'pipeline' ? 'var(--rojo, #d91c2b)' : 'transparent',
              color: viewMode === 'pipeline' ? '#ffffff' : '#6b635b',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              transition: 'all 0.2s ease'
            }}
          >
            <Kanban size={15} />
            <span>Pipeline Kanban</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setViewMode('grid');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: viewMode === 'grid' ? 'var(--rojo, #d91c2b)' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : '#6b635b',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutGrid size={15} />
            <span>Tarjetas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setViewMode('history');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: viewMode === 'history' ? 'var(--rojo, #d91c2b)' : 'transparent',
              color: viewMode === 'history' ? '#ffffff' : '#6b635b',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText size={15} />
            <span>Registro Completo</span>
          </button>
        </div>

        {/* Buscador de Órdenes y Clientes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '320px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#f5efe4',
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              width: '100%'
            }}
          >
            <Search size={15} color="#6b635b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar #orden, cliente, mesa, #CLI..."
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none !important',
                outline: 'none',
                fontSize: '0.82rem',
                color: '#1f1e1c',
                fontWeight: 600
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none !important', cursor: 'pointer', padding: 0, color: '#6b635b' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Acciones Rápidas (Sonido y Refrescar) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onToggleSound}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: soundEnabled ? '#ecfdf5' : '#f5efe4',
              color: soundEnabled ? '#059669' : '#6b635b',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important'
            }}
            title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Alerta Activa' : 'Silencio'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important'
            }}
            title="Actualizar pedidos"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* RENDERIZADO: PIPELINE KANBAN, VISTA CUADRÍCULA O REGISTRO HISTÓRICO */}
      {viewMode === 'pipeline' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem'
          }}
        >
          {pipelineColumns.map(col => {
            const Icon = col.icon;
            // Filtrar también por término de búsqueda si existe
            const colOrders = col.orders.filter(o => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase().trim();
              return (
                (o.order_number || '').toLowerCase().includes(q) ||
                (o.customer_name || '').toLowerCase().includes(q) ||
                String(o.table_number || '').includes(q) ||
                (o.customer_phone || '').includes(q) ||
                getClientShortCode(o.client_uuid).toLowerCase().includes(q)
              );
            });

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  minHeight: '480px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: 'none !important'
                }}
              >
                {/* Cabecera de Columna */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: col.color }}>
                    <Icon size={18} />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0 }}>
                      {col.title}
                    </h3>
                  </div>

                  <span
                    style={{
                      backgroundColor: col.bgLight,
                      color: col.color,
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px'
                    }}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Lista de Pedidos en Columna */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflowY: 'auto',
                    flex: 1
                  }}
                >
                  {colOrders.length === 0 ? (
                    <div
                      style={{
                        padding: '2.5rem 1rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                      }}
                    >
                      Sin pedidos en esta fase
                    </div>
                  ) : (
                    colOrders.map(order => renderOrderCard(order, true))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'grid' && (
        <div>
          {/* Pills de Filtrado Rápido */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: `Pendientes (${countPending})` },
              { id: 'in_kitchen', label: `Cocina (${countKitchen})` },
              { id: 'ready', label: `Listos (${countReady})` },
              { id: 'delivered', label: 'Entregados' },
              { id: 'paid', label: 'Solo Pagados' },
              { id: 'unpaid', label: 'Pendientes de Pago' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setFilterStatus(tab.id);
                }}
                style={{
                  backgroundColor: filterStatus === tab.id ? 'var(--rojo, #d91c2b)' : '#ffffff',
                  color: filterStatus === tab.id ? '#ffffff' : '#6b635b',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                color: '#6b635b',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: 'none !important'
              }}
            >
              <Utensils size={42} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f1e1c' }}>No se encontraron pedidos</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Prueba con otro filtro o término de búsqueda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredOrders.map(order => renderOrderCard(order, false))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: REGISTRO HISTÓRICO COMPLETO (TABLA DE AUDITORÍA) */}
      {viewMode === 'history' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: 'none !important',
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
                Registro Histórico de Pedidos
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#6b635b' }}>
                Mostrando {filteredOrders.length} pedidos registrados en Supabase
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f1e1c' }}>
              Total Facturado: <span style={{ color: 'var(--rojo, #d91c2b)' }}>${filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toFixed(2)}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fcf9f2', color: '#6b635b', fontWeight: 800, borderBottom: 'none' }}>
                <th style={{ padding: '0.75rem 0.6rem' }}>Orden</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Fecha/Hora</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Cliente</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Mesa</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Comensales</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Método</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Total</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Estado</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Pago</th>
                <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const { clientCode, isRecurring, orderCount } = getClientInfo(order);
                const isPaid = Boolean(order.is_paid || order.payment_status === 'paid');
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: 'none',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 800, color: '#1f1e1c' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', color: '#6b635b', whiteSpace: 'nowrap' }}>
                      {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <div style={{ fontWeight: 800, color: '#1f1e1c' }}>{order.customer_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#6b635b', backgroundColor: '#f5efe4', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          {clientCode}
                        </span>
                        {isRecurring && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#b45309', backgroundColor: '#fef3c7', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            Frecuente ({orderCount})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 800, color: 'var(--rojo, #d91c2b)' }}>
                      Mesa {order.table_number}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', color: '#1f1e1c', fontWeight: 700 }}>
                      {order.diner_count || 2} pers.
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', color: '#6b635b', textTransform: 'capitalize' }}>
                      {order.payment_method || 'efectivo'}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 900, color: '#1f1e1c' }}>
                      ${Number(order.total_amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: order.status === 'delivered' ? '#f3f4f6' : order.status === 'ready' ? '#ecfdf5' : order.status === 'in_kitchen' ? '#eff6ff' : '#fef3c7',
                          color: order.status === 'delivered' ? '#4b5563' : order.status === 'ready' ? '#059669' : order.status === 'in_kitchen' ? '#2563eb' : '#d97706'
                        }}
                      >
                        {order.status === 'delivered' ? 'Entregado' : order.status === 'ready' ? 'Listo' : order.status === 'in_kitchen' ? 'En Cocina' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: isPaid ? '#ecfdf5' : '#fef3c7',
                          color: isPaid ? '#059669' : '#b45309'
                        }}
                      >
                        {isPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(order)}
                        style={{
                          backgroundColor: isPaid ? '#f5efe4' : '#ecfdf5',
                          color: isPaid ? '#6b635b' : '#059669',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: 'none !important'
                        }}
                      >
                        {isPaid ? 'Desmarcar' : 'Marcar Pagado'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
