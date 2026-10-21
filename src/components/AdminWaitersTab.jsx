import React, { useState } from 'react';
import { Plus, Trash2, Edit2, UserCheck, Phone, KeyRound, RefreshCw, X, Shield, Eye, EyeOff, User, ShieldCheck } from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

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
  const [showModalPin, setShowModalPin] = useState(false);
  const [revealedCardPins, setRevealedCardPins] = useState(new Set());

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    pin: '1234',
    phone: '',
    role: 'mesero',
    permission_level: 'solo_pedidos'
  });

  const toggleRevealCardPin = (waiterId) => {
    triggerHaptic(6);
    setRevealedCardPins(prev => {
      const next = new Set(prev);
      if (next.has(waiterId)) {
        next.delete(waiterId);
      } else {
        next.add(waiterId);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    triggerHaptic(10);
    setEditingWaiter(null);
    setShowModalPin(false);
    const generatedPin = String(Math.floor(1000 + Math.random() * 9000));
    setFormData({
      name: '',
      username: '',
      pin: generatedPin,
      phone: '',
      role: 'mesero',
      permission_level: 'solo_pedidos'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (waiter) => {
    triggerHaptic(10);
    setEditingWaiter(waiter);
    setShowModalPin(false);
    setFormData({
      name: waiter.name,
      username: waiter.username || waiter.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      pin: waiter.pin || '1234',
      phone: waiter.phone || '',
      role: waiter.role || 'mesero',
      permission_level: waiter.permission_level || (waiter.role === 'admin' ? 'admin_completo' : waiter.role === 'capitan' ? 'pedidos_y_mesas' : 'solo_pedidos')
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
        message: 'El registro fue eliminado exitosamente.',
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

    const cleanUsername = (formData.username || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase().trim();
    const cleanPin = String(formData.pin || '1234').trim();

    if (cleanPin.length < 4) {
      showAlert({
        title: 'PIN Inválido',
        message: 'El PIN de acceso debe tener al menos 4 dígitos.',
        type: 'warning'
      });
      return;
    }

    const payload = {
      ...formData,
      username: cleanUsername,
      pin: cleanPin
    };

    try {
      triggerHaptic(12);
      if (editingWaiter) {
        await onUpdateWaiter(editingWaiter.id, payload);
        showAlert({
          title: 'Datos Actualizados',
          message: `Personal "${formData.name}" actualizado correctamente con usuario @${cleanUsername}.`,
          type: 'success'
        });
      } else {
        await onCreateWaiter(payload);
        showAlert({
          title: 'Mesero Registrado',
          message: `${formData.name} registrado con usuario de login @${cleanUsername}.`,
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
          backgroundColor: '#ffffff',
          padding: '1.15rem 1.35rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: 'none !important',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
            Equipo y Meseros
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#78716c' }}>
            {waiters.length} colaboradores registrados para atención de mesas
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Refrescar</span>
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
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.3)'
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
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                padding: '1.25rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1f1e1c', margin: 0 }}>
                      {waiter.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#6b635b', fontWeight: 700 }}>
                        @{waiter.username || waiter.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>•</span>
                      <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
                        {roleLabels[waiter.role] || waiter.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(waiter)}
                    style={{
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      border: 'none !important',
                      borderRadius: '10px',
                      padding: '0.45rem',
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
                      borderRadius: '10px',
                      padding: '0.45rem',
                      cursor: 'pointer'
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Badge de Nivel de Permisos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {waiter.permission_level === 'admin_completo' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px'
                    }}
                  >
                    <ShieldCheck size={12} />
                    Acceso Total (Administrador)
                  </span>
                ) : waiter.permission_level === 'pedidos_y_mesas' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: '#f5f3ff',
                      color: '#7c3aed',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px'
                    }}
                  >
                    <UserCheck size={12} />
                    Pedidos & Mesas
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px'
                    }}
                  >
                    <User size={12} />
                    Solo Pedidos (Comandas)
                  </span>
                )}
              </div>

              {/* Datos de contacto y PIN con Ojo para Visualizar */}
              <div
                style={{
                  backgroundColor: '#f8f4ec',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#78716c' }}>
                  <Phone size={13} />
                  <span>{waiter.phone || 'Sin teléfono'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309', fontWeight: 800 }}>
                  <KeyRound size={13} />
                  <span>
                    PIN: {revealedCardPins.has(waiter.id) ? waiter.pin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRevealCardPin(waiter.id)}
                    style={{
                      background: 'none',
                      border: 'none !important',
                      color: '#b45309',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={revealedCardPins.has(waiter.id) ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {revealedCardPins.has(waiter.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
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
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              color: '#1f1e1c',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
              border: 'none !important',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
                  {editingWaiter ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#78716c' }}>
                  Asignación de usuario, PIN de acceso y permisos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.45rem',
                  color: '#1f1e1c',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setFormData(p => ({
                      ...p,
                      name: nameVal,
                      username: p.username ? p.username : nameVal.toLowerCase().replace(/[^a-z0-9]/g, '')
                    }));
                  }}
                  placeholder="Ej: Carlos Gómez"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Fila: Nombre de Usuario para Login + PIN con Ojo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    Usuario Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
                    placeholder="ej: carlosg"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '14px',
                      fontSize: '0.9rem',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    PIN de Acceso *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f5efe4',
                      borderRadius: '14px',
                      padding: '0 0.5rem 0 0.95rem'
                    }}
                  >
                    <input
                      type={showModalPin ? 'text' : 'password'}
                      maxLength={6}
                      required
                      value={formData.pin}
                      onChange={(e) => setFormData(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))}
                      placeholder="4 dígitos"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0',
                        backgroundColor: 'transparent',
                        color: '#1f1e1c',
                        fontSize: '0.9rem',
                        border: 'none !important',
                        outline: 'none',
                        letterSpacing: showModalPin ? 'normal' : '2px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPin(!showModalPin)}
                      style={{
                        background: 'none',
                        border: 'none !important',
                        color: '#6b635b',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={showModalPin ? 'Ocultar PIN' : 'Ver PIN'}
                    >
                      {showModalPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Fila: Teléfono + Rol */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Ej: (973) 555-0101"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '14px',
                      fontSize: '0.9rem',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    Puesto
                  </label>
                  <CustomSelect
                    value={formData.role}
                    onChange={(val) => setFormData(p => ({ ...p, role: val }))}
                    options={[
                      { value: 'mesero', label: 'Mesero / Mozo' },
                      { value: 'capitan', label: 'Capitán de Sala' },
                      { value: 'cocina', label: 'Cocina / Pase' },
                      { value: 'cajero', label: 'Cajero / Bar' }
                    ]}
                    buttonStyle={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '14px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Selector de Nivel de Permisos para el Sistema */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Nivel de Permisos en el Panel
                </label>
                <CustomSelect
                  value={formData.permission_level}
                  onChange={(val) => setFormData(p => ({ ...p, permission_level: val }))}
                  options={[
                    { value: 'solo_pedidos', label: 'Solo Pedidos (Comandas, tiempos y entregas)' },
                    { value: 'pedidos_y_mesas', label: 'Pedidos y Mesas & QR (Gestión de comandas + liberar mesas)' },
                    { value: 'admin_completo', label: 'Acceso Total (Permite platos, categorías y meseros)' }
                  ]}
                  buttonStyle={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#78716c', display: 'block', marginTop: '0.3rem' }}>
                  Al seleccionar "Solo Pedidos", el mesero no podrá editar platos, categorías ni crear otros meseros.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    fontWeight: 800,
                    padding: '0.85rem',
                    borderRadius: '14px',
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
                    fontWeight: 900,
                    padding: '0.85rem',
                    borderRadius: '14px',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(217, 28, 43, 0.35)'
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
