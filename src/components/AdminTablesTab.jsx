import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Check, QrCode, Copy, RefreshCw, 
  X, Users, AlertTriangle, Sparkles, Layers, 
  Download, ExternalLink, Printer 
} from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { restaurantConfigService } from '../services/supabase';

export function AdminTablesTab({
  tables = [],
  orders = [],
  onCreateTable,
  onUpdateTable,
  onDeleteTable,
  onCloseTable,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrMode, setQrMode] = useState('single'); // 'single' (QR único - default) | 'per_table' (QR por mesa)
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: 4,
    status: 'available'
  });

  // Cargar modo de QR configurado
  useEffect(() => {
    restaurantConfigService.getQrModeConfig().then(savedMode => {
      if (savedMode) setQrMode(savedMode);
    });
  }, []);

  const handleSwitchQrMode = async (newMode) => {
    triggerHaptic(10);
    setQrMode(newMode);
    await restaurantConfigService.updateQrModeConfig(newMode);
    showAlert({
      title: newMode === 'single' ? 'Modo QR Único Activo' : 'Modo QR por Mesa Activo',
      message: newMode === 'single'
        ? 'El restaurante opera con un único código QR central para todas las mesas. Los clientes indican o seleccionan su mesa desde la carta.'
        : 'Cada mesa dispone ahora de su código QR independiente con el número de mesa precargado automáticamente.',
      type: 'success'
    });
  };

  const handleCloseTableClick = async (table) => {
    triggerHaptic(14);
    const confirmed = await showConfirm({
      title: `¿Cerrar Mesa #${table.number}?`,
      message: `¿Deseas cerrar y liberar la Mesa ${table.number}? Sus pedidos activos se marcarán automáticamente como entregados y pagados en el sistema.`,
      confirmText: 'Sí, Cerrar Mesa',
      cancelText: 'Cancelar'
    });
    if (confirmed && onCloseTable) {
      await onCloseTable(table.id, table.number);
      showAlert({
        title: 'Mesa Cerrada con Éxito',
        message: `La Mesa ${table.number} ahora está disponible y sus pedidos han sido saldados.`,
        type: 'success'
      });
    }
  };

  const handleOpenCreate = () => {
    triggerHaptic(10);
    const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number || 0)) + 1 : 1;
    setFormData({
      number: nextNumber,
      name: `Mesa ${nextNumber}`,
      capacity: 4,
      status: 'available'
    });
    setIsModalOpen(true);
  };

  const handleCopyLink = (tableNumber) => {
    triggerHaptic(12);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mibarrunto.com';
    const tableUrl = `${origin}/?mesa=${tableNumber}`;
    navigator.clipboard?.writeText(tableUrl);
    showAlert({
      title: 'Enlace de Mesa Copiado',
      message: `Enlace directo para QR copiado al portapapeles:\n${tableUrl}`,
      type: 'success'
    });
  };

  const handleCopyCentralLink = () => {
    triggerHaptic(12);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mibarrunto.com';
    const centralUrl = `${origin}/`;
    navigator.clipboard?.writeText(centralUrl);
    showAlert({
      title: 'Enlace Central Copiado',
      message: `Enlace de la carta central copiado al portapapeles:\n${centralUrl}`,
      type: 'success'
    });
  };

  const handleDownloadQr = (dataUrl, filename) => {
    triggerHaptic(10);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleStatusChange = async (table, newStatus) => {
    triggerHaptic(8);
    await onUpdateTable(table.id, { status: newStatus });
  };

  const handleDelete = async (table) => {
    triggerHaptic(15);
    const confirmed = await showConfirm({
      title: '¿Eliminar Mesa?',
      message: `¿Estás seguro de eliminar "${table.name}" (Mesa ${table.number})?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });
    if (confirmed) {
      await onDeleteTable(table.id);
      showAlert({
        title: 'Mesa Eliminada',
        message: 'La mesa fue eliminada del sistema.',
        type: 'success'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.number) {
      showAlert({
        title: 'Campo Requerido',
        message: 'Por favor ingresa el número de mesa.',
        type: 'warning'
      });
      return;
    }

    try {
      triggerHaptic(12);
      await onCreateTable(formData);
      showAlert({
        title: 'Mesa Creada',
        message: `La ${formData.name || 'Mesa ' + formData.number} ha sido registrada.`,
        type: 'success'
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creando mesa:', err);
      showAlert({
        title: 'Error',
        message: err.message || 'No se pudo crear la mesa.',
        type: 'error'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabecera y botón Crear Mesa */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: 'none !important'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
            Mesas &amp; Generador QR
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#6b635b' }}>
            {tables.length} mesas registradas · Detección de ocupación y cierre de comanda
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              backgroundColor: 'var(--rojo, #d91c2b)',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.25)'
            }}
          >
            <Plus size={18} />
            <span>Crear Mesa</span>
          </button>
        </div>
      </div>

      {/* SELECTOR DE MODALIDAD QR: ÚNICO (DEFAULT) VS POR MESA */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '0.85rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: 'none !important',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '0.55rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrCode size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f1e1c', display: 'block' }}>
              Modalidad de Códigos QR
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b635b' }}>
              Elige cómo interactúan los clientes con la carta digital
            </span>
          </div>
        </div>

        {/* Botones de Selección de Modo */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#f5efe4', padding: '0.25rem', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => handleSwitchQrMode('single')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: qrMode === 'single' ? 'var(--rojo, #d91c2b)' : 'transparent',
              color: qrMode === 'single' ? '#ffffff' : '#6b635b',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              boxShadow: qrMode === 'single' ? '0 4px 12px rgba(217, 28, 43, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={15} />
            <span>QR Único (Predeterminado)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchQrMode('per_table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: qrMode === 'per_table' ? 'var(--rojo, #d91c2b)' : 'transparent',
              color: qrMode === 'per_table' ? '#ffffff' : '#6b635b',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              boxShadow: qrMode === 'per_table' ? '0 4px 12px rgba(217, 28, 43, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={15} />
            <span>QR Dinámico por Mesa</span>
          </button>
        </div>
      </div>

      {/* TARJETA DESTACADA: MODO QR ÚNICO CENTRAL */}
      {qrMode === 'single' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            border: 'none !important',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem'
          }}
        >
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              <Check size={14} />
              <span>Modo Recomendado Activo</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c', margin: '0 0 0.4rem 0' }}>
              Código QR Central del Restaurante
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#6b635b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Un único código para imprimir en servilleteros, barras o manteles. El comensal escanea el QR, visualiza la carta con fotos en alta definición y, al enviar su comanda, selecciona o confirma su número de mesa.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleCopyCentralLink}
                style={{
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 4px 15px rgba(217, 28, 43, 0.25)'
                }}
              >
                <Copy size={15} />
                <span>Copiar Enlace Central</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mibarrunto.com';
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin + '/')}&margin=15`;
                  handleDownloadQr(qrUrl, 'qr_central_mibarrunto.png');
                }}
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                <Download size={15} />
                <span>Descargar QR (PNG)</span>
              </button>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#6b635b',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  textDecoration: 'none',
                  border: 'none !important'
                }}
              >
                <ExternalLink size={15} />
                <span>Probar Enlace</span>
              </a>
            </div>
          </div>

          {/* Gráfico Visual del QR Central */}
          <div
            style={{
              backgroundColor: '#fcf9f2',
              padding: '1rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/' : 'https://mibarrunto.com/')}&margin=10`}
              alt="QR Central Mi Barrunto"
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '12px',
                backgroundColor: '#ffffff'
              }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1f1e1c', marginTop: '0.5rem' }}>
              Carta Digital Oficial
            </span>
          </div>
        </div>
      )}

      {/* INFORMACIÓN DEL MODO DINÁMICO POR MESA */}
      {qrMode === 'per_table' && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            color: '#1d4ed8',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            border: 'none !important'
          }}
        >
          <Layers size={22} style={{ flexShrink: 0 }} />
          <span>
            <strong>Modo QR por Mesa activado:</strong> Cada tarjeta de mesa inferior cuenta con su enlace específico (<code>/?mesa=X</code>). Al escanearlo, el sistema detecta de forma automática la mesa del cliente sin pedirle ingresarla.
          </span>
        </div>
      )}

      {/* Grid de Mesas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {tables.map(table => {
          const activeOrdersForTable = (orders || []).filter(o => 
            String(o.table_number) === String(table.number) && 
            ['pending', 'in_kitchen', 'accepted', 'ready'].includes(o.status)
          );
          const hasActiveOrders = activeOrdersForTable.length > 0;
          const isOccupied = table.status === 'occupied' || hasActiveOrders;
          const isAvail = !isOccupied && table.status === 'available';
          const isRes = !isOccupied && table.status === 'reserved';

          const statusColor = isOccupied ? '#ef4444' : isAvail ? '#059669' : '#d97706';
          const totalActiveAmount = activeOrdersForTable.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

          return (
            <div
              key={table.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: isOccupied 
                  ? '0 6px 24px rgba(239, 68, 68, 0.15)' 
                  : '0 4px 20px rgba(0,0,0,0.06)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Barra de estado superior */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: statusColor
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#1f1e1c'
                    }}
                  >
                    #{table.number}
                  </span>
                  {isOccupied && (
                    <span
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          boxShadow: '0 0 6px #ef4444'
                        }}
                      />
                      Ocupada
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(table)}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: 'none !important',
                    borderRadius: '8px',
                    padding: '0.35rem',
                    cursor: 'pointer'
                  }}
                  title="Eliminar mesa"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1f1e1c', margin: 0 }}>
                  {table.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6b635b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem', fontWeight: 600 }}>
                  <Users size={13} color="var(--rojo, #d91c2b)" /> Capacidad: {table.capacity || 4} comensales
                </span>

                {hasActiveOrders && (
                  <div
                    style={{
                      marginTop: '0.45rem',
                      padding: '0.4rem 0.6rem',
                      backgroundColor: '#fee2e2',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      color: '#b91c1c',
                      fontWeight: 800
                    }}
                  >
                    {activeOrdersForTable.length} orden(es) en curso · ${totalActiveAmount.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Selector de Estado Rápido */}
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[
                  { id: 'available', label: 'Libre' },
                  { id: 'occupied', label: 'Ocupada' },
                  { id: 'reserved', label: 'Res.' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStatusChange(table, s.id)}
                    style={{
                      flex: 1,
                      backgroundColor: (isOccupied && s.id === 'occupied') || (!isOccupied && table.status === s.id)
                        ? `${statusColor}22`
                        : '#f5efe4',
                      color: (isOccupied && s.id === 'occupied') || (!isOccupied && table.status === s.id)
                        ? statusColor
                        : '#6b635b',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '0.35rem 0',
                      borderRadius: '8px',
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Botón de CERRAR MESA si está ocupada */}
              {isOccupied && (
                <button
                  type="button"
                  onClick={() => handleCloseTableClick(table)}
                  style={{
                    width: '100%',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '0.6rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    border: 'none !important',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Liberar mesa y marcar todos sus pedidos como entregados y pagados"
                >
                  <Check size={16} />
                  <span>Cerrar Mesa &amp; Liquidar</span>
                </button>
              )}

              {/* Botón Copiar Enlace QR */}
              <button
                type="button"
                onClick={() => handleCopyLink(table.number)}
                style={{
                  width: '100%',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '0.55rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  border: 'none !important'
                }}
                title="Copiar enlace directo para generar QR de esta mesa"
              >
                <QrCode size={15} />
                <span>Copiar Enlace QR</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Mesa */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
              border: 'none !important'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
                Nueva Mesa
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
                  Número de Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
                  Nombre / Etiqueta (Ej: Terraza 1, VIP 2)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
                  Capacidad (Personas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    border: 'none !important'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    border: 'none !important',
                    boxShadow: '0 4px 15px rgba(217, 28, 43, 0.3)'
                  }}
                >
                  Guardar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
