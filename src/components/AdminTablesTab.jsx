import React, { useState } from 'react';
import { Plus, Trash2, Check, QrCode, Copy, RefreshCw, X, Users } from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminTablesTab({
  tables = [],
  onCreateTable,
  onUpdateTable,
  onDeleteTable,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: 4,
    status: 'available'
  });

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
        message: 'La mesa fue eliminada de Supabase.',
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
        message: err.message || 'No se pudo crear la mesa (quizás el número ya existe).',
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
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card, #1c1d22)',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: 'none !important'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Mesas del Restaurante
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {tables.length} mesas registradas · Cada mesa tiene enlace QR único
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
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
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.4)'
            }}
          >
            <Plus size={18} />
            <span>Crear Mesa</span>
          </button>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {tables.map(table => {
          const isAvail = table.status === 'available';
          const isOcc = table.status === 'occupied';
          const isRes = table.status === 'reserved';

          const statusColor = isAvail ? '#10b981' : isOcc ? '#ef4444' : '#f59e0b';
          const statusText = isAvail ? 'Disponible' : isOcc ? 'Ocupada' : 'Reservada';

          return (
            <div
              key={table.id}
              style={{
                backgroundColor: 'var(--bg-card, #1c1d22)',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
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
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: '#ffffff'
                  }}
                >
                  #{table.number}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(table)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
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
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {table.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <Users size={12} /> Capacidad: {table.capacity || 4} personas
                </span>
              </div>

              {/* Selector de Estado */}
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
                      backgroundColor: table.status === s.id ? `${statusColor}35` : 'rgba(255, 255, 255, 0.06)',
                      color: table.status === s.id ? statusColor : '#9ca3af',
                      fontWeight: 700,
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

              {/* Botón Copiar Enlace QR */}
              <button
                type="button"
                onClick={() => handleCopyLink(table.number)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.5rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important',
                  marginTop: '0.25rem'
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
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
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
              backgroundColor: 'var(--bg-card, #1c1d22)',
              color: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.65)',
              border: 'none !important',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Crear Nueva Mesa
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.4rem',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                    Número *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.number}
                    onChange={(e) => {
                      const num = e.target.value;
                      setFormData(p => ({ ...p, number: num, name: `Mesa ${num}` }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      border: 'none !important'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                    Nombre / Ubicación *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Mesa 21 (Terraza)"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      border: 'none !important'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                  Capacidad de Personas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    border: 'none !important'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    fontWeight: 800,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(217, 28, 43, 0.4)'
                  }}
                >
                  Registrar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
