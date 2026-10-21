import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Plus, Minus, Trash2, Printer, 
  Send, DollarSign, Check, X, Search, User, 
  Utensils, Layers, RefreshCw, ChefHat, CreditCard, 
  Receipt, Percent, Truck, UserPlus, Sparkles, ChevronDown
} from 'lucide-react';
import { ordersService, invoicesService, tablesService, customersService } from '../services/supabase';
import { InvoicePrintModal } from './InvoicePrintModal';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminPOSTab({
  tables = [],
  orders = [],
  dishes = [],
  categories = [],
  waiters = [],
  currentWaiter = null,
  onOrderCreated,
  onOrderUpdated,
  onRefreshData
}) {
  const { showAlert, showConfirm } = useAlertConfirm();

  // Estados del POS
  const [selectedTable, setSelectedTable] = useState('1'); // mesa número o 'Llevar'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('Cliente de Consumo');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState(currentWaiter?.id || '');

  // Detección de orden activa en la mesa seleccionada (ej: cliente que pidió por QR)
  const activeTableOrder = useMemo(() => {
    if (!selectedTable || selectedTable === 'Llevar' || selectedTable === 'Barra') return null;
    return orders.find(o => 
      String(o.table_number) === String(selectedTable) && 
      (o.status === 'pending' || o.status === 'in_kitchen' || o.status === 'ready' || o.status === 'delivered')
    );
  }, [orders, selectedTable]);

  // Si la mesa seleccionada tiene orden activa y el cliente está como genérico, auto-completar nombre
  useEffect(() => {
    if (activeTableOrder && activeTableOrder.customer_name && customerName === 'Cliente de Consumo') {
      setCustomerName(activeTableOrder.customer_name);
      if (activeTableOrder.customer_phone) {
        setCustomerPhone(activeTableOrder.customer_phone);
      }
    }
  }, [activeTableOrder]);

  // Carrito / Comanda en curso del POS
  const [posItems, setPosItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Toggles de Facturación en POS (DESACTIVADOS POR DEFECTO)
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(6.625); // New Jersey Sales Tax

  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState(5.00);

  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipPercent, setTipPercent] = useState(15);

  // Filtros del catálogo
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dishSearch, setDishSearch] = useState('');

  // Modal para agregar ítem manual / fuera de carta
  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemQty, setManualItemQty] = useState(1);
  const [manualItemNote, setManualItemNote] = useState('');

  // Modal de Impresión
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModalData, setPrintModalData] = useState(null);

  // Estado de envío / guardado
  const [isProcessing, setIsProcessing] = useState(false);

  // Cargar lista de clientes
  useEffect(() => {
    customersService.getCustomers().then(data => {
      setCustomersList(data || []);
    }).catch(() => {});
  }, []);

  // Filtrado de platos del catálogo
  const filteredDishes = useMemo(() => {
    return dishes.filter(d => {
      const matchCat = selectedCategory === 'all' || d.category_id === selectedCategory;
      const matchQuery = !dishSearch.trim() || 
        d.name?.toLowerCase().includes(dishSearch.toLowerCase()) ||
        d.description?.toLowerCase().includes(dishSearch.toLowerCase());
      return matchCat && matchQuery && d.is_available !== false;
    });
  }, [dishes, selectedCategory, dishSearch]);

  // Cálculos matemáticos en vivo
  const subtotal = useMemo(() => {
    return posItems.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
  }, [posItems]);

  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    return Number(((subtotal * Number(taxRate || 0)) / 100).toFixed(2));
  }, [subtotal, taxEnabled, taxRate]);

  const deliveryFee = useMemo(() => {
    if (!deliveryEnabled) return 0;
    return Number(Number(deliveryAmount || 0).toFixed(2));
  }, [deliveryEnabled, deliveryAmount]);

  const tipAmount = useMemo(() => {
    if (!tipEnabled) return 0;
    return Number(((subtotal * Number(tipPercent || 0)) / 100).toFixed(2));
  }, [subtotal, tipEnabled, tipPercent]);

  const totalAmount = useMemo(() => {
    return Number((subtotal + taxAmount + deliveryFee + tipAmount).toFixed(2));
  }, [subtotal, taxAmount, deliveryFee, tipAmount]);

  // Cálculo de estado en tiempo real de cada mesa con colores diferenciados
  const getTableLiveStatus = (tblNumber) => {
    if (tblNumber === 'Llevar') {
      return { label: 'Llevar', color: '#f5efe4', textColor: '#1f1e1c', dot: '#78716c', isSpecial: true };
    }
    if (tblNumber === 'Barra') {
      return { label: 'Barra', color: '#f5efe4', textColor: '#1f1e1c', dot: '#78716c', isSpecial: true };
    }

    const activeOrders = orders.filter(o => 
      String(o.table_number) === String(tblNumber) && 
      o.status !== 'completed' && o.status !== 'cancelled'
    );

    // 1. Nueva Orden / Pendiente (Ámbar suave con pulso)
    if (activeOrders.some(o => o.status === 'pending')) {
      return {
        label: 'Nueva',
        color: '#fef3c7',
        textColor: '#92400e',
        dot: '#f59e0b',
        isPulsing: true
      };
    }

    // 2. En Cocina / Preparando (Azul suave)
    if (activeOrders.some(o => o.status === 'in_kitchen')) {
      return {
        label: 'Cocina',
        color: '#dbeafe',
        textColor: '#1e40af',
        dot: '#3b82f6'
      };
    }

    // 3. Lista para Servir (Púrpura suave)
    if (activeOrders.some(o => o.status === 'ready')) {
      return {
        label: 'Lista',
        color: '#ede9fe',
        textColor: '#6d28d9',
        dot: '#8b5cf6'
      };
    }

    // 4. En Mesa / Servida / Cuenta Abierta (Naranja / Coral suave)
    if (activeOrders.some(o => o.status === 'delivered')) {
      return {
        label: 'En Mesa',
        color: '#ffedd5',
        textColor: '#c2410c',
        dot: '#ea580c'
      };
    }

    // 5. Mesa ocupada en la base de datos
    const tblObj = tables.find(t => String(t.number) === String(tblNumber));
    if (tblObj && tblObj.status === 'occupied') {
      return {
        label: 'Ocupada',
        color: '#ffedd5',
        textColor: '#c2410c',
        dot: '#ea580c'
      };
    }

    // 6. Libre / Disponible (Verde esmeralda suave)
    return {
      label: 'Libre',
      color: '#dcfce7',
      textColor: '#166534',
      dot: '#10b981'
    };
  };

  // Manejadores de Ítems en el Carrito POS
  const handleAddDish = (dish) => {
    triggerHaptic(8);
    setPosItems(prev => {
      const existing = prev.find(it => it.dish_id === dish.id);
      if (existing) {
        return prev.map(it => 
          it.dish_id === dish.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          id: Math.random().toString(),
          dish_id: dish.id,
          name: dish.name,
          quantity: 1,
          unit_price: Number(dish.price || 0),
          notes: ''
        }
      ];
    });
  };

  const handleUpdateQty = (idx, delta) => {
    triggerHaptic(6);
    setPosItems(prev => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== idx);
      }
      copy[idx] = { ...copy[idx], quantity: newQty };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    triggerHaptic(8);
    setPosItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemNoteChange = (idx, note) => {
    setPosItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], notes: note };
      return copy;
    });
  };

  const handleAddManualItem = (e) => {
    e.preventDefault();
    if (!manualItemName.trim() || isNaN(Number(manualItemPrice))) return;
    triggerHaptic(8);
    setPosItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        dish_id: null,
        name: manualItemName.trim(),
        quantity: Math.max(1, Number(manualItemQty) || 1),
        unit_price: Number(manualItemPrice) || 0,
        notes: manualItemNote.trim()
      }
    ]);
    setManualItemName('');
    setManualItemPrice('');
    setManualItemQty(1);
    setManualItemNote('');
    setShowManualItemModal(false);
  };

  const handleSelectCustomer = (cust) => {
    triggerHaptic(6);
    if (!cust) {
      setSelectedCustomerId(null);
      setCustomerName('Cliente de Consumo');
      setCustomerPhone('');
      return;
    }
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone || '');
  };

  const handleClearPOS = async () => {
    if (posItems.length === 0) return;
    const confirmed = await showConfirm({
      title: '¿Vaciar Comanda en Curso?',
      message: 'Se eliminarán todos los platos seleccionados actualmente en el TPV.',
      confirmText: 'Sí, vaciar',
      cancelText: 'Continuar editando',
      isDestructive: true
    });
    if (confirmed) {
      triggerHaptic(8);
      setPosItems([]);
      setOrderNotes('');
    }
  };

  // 1. Acción: Enviar a Cocina (Crea un nuevo Pedido con estado 'in_kitchen')
  const handleSendToKitchen = async () => {
    if (posItems.length === 0) {
      await showAlert({
        title: 'Comanda Vacía',
        message: 'Añade al menos un plato a la comanda antes de enviarla a cocina.',
        type: 'warning'
      });
      return;
    }

    try {
      setIsProcessing(true);
      triggerHaptic(14);

      const tableObj = tables.find(t => String(t.number) === String(selectedTable));

      const newOrder = await ordersService.createOrder({
        customer_name: customerName || 'Cliente de Consumo',
        customer_phone: customerPhone || null,
        customer_id: selectedCustomerId,
        table_number: String(selectedTable),
        table_id: tableObj?.id || null,
        waiter_id: selectedWaiterId || null,
        status: 'in_kitchen',
        subtotal,
        tax_enabled: taxEnabled,
        tax_amount: taxAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: deliveryFee,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        payment_method: 'efectivo',
        notes: orderNotes
      }, posItems);

      // Ocupar la mesa si aplica
      if (tableObj) {
        await tablesService.occupyTable(tableObj.id, customerName);
      }

      await showAlert({
        title: '¡Comanda Enviada a Cocina!',
        message: `El pedido #${newOrder.order_number || ''} para Mesa ${selectedTable} ha sido recibido en cocina y sincronizado en vivo.`,
        type: 'success'
      });

      if (onOrderCreated) onOrderCreated(newOrder);
      if (onRefreshData) onRefreshData();

      // Vaciar carrito
      setPosItems([]);
      setOrderNotes('');
    } catch (err) {
      console.error('Error enviando comanda a cocina:', err);
      await showAlert({
        title: 'Error',
        message: 'No se pudo enviar la orden a cocina. Verifica la conexión.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Acción: Unificar y Añadir a la orden activa de la mesa (evita duplicar tickets de la misma mesa)
  const handleAppendToActiveOrder = async () => {
    if (!activeTableOrder || posItems.length === 0) return;
    try {
      setIsProcessing(true);
      triggerHaptic(14);

      const existingItems = (activeTableOrder.order_items || []).map(it => ({
        dish_id: it.dish_id,
        name: it.dish_name || it.name,
        quantity: Number(it.quantity || 1),
        unit_price: Number(it.dish_price || it.unit_price || 0),
        notes: it.notes || ''
      }));

      const combinedItems = [...existingItems, ...posItems];
      const newSubtotal = combinedItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
      const newTotal = Number(newSubtotal.toFixed(2));

      const updated = await ordersService.updateOrderFull(activeTableOrder.id, {
        customer_name: activeTableOrder.customer_name || customerName,
        customer_phone: activeTableOrder.customer_phone || customerPhone,
        table_number: String(selectedTable),
        status: activeTableOrder.status,
        subtotal: newSubtotal,
        total_amount: newTotal,
        notes: activeTableOrder.notes ? `${activeTableOrder.notes}. ${orderNotes}`.trim() : orderNotes
      }, combinedItems);

      await showAlert({
        title: '¡Platos Añadidos a la Cuenta!',
        message: `Se agregaron ${posItems.length} platos al pedido activo #${activeTableOrder.order_number} de Mesa ${selectedTable}. Cuenta unificada con éxito.`,
        type: 'success'
      });

      if (onOrderUpdated) onOrderUpdated(updated);
      if (onRefreshData) onRefreshData();

      setPosItems([]);
      setOrderNotes('');
    } catch (err) {
      console.error('Error unificando platos en la orden:', err);
      await showAlert({
        title: 'Error',
        message: 'No se pudieron añadir los platos a la orden existente.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Acción: Abrir Factura / Pre-cuenta para Imprimir
  const handleOpenPrintPreview = () => {
    if (posItems.length === 0) {
      showAlert({
        title: 'Comanda Vacía',
        message: 'Selecciona platos para generar el ticket de pre-cuenta.',
        type: 'warning'
      });
      return;
    }

    const waiterObj = waiters.find(w => w.id === selectedWaiterId) || currentWaiter;

    setPrintModalData({
      invoice_number: `POS-${Date.now().toString().slice(-6)}`,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_number: selectedTable,
      waiter_name: waiterObj?.name || 'Servicio de Sala',
      payment_method: 'efectivo',
      tax_enabled: taxEnabled,
      tax_rate: taxRate,
      delivery_enabled: deliveryEnabled,
      delivery_amount: deliveryAmount,
      tip_enabled: tipEnabled,
      tip_amount: tipAmount,
      notes: orderNotes,
      items: posItems.map(it => ({
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        notes: it.notes
      }))
    });
    setPrintModalOpen(true);
  };

  // 3. Acción: Cobrar y Cerrar Mesa
  const handleChargeAndClose = async () => {
    if (posItems.length === 0) {
      await showAlert({
        title: 'Comanda Vacía',
        message: 'No hay ítems para cobrar en esta mesa.',
        type: 'warning'
      });
      return;
    }

    const confirmed = await showConfirm({
      title: '¿Cobrar y Liberar Mesa?',
      message: `Se registrará la factura por $${totalAmount.toFixed(2)} USD y se liberará la Mesa ${selectedTable}.`,
      confirmText: 'Sí, cobrar y cerrar',
      cancelText: 'Volver'
    });

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      triggerHaptic(14);

      const waiterObj = waiters.find(w => w.id === selectedWaiterId) || currentWaiter;
      const nextInvNum = await invoicesService.getNextInvoiceNumber();

      // Guardar factura formal en DB
      await invoicesService.createInvoice({
        invoice_number: nextInvNum,
        customer_id: selectedCustomerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: String(selectedTable),
        waiter_id: selectedWaiterId || null,
        waiter_name: waiterObj?.name || 'Servicio de Sala',
        subtotal,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: deliveryFee,
        tip_enabled: tipEnabled,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        payment_method: 'efectivo',
        payment_status: 'paid',
        notes: orderNotes
      }, posItems);

      // Si la mesa existe, liberarla
      const tableObj = tables.find(t => String(t.number) === String(selectedTable));
      if (tableObj) {
        await tablesService.closeTable(tableObj.id, selectedTable);
      }

      await showAlert({
        title: '¡Cobro Exitoso!',
        message: `Factura ${nextInvNum} registrada por $${totalAmount.toFixed(2)} USD. Mesa ${selectedTable} liberada.`,
        type: 'success'
      });

      if (onRefreshData) onRefreshData();
      setPosItems([]);
      setOrderNotes('');
    } catch (err) {
      console.error('Error cobrando mesa:', err);
      await showAlert({
        title: 'Error al Cobrar',
        message: 'No se pudo procesar la factura.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Selección Rápida de Mesas */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 28, 43, 0.1)',
                color: 'var(--rojo, #d91c2b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                Punto de Venta · Salón & Barra
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
                Selecciona la mesa para comandar o despachar
              </span>
            </div>
          </div>

          {/* Selector de Mesero Operador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#78716c' }}>Atiende:</span>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedWaiterId}
                onChange={(e) => setSelectedWaiterId(e.target.value)}
                style={{
                  padding: '0.45rem 1.85rem 0.45rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#1f1e1c',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Seleccionar Mesero...</option>
                {waiters.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.role || 'Mesero'})</option>
                ))}
              </select>
              <ChevronDown size={14} color="#78716c" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Barra de Leyenda de Estados en Tiempo Real */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', padding: '0.2rem 0', fontSize: '0.72rem', fontWeight: 800 }}>
          <span style={{ color: '#78716c' }}>Estados en Tiempo Real:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Libre</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#92400e', backgroundColor: '#fef3c7', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'statusPulse 1.5s infinite' }} />
            <span>Nueva Orden</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e40af', backgroundColor: '#dbeafe', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span>En Cocina</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6d28d9', backgroundColor: '#ede9fe', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
            <span>Lista</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <span>En Mesa / Ocupada</span>
          </div>
        </div>

        {/* Píldoras de Mesas con Estado en Tiempo Real y Colores Diferenciados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {['Llevar', 'Barra', ...tables.map(t => String(t.number))].map((tbl) => {
            const isSelected = String(selectedTable) === String(tbl);
            const statusInfo = getTableLiveStatus(tbl);

            return (
              <button
                key={tbl}
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setSelectedTable(tbl);
                }}
                style={{
                  padding: '0.6rem 0.95rem',
                  borderRadius: '14px',
                  backgroundColor: isSelected 
                    ? 'var(--rojo, #d91c2b)' 
                    : statusInfo.color,
                  color: isSelected 
                    ? '#ffffff' 
                    : statusInfo.textColor,
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: isSelected ? '0 6px 16px rgba(217, 28, 43, 0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Indicador de estado */}
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#ffffff' : statusInfo.dot,
                    animation: statusInfo.isPulsing ? 'statusPulse 1.5s infinite' : 'none'
                  }}
                />
                <span>{tbl === 'Llevar' || tbl === 'Barra' ? tbl : `Mesa ${tbl}`}</span>
                {!statusInfo.isSpecial && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      opacity: isSelected ? 0.9 : 0.85,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '6px'
                    }}
                  >
                    {statusInfo.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Regla CSS interna para evitar desbordamiento en POS */}
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.35); }
        }
        .pos-responsive-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 430px);
          gap: 1.25rem;
          align-items: start;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1120px) {
          .pos-responsive-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>

      {/* Grid Central del POS: Catálogo de Platos a la Izquierda, Comanda / Carrito a la Derecha */}
      <div className="pos-responsive-grid">
        {/* PANEL IZQUIERDO: CATÁLOGO DE PLATOS DEL RESTAURANTE */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Barra de Búsqueda y Botón Ítem Manual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="#78716c" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Buscar plato en la carta por nombre..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '12px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setShowManualItemModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#1f1e1c',
                color: '#ffffff',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none !important',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} />
              <span>Plato Manual</span>
            </button>
          </div>

          {/* Filtro de Categorías */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                backgroundColor: selectedCategory === 'all' ? '#1f1e1c' : '#f5efe4',
                color: selectedCategory === 'all' ? '#ffffff' : '#1f1e1c',
                fontSize: '0.78rem',
                fontWeight: 800,
                border: 'none !important',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Todos ({dishes.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: selectedCategory === cat.id ? '#1f1e1c' : '#f5efe4',
                  color: selectedCategory === cat.id ? '#ffffff' : '#1f1e1c',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid de Platos Seleccionables */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.65rem',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}
          >
            {filteredDishes.map(dish => (
              <button
                key={dish.id}
                type="button"
                onClick={() => handleAddDish(dish)}
                style={{
                  backgroundColor: '#fbf7ee',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                  transition: 'transform 0.12s ease'
                }}
              >
                {dish.image_url && (
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    style={{
                      width: '100%',
                      height: '90px',
                      borderRadius: '10px',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 900, color: '#1f1e1c', lineHeight: 1.25 }}>
                    {dish.name}
                  </h4>
                  {dish.description && (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#78716c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dish.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                    ${Number(dish.price).toFixed(2)}
                  </span>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--rojo, #d91c2b)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: TICKET / COMANDA EN VIVO DEL TPV */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'sticky',
            top: '1.5rem'
          }}
        >
          {/* Cabecera del Ticket */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)' }}>
                Comanda de Sala
              </span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                Mesa {selectedTable}
              </h3>
            </div>

            {posItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearPOS}
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#78716c',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Asignación de Cliente */}
          <div style={{ backgroundColor: '#faf7f2', padding: '0.75rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c' }}>Cliente Asignado:</span>
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                style={{
                  backgroundColor: selectedCustomerId === null ? '#1f1e1c' : '#ffffff',
                  color: selectedCustomerId === null ? '#ffffff' : '#78716c',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Consumo General
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => {
                  const found = customersList.find(c => c.id === e.target.value);
                  handleSelectCustomer(found || null);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1.85rem 0.5rem 0.65rem',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: 'none !important',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Cliente de Consumo (Por Defecto)</option>
                {customersList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
              <ChevronDown size={14} color="#78716c" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Lista de Ítems en la Comanda */}
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingRight: '0.2rem'
            }}
          >
            {posItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#a8a29e' }}>
                <Utensils size={28} style={{ margin: '0 auto 0.5rem auto' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block' }}>Comanda vacía</span>
                <span style={{ fontSize: '0.72rem' }}>Haz clic en los platos para agregarlos</span>
              </div>
            ) : (
              posItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#faf7f2',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1f1e1c', flex: 1 }}>
                      {it.name}
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#1f1e1c' }}>
                      ${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <input
                      type="text"
                      placeholder="Nota (sin picante, bien cocido)..."
                      value={it.notes}
                      onChange={(e) => handleItemNoteChange(idx, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.25rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: 'none !important',
                        fontSize: '0.72rem',
                        marginRight: '0.5rem'
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          backgroundColor: '#f5efe4',
                          border: 'none !important',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 900, minWidth: '18px', textAlign: 'center' }}>
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          backgroundColor: '#f5efe4',
                          border: 'none !important',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          padding: '0.3rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none !important',
                          cursor: 'pointer',
                          marginLeft: '0.25rem'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* REGLA: Toggles de Facturación en POS (Tax, Envío, Propina) - DEFAULT OFF */}
          <div style={{ backgroundColor: '#f8f4ec', padding: '0.75rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#78716c', textTransform: 'uppercase' }}>
              Recargos Fiscales (Desactivados por defecto)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setTaxEnabled(!taxEnabled);
                }}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  backgroundColor: taxEnabled ? '#10b981' : '#ffffff',
                  color: taxEnabled ? '#ffffff' : '#1f1e1c',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Tax {taxEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setDeliveryEnabled(!deliveryEnabled);
                }}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  backgroundColor: deliveryEnabled ? '#10b981' : '#ffffff',
                  color: deliveryEnabled ? '#ffffff' : '#1f1e1c',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Envío {deliveryEnabled ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setTipEnabled(!tipEnabled);
                }}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  backgroundColor: tipEnabled ? '#10b981' : '#ffffff',
                  color: tipEnabled ? '#ffffff' : '#1f1e1c',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Propina {tipEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Resumen Total del Ticket */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.5rem', borderTop: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#78716c' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 800, color: '#1f1e1c' }}>${subtotal.toFixed(2)}</span>
            </div>

            {taxEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#10b981' }}>
                <span>Sales Tax ({taxRate}%):</span>
                <span style={{ fontWeight: 800 }}>+${taxAmount.toFixed(2)}</span>
              </div>
            )}

            {deliveryEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#10b981' }}>
                <span>Tarifa Envío:</span>
                <span style={{ fontWeight: 800 }}>+${deliveryFee.toFixed(2)}</span>
              </div>
            )}

            {tipEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#10b981' }}>
                <span>Propina ({tipPercent}%):</span>
                <span style={{ fontWeight: 800 }}>+${tipAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)', marginTop: '0.25rem' }}>
              <span>TOTAL USD:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Botones de Acción del POS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeTableOrder && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  borderRadius: '14px',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#92400e' }}>
                    Comanda Activa #{activeTableOrder.order_number || activeTableOrder.id?.slice(0, 6)} en Mesa {selectedTable}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#b45309' }}>
                    ${Number(activeTableOrder.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#78350f' }}>
                  Cliente: <strong>{activeTableOrder.customer_name}</strong> · {(activeTableOrder.order_items || []).length} platos ya en marcha
                </span>

                <button
                  type="button"
                  disabled={isProcessing || posItems.length === 0}
                  onClick={handleAppendToActiveOrder}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '10px',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    border: 'none !important',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <Plus size={15} />
                  <span>Unificar y Añadir a Esta Cuenta Activa</span>
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing || posItems.length === 0}
              onClick={handleSendToKitchen}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '14px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 18px rgba(217, 28, 43, 0.3)'
              }}
            >
              <Send size={17} />
              <span>{activeTableOrder ? 'Crear Comanda Nueva Separada' : 'Enviar a Cocina'}</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={posItems.length === 0}
                onClick={handleOpenPrintPreview}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Printer size={15} />
                <span>Pre-cuenta</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || posItems.length === 0}
                onClick={handleChargeAndClose}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)'
                }}
              >
                <DollarSign size={15} />
                <span>Cobrar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Añadir Ítem Manual / Fuera de Carta */}
      {showManualItemModal && (
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
            if (e.target === e.currentTarget) setShowManualItemModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1f1e1c' }}>
                Añadir Ítem Manual Fuera de Carta
              </h3>
              <button
                type="button"
                onClick={() => setShowManualItemModal(false)}
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

            <form onSubmit={handleAddManualItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                  Nombre del Ítem o Plato *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tiradito Especial del Chef"
                  value={manualItemName}
                  onChange={(e) => setManualItemName(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={manualItemPrice}
                    onChange={(e) => setManualItemPrice(e.target.value)}
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
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualItemQty}
                    onChange={(e) => setManualItemQty(Number(e.target.value))}
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

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                  Nota de Cocina Opcional
                </label>
                <input
                  type="text"
                  placeholder="Ej: Con camote extra..."
                  value={manualItemNote}
                  onChange={(e) => setManualItemNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  boxShadow: '0 6px 18px rgba(217, 28, 43, 0.3)'
                }}
              >
                Agregar al Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impresión Integrado */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        initialData={printModalData}
      />
    </div>
  );
}
