import React, { useState } from 'react';
import { 
  Clock, ChefHat, CheckCircle2, AlertCircle, User, 
  MapPin, Check, Plus, Minus, RefreshCw, Volume2, 
  VolumeX, Utensils, MessageSquare, Phone, UserCheck,
  CreditCard, DollarSign, Kanban, LayoutGrid, CheckCheck
} from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

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
  const [viewMode, setViewMode] = useState('pipeline'); // 'pipeline' | 'grid'
  const [filterStatus, setFilterStatus] = useState('all');
  const [timeInputs, setTimeInputs] = useState({});

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
      title: '¡Pedido Listo!',
      message: `El pedido ${order.order_number} está listo para ser servido en Mesa ${order.table_number}.`,
      type: 'success'
    });
  };

  const handleDeliverOrder = async (order) => {
    triggerHaptic(12);
    const confirmed = await showConfirm({
      title: '¿Confirmar Entrega?',
      message: `¿Marcar el pedido ${order.order_number} de la Mesa ${order.table_number} como entregado?`,
      confirmText: 'Entregado',
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
      message: `¿Estás seguro de cancelar el pedido ${order.order_number}? El cliente verá la orden cancelada.`,
      confirmText: 'Sí, cancelar pedido',
      cancelText: 'No mantener',
      isDestructive: true
    });
    if (confirmed) {
      await onUpdateStatus(order.id, 'cancelled', order.estimated_time);
    }
  };

  const handleTogglePaid = async (order) => {
    triggerHaptic(12);
    const nextIsPaid = !order.is_paid;
    const confirmed = await showConfirm({
      title: nextIsPaid ? '¿Marcar Orden como Pagada?' : '¿Revertir Estado de Pago?',
      message: nextIsPaid
        ? `¿Confirmas que la orden ${order.order_number} (Mesa ${order.table_number}) fue pagada por $${Number(order.total_amount || 0).toFixed(2)}?`
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

  // Filtrado de pedidos para la vista Grid
  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return o.status === 'pending';
    if (filterStatus === 'in_kitchen') return o.status === 'in_kitchen' || o.status === 'accepted';
    if (filterStatus === 'ready') return o.status === 'ready';
    if (filterStatus === 'delivered') return o.status === 'delivered';
    if (filterStatus === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  // Columnas para el Pipeline / Kanban
  const pipelineColumns = [
    {
      id: 'pending',
      title: 'Pendientes',
      icon: Clock,
      color: '#f59e0b',
      orders: orders.filter(o => o.status === 'pending')
    },
    {
      id: 'in_kitchen',
      title: 'En Cocina',
      icon: ChefHat,
      color: '#3b82f6',
      orders: orders.filter(o => o.status === 'in_kitchen' || o.status === 'accepted')
    },
    {
      id: 'ready',
      title: 'Listos para Servir',
      icon: CheckCircle2,
      color: '#10b981',
      orders: orders.filter(o => o.status === 'ready')
    },
    {
      id: 'delivered',
      title: 'Entregados / Pagados',
      icon: Utensils,
      color: '#9ca3af',
      orders: orders.filter(o => o.status === 'delivered')
    }
  ];

  // Componente Reutilizable: Tarjeta de Pedido
  const renderOrderCard = (order, isCompact = false) => {
    const isPending = order.status === 'pending';
    const isKitchen = order.status === 'in_kitchen' || order.status === 'accepted';
    const isReady = order.status === 'ready';
    const isDelivered = order.status === 'delivered';
    const isPaid = Boolean(order.is_paid || order.payment_status === 'paid');

    const cardColor = isPending
      ? '#f59e0b'
      : isKitchen
      ? '#3b82f6'
      : isReady
      ? '#10b981'
      : '#9ca3af';

    const formattedTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div
        key={order.id}
        style={{
          backgroundColor: 'var(--bg-card, #1c1d22)',
          borderRadius: '16px',
          padding: isCompact ? '1rem' : '1.25rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          border: 'none !important',
          display: 'flex',
          flexDirection: 'column',
          gap: isCompact ? '0.75rem' : '0.9rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Franja superior de color de estado */}
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
                backgroundColor: `${cardColor}25`,
                color: cardColor,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 800
              }}
            >
              {order.order_number}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>
              {formattedTime}
            </span>
          </div>

          {/* Mesa Destacada */}
          <div
            style={{
              backgroundColor: 'rgba(217, 28, 43, 0.18)',
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

        {/* Info Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#ffffff' }}>
            <User size={14} color="var(--rojo, #d91c2b)" />
            <span>{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#9ca3af', fontSize: '0.75rem' }}>
              <Phone size={12} />
              <span>{order.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Lista de Platos Solicitados */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>
                    {item.dish_name}
                  </span>
                </div>
                {item.notes && (
                  <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.1rem', fontStyle: 'italic', paddingLeft: '1.4rem' }}>
                    Nota: "{item.notes}"
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 700, color: '#9ca3af', fontSize: '0.78rem' }}>
                ${Number(item.subtotal || item.dish_price * item.quantity || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Nota General */}
        {order.notes && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
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

        {/* Fila de Total y Asignación de Mesero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Total:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
              ${Number(order.total_amount || 0).toFixed(2)}
            </span>
          </div>

          {/* Asignación de Mesero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <UserCheck size={13} color="#9ca3af" />
            <select
              value={order.waiter_id || ''}
              onChange={(e) => onAssignWaiter(order.id, e.target.value || null)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
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

        {/* Fila de Estado de Pago (Pagada / Marcar como Pagada) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.1rem' }}>
          {isPaid ? (
            <button
              type="button"
              onClick={() => handleTogglePaid(order)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                color: '#10b981',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
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
              <span>PAGADO (${Number(order.total_amount || 0).toFixed(2)})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTogglePaid(order)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
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
              <span>Marcar como Pagada</span>
            </button>
          )}
        </div>

        {/* Control de Tiempo de Espera (para pendientes o en cocina) */}
        {(isPending || isKitchen) && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '0.55rem',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} />
                Tiempo de Espera:
              </span>
              <strong style={{ fontSize: '0.78rem', color: cardColor }}>
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
                    backgroundColor: (timeInputs[order.id] || order.estimated_time) === timePreset ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
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

        {/* Botones de Acción de Estado del Pedido */}
        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.2rem' }}>
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => handleAcceptOrder(order)}
                style={{
                  flex: 2,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
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
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.6rem 0.65rem',
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
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)'
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
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#9ca3af',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.6rem 0.5rem',
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
                backgroundColor: '#10b981',
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
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
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
                color: '#10b981',
                fontWeight: 700,
                padding: '0.4rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px'
              }}
            >
              Orden completada y entregada
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra Superior con Contadores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {/* Métrica: Pendientes */}
        <div
          onClick={() => setFilterStatus('pending')}
          style={{
            backgroundColor: filterStatus === 'pending' ? 'rgba(245, 158, 11, 0.22)' : 'var(--bg-card, #1c1d22)',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f59e0b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Pendientes</span>
            <Clock size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem' }}>
            {countPending}
          </div>
        </div>

        {/* Métrica: En Cocina */}
        <div
          onClick={() => setFilterStatus('in_kitchen')}
          style={{
            backgroundColor: filterStatus === 'in_kitchen' ? 'rgba(59, 130, 246, 0.22)' : 'var(--bg-card, #1c1d22)',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#3b82f6' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>En Cocina</span>
            <ChefHat size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem' }}>
            {countKitchen}
          </div>
        </div>

        {/* Métrica: Listos */}
        <div
          onClick={() => setFilterStatus('ready')}
          style={{
            backgroundColor: filterStatus === 'ready' ? 'rgba(16, 185, 129, 0.22)' : 'var(--bg-card, #1c1d22)',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Listos</span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem' }}>
            {countReady}
          </div>
        </div>

        {/* Métrica: Entregados */}
        <div
          onClick={() => setFilterStatus('delivered')}
          style={{
            backgroundColor: filterStatus === 'delivered' ? 'rgba(156, 163, 175, 0.22)' : 'var(--bg-card, #1c1d22)',
            padding: '1rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#9ca3af' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Entregados</span>
            <Utensils size={18} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '0.35rem' }}>
            {countDelivered}
          </div>
        </div>
      </div>

      {/* Controles de Vista (Pipeline vs Cuadrícula), Filtros y Alertas */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card, #1a1b20)',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          border: 'none !important'
        }}
      >
        {/* Selector de Modo de Vista: Pipeline Kanban vs Grid */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(0,0,0,0.25)', padding: '0.25rem', borderRadius: '10px' }}>
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
              color: '#ffffff',
              padding: '0.4rem 0.8rem',
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
              color: '#ffffff',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              transition: 'all 0.2s ease'
            }}
          >
            <LayoutGrid size={15} />
            <span>Vista Tarjetas</span>
          </button>
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
              backgroundColor: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: soundEnabled ? '#10b981' : '#9ca3af',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important'
            }}
            title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Alerta Activa' : 'Sin Sonido'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
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

      {/* RENDERIZADO SEGÚN EL MODO: PIPELINE KANBAN O GRID */}
      {viewMode === 'pipeline' ? (
        /* VISTA PIPELINE KANBAN */
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
            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '18px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  minHeight: '480px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  border: 'none !important'
                }}
              >
                {/* Cabecera de Columna */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.65rem',
                    borderBottom: 'none'
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
                      backgroundColor: `${col.color}25`,
                      color: col.color,
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px'
                    }}
                  >
                    {col.orders.length}
                  </span>
                </div>

                {/* Lista de Pedidos en esta Columna */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflowY: 'auto',
                    flex: 1
                  }}
                >
                  {col.orders.length === 0 ? (
                    <div
                      style={{
                        padding: '2.5rem 1rem',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '0.8rem',
                        fontStyle: 'italic'
                      }}
                    >
                      Sin pedidos en esta fase
                    </div>
                  ) : (
                    col.orders.map(order => renderOrderCard(order, true))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA GRID CLÁSICA */
        <div>
          {/* Pills de Filtrado en Grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: `Pendientes (${countPending})` },
              { id: 'in_kitchen', label: `Cocina (${countKitchen})` },
              { id: 'ready', label: `Listos (${countReady})` },
              { id: 'delivered', label: 'Entregados' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setFilterStatus(tab.id);
                }}
                style={{
                  backgroundColor: filterStatus === tab.id ? 'var(--rojo, #d91c2b)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none !important',
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
                backgroundColor: 'var(--bg-card, #1c1d22)',
                borderRadius: '16px',
                color: '#9ca3af',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: 'none !important'
              }}
            >
              <Utensils size={42} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No hay pedidos en esta sección</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Los nuevos pedidos recibidos desde la carta se mostrarán aquí en tiempo real.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredOrders.map(order => renderOrderCard(order, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
