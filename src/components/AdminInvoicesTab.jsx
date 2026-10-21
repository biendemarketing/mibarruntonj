import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Printer, Edit2, 
  Trash2, DollarSign, Calendar, User, 
  CreditCard, CheckCircle2, Clock, X, 
  RefreshCw, Percent, Truck, FileText, ArrowRight,
  ChevronDown, Utensils, UserPlus, Sparkles, Layers, Check
} from 'lucide-react';
import { invoicesService, customersService } from '../services/supabase';
import { InvoicePrintModal } from './InvoicePrintModal';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

export function AdminInvoicesTab({ 
  dishes = [], 
  tables = [], 
  categories = [],
  waiters = [],
  orders = [],
  onRefreshData = null
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Clientes para autocompletado y selección
  const [customersList, setCustomersList] = useState([]);
  const [showCreateCustomerInline, setShowCreateCustomerInline] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Modal de Crear / Editar Factura Manual
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Formulario Factura
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');

  // Toggles e Importes de Facturación (DEFAULT OFF)
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(6.625); // New Jersey Sales Tax %
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState(5.00);
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  // Catálogo de platos dentro del modal de facturación
  const [showDishCatalog, setShowDishCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  // Ítems de la factura
  const [formItems, setFormItems] = useState([
    { name: 'Consumo General', quantity: 1, unit_price: 25.00 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Impresión
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalData, setPrintModalData] = useState(null);

  // Cargar facturas y clientes desde Supabase
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

  const loadCustomers = async () => {
    try {
      const data = await customersService.getCustomers();
      setCustomersList(data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadCustomers();
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
    const tip = tipEnabled ? Number(tipAmount || 0) : 0;
    return Number((formSubtotal + formTaxAmount + formDeliveryFee + tip).toFixed(2));
  }, [formSubtotal, formTaxAmount, formDeliveryFee, tipEnabled, tipAmount]);

  // Filtrado de platos en el catálogo del modal
  const filteredCatalogDishes = useMemo(() => {
    return dishes.filter(d => {
      const matchCat = catalogCategory === 'all' || d.category_id === catalogCategory;
      const matchSearch = !catalogSearch.trim() ||
        d.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        d.description?.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch && d.is_available !== false;
    });
  }, [dishes, catalogCategory, catalogSearch]);

  // Filtrado de Facturas en la lista principal
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
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setSelectedCustomerId(null);
    setTableNumber(tables.length > 0 ? String(tables[0].number) : '1');
    setPaymentMethod('efectivo');
    setPaymentStatus('paid');
    setNotes('');
    setTaxEnabled(false);
    setTaxRate(6.625);
    setDeliveryEnabled(false);
    setDeliveryAmount(5.00);
    setTipEnabled(false);
    setTipAmount(0);
    setShowDishCatalog(false);
    setShowCreateCustomerInline(false);

    if (dishes.length > 0) {
      setFormItems([{ name: dishes[0].name, quantity: 1, unit_price: Number(dishes[0].price || 20.00) }]);
    } else {
      setFormItems([{ name: 'Consumo General', quantity: 1, unit_price: 20.00 }]);
    }

    setIsEditModalOpen(true);
  };

  // Abrir modal de edición de factura existente
  const handleOpenEdit = (inv) => {
    triggerHaptic(8);
    setEditingInvoice(inv);
    setCustomerName(inv.customer_name || 'Walk-in Customer');
    setCustomerPhone(inv.customer_phone || '');
    setSelectedCustomerId(inv.customer_id || null);
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
    setShowDishCatalog(false);
    setShowCreateCustomerInline(false);

    const items = inv.items || inv.invoice_items;
    if (Array.isArray(items) && items.length > 0) {
      setFormItems(items.map(it => ({
        id: it.id,
        name: it.dish_name || it.name,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.unit_price || it.price || 0)
      })));
    } else {
      setFormItems([{ name: 'Consumo General', quantity: 1, unit_price: Number(inv.subtotal || 20) }]);
    }

    setIsEditModalOpen(true);
  };

  // Agregar plato desde el catálogo al formulario
  const handleAddDishFromCatalog = (dish) => {
    triggerHaptic(6);
    setFormItems(prev => {
      const existingIdx = prev.findIndex(it => it.name.toLowerCase() === dish.name.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity = Number(copy[existingIdx].quantity || 1) + 1;
        return copy;
      }
      return [
        ...prev,
        {
          name: dish.name,
          quantity: 1,
          unit_price: Number(dish.price || 0)
        }
      ];
    });
  };

  // Crear cliente rápido desde el modal de facturación
  const handleSaveInlineCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;

    try {
      setIsCreatingCustomer(true);
      triggerHaptic(10);
      const created = await customersService.createCustomer(newCustomerForm);
      setCustomersList(prev => [created, ...prev]);
      setCustomerName(created.name);
      setCustomerPhone(created.phone || '');
      setSelectedCustomerId(created.id);
      setShowCreateCustomerInline(false);
      setNewCustomerForm({ name: '', phone: '', email: '', address: '', notes: '' });
      await showAlert({
        title: '¡Cliente Creado!',
        message: `"${created.name}" fue registrado y seleccionado para esta factura.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error creando cliente inline:', err);
      await showAlert({
        title: 'Error',
        message: 'No se pudo registrar el nuevo cliente.',
        type: 'error'
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Guardar factura manual o editada
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (formItems.length === 0) {
      await showAlert({
        title: 'Factura sin ítems',
        message: 'Por favor agrega al menos un plato o concepto a la factura.',
        type: 'warning'
      });
      return;
    }

    try {
      setIsSaving(true);
      triggerHaptic(12);

      const invoiceData = {
        invoice_number: editingInvoice ? editingInvoice.invoice_number : await invoicesService.getNextInvoiceNumber(),
        customer_id: selectedCustomerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: String(tableNumber),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes,
        subtotal: formSubtotal,
        tax_enabled: taxEnabled,
        tax_rate: Number(taxRate || 0),
        tax_amount: formTaxAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: formDeliveryFee,
        tip_enabled: tipEnabled,
        tip_amount: tipEnabled ? Number(tipAmount || 0) : 0,
        total_amount: formTotalAmount
      };

      if (editingInvoice) {
        const updated = await invoicesService.updateInvoice(editingInvoice.id, invoiceData, formItems);
        setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...updated, items: formItems } : inv));
        await showAlert({
          title: 'Factura Actualizada',
          message: `Los cambios en la Factura ${editingInvoice.invoice_number} se guardaron exitosamente.`,
          type: 'success'
        });
      } else {
        const created = await invoicesService.createInvoice(invoiceData, formItems);
        setInvoices(prev => [created, ...prev]);
        await showAlert({
          title: 'Factura Creada',
          message: `Factura ${invoiceData.invoice_number} registrada por $${formTotalAmount.toFixed(2)} USD.`,
          type: 'success'
        });
      }

      setIsEditModalOpen(false);
      if (onRefreshData) onRefreshData();
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
    const items = inv.items || inv.invoice_items;
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
      items: Array.isArray(items) && items.length > 0 
        ? items.map(it => ({
            name: it.dish_name || it.name,
            quantity: it.quantity,
            unit_price: it.unit_price || it.price,
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
      message: `¿Estás seguro de eliminar el registro de la Factura ${inv.invoice_number}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await invoicesService.deleteInvoice(inv.id);
        setInvoices(prev => prev.filter(i => i.id !== inv.id));
        showAlert({
          title: 'Factura Eliminada',
          message: `La factura ${inv.invoice_number} fue removida.`,
          type: 'success'
        });
        if (onRefreshData) onRefreshData();
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
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          border: 'none !important'
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
              Total Facturado: <strong style={{ color: 'var(--rojo, #d91c2b)' }}>${totalBilled.toFixed(2)} USD</strong> · {invoices.length} facturas registradas
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
              placeholder="Buscar factura, mesa..."
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
                    {inv.customer_name || 'Walk-in Customer'} · Método: {inv.payment_method?.toUpperCase() || 'EFECTIVO'}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: '#a8a29e' }}>
                    {new Date(inv.created_at).toLocaleString('es-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Desglose de Precios */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#78716c' }}>
                    Subtotal: ${Number(inv.subtotal || 0).toFixed(2)}
                    {inv.tax_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Tax ({inv.tax_rate || 6.625}%)</span>}
                    {inv.delivery_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Envío</span>}
                    {inv.tip_enabled && <span style={{ color: '#10b981', marginLeft: '0.35rem' }}>+Propina (${Number(inv.tip_amount || 0).toFixed(2)})</span>}
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                    ${Number(inv.total_amount || 0).toFixed(2)} USD
                  </span>
                </div>

                {/* Acciones de Factura Destacadas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {/* Botón Imprimir */}
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

                  {/* Botón Editar Factura Visible */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(inv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '12px',
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer'
                    }}
                    title="Editar factura"
                  >
                    <Edit2 size={15} />
                    <span>Editar</span>
                  </button>

                  {/* Botón Eliminar */}
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
              boxShadow: '0 8px 25px rgba(0,0,0,0.03)',
              border: 'none !important'
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

      {/* MODAL CREAR / EDITAR FACTURA MANUAL */}
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
              maxWidth: '720px',
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
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(217, 28, 43, 0.1)',
                    color: 'var(--rojo, #d91c2b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c' }}>
                    {editingInvoice ? `Editar Factura ${editingInvoice.invoice_number}` : 'Nueva Factura Manual'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#78716c' }}>
                    {editingInvoice ? 'Modifica platillos, impuestos o datos del cliente' : 'Genera un comprobante oficial de venta'}
                  </span>
                </div>
              </div>

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

            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Sección 1: Cliente con Selector Personalizado y Botón Crear Nuevo */}
              <div style={{ backgroundColor: '#faf7f2', padding: '1rem', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1f1e1c', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={15} color="var(--rojo, #d91c2b)" />
                    <span>Cliente de la Factura</span>
                  </label>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setCustomerName('Walk-in Customer');
                        setCustomerPhone('');
                        setSelectedCustomerId(null);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        color: '#6b635b',
                        backgroundColor: '#f5efe4',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '8px',
                        border: 'none !important',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      Walk-in Customer
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setShowCreateCustomerInline(!showCreateCustomerInline);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        color: '#ffffff',
                        backgroundColor: 'var(--rojo, #d91c2b)',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none !important',
                        cursor: 'pointer',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <UserPlus size={13} />
                      <span>+ Crear Nuevo Cliente</span>
                    </button>
                  </div>
                </div>

                {/* Sub-formulario inline para Crear Nuevo Cliente */}
                {showCreateCustomerInline && (
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1f1e1c' }}>
                      Registro Inmediato de Cliente
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={newCustomerForm.name}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono móvil"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                      />
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={newCustomerForm.email}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="Notas / Preferencias"
                        value={newCustomerForm.notes}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', backgroundColor: '#f5efe4', border: 'none !important', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowCreateCustomerInline(false)}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', backgroundColor: '#f5efe4', color: '#78716c', fontSize: '0.74rem', fontWeight: 800, border: 'none !important', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInlineCustomer}
                        disabled={isCreatingCustomer || !newCustomerForm.name.trim()}
                        style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', backgroundColor: '#10b981', color: '#ffffff', fontSize: '0.74rem', fontWeight: 800, border: 'none !important', cursor: 'pointer' }}
                      >
                        {isCreatingCustomer ? 'Guardando...' : 'Guardar y Asignar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Select de Clientes Registrados + Input Libre */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <CustomSelect
                    value={selectedCustomerId || ''}
                    onChange={(val) => {
                      if (!val) {
                        setSelectedCustomerId(null);
                        setCustomerName('Walk-in Customer');
                        setCustomerPhone('');
                      } else {
                        const cust = customersList.find(c => c.id === val);
                        if (cust) {
                          setSelectedCustomerId(cust.id);
                          setCustomerName(cust.name);
                          setCustomerPhone(cust.phone || '');
                        }
                      }
                    }}
                    options={[
                      { value: '', label: 'Walk-in Customer (General)' },
                      ...customersList.map(c => ({
                        value: c.id,
                        label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`
                      }))
                    ]}
                    placeholder={`Seleccionar Cliente (${customersList.length})`}
                    buttonStyle={{
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  />

                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre en la factura *"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      border: 'none !important',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#1f1e1c',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  />
                </div>
              </div>

              {/* Sección 2: Mesa, Método de Pago y Estado del Cobro */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                {/* Selector de Mesa */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                    Mesa / Destino
                  </label>
                  <CustomSelect
                    value={tableNumber}
                    onChange={(val) => setTableNumber(val)}
                    options={[
                      ...tables.map(t => ({ value: String(t.number), label: `Mesa ${t.number}` })),
                      { value: 'Barra', label: 'Barra Principal' },
                      { value: 'Para Llevar', label: 'Para Llevar / Takeout' },
                      { value: 'Delivery', label: 'Delivery / Domicilio' },
                      { value: 'Consumo General', label: 'Consumo General' }
                    ]}
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                    Forma de Pago
                  </label>
                  <CustomSelect
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val)}
                    options={[
                      { value: 'efectivo', label: 'Efectivo ($ USD)' },
                      { value: 'tarjeta', label: 'Tarjeta Débito / Crédito' },
                      { value: 'zelle', label: 'Zelle' },
                      { value: 'apple_pay', label: 'Apple Pay' }
                    ]}
                  />
                </div>

                {/* Estado de Cobro */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.25rem' }}>
                    Estado del Cobro
                  </label>
                  <CustomSelect
                    value={paymentStatus}
                    onChange={(val) => setPaymentStatus(val)}
                    options={[
                      { value: 'paid', label: 'Pagado (Completado)' },
                      { value: 'pending', label: 'Pendiente de Pago' }
                    ]}
                  />
                </div>
              </div>

              {/* Sección 3: AJUSTES FISCALES, TAXES Y PROPINA MANUAL */}
              <div style={{ backgroundColor: '#faf7f2', padding: '1rem', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1f1e1c', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Ajustes Fiscales & Propina (EE.UU. / New Jersey)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                  {/* Control de Sales Tax */}
                  <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1f1e1c' }}>Sales Tax</span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setTaxEnabled(!taxEnabled);
                        }}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: taxEnabled ? '#10b981' : '#f5efe4',
                          color: taxEnabled ? '#ffffff' : '#78716c',
                          fontWeight: 900,
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                      >
                        {taxEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        disabled={!taxEnabled}
                        style={{
                          width: '70px',
                          padding: '0.4rem',
                          borderRadius: '8px',
                          backgroundColor: taxEnabled ? '#f5efe4' : '#fafafa',
                          border: 'none !important',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#78716c', fontWeight: 700 }}>%</span>
                      <span style={{ fontSize: '0.76rem', color: taxEnabled ? '#10b981' : '#a8a29e', fontWeight: 800, marginLeft: 'auto' }}>
                        +${formTaxAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Control de Propina Manual */}
                  <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1f1e1c' }}>Propina Manual</span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setTipEnabled(!tipEnabled);
                        }}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: tipEnabled ? '#10b981' : '#f5efe4',
                          color: tipEnabled ? '#ffffff' : '#78716c',
                          fontWeight: 900,
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                      >
                        {tipEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#78716c' }}>$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={tipAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTipAmount(val);
                          if (val > 0 && !tipEnabled) setTipEnabled(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '8px',
                          backgroundColor: '#f5efe4',
                          border: 'none !important',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          outline: 'none'
                        }}
                      />
                    </div>
                    {/* Botones de sugerencia rápida */}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {[0, 3, 5, 10, 15].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            triggerHaptic(5);
                            setTipAmount(amt);
                            setTipEnabled(amt > 0);
                          }}
                          style={{
                            flex: 1,
                            fontSize: '0.64rem',
                            padding: '0.15rem 0',
                            borderRadius: '5px',
                            backgroundColor: tipAmount === amt && tipEnabled ? '#10b981' : '#f5efe4',
                            color: tipAmount === amt && tipEnabled ? '#ffffff' : '#44403c',
                            fontWeight: 800,
                            border: 'none !important',
                            cursor: 'pointer'
                          }}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control de Envío */}
                  <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1f1e1c' }}>Costo Envío</span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setDeliveryEnabled(!deliveryEnabled);
                        }}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: deliveryEnabled ? '#10b981' : '#f5efe4',
                          color: deliveryEnabled ? '#ffffff' : '#78716c',
                          fontWeight: 900,
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                      >
                        {deliveryEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#78716c' }}>$</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={deliveryAmount}
                        onChange={(e) => setDeliveryAmount(Number(e.target.value))}
                        disabled={!deliveryEnabled}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '8px',
                          backgroundColor: deliveryEnabled ? '#f5efe4' : '#fafafa',
                          border: 'none !important',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: CATÁLOGO DE PLATOS PARA AÑADIR A LA FACTURA */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Utensils size={16} color="var(--rojo, #d91c2b)" />
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1f1e1c' }}>
                      Platos y Conceptos Facturados ({formItems.length})
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setShowDishCatalog(!showDishCatalog);
                      }}
                      style={{
                        backgroundColor: showDishCatalog ? 'var(--rojo, #d91c2b)' : '#f5efe4',
                        color: showDishCatalog ? '#ffffff' : '#1f1e1c',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none !important',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Utensils size={13} />
                      <span>{showDishCatalog ? 'Ocultar Carta' : '+ Elegir de la Carta'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setFormItems(prev => [...prev, { name: 'Concepto Extra', quantity: 1, unit_price: 10.00 }]);
                      }}
                      style={{
                        backgroundColor: '#f5efe4',
                        color: '#1f1e1c',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none !important',
                        cursor: 'pointer'
                      }}
                    >
                      + Ítem Libre
                    </button>
                  </div>
                </div>

                {/* Acordeón del Catálogo de Platos Seleccionables */}
                {showDishCatalog && (
                  <div
                    style={{
                      backgroundColor: '#fbf7ee',
                      borderRadius: '16px',
                      padding: '0.85rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} color="#78716c" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Buscar plato en la carta..."
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            border: 'none !important',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Selector de Categoría en el catálogo */}
                      <CustomSelect
                        value={catalogCategory}
                        onChange={(val) => setCatalogCategory(val)}
                        options={[
                          { value: 'all', label: 'Todas las Categorías' },
                          ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                        ]}
                        width="180px"
                        buttonStyle={{
                          backgroundColor: '#ffffff',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '10px',
                          fontSize: '0.78rem'
                        }}
                      />
                    </div>

                    {/* Grid de Platos Rápidos */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '0.45rem',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        paddingRight: '0.2rem'
                      }}
                    >
                      {filteredCatalogDishes.map(dish => (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => handleAddDishFromCatalog(dish)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            border: 'none !important',
                            cursor: 'pointer',
                            textAlign: 'left',
                            gap: '0.35rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1f1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dish.name}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)', whiteSpace: 'nowrap' }}>
                            ${Number(dish.price || 0).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Ítems Agregados en la Factura */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {formItems.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 80px 100px 80px auto',
                        gap: '0.45rem',
                        alignItems: 'center',
                        backgroundColor: '#faf7f2',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '12px'
                      }}
                    >
                      <input
                        type="text"
                        required
                        value={it.name}
                        onChange={(e) => {
                          const copy = [...formItems];
                          copy[idx].name = e.target.value;
                          setFormItems(copy);
                        }}
                        placeholder="Descripción del plato..."
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', backgroundColor: '#ffffff', border: 'none !important', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const copy = [...formItems];
                          copy[idx].quantity = Math.max(1, Number(e.target.value));
                          setFormItems(copy);
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#ffffff', border: 'none !important', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center', outline: 'none' }}
                      />
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#78716c', fontWeight: 800 }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unit_price}
                          onChange={(e) => {
                            const copy = [...formItems];
                            copy[idx].unit_price = Number(e.target.value);
                            setFormItems(copy);
                          }}
                          style={{ width: '100%', padding: '0.45rem 0.45rem 0.45rem 1.25rem', borderRadius: '8px', backgroundColor: '#ffffff', border: 'none !important', fontSize: '0.82rem', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#1f1e1c', textAlign: 'right' }}>
                        ${((Number(it.quantity || 1) * Number(it.unit_price || 0))).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (formItems.length > 1) {
                            setFormItems(formItems.filter((_, i) => i !== idx));
                          }
                        }}
                        style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none !important', cursor: 'pointer' }}
                        title="Remover plato"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Botón Guardar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: 'none',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 700 }}>Total Final Liquidado:</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                      ${formTotalAmount.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c' }}>USD</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '0.65rem 1.15rem',
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
                      padding: '0.65rem 1.35rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--rojo, #d91c2b)',
                      color: '#ffffff',
                      fontWeight: 900,
                      border: 'none !important',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(217, 28, 43, 0.3)'
                    }}
                  >
                    {isSaving ? 'Guardando...' : editingInvoice ? 'Guardar Cambios' : 'Emitir Factura'}
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
