import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Phone, 
  Mail, MapPin, FileText, Check, X, RefreshCw, 
  UserCheck, DollarSign, Calendar
} from 'lucide-react';
import { customersService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminCustomersTab() {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Crear / Editar Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersService.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleOpenCreate = () => {
    triggerHaptic(8);
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    triggerHaptic(8);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSaving(true);
      triggerHaptic(10);

      if (editingCustomer) {
        const updated = await customersService.updateCustomer(editingCustomer.id, formData);
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updated } : c));
      } else {
        const created = await customersService.createCustomer(formData);
        setCustomers(prev => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando cliente:', err);
      await showAlert({
        title: 'Error al Guardar',
        message: 'No se pudo guardar la información del cliente.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    triggerHaptic(10);
    const confirmed = await showConfirm({
      title: '¿Eliminar Cliente?',
      message: `¿Estás seguro de eliminar a "${customer.name}" del directorio de clientes?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await customersService.deleteCustomer(customer.id);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
      } catch (err) {
        console.error('Error eliminando cliente:', err);
        await showAlert({
          title: 'Error',
          message: 'No se pudo eliminar el cliente.',
          type: 'error'
        });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Acciones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: 'rgba(217, 28, 43, 0.1)',
              color: 'var(--rojo, #d91c2b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c' }}>
              Directorio de Clientes
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#78716c' }}>
              {customers.length} clientes registrados para facturación y asignación de mesas
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} color="#78716c" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono..."
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.4rem',
                borderRadius: '12px',
                backgroundColor: '#f5efe4',
                border: 'none !important',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#1f1e1c',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: '#f5efe4',
              color: '#78716c',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Recargar clientes"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--rojo, #d91c2b)',
              color: '#ffffff',
              padding: '0.65rem 1.15rem',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.88rem',
              border: 'none !important',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(217, 28, 43, 0.28)'
            }}
          >
            <UserPlus size={18} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Clientes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '1rem'
        }}
      >
        {filteredCustomers.map(customer => {
          const isDefault = customer.name?.toLowerCase().includes('consumo');
          return (
            <div
              key={customer.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.85rem',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        backgroundColor: isDefault ? 'rgba(120, 113, 108, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                        color: isDefault ? '#78716c' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem'
                      }}
                    >
                      {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#1f1e1c' }}>
                        {customer.name}
                      </h4>
                      {isDefault ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#78716c' }}>
                          Perfil Genérico
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                          Cliente Registrado
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(customer)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        backgroundColor: '#f5efe4',
                        color: '#44403c',
                        border: 'none !important',
                        cursor: 'pointer'
                      }}
                      title="Editar cliente"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer)}
                        style={{
                          padding: '0.4rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                        title="Eliminar cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalles de Contacto */}
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#44403c' }}>
                      <Phone size={14} color="#78716c" />
                      <span style={{ fontWeight: 700 }}>{customer.phone}</span>
                    </div>
                  )}

                  {customer.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#44403c' }}>
                      <Mail size={14} color="#78716c" />
                      <span>{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#44403c' }}>
                      <MapPin size={14} color="#78716c" />
                      <span>{customer.address}</span>
                    </div>
                  )}

                  {customer.notes && (
                    <div style={{ marginTop: '0.35rem', padding: '0.45rem 0.65rem', backgroundColor: '#f8f4ec', borderRadius: '10px', fontSize: '0.75rem', color: '#78716c' }}>
                      <span style={{ fontWeight: 800, color: '#1f1e1c' }}>Notas: </span>
                      {customer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de Tarjeta con Estadísticas */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.65rem',
                  borderTop: 'none',
                  backgroundColor: '#faf7f2',
                  margin: '0 -0.5rem -0.5rem -0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem'
                }}
              >
                <span style={{ color: '#78716c' }}>
                  Pedidos: <strong style={{ color: '#1f1e1c' }}>{customer.total_orders || 0}</strong>
                </span>
                <span style={{ color: '#78716c' }}>
                  Consumo: <strong style={{ color: 'var(--rojo, #d91c2b)' }}>${Number(customer.total_spent || 0).toFixed(2)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && !isLoading && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
          }}
        >
          <Users size={38} color="#a8a29e" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f1e1c', margin: 0 }}>
            No se encontraron clientes
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#78716c', margin: '0.25rem 0 1rem 0' }}>
            {searchQuery ? 'Prueba con otro término de búsqueda' : 'Registra el primer cliente para el restaurante'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '14px',
              backgroundColor: 'var(--rojo, #d91c2b)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.88rem',
              border: 'none !important',
              cursor: 'pointer'
            }}
          >
            Crear Nuevo Cliente
          </button>
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2600,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  color: '#78716c',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Mendoza"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                    Teléfono (USA)
                  </label>
                  <input
                    type="tel"
                    placeholder="(201) 555-0192"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="carlos@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Dirección de Entrega / Domicilio
                </label>
                <input
                  type="text"
                  placeholder="Calle, número, apto, ciudad, NJ"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Notas / Preferencias Gastronómicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Prefiere ceviche sin picante, mesa reservada..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '14px',
                    backgroundColor: '#f5efe4',
                    color: '#78716c',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(217, 28, 43, 0.28)'
                  }}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
