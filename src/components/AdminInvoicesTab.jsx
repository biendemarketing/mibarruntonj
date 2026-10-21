import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Printer, Edit2, 
  Trash2, DollarSign, Calendar, User, 
  CreditCard, CheckCircle2, Clock, X, 
  RefreshCw, Percent, Truck, FileText, ArrowRight
} from 'lucide-react';
import { invoicesService, customersService } from '../services/supabase';
import { InvoicePrintModal } from './InvoicePrintModal';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminInvoicesTab({ dishes = [] }) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal de Crear / Editar Factura Manual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Formulario Factura
  const [customerName, setCustomerName] = useState('Cliente de Consumo');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('Consumo');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');

  // Toggles de Facturación (DEFAULT OFF)
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(6.625);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState(5.00);
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  // Ítems de la factura
  const [formItems, setFormItems] = useState([
    { name: 'Consumo General', quantity: 1, unit_price: 25.00 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Impresión
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalData, setPrintModalData] = useState(null);

  // Cargar facturas desde Supabase
  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoicesService.getInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Cálculos matemáticos del formulario
  const formSubtotal = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
  }, [formItems]);

  const formTaxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    return Number(((formSubtotal * Number(taxRate || 0)) / 100).toFixed(2));
  }, [formSubtotal, taxEnabled, taxRate]);

  const formDeliveryFee = useMemo(() => {
    if (!deliveryEnabled) return 0;
    return Number(Number(deliveryAmount || 0).toFixed(2));
  }, [deliveryEnabled, deliveryAmount]);

  const formTotalAmount = useMemo(() => {
    return Number((formSubtotal + formTaxAmount + formDeliveryFee + Number(tipAmount || 0)).toFixed(2));
  }, [formSubtotal, formTaxAmount, formDeliveryFee, tipAmount]);

  // Filtrado de Facturas
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery = !searchQuery.trim() ||
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.customer_name?.toLowerCase().includes(q) ||
        inv.table_number?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [invoices, statusFilter, searchQuery]);

  // Estadísticas rápidas
  const totalBilled = useMemo(() => {
    return invoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0);
  }, [invoices]);

  // Abrir modal de creación manual
  const handleOpenCreateManual = async () => {
    triggerHaptic(8);
    setEditingInvoice(null);
    const nextNum = await invoicesService.getNextInvoiceNumber();
    setCustomerName('Cliente de Consumo');
    setCustomerPhone('');
    setTableNumber('Barra');
    setPaymentMethod('efectivo');
    setPaymentStatus('paid');
    setNotes('');
    setTaxEnabled(false);
    setDeliveryEnabled(false);
    setTipEnabled(false);
    setTipAmount(0);
    setFormItems([{ name: 'Consumo General', quantity: 1, unit_price: 20.00 }]);
    setIsEditModalOpen(true);
  };

  // Abrir modal de edición de factura existente
  const handleOpenEdit = (inv) => {
    triggerHaptic(8);
    setEditingInvoice(inv);
    setCustomerName(inv.customer_name || 'Cliente de Consumo');
    setCustomerPhone(inv.customer_phone || '');
    setTableNumber(inv.table_number || '1');
    setPaymentMethod(inv.payment_method || 'efectivo');
    setPaymentStatus(inv.payment_status || 'paid');
    setNotes(inv.notes || '');
    setTaxEnabled(Boolean(inv.tax_enabled));
    setTaxRate(Number(inv.tax_rate) || 6.625);
    setDeliveryEnabled(Boolean(inv.delivery_enabled));
    setDeliveryAmount(Number(inv.delivery_amount) || 5.00);
    setTipEnabled(Boolean(inv.tip_enabled));
    setTipAmount(Number(inv.tip_amount) || 0);

    if (Array.isArray(inv.items) && inv.items.length > 0) {
      setFormItems(inv.items.map(it => ({
        id: it.id,
        name: it.dish_name || it.name,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || 0)
      })));
    } else {
      setFormItems([{ name: 'Consumo General', quantity: 1, unit_price: Number(inv.subtotal || 20) }]);
    }

    setIsEditModalOpen(true);
  };

  // Guardar factura manual o editada
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (formItems.length === 0) return;

    try {
      setIsSaving(true);
      triggerHaptic(12);

      const invoiceData = {
        invoice_number: editingInvoice ? editingInvoice.invoice_number : await invoicesService.getNextInvoiceNumber(),
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: tableNumber,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes,
        subtotal: formSubtotal,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount: formTaxAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: formDeliveryFee,
        tip_enabled: tipEnabled,
        tip_amount: Number(tipAmount || 0),
        total_amount: formTotalAmount
      };

      if (editingInvoice) {
        const updated = await invoicesService.updateInvoice(editingInvoice.id, invoiceData, formItems);
        setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...updated, items: formItems } : inv));
      } else {
        const created = await invoicesService.createInvoice(invoiceData, formItems);
        setInvoices(prev => [created, ...prev]);
      }

      setIsEditModalOpen(false);
      await showAlert({
        title: 'Factura Guardada',
        message: 'La factura ha sido registrada en el sistema con éxito.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error guardando factura:', err);
      await showAlert({
        title: 'Error',
        message: 'No se pudo guardar la factura.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Imprimir factura
  const handlePrintInvoice = (inv) => {
    triggerHaptic(8);
    setPrintModalData({
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_name,
      customer_phone: inv.customer_phone,
      table_number: inv.table_number,
      waiter_name: inv.waiter_name || 'Servicio de Sala',
      payment_method: inv.payment_method,
      tax_enabled: inv.tax_enabled,
      tax_rate: inv.tax_rate,
      delivery_enabled: inv.delivery_enabled,
      delivery_amount: inv.delivery_amount,
      tip_enabled: inv.tip_enabled,
      tip_amount: inv.tip_amount,
      notes: inv.notes,
      items: Array.isArray(inv.items) && inv.items.length > 0 
        ? inv.items.map(it => ({
            name: it.dish_name || it.name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            notes: it.notes
          }))
        : [{ name: 'Consumo General', quantity: 1, unit_price: Number(inv.subtotal || inv.total_amount) }]
    });
    setPrintModalOpen(true);
  };

  // Eliminar / Anular factura
  const handleDeleteInvoice = async (inv) => {
    triggerHaptic(10);
    const confirmed = await showConfirm({
      title: '¿Anular / Eliminar Factura?',
      message: `¿Estás seguro de eliminar el registro de la Factura ${inv.invoice_number}?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await invoicesService.deleteInvoice(inv.id);
        setInvoices(prev => prev.filter(i => i.id !== inv.id));
      } catch (err) {
        console.error('Error eliminando factura:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra Superior con Métricas y Acciones */}
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
            <Receipt size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c' }}>
              Historial de Facturación & Cobros
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#78716c' }}>
              Total Facturado: <strong style={{ color: 'var(--rojo, #d91c2b)' }}>${totalBilled.toFixed(2)} USD</strong> · {invoices.length} facturas
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="#78716c" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar factura o cliente..."
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
            onClick={loadInvoices}
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
            title="Recargar facturas"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateManual}
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
            <Plus size={18} />
            <span>Factura Manual</span>
          </button>
        </div>
      </div>

      {/* Lista de Facturas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredInvoices.map(inv => {
          const isPaid = inv.payment_status === 'paid';
          return (
            <div
              key={inv.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                border: 'none !important',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              {/* Información Principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.15)',
                    color: isPaid ? '#10b981' : '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Receipt size={22} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#1f1e1c' }}>
                      {inv.invoice_number}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: isPaid ? '#059669' : '#b45309'
                      }}
                    >
                      {isPaid ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 700 }}>
                      Mesa {inv.table_number || '1'}
                    </span>
                  </div>

                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#44403c', fontWeight: 700 }}>
                    {inv.customer_name || 'Cliente de Consumo'} · Método: {inv.payment_method?.toUpperCase() || 'EFECTIVO'}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: '#a8a29e' }}>
                    {new Date(inv.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Desglose de Precios */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#78716c' }}>
                    Subtotal: ${Number(inv.subtotal || 0).toFixed(2)}
                    {inv.tax_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Tax</span>}
                    {inv.delivery_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Envío</span>}
                    {inv.tip_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Propina</span>}
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                    ${Number(inv.total_amount || 0).toFixed(2)} USD
                  </span>
                </div>

                {/* Acciones de Factura */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    type="button"
                    onClick={() => handlePrintInvoice(inv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.6rem 0.95rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--rojo, #d91c2b)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(217, 28, 43, 0.25)'
                    }}
                    title="Imprimir ticket o factura"
                  >
                    <Printer size={16} />
                    <span>Imprimir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(inv)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '12px',
                      backgroundColor: '#f5efe4',
                      color: '#44403c',
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                    title="Editar factura"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(inv)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                    title="Anular factura"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInvoices.length === 0 && !isLoading && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
            }}
          >
            <Receipt size={38} color="#a8a29e" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f1e1c', margin: 0 }}>
              No hay facturas registradas
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#78716c', margin: '0.25rem 0 1rem 0' }}>
              Crea una factura manual o cobra una mesa desde el Punto de Venta (POS)
            </p>
            <button
              type="button"
              onClick={handleOpenCreateManual}
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
              Crear Factura Manual
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Factura Manual */}
      {isEditModalOpen && (
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
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c' }}>
                {editingInvoice ? `Editar Factura ${editingInvoice.invoice_number}` : 'Nueva Factura Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
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

            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Cliente y Mesa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c' }}>
                      Cliente *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomerName('Cliente de Consumo')}
                      style={{ fontSize: '0.68rem', color: 'var(--rojo, #d91c2b)', background: 'none', border: 'none !important', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Consumo
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Mesa / Referencia
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Método de Pago y Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="efectivo">Efectivo ($)</option>
                    <option value="tarjeta">Tarjeta Crédito / Débito</option>
                    <option value="zelle">Zelle / Transferencia</option>
                    <option value="apple_pay">Apple Pay</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Estado del Cobro
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="paid">Pagado (Completado)</option>
                    <option value="pending">Pendiente de Pago</option>
                  </select>
                </div>
              </div>

              {/* REGLA: Toggles de Facturación en USA (DESACTIVADOS POR DEFECTO) */}
              <div style={{ backgroundColor: '#faf7f2', padding: '0.85rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1f1e1c', textTransform: 'uppercase' }}>
                  Ajustes Fiscales (Desactivados por defecto)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setTaxEnabled(!taxEnabled);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '10px',
                      backgroundColor: taxEnabled ? '#10b981' : '#ffffff',
                      color: taxEnabled ? '#ffffff' : '#1f1e1c',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                  >
                    Sales Tax ({taxRate}%) {taxEnabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setDeliveryEnabled(!deliveryEnabled);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '10px',
                      backgroundColor: deliveryEnabled ? '#10b981' : '#ffffff',
                      color: deliveryEnabled ? '#ffffff' : '#1f1e1c',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                  >
                    Envío ($5) {deliveryEnabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setTipEnabled(!tipEnabled);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '10px',
                      backgroundColor: tipEnabled ? '#10b981' : '#ffffff',
                      color: tipEnabled ? '#ffffff' : '#1f1e1c',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                  >
                    Propina {tipEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Ítems de la Factura */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#44403c' }}>
                    Conceptos / Platos Facturados ({formItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setFormItems(prev => [...prev, { name: 'Plato Adicional', quantity: 1, unit_price: 15.00 }]);
                    }}
                    style={{
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                  >
                    + Añadir Ítem
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {formItems.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        required
                        value={it.name}
                        onChange={(e) => {
                          const copy = [...formItems];
                          copy[idx].name = e.target.value;
                          setFormItems(copy);
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.8rem', fontWeight: 700 }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const copy = [...formItems];
                          copy[idx].quantity = Number(e.target.value);
                          setFormItems(copy);
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.8rem', fontWeight: 700 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={it.unit_price}
                        onChange={(e) => {
                          const copy = [...formItems];
                          copy[idx].unit_price = Number(e.target.value);
                          setFormItems(copy);
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.8rem', fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formItems.length > 1) {
                            setFormItems(formItems.filter((_, i) => i !== idx));
                          }
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none !important', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Botón Guardar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: 'none' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#78716c' }}>Total Facturado:</span>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                    ${formTotalAmount.toFixed(2)} USD
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '12px',
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
                      padding: '0.65rem 1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--rojo, #d91c2b)',
                      color: '#ffffff',
                      fontWeight: 900,
                      border: 'none !important',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(217, 28, 43, 0.3)'
                    }}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Factura'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impresión */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        initialData={printModalData}
      />
    </div>
  );
}
