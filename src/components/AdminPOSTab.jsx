import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Plus, Minus, Trash2, Printer, 
  Send, DollarSign, Check, X, Search, User, 
  Utensils, Layers, RefreshCw, ChefHat, CreditCard, 
  Receipt, Percent, Truck, UserPlus, Sparkles, ChevronDown,
  ArrowLeft, Users, Clock, AlertCircle, Phone, MapPin
} from 'lucide-react';
import { ordersService, invoicesService, tablesService, customersService } from '../services/supabase';
import { InvoicePrintModal } from './InvoicePrintModal';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

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

  // 1. Selector de Modalidad Principal del Servicio
  // 'salon' (Mesas) | 'llevar' (Para Llevar) | 'delivery' (Entrega a Domicilio)
  const [serviceMode, setServiceMode] = useState('salon');

  // En modo salón: 'tables' (Plano visual de mesas) | 'order' (Comandando platos)
  const [salonView, setSalonView] = useState('tables');

  // Estados de Selección
  const [selectedTable, setSelectedTable] = useState('1');
  const [dinersCount, setDinersCount] = useState(2);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState(currentWaiter?.id || '');

  // Filtros en Plano de Mesas (Estado, Zona, Capacidad y Búsqueda)
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'free' | 'occupied' | 'kitchen' | 'ready'
  const [tableZoneFilter, setTableZoneFilter] = useState('all'); // 'all' | 'salon' | 'barra' | 'terraza'
  const [tableCapacityFilter, setTableCapacityFilter] = useState('all'); // 'all' | '2' | '4' | '6+'
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Modal para Abrir Cuenta / Asignar Comensales en Mesa Libre
  const [openingTableData, setOpeningTableData] = useState(null); // { tableNumber, tableObj }

  // Carrito / Comanda en curso del POS (nuevos ítems que se van a enviar)
  const [posItems, setPosItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Toggles de Facturación en POS (DESACTIVADOS POR DEFECTO)
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(6.625); // New Jersey Sales Tax

  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState(5.00);

  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipPercent, setTipPercent] = useState(16); // 16% Gratuity estándar cuando >2 personas

  // Auto-activar propina sugerida (gratuity 16%) si son más de 2 comensales
  useEffect(() => {
    if (dinersCount > 2) {
      setTipEnabled(true);
      setTipPercent(16);
    }
  }, [dinersCount]);

  // Filtros del catálogo de platos
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dishSearch, setDishSearch] = useState('');

  // Modal para agregar ítem manual fuera de carta
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

  // Cargar lista de clientes registrados
  useEffect(() => {
    customersService.getCustomers().then(data => {
      setCustomersList(data || []);
    }).catch(() => {});
  }, []);

  // Sincronizar mesero si llega uno por props
  useEffect(() => {
    if (currentWaiter?.id && !selectedWaiterId) {
      setSelectedWaiterId(currentWaiter.id);
    }
  }, [currentWaiter, selectedWaiterId]);

  // Detección de orden activa en la mesa seleccionada (ej: cliente que pidió por QR o mesero previo)
  const activeTableOrder = useMemo(() => {
    if (!selectedTable || selectedTable === 'Llevar' || selectedTable === 'Delivery' || selectedTable === 'Barra') {
      return null;
    }
    return orders.find(o => 
      String(o.table_number) === String(selectedTable) && 
      (o.status === 'pending' || o.status === 'in_kitchen' || o.status === 'ready' || o.status === 'delivered')
    );
  }, [orders, selectedTable]);

  // Si la mesa seleccionada tiene orden activa y el cliente está como genérico, auto-completar nombre
  useEffect(() => {
    if (activeTableOrder && activeTableOrder.customer_name && customerName === 'Walk-in Customer') {
      setCustomerName(activeTableOrder.customer_name);
      if (activeTableOrder.customer_phone) {
        setCustomerPhone(activeTableOrder.customer_phone);
      }
      if (activeTableOrder.waiter_id) {
        setSelectedWaiterId(activeTableOrder.waiter_id);
      }
    }
  }, [activeTableOrder]);

  // Obtener orden activa para cualquier número de mesa
  const getTableActiveOrder = (tblNumber) => {
    return orders.find(o => 
      String(o.table_number) === String(tblNumber) && 
      o.status !== 'completed' && o.status !== 'cancelled'
    );
  };

  // Cálculo de estado en tiempo real de cada mesa con colores y tipografía de restaurante
  const getTableLiveStatus = (tblNumber) => {
    if (tblNumber === 'Llevar' || tblNumber === 'Delivery' || tblNumber === 'Barra') {
      return { label: tblNumber, color: '#f5efe4', textColor: '#1f1e1c', dot: '#78716c', isSpecial: true };
    }

    const activeOrder = getTableActiveOrder(tblNumber);

    if (activeOrder) {
      // 1. Nueva Orden / Pendiente (Ámbar suave con pulso)
      if (activeOrder.status === 'pending') {
        return {
          label: 'Nueva Orden',
          color: '#fef3c7',
          textColor: '#92400e',
          dot: '#f59e0b',
          isPulsing: true,
          badgeBg: '#fde68a',
          order: activeOrder
        };
      }
      // 2. En Cocina / Preparando (Azul suave)
      if (activeOrder.status === 'in_kitchen' || activeOrder.status === 'accepted') {
        return {
          label: 'En Cocina',
          color: '#dbeafe',
          textColor: '#1e40af',
          dot: '#3b82f6',
          badgeBg: '#bfdbfe',
          order: activeOrder
        };
      }
      // 3. Lista para Servir (Púrpura suave)
      if (activeOrder.status === 'ready') {
        return {
          label: 'Lista para Servir',
          color: '#ede9fe',
          textColor: '#6d28d9',
          dot: '#8b5cf6',
          badgeBg: '#ddd6fe',
          order: activeOrder
        };
      }
      // 4. En Mesa / Comiendo (Naranja / Coral suave)
      if (activeOrder.status === 'delivered') {
        return {
          label: 'En Mesa',
          color: '#ffedd5',
          textColor: '#c2410c',
          dot: '#ea580c',
          badgeBg: '#fed7aa',
          order: activeOrder
        };
      }
    }

    // 5. Mesa ocupada en la base de datos sin orden abierta aún
    const tblObj = tables.find(t => String(t.number) === String(tblNumber));
    if (tblObj && tblObj.status === 'occupied') {
      return {
        label: 'Ocupada',
        color: '#ffedd5',
        textColor: '#c2410c',
        dot: '#ea580c',
        badgeBg: '#fed7aa',
        order: null
      };
    }

    // 6. Libre / Disponible (Verde esmeralda suave)
    return {
      label: 'Libre',
      color: '#dcfce7',
      textColor: '#166534',
      dot: '#10b981',
      badgeBg: '#bbf7d0',
      order: null
    };
  };

  // Filtrado de mesas en el plano visual (Estado, Zona, Capacidad y Búsqueda)
  const filteredTablesList = useMemo(() => {
    return tables.filter(t => {
      const tblNum = String(t.number);
      const statusInfo = getTableLiveStatus(tblNum);
      const activeOrder = statusInfo.order;

      // Búsqueda por número de mesa, nombre de cliente o nombre de mesero
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase().trim();
        const matchNum = tblNum.includes(query);
        const matchCust = activeOrder?.customer_name && activeOrder.customer_name.toLowerCase().includes(query);
        const matchLoc = t.location && t.location.toLowerCase().includes(query);
        if (!matchNum && !matchCust && !matchLoc) return false;
      }

      // Filtro por Zona / Ubicación
      if (tableZoneFilter !== 'all') {
        const loc = (t.location || 'Salón Principal').toLowerCase();
        if (tableZoneFilter === 'salon' && (!loc.includes('salón') && !loc.includes('salon'))) return false;
        if (tableZoneFilter === 'barra' && (!loc.includes('barra') && !loc.includes('counter'))) return false;
        if (tableZoneFilter === 'terraza' && (!loc.includes('terraza') && !loc.includes('patio') && !loc.includes('afuera'))) return false;
      }

      // Filtro por Capacidad de Comensales
      const cap = Number(t.capacity || 2);
      if (tableCapacityFilter === '2' && cap > 2) return false;
      if (tableCapacityFilter === '4' && (cap < 3 || cap > 4)) return false;
      if (tableCapacityFilter === '6+' && cap < 5) return false;

      // Filtro por Estado
      if (tableFilter === 'free') return statusInfo.label === 'Libre';
      if (tableFilter === 'occupied') return statusInfo.label !== 'Libre';
      if (tableFilter === 'kitchen') return statusInfo.label === 'En Cocina' || statusInfo.label === 'Nueva Orden';
      if (tableFilter === 'ready') return statusInfo.label === 'Lista para Servir';
      return true;
    });
  }, [tables, orders, tableFilter, tableSearchQuery, tableZoneFilter, tableCapacityFilter]);

  // Métricas del plano de mesas
  const tableMetrics = useMemo(() => {
    let libres = 0;
    let ocupadas = 0;
    let cocina = 0;
    let listas = 0;

    tables.forEach(t => {
      const statusInfo = getTableLiveStatus(String(t.number));
      if (statusInfo.label === 'Libre') libres++;
      else ocupadas++;

      if (statusInfo.label === 'En Cocina' || statusInfo.label === 'Nueva Orden') cocina++;
      if (statusInfo.label === 'Lista para Servir') listas++;
    });

    return { total: tables.length, libres, ocupadas, cocina, listas };
  }, [tables, orders]);

  // Filtrado de platos del catálogo (priorizando imágenes v2 de Supabase)
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

  // Manejadores de Modalidad
  const handleSelectServiceMode = (mode) => {
    triggerHaptic(8);
    setServiceMode(mode);
    if (mode === 'salon') {
      setDeliveryEnabled(false);
      setSalonView('tables');
    } else if (mode === 'llevar') {
      setSelectedTable('Llevar');
      setDeliveryEnabled(false);
      setSalonView('order');
    } else if (mode === 'delivery') {
      setSelectedTable('Delivery');
      setDeliveryEnabled(true);
      setSalonView('order');
    }
  };

  // Abrir Mesa Libre (Paso 1 del flujo salón: Elegir comensales y mesero)
  const handleStartOpenFreeTable = (tbl) => {
    triggerHaptic(8);
    setOpeningTableData({
      tableNumber: String(tbl.number),
      tableObj: tbl
    });
    setDinersCount(tbl.capacity || 2);
  };

  // Confirmar Apertura de Mesa Libre y Pasar a Comandar Platos
  const handleConfirmOpenTable = async () => {
    if (!openingTableData) return;
    triggerHaptic(10);
    const tblNumber = openingTableData.tableNumber;
    setSelectedTable(tblNumber);
    setSalonView('order');
    setPosItems([]);
    setOrderNotes('');
    setOpeningTableData(null);
  };

  // Abrir Mesa Ocupada para Agregar Más Platos a la Cuenta Activa Existente
  const handleOpenOccupiedTableToAppend = (tblNumber, activeOrder) => {
    triggerHaptic(10);
    setSelectedTable(String(tblNumber));
    if (activeOrder?.customer_name) {
      setCustomerName(activeOrder.customer_name);
    }
    if (activeOrder?.customer_phone) {
      setCustomerPhone(activeOrder.customer_phone);
    }
    if (activeOrder?.waiter_id) {
      setSelectedWaiterId(activeOrder.waiter_id);
    }
    setPosItems([]); // Comienza limpio para nuevos platos extras
    setOrderNotes('');
    setSalonView('order');
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
      setCustomerName('Walk-in Guest');
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
        customer_name: customerName || 'Walk-in Customer',
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
        diner_count: dinersCount,
        payment_method: 'efectivo',
        notes: orderNotes ? `[${dinersCount} Comensales] ${orderNotes}` : `[${dinersCount} Comensales]`
      }, posItems);

      // Ocupar la mesa si aplica en salón
      if (tableObj && serviceMode === 'salon') {
        await tablesService.occupyTable(tableObj.id, customerName);
      }

      await showAlert({
        title: '¡Comanda Enviada a Cocina!',
        message: `El pedido #${newOrder.order_number || ''} para Mesa ${selectedTable} ha sido recibido en cocina y sincronizado en vivo.`,
        type: 'success'
      });

      if (onOrderCreated) onOrderCreated(newOrder);
      if (onRefreshData) onRefreshData();

      // Vaciar carrito y volver al plano de mesas si es salón
      setPosItems([]);
      setOrderNotes('');
      if (serviceMode === 'salon') {
        setSalonView('tables');
      }
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

  // 2. Acción: Unificar y Añadir a la orden activa de la mesa (evita duplicar tickets de la misma mesa)
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
        notes: activeTableOrder.notes ? `${activeTableOrder.notes}. [Extra]: ${orderNotes}`.trim() : orderNotes
      }, combinedItems);

      await showAlert({
        title: '¡Platos Añadidos a la Cuenta!',
        message: `Se agregaron ${posItems.length} platos al pedido activo #${activeTableOrder.order_number} de Mesa ${selectedTable}. Cuenta unificada con éxito en cocina.`,
        type: 'success'
      });

      if (onOrderUpdated) onOrderUpdated(updated);
      if (onRefreshData) onRefreshData();

      setPosItems([]);
      setOrderNotes('');
      setSalonView('tables');
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

  // 3. Acción: Abrir Factura / Pre-cuenta para Imprimir
  const handleOpenPrintPreview = (customOrder = null) => {
    const orderToPrint = customOrder || activeTableOrder;
    const items = posItems.length > 0 
      ? posItems.map(it => ({
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          notes: it.notes
        }))
      : (orderToPrint?.order_items || []).map(it => ({
          name: it.dish_name || it.name,
          quantity: it.quantity,
          unit_price: it.dish_price || it.unit_price,
          notes: it.notes
        }));

    if (items.length === 0) {
      showAlert({
        title: 'Comanda Vacía',
        message: 'No hay productos para generar el ticket de pre-cuenta.',
        type: 'warning'
      });
      return;
    }

    const waiterObj = waiters.find(w => w.id === selectedWaiterId) || currentWaiter;

    setPrintModalData({
      invoice_number: `POS-${Date.now().toString().slice(-6)}`,
      customer_name: orderToPrint?.customer_name || customerName,
      customer_phone: orderToPrint?.customer_phone || customerPhone,
      table_number: orderToPrint?.table_number || selectedTable,
      waiter_name: waiterObj?.name || 'Servicio de Sala',
      payment_method: 'efectivo',
      tax_enabled: taxEnabled,
      tax_rate: taxRate,
      delivery_enabled: deliveryEnabled,
      delivery_amount: deliveryAmount,
      tip_enabled: tipEnabled,
      tip_amount: tipAmount,
      notes: orderNotes || orderToPrint?.notes || '',
      items
    });
    setPrintModalOpen(true);
  };

  // 4. Acción: Cobrar y Cerrar Mesa
  const handleChargeAndClose = async (targetTableNumber = null) => {
    const tblToClose = String(targetTableNumber || selectedTable);
    const targetOrder = getTableActiveOrder(tblToClose) || activeTableOrder;

    const itemsToCharge = posItems.length > 0 
      ? posItems 
      : (targetOrder?.order_items || []).map(it => ({
          dish_id: it.dish_id,
          name: it.dish_name || it.name,
          quantity: Number(it.quantity || 1),
          unit_price: Number(it.dish_price || it.unit_price || 0),
          notes: it.notes || ''
        }));

    if (itemsToCharge.length === 0) {
      await showAlert({
        title: 'Comanda Vacía',
        message: 'No hay ítems para cobrar en esta mesa.',
        type: 'warning'
      });
      return;
    }

    const chargeSubtotal = itemsToCharge.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
    const chargeTotal = Number(chargeSubtotal.toFixed(2));

    const confirmed = await showConfirm({
      title: '¿Cobrar y Liberar Mesa?',
      message: `Se registrará la factura por $${chargeTotal.toFixed(2)} USD y se liberará la Mesa ${tblToClose}.`,
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
        customer_name: targetOrder?.customer_name || customerName,
        customer_phone: targetOrder?.customer_phone || customerPhone,
        table_number: tblToClose,
        waiter_id: selectedWaiterId || targetOrder?.waiter_id || null,
        waiter_name: waiterObj?.name || 'Servicio de Sala',
        subtotal: chargeSubtotal,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: deliveryFee,
        tip_enabled: tipEnabled,
        tip_amount: tipAmount,
        total_amount: chargeTotal,
        payment_method: 'efectivo',
        payment_status: 'paid',
        notes: orderNotes
      }, itemsToCharge);

      // Si había una orden activa, marcarla como pagada y completada
      if (targetOrder?.id) {
        await ordersService.updateOrderStatus(targetOrder.id, 'completed');
        await ordersService.markOrderPaid(targetOrder.id, true, 'efectivo');
      }

      // Si la mesa existe, liberarla
      const tableObj = tables.find(t => String(t.number) === tblToClose);
      if (tableObj) {
        await tablesService.closeTable(tableObj.id, tblToClose);
      }

      await showAlert({
        title: '¡Cobro Exitoso!',
        message: `Factura ${nextInvNum} registrada por $${chargeTotal.toFixed(2)} USD. Mesa ${tblToClose} liberada.`,
        type: 'success'
      });

      if (onRefreshData) onRefreshData();
      setPosItems([]);
      setOrderNotes('');
      if (serviceMode === 'salon') {
        setSalonView('tables');
      }
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
      {/* 1. BARRA SUPERIOR: SELECTOR DE MODALIDAD DEL RESTAURANTE */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)' }}>
              Terminal Punto de Venta (TPV / POS)
            </span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c' }}>
              Sistema de Pedidos & Mesas
            </h2>
          </div>

          {/* Selector de Mesero de Turno */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#78716c' }}>Atiende:</span>
            <CustomSelect
              value={selectedWaiterId}
              onChange={(val) => setSelectedWaiterId(val)}
              options={[
                { value: '', label: 'Seleccionar Mesero...' },
                ...waiters.map(w => ({ value: w.id, label: `${w.name} (${w.role || 'Mesero'})` }))
              ]}
              width="210px"
              placeholder="Seleccionar Mesero..."
              buttonStyle={{
                padding: '0.5rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800
              }}
            />
          </div>
        </div>

        {/* Pestañas de Modalidad de Servicio (Salón, Para Llevar, Delivery) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => handleSelectServiceMode('salon')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              backgroundColor: serviceMode === 'salon' ? 'var(--rojo, #d91c2b)' : '#fbf7ee',
              color: serviceMode === 'salon' ? '#ffffff' : '#1f1e1c',
              fontWeight: 900,
              fontSize: '0.9rem',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: serviceMode === 'salon' ? '0 6px 18px rgba(217, 28, 43, 0.28)' : '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
          >
            <Utensils size={18} />
            <span>Salón (Mesas)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectServiceMode('llevar')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              backgroundColor: serviceMode === 'llevar' ? 'var(--rojo, #d91c2b)' : '#fbf7ee',
              color: serviceMode === 'llevar' ? '#ffffff' : '#1f1e1c',
              fontWeight: 900,
              fontSize: '0.9rem',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: serviceMode === 'llevar' ? '0 6px 18px rgba(217, 28, 43, 0.28)' : '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={18} />
            <span>Para Llevar (Takeout)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectServiceMode('delivery')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              backgroundColor: serviceMode === 'delivery' ? 'var(--rojo, #d91c2b)' : '#fbf7ee',
              color: serviceMode === 'delivery' ? '#ffffff' : '#1f1e1c',
              fontWeight: 900,
              fontSize: '0.9rem',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: serviceMode === 'delivery' ? '0 6px 18px rgba(217, 28, 43, 0.28)' : '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease'
            }}
          >
            <Truck size={18} />
            <span>Delivery (A Domicilio)</span>
          </button>
        </div>
      </div>

      {/* Regla CSS interna para evitar desbordamiento y animar pulso */}
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.35); }
        }
        .pos-responsive-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(330px, 440px);
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

      {/* 2. VISTA SALÓN A: PLANO VISUAL DE MESAS (CARDS GRID) */}
      {serviceMode === 'salon' && salonView === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Barra de Filtros y Búsqueda del Plano de Mesas */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1f1e1c' }}>
                  Plano de Mesas · Selección Visual
                </span>
                <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>
                  (Toca una mesa libre para abrir comanda, o una ocupada para sumar platos o cobrar)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#78716c" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Buscar mesa #"
                    style={{
                      padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#1f1e1c',
                      outline: 'none',
                      width: '130px'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    if (onRefreshData) onRefreshData();
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Refrescar estado en tiempo real de mesas"
                >
                  <RefreshCw size={13} />
                  <span>Refrescar</span>
                </button>
              </div>
            </div>

            {/* Píldoras de Filtro Rápido con Contadores */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              <button
                type="button"
                onClick={() => setTableFilter('all')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: tableFilter === 'all' ? '#1f1e1c' : '#f5efe4',
                  color: tableFilter === 'all' ? '#ffffff' : '#1f1e1c',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Todas ({tableMetrics.total})
              </button>

              <button
                type="button"
                onClick={() => setTableFilter('free')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: tableFilter === 'free' ? '#166534' : '#dcfce7',
                  color: tableFilter === 'free' ? '#ffffff' : '#166534',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Libres ({tableMetrics.libres})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableFilter('occupied')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: tableFilter === 'occupied' ? '#c2410c' : '#ffedd5',
                  color: tableFilter === 'occupied' ? '#ffffff' : '#c2410c',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
                <span>Ocupadas ({tableMetrics.ocupadas})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableFilter('kitchen')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: tableFilter === 'kitchen' ? '#1e40af' : '#dbeafe',
                  color: tableFilter === 'kitchen' ? '#ffffff' : '#1e40af',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span>En Cocina ({tableMetrics.cocina})</span>
              </button>

              <button
                type="button"
                onClick={() => setTableFilter('ready')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: tableFilter === 'ready' ? '#6d28d9' : '#ede9fe',
                  color: tableFilter === 'ready' ? '#ffffff' : '#6d28d9',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none !important',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                <span>Listas para Servir ({tableMetrics.listas})</span>
              </button>
            </div>

            {/* Fila 2: Filtros de Zona / Sector y Capacidad */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', borderTop: 'none', paddingTop: '0.4rem' }}>
              {/* Filtro por Zona */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.3px', marginRight: '0.2rem' }}>
                  Zona:
                </span>
                {[
                  { id: 'all', label: 'Todas las Zonas' },
                  { id: 'salon', label: 'Salón Principal' },
                  { id: 'barra', label: 'Barra / Counter' },
                  { id: 'terraza', label: 'Terraza' }
                ].map(z => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(5);
                      setTableZoneFilter(z.id);
                    }}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: tableZoneFilter === z.id ? '#1f1e1c' : '#f5efe4',
                      color: tableZoneFilter === z.id ? '#ffffff' : '#44403c',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {z.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Capacidad */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.3px', marginRight: '0.2rem' }}>
                  Capacidad:
                </span>
                {[
                  { id: 'all', label: 'Todas' },
                  { id: '2', label: '2 pax' },
                  { id: '4', label: '4 pax' },
                  { id: '6+', label: '6+ pax' }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(5);
                      setTableCapacityFilter(c.id);
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      backgroundColor: tableCapacityFilter === c.id ? '#c2410c' : '#f5efe4',
                      color: tableCapacityFilter === c.id ? '#ffffff' : '#44403c',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      border: 'none !important',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRID DE CARDS VISUALES DE TODAS LAS MESAS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredTablesList.map(tbl => {
              const tblNumber = String(tbl.number);
              const statusInfo = getTableLiveStatus(tblNumber);
              const activeOrder = statusInfo.order;
              const isFree = statusInfo.label === 'Libre';

              return (
                <div
                  key={tbl.id || tblNumber}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    padding: '1.25rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {/* Franja superior de fase */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '5px',
                      backgroundColor: statusInfo.dot
                    }}
                  />

                  {/* Cabecera de la Card de Mesa */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: '#78716c' }}>
                          Salón Principal
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1f1e1c', lineHeight: 1.15 }}>
                          Mesa {tblNumber}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontSize: '0.74rem', color: '#78716c', fontWeight: 700 }}>
                          <Users size={13} />
                          <span>Capacidad: {tbl.capacity || 4} comensales</span>
                        </div>
                      </div>

                      {/* Badge de Estado con Dot Pulsante */}
                      <div
                        style={{
                          backgroundColor: statusInfo.color,
                          color: statusInfo.textColor,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusInfo.dot,
                            animation: statusInfo.isPulsing ? 'statusPulse 1.5s infinite' : 'none'
                          }}
                        />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Contenido Contextual Dependiendo si está Libre u Ocupada */}
                    {isFree ? (
                      <div
                        style={{
                          backgroundColor: '#fbf9f4',
                          borderRadius: '16px',
                          padding: '1rem',
                          marginTop: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          color: '#166534'
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: '#dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Utensils size={18} color="#166534" />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.84rem', display: 'block', color: '#166534' }}>
                            Mesa Disponible
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
                            Lista para abrir cuenta y comandar
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: '#faf7f2',
                          borderRadius: '16px',
                          padding: '0.85rem',
                          marginTop: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 800, color: '#1f1e1c', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} color="var(--rojo, #d91c2b)" />
                            <span>{activeOrder?.customer_name || 'Comensales en Sala'}</span>
                          </span>
                          <span style={{ fontWeight: 900, color: 'var(--rojo, #d91c2b)', fontSize: '0.92rem' }}>
                            ${Number(activeOrder?.total_amount || 0).toFixed(2)} USD
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#78716c' }}>
                          <span>
                            Pedido: #{activeOrder?.order_number || activeOrder?.id?.slice(0, 5) || 'Activo'}
                          </span>
                          <span>
                            {(activeOrder?.order_items || []).length} platos en cuenta
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de la Tarjeta de Mesa */}
                  <div>
                    {isFree ? (
                      <button
                        type="button"
                        onClick={() => handleStartOpenFreeTable(tbl)}
                        style={{
                          width: '100%',
                          padding: '0.8rem',
                          borderRadius: '14px',
                          backgroundColor: 'var(--rojo, #d91c2b)',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.88rem',
                          border: 'none !important',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 6px 18px rgba(217, 28, 43, 0.25)',
                          transition: 'opacity 0.15s ease'
                        }}
                      >
                        <Plus size={16} />
                        <span>Abrir Mesa & Comandar</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {/* Botón Principal: Agregar más platos a la cuenta existente */}
                        <button
                          type="button"
                          onClick={() => handleOpenOccupiedTableToAppend(tblNumber, activeOrder)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '12px',
                            backgroundColor: '#1f1e1c',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '0.82rem',
                            border: 'none !important',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Plus size={15} />
                          <span>+ Agregar más platos a esta cuenta</span>
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPrintPreview(activeOrder)}
                            style={{
                              padding: '0.55rem',
                              borderRadius: '10px',
                              backgroundColor: '#f5efe4',
                              color: '#1f1e1c',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              border: 'none !important',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Printer size={13} />
                            <span>Pre-cuenta</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChargeAndClose(tblNumber)}
                            style={{
                              padding: '0.55rem',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(217, 28, 43, 0.1)',
                              color: 'var(--rojo, #d91c2b)',
                              fontWeight: 900,
                              fontSize: '0.75rem',
                              border: 'none !important',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <CreditCard size={13} />
                            <span>Cobrar y Liberar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VISTA SALÓN B / LLEVAR / DELIVERY: CATÁLOGO DE PLATOS & COMANDA */}
      {(serviceMode !== 'salon' || salonView === 'order') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Barra de Control de la Mesa Seleccionada */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.15rem 1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {serviceMode === 'salon' && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setSalonView('tables');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Volver al Plano de Mesas</span>
                </button>
              )}

              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)' }}>
                  {serviceMode === 'salon' 
                    ? `Comandando en Mesa ${selectedTable}` 
                    : serviceMode === 'llevar' 
                    ? 'Pedido Para Llevar (Takeout)' 
                    : 'Pedido Delivery (Entrega a Domicilio)'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c' }}>
                  {serviceMode === 'salon' ? `Mesa ${selectedTable}` : customerName}
                </h3>
              </div>
            </div>

            {/* Banner de Mesa Ocupada Existente */}
            {activeTableOrder && serviceMode === 'salon' && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706', animation: 'statusPulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>
                  Cuenta Activa #{activeTableOrder.order_number} · Acumulado: ${Number(activeTableOrder.total_amount || 0).toFixed(2)} USD
                </span>
              </div>
            )}
          </div>

          {/* GRID CENTRAL: CATÁLOGO DE PLATOS (IZQUIERDA) Y COMANDA (DERECHA) */}
          <div className="pos-responsive-grid">
            {/* PANEL IZQUIERDO: CATÁLOGO DE PLATOS OFICIALES V2 */}
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
                    placeholder="Buscar plato en la carta oficial..."
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

              {/* Grid de Platos Seleccionables con Imágenes v2 Supabase Storage */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                  gap: '0.75rem',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}
              >
                {filteredDishes.map(dish => {
                  const dishImg = dish.platos_image || dish.image_url;

                  return (
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
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        transition: 'transform 0.12s ease'
                      }}
                    >
                      {/* Imagen v2 oficial o Fallback SVG elegante */}
                      <div
                        style={{
                          width: '100%',
                          height: '92px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          backgroundColor: '#f0ece1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {dishImg ? (
                          <img
                            src={dishImg}
                            alt={dish.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: dishImg ? 'none' : 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#a8a29e'
                          }}
                        >
                          <Utensils size={24} />
                        </div>
                      </div>

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
                  );
                })}
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
                    Comanda de Servicio
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                    {serviceMode === 'salon' ? `Mesa ${selectedTable}` : serviceMode === 'llevar' ? 'Para Llevar' : 'Delivery'}
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
                    Vaciar Nuevos
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
                    Walk-in Customer
                  </button>
                </div>

                <CustomSelect
                  value={selectedCustomerId || ''}
                  onChange={(val) => {
                    const found = customersList.find(c => c.id === val);
                    handleSelectCustomer(found || null);
                  }}
                  options={[
                    { value: '', label: 'Walk-in Customer (Por Defecto)' },
                    ...customersList.map(c => ({
                      value: c.id,
                      label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`
                    }))
                  ]}
                  placeholder="Walk-in Customer (Por Defecto)"
                  buttonStyle={{
                    backgroundColor: '#ffffff',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem'
                  }}
                />

                {/* Si es Delivery o Para Llevar, campos de contacto */}
                {serviceMode !== 'salon' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <input
                      type="text"
                      placeholder="Nombre del Cliente..."
                      value={customerName === 'Walk-in Customer' ? '' : customerName}
                      onChange={(e) => setCustomerName(e.target.value || 'Walk-in Customer')}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: 'none !important',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#1f1e1c',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono de contacto..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: 'none !important',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#1f1e1c',
                        outline: 'none'
                      }}
                    />
                    {serviceMode === 'delivery' && (
                      <input
                        type="text"
                        placeholder="Dirección exacta de entrega..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          border: 'none !important',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#1f1e1c',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* SECCIÓN 1: SI LA MESA YA TIENE CUENTA ACTIVA, MOSTRAR SUS PLATOS PREVIOS */}
              {activeTableOrder && serviceMode === 'salon' && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    borderRadius: '14px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#92400e' }}>
                      Platos Ya en Marcha ({(activeTableOrder.order_items || []).length})
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#b45309' }}>
                      ${Number(activeTableOrder.total_amount || 0).toFixed(2)} USD
                    </span>
                  </div>

                  <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {(activeTableOrder.order_items || []).map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#78350f' }}>
                        <span>{it.quantity}x {it.dish_name || it.name}</span>
                        <span style={{ fontWeight: 700 }}>${(Number(it.quantity) * Number(it.dish_price || it.unit_price || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: NUEVOS PLATOS EN LA COMANDA ACTUAL */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#78716c', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  {activeTableOrder && serviceMode === 'salon' ? 'Nuevos Platos a Sumar (+)' : 'Platos a Comandar'}
                </span>

                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    paddingRight: '0.2rem'
                  }}
                >
                  {posItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#a8a29e' }}>
                      <Utensils size={24} style={{ margin: '0 auto 0.4rem auto' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>
                        Ningún plato nuevo seleccionado
                      </span>
                      <span style={{ fontSize: '0.7rem' }}>
                        Haz clic en los platos del catálogo para agregarlos
                      </span>
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
              </div>

              {/* Toggles de Facturación en POS (Tax, Envío, Propina) - DEFAULT OFF */}
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

              {/* Resumen Total de la Comanda en Curso */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#78716c' }}>
                  <span>Subtotal Nuevos:</span>
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
                  <span>TOTAL NUEVOS:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Botones de Acción del POS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Si la mesa tiene cuenta activa, botón principal es unificar y enviar extras a cocina */}
                {activeTableOrder && serviceMode === 'salon' ? (
                  <button
                    type="button"
                    disabled={isProcessing || posItems.length === 0}
                    onClick={handleAppendToActiveOrder}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '14px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.92rem',
                      border: 'none !important',
                      cursor: posItems.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: posItems.length === 0 ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 6px 18px rgba(217, 119, 6, 0.28)'
                    }}
                  >
                    <Plus size={18} />
                    <span>+ Marchar Nuevos Platos a Cuenta #{activeTableOrder.order_number}</span>
                  </button>
                ) : (
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
                      cursor: posItems.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: posItems.length === 0 ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 6px 18px rgba(217, 28, 43, 0.3)'
                    }}
                  >
                    <Send size={17} />
                    <span>Enviar a Cocina</span>
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenPrintPreview()}
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
                    onClick={() => handleChargeAndClose()}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      border: 'none !important',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <CreditCard size={15} />
                    <span>Cobrar y Liberar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ABRIR MESA LIBRE (ASIGNAR MESERO Y COMENSALES) */}
      {openingTableData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setOpeningTableData(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)' }}>
                  Apertura de Mesa
                </span>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1f1e1c' }}>
                  Abrir Cuenta · Mesa {openingTableData.tableNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpeningTableData(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#78716c" />
              </button>
            </div>

            {/* Número de Comensales - No limitado a 6, con input numérico y presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#78716c' }}>
                  Número de Comensales:
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                  {dinersCount} {dinersCount === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              {/* Stepper y Entrada Numérica Directa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f5efe4', padding: '0.4rem 0.65rem', borderRadius: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setDinersCount(prev => Math.max(1, prev - 1));
                  }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    color: '#1f1e1c',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                  title="Restar comensal"
                >
                  -
                </button>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={dinersCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDinersCount(isNaN(val) ? 1 : Math.max(1, Math.min(99, val)));
                    }}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: 'var(--rojo, #d91c2b)',
                      backgroundColor: 'transparent',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#78716c' }}>comensales</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setDinersCount(prev => Math.min(99, prev + 1));
                  }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    color: '#1f1e1c',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                  title="Sumar comensal"
                >
                  +
                </button>
              </div>

              {/* Píldoras Rápidas de Comensales Habituales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.3rem' }}>
                {[1, 2, 3, 4, 6, 8, 10, 12].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setDinersCount(num);
                    }}
                    style={{
                      padding: '0.55rem 0',
                      borderRadius: '10px',
                      backgroundColor: dinersCount === num ? 'var(--rojo, #d91c2b)' : '#f5efe4',
                      color: dinersCount === num ? '#ffffff' : '#1f1e1c',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      border: 'none !important',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Mesero Asignado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#78716c' }}>
                Mesero Responsable de la Mesa:
              </label>
              <CustomSelect
                value={selectedWaiterId}
                onChange={(val) => setSelectedWaiterId(val)}
                options={[
                  { value: '', label: 'Seleccionar Mesero...' },
                  ...waiters.map(w => ({ value: w.id, label: `${w.name} (${w.role || 'Mesero'})` }))
                ]}
                placeholder="Seleccionar Mesero..."
              />
            </div>

            {/* Cliente (Opcional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#78716c' }}>
                Nombre del Cliente o Referencia (Opcional):
              </label>
              <input
                type="text"
                value={customerName === 'Walk-in Customer' ? '' : customerName}
                onChange={(e) => setCustomerName(e.target.value || 'Walk-in Customer')}
                placeholder="Ej: Familia López o Walk-in Customer"
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmOpenTable}
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
              <span>Abrir Mesa y Elegir Platos</span>
              <Utensils size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: AGREGAR PLATO MANUAL FUERA DE CARTA */}
      {showManualItemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowManualItemModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)' }}>
                  Producto Extra
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1f1e1c' }}>
                  Plato Fuera de Carta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualItemModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#78716c" />
              </button>
            </div>

            <form onSubmit={handleAddManualItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                  Nombre del Producto o Sugerencia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Porción adicional de salsa..."
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>
                    Precio USD ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
                Agregar a la Comanda
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
