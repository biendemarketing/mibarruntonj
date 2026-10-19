import React, { useState } from 'react';
import { Plus, Trash2, Edit2, UserCheck, Phone, KeyRound, RefreshCw, X, Shield } from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminWaitersTab({
  waiters = [],
  onCreateWaiter,
  onUpdateWaiter,
  onDeleteWaiter,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    pin: '1234',
    phone: '',
    role: 'mesero'
  });

  const handleOpenCreate = () => {
    triggerHaptic(10);
    setEditingWaiter(null);
    setFormData({
      name: '',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      phone: '',
      role: 'mesero'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (waiter) => {
    triggerHaptic(10);
    setEditingWaiter(waiter);
    setFormData({
      name: waiter.name,
      pin: waiter.pin || '1234',
      phone: waiter.phone || '',
      role: waiter.role || 'mesero'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (waiter) => {
    triggerHaptic(15);
    const confirmed = await showConfirm({
      title: '¿Eliminar Personal?',
      message: `¿Estás seguro de eliminar a "${waiter.name}" del personal?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });
    if (confirmed) {
      await onDeleteWaiter(waiter.id);
      showAlert({
        title: 'Personal Eliminado',
        message: 'El registro fue eliminado de Supabase.',
        type: 'success'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert({
        title: 'Campo Requerido',
        message: 'Por favor ingresa el nombre del mesero/personal.',
        type: 'warning'
      });
      return;
    }

    try {
      triggerHaptic(12);
      if (editingWaiter) {
        await onUpdateWaiter(editingWaiter.id, formData);
        showAlert({
          title: 'Datos Actualizados',
          message: 'Personal actualizado correctamente.',
          type: 'success'
        });
      } else {
        await onCreateWaiter(formData);
        showAlert({
          title: 'Mesero Creado',
          message: `${formData.name} ha sido registrado en el equipo.`,
          type: 'success'
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando mesero:', err);
      showAlert({
        title: 'Error',
        message: err.message || 'No se pudo guardar.',
        type: 'error'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabecera y botón Crear */}
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
            Equipo y Meseros
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {waiters.length} colaboradores registrados para atención de mesas
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
            <span>Nuevo Mesero</span>
          </button>
        </div>
      </div>

      {/* Grid de Meseros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {waiters.map(waiter => {
          const roleLabels = {
            capitan: 'Capitán de Sala',
            mesero: 'Mesero / Salonero',
            cajero: 'Cajero',
            cocina: 'Cocina / Chef'
          };

          return (
            <div
              key={waiter.id}
              style={{
                backgroundColor: 'var(--bg-card, #1c1d22)',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      {waiter.name}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>
                      {roleLabels[waiter.role] || waiter.role}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(waiter)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: 'none !important',
                      borderRadius: '8px',
                      padding: '0.35rem',
                      cursor: 'pointer'
                    }}
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(waiter)}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none !important',
                      borderRadius: '8px',
                      padding: '0.35rem',
                      cursor: 'pointer'
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Datos de contacto y PIN */}
              <div
                style={{
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#9ca3af' }}>
                  <Phone size={13} />
                  <span>{waiter.phone || 'Sin teléfono'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--naranja, #f97316)', fontWeight: 700 }}>
                  <KeyRound size={13} />
                  <span>PIN: {waiter.pin || '----'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Mesero */}
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
              maxWidth: '440px',
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
                {editingWaiter ? 'Editar Personal' : 'Nuevo Colaborador'}
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
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Juan Perez"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Ej: (973) 555-0101"
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
                    PIN de Acceso
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData(p => ({ ...p, pin: e.target.value }))}
                    placeholder="4 dígitos"
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
                  Rol en el Restaurante
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  <option value="mesero" style={{ backgroundColor: '#1c1d22' }}>Mesero / Salonero</option>
                  <option value="capitan" style={{ backgroundColor: '#1c1d22' }}>Capitán de Sala</option>
                  <option value="cocina" style={{ backgroundColor: '#1c1d22' }}>Cocina / Chef</option>
                  <option value="cajero" style={{ backgroundColor: '#1c1d22' }}>Cajero / Recepción</option>
                </select>
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
                  {editingWaiter ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
