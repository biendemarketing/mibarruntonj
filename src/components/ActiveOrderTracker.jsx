import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, AlertCircle, ShoppingBag, ChevronDown, ChevronUp, X, Utensils } from 'lucide-react';
import { ordersService } from '../services/supabase';

export function ActiveOrderTracker({ activeOrder, onClose, onRefresh }) {
  const [order, setOrder] = useState(activeOrder);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setOrder(activeOrder);
  }, [activeOrder]);

  // Suscribirse a cambios en tiempo real del pedido específico
  useEffect(() => {
    if (!order?.id) return;

    const unsubscribe = ordersService.subscribeToClientOrder(order.id, (updatedOrder) => {
      setOrder((prev) => ({
        ...prev,
        ...updatedOrder
      }));
      if (onRefresh) onRefresh();
    });

    return () => {
      unsubscribe();
    };
  }, [order?.id, onRefresh]);

  if (!order || !order.id) return null;

  // Estados visuales
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Pedido Recibido',
          subtitle: 'Esperando confirmación del restaurante',
          badgeClass: 'status-badge-pending',
          icon: Clock,
          color: '#f59e0b',
          step: 1
        };
      case 'accepted':
      case 'in_kitchen':
        return {
          title: 'En Preparación',
          subtitle: `Tiempo estimado: ${order.estimated_time || '15-20 min'}`,
          badgeClass: 'status-badge-kitchen',
          icon: ChefHat,
          color: '#3b82f6',
          step: 2
        };
      case 'ready':
        return {
          title: '¡Listo para Servir!',
          subtitle: 'Tu orden está saliendo a tu mesa',
          badgeClass: 'status-badge-ready',
          icon: CheckCircle2,
          color: '#10b981',
          step: 3
        };
      case 'delivered':
        return {
          title: 'Entregado',
          subtitle: '¡Que disfrutes tu comida en Mi Barrunto!',
          badgeClass: 'status-badge-delivered',
          icon: CheckCircle2,
          color: '#10b981',
          step: 4
        };
      case 'cancelled':
        return {
          title: 'Pedido Cancelado',
          subtitle: 'Comunícate con el personal de sala',
          badgeClass: 'status-badge-cancelled',
          icon: AlertCircle,
          color: '#ef4444',
          step: 0
        };
      default:
        return {
          title: 'Procesando Pedido',
          subtitle: 'Actualizando estado...',
          badgeClass: 'status-badge-pending',
          icon: Clock,
          color: '#f59e0b',
          step: 1
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '88px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '480px',
        backgroundColor: 'rgba(20, 21, 26, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 16px 45px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        border: 'none !important',
        zIndex: 998,
        color: '#ffffff',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Barra de progreso de estado */}
      <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', width: '100%', display: 'flex' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: statusInfo.color,
            width: `${Math.min(100, Math.max(15, (statusInfo.step / 4) * 100))}%`,
            transition: 'width 0.6s ease',
            borderRadius: '9999px'
          }}
        />
      </div>

      {/* Contenido principal */}
      <div style={{ padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: `${statusInfo.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statusInfo.color,
                flexShrink: 0
              }}
            >
              <StatusIcon size={22} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  {statusInfo.title}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    color: '#e5e7eb'
                  }}
                >
                  {order.order_number}
                </span>
              </div>
              <p
                style={{
                  margin: '0.15rem 0 0 0',
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.72)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {statusInfo.subtitle} · Mesa {order.table_number}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: 'none !important',
                borderRadius: '9999px',
                padding: '0.4rem',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isExpanded ? 'Ver menos' : 'Ver detalle del pedido'}
            >
              {isExpanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </button>

            {order.status === 'delivered' || order.status === 'cancelled' ? (
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.4rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Cerrar seguimiento"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Detalle expandido con los ítems pedidos */}
        {isExpanded && (
          <div
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.85rem',
              borderTop: 'none !important',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              padding: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detalle de la orden
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--naranja, #f97316)' }}>
                ${Number(order.total_amount || 0).toFixed(2)}
              </span>
            </div>

            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(order.order_items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontWeight: 800, color: '#ffffff', minWidth: '18px' }}>
                      {item.quantity}x
                    </span>
                    <span style={{ color: '#e5e7eb' }}>
                      {item.dish_name}
                    </span>
                  </div>
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>
                    ${Number(item.subtotal || item.dish_price * item.quantity || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
              <span>Cliente: <strong style={{ color: '#ffffff' }}>{order.customer_name}</strong></span>
              <span>Tiempo Estimado: <strong style={{ color: statusInfo.color }}>{order.estimated_time || '15-20 min'}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
