import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, X, Check, DollarSign, Percent, Truck, 
  Receipt, ChefHat, FileText, Settings, Copy, Share2, CreditCard
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

export function InvoicePrintModal(props) {
  // Wrapper: monta el contenido (con todos sus hooks) solo cuando el modal está abierto.
  if (!props.isOpen) return null;
  return <InvoicePrintModalContent {...props} />;
}

function InvoicePrintModalContent({
  isOpen,
  onClose,
  initialData = null,
  onSaveInvoice = null
}) {

  // Formatos: 'thermal80' (80mm), 'thermal58' (58mm), 'formal' (Letter/A4), 'kitchen' (Comanda Cocina)
  const [template, setTemplate] = useState('thermal80');

  // Datos base
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoice_number || `INV-${Date.now().toString().slice(-6)}`
  );
  const [customerName, setCustomerName] = useState(
    initialData?.customer_name || 'Walk-in Customer'
  );
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customer_address || '');
  const [tableNumber, setTableNumber] = useState(initialData?.table_number || 'Barra / Llevar');
  const [waiterName, setWaiterName] = useState(initialData?.waiter_name || 'Servicio de Sala');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'efectivo');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [items, setItems] = useState(
    initialData?.items && initialData.items.length > 0 
      ? initialData.items.map(it => ({
          ...it,
          name: it.dishName || it.dish_name || it.name || 'Plato',
          unit_price: Number(it.dishPrice || it.dish_price || it.unit_price || it.price || 0)
        }))
      : [{ name: 'Consumo General', quantity: 1, unit_price: 0, subtotal: 0 }]
  );

  // REGLA: Toggles de Impuesto, Envío, Tarjeta y Propina
  const [taxEnabled, setTaxEnabled] = useState(
    initialData?.tax_enabled ?? (Number(initialData?.tax_amount) > 0)
  );
  const [taxRate, setTaxRate] = useState(initialData?.tax_rate ?? 6.625); // New Jersey Sales Tax estándar

  const [deliveryEnabled, setDeliveryEnabled] = useState(initialData?.delivery_enabled ?? false);
  const [deliveryAmount, setDeliveryAmount] = useState(initialData?.delivery_amount ?? 5.00);

  const [cardFeeEnabled, setCardFeeEnabled] = useState(
    (Number(initialData?.card_fee_amount) > 0) || (initialData?.payment_method === 'tarjeta')
  );

  const [tipEnabled, setTipEnabled] = useState(
    initialData?.tip_enabled ?? (Number(initialData?.tip_amount) > 0)
  );
  const [tipType, setTipType] = useState('percent'); // 'percent' | 'fixed'
  const [tipPercent, setTipPercent] = useState(16); // 16% gratuity estándar
  const [tipFixedAmount, setTipFixedAmount] = useState(initialData?.tip_amount ?? 5.00);

  // Cálculos matemáticos en vivo
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_price || 0)), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    return Number(((subtotal * Number(taxRate || 0)) / 100).toFixed(2));
  }, [subtotal, taxEnabled, taxRate]);

  const cardFeeAmount = useMemo(() => {
    if (!cardFeeEnabled) return 0;
    return Number(((subtotal * 0.04)).toFixed(2));
  }, [subtotal, cardFeeEnabled]);

  const deliveryFee = useMemo(() => {
    if (!deliveryEnabled) return 0;
    return Number(Number(deliveryAmount || 0).toFixed(2));
  }, [deliveryEnabled, deliveryAmount]);

  const tipAmount = useMemo(() => {
    if (!tipEnabled) return 0;
    if (tipType === 'percent') {
      return Number(((subtotal * Number(tipPercent || 0)) / 100).toFixed(2));
    }
    return Number(Number(tipFixedAmount || 0).toFixed(2));
  }, [subtotal, tipEnabled, tipType, tipPercent, tipFixedAmount]);

  const totalAmount = useMemo(() => {
    return Number((subtotal + taxAmount + cardFeeAmount + deliveryFee + tipAmount).toFixed(2));
  }, [subtotal, taxAmount, cardFeeAmount, deliveryFee, tipAmount]);

  const currentDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Función de impresión con soporte CSS directo
  const handlePrint = () => {
    triggerHaptic(12);

    if (onSaveInvoice) {
      onSaveInvoice({
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: tableNumber,
        waiter_name: waiterName,
        payment_method: paymentMethod,
        subtotal,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        card_fee_amount: cardFeeAmount,
        delivery_enabled: deliveryEnabled,
        delivery_amount: deliveryFee,
        tip_enabled: tipEnabled,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        notes,
        items
      }).catch(err => console.error('Error guardando factura:', err));
    }

    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Estilos específicos de impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-area, #printable-invoice-area * {
            visibility: visible !important;
          }
          #printable-invoice-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${template === 'thermal80' ? '76mm' : template === 'thermal58' ? '54mm' : '100%'} !important;
            margin: 0 !important;
            padding: ${template === 'thermal58' ? '3mm' : template === 'thermal80' ? '5mm' : '15mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: ${template === 'thermal80' ? '80mm auto' : template === 'thermal58' ? '58mm auto' : 'auto'};
          }
        }
      `}</style>

      <div
        className="no-print-card"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
          border: 'none !important',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                Centro de Facturación & Tickets
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#78716c' }}>
                Estándar USA · Impresoras Térmicas 80mm / 58mm & Factura Formal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: '#f5efe4',
              color: '#78716c',
              border: 'none !important',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con 2 Columnas: Controles a la Izquierda, Preview a la Derecha */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) 1fr',
            overflow: 'hidden',
            backgroundColor: '#faf7f2'
          }}
        >
          {/* Columna Izquierda: Configuración de Impuestos, Envío, Propina y Plantilla */}
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* 1. Selector de Plantilla */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.5rem' }}>
                Seleccionar Plantilla de Impresión
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'thermal80', label: 'Térmico 80mm', icon: Printer, desc: 'POS Estándar' },
                  { id: 'thermal58', label: 'Térmico 58mm', icon: Receipt, desc: 'Mini Portátil' },
                  { id: 'formal', label: 'Factura Formal', icon: FileText, desc: 'Carta / A4' },
                  { id: 'kitchen', label: 'Comanda Cocina', icon: ChefHat, desc: 'Ticket KOT' }
                ].map(t => {
                  const Icon = t.icon;
                  const active = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setTemplate(t.id);
                      }}
                      style={{
                        padding: '0.75rem 0.65rem',
                        borderRadius: '14px',
                        backgroundColor: active ? '#1f1e1c' : '#ffffff',
                        color: active ? '#ffffff' : '#1f1e1c',
                        border: 'none !important',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: active 
                          ? '0 8px 20px rgba(0,0,0,0.18)' 
                          : '0 4px 12px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <Icon size={16} color={active ? '#d91c2b' : '#78716c'} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{t.label}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: active ? '#a8a29e' : '#a8a29e', display: 'block' }}>
                        {t.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. REGLA: Toggles de Impuesto, Envío y Propina (DESACTIVADOS POR DEFECTO) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '1.15rem',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1f1e1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Ajustes Fiscales & Recargos (USA)
              </span>

              {/* TOGGLE 1: IMPUESTO A LAS VENTAS (TAX) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Percent size={16} color="#78716c" />
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f1e1c', display: 'block' }}>
                        Sales Tax (Impuesto)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#78716c' }}>
                        NJ Estándar 6.625%
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setTaxEnabled(!taxEnabled);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '14px',
                      backgroundColor: taxEnabled ? '#10b981' : '#e7e5e4',
                      border: 'none !important',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      padding: '2px'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: '#ffffff',
                        transform: taxEnabled ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                      }}
                    />
                  </button>
                </div>
                {taxEnabled && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>Tasa %:</span>
                    <input
                      type="number"
                      step="0.001"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '8px',
                        backgroundColor: '#f5efe4',
                        border: 'none !important',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#1f1e1c',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981', marginLeft: 'auto' }}>
                      +${taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* TOGGLE 2: RECARGO POR PAGO CON TARJETA (4%) */}
              <div style={{ paddingTop: '0.5rem', borderTop: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={16} color="#78716c" />
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f1e1c', display: 'block' }}>
                        Tarifa Tarjeta (4%)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#78716c' }}>
                        Procesamiento débito / crédito
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setCardFeeEnabled(!cardFeeEnabled);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '14px',
                      backgroundColor: cardFeeEnabled ? '#10b981' : '#e7e5e4',
                      border: 'none !important',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      padding: '2px'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: '#ffffff',
                        transform: cardFeeEnabled ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                      }}
                    />
                  </button>
                </div>
                {cardFeeEnabled && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
                      Cargo 4% sobre subtotal:
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                      +${cardFeeAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* TOGGLE 3: COSTO DE ENVÍO / DELIVERY */}
              <div style={{ paddingTop: '0.5rem', borderTop: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={16} color="#78716c" />
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f1e1c', display: 'block' }}>
                        Tarifa de Envío / Delivery
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#78716c' }}>
                        Entrega a domicilio en NJ
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setDeliveryEnabled(!deliveryEnabled);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '14px',
                      backgroundColor: deliveryEnabled ? '#10b981' : '#e7e5e4',
                      border: 'none !important',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      padding: '2px'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: '#ffffff',
                        transform: deliveryEnabled ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                      }}
                    />
                  </button>
                </div>
                {deliveryEnabled && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>Monto ($):</span>
                    <input
                      type="number"
                      step="0.5"
                      value={deliveryAmount}
                      onChange={(e) => setDeliveryAmount(Number(e.target.value))}
                      style={{
                        width: '80px',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '8px',
                        backgroundColor: '#f5efe4',
                        border: 'none !important',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#1f1e1c',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981', marginLeft: 'auto' }}>
                      +${deliveryFee.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* TOGGLE 4: PROPINA / GRATUITY */}
              <div style={{ paddingTop: '0.5rem', borderTop: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} color="#78716c" />
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f1e1c', display: 'block' }}>
                        Propina / Gratuity
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#78716c' }}>
                        16% sugerido (más de 2 personas)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setTipEnabled(!tipEnabled);
                    }}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '14px',
                      backgroundColor: tipEnabled ? '#10b981' : '#e7e5e4',
                      border: 'none !important',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                      padding: '2px'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: '#ffffff',
                        transform: tipEnabled ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                      }}
                    />
                  </button>
                </div>
                {tipEnabled && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[16, 18, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setTipType('percent');
                            setTipPercent(pct);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            borderRadius: '8px',
                            backgroundColor: tipType === 'percent' && tipPercent === pct ? 'var(--rojo, #d91c2b)' : '#f5efe4',
                            color: tipType === 'percent' && tipPercent === pct ? '#ffffff' : '#1f1e1c',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            border: 'none !important',
                            cursor: 'pointer'
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
                        Monto calculado:
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                        +${tipAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Datos del Cliente / Mesa */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '1.15rem',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1f1e1c', textTransform: 'uppercase' }}>
                  Datos del Documento
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setCustomerName('Walk-in Customer');
                  }}
                  style={{
                    backgroundColor: '#f5efe4',
                    color: '#78716c',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Walk-in Customer
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '10px',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                    Mesa / Orden
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      backgroundColor: '#f5efe4',
                      border: 'none !important',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#1f1e1c',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                    Método de Pago
                  </label>
                  <CustomSelect
                    value={paymentMethod}
                    onChange={(val) => {
                      setPaymentMethod(val);
                      if (val === 'tarjeta') {
                        setCardFeeEnabled(true);
                      }
                    }}
                    options={[
                      { value: 'efectivo', label: 'Efectivo ($ USD)' },
                      { value: 'tarjeta', label: 'Tarjeta Crédito / Débito (4%)' },
                      { value: 'zelle', label: 'Zelle / Transferencia' },
                      { value: 'apple_pay', label: 'Apple Pay / Contactless' }
                    ]}
                    buttonStyle={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Botón de Imprimir Principal */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '18px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1rem',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                boxShadow: '0 10px 25px rgba(217, 28, 43, 0.35)',
                marginTop: 'auto'
              }}
            >
              <Printer size={20} />
              <span>Imprimir Ticket ({template === 'thermal80' ? '80mm' : template === 'thermal58' ? '58mm' : template === 'formal' ? 'Carta' : 'Cocina'})</span>
            </button>
          </div>

          {/* Columna Derecha: Vista Previa Realista del Ticket / Factura */}
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              backgroundColor: '#e7e3da'
            }}
          >
            <div
              id="printable-invoice-area"
              style={{
                width: template === 'thermal80' 
                  ? '300px' 
                  : template === 'thermal58' 
                  ? '230px' 
                  : template === 'kitchen'
                  ? '320px'
                  : '100%',
                maxWidth: template === 'formal' ? '560px' : 'none',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: template === 'thermal58' ? '1.25rem 0.9rem' : '1.75rem 1.4rem',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
                color: '#111827',
                fontFamily: template === 'kitchen' 
                  ? 'monospace, Courier, sans-serif'
                  : template === 'formal'
                  ? 'var(--font-admin-primary, "Roboto", sans-serif)'
                  : '"Courier New", Courier, monospace',
                fontSize: template === 'thermal58' ? '11px' : '12px',
                lineHeight: 1.4,
                boxSizing: 'border-box'
              }}
            >
              {/* PLANTILLA 1: COMANDA DE COCINA (KOT) */}
              {template === 'kitchen' ? (
                <div>
                  <div style={{ textAlign: 'center', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>
                      *** COMANDA COCINA ***
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>
                      MESA: {tableNumber}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
                      {currentDateStr} · #{invoiceNumber}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, display: 'block' }}>
                      Mesero: {waiterName}
                    </span>
                  </div>

                  <div style={{ height: '2px', backgroundColor: '#000000', margin: '0.5rem 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '15px', fontWeight: 900 }}>
                            {it.quantity}x {it.name}
                          </span>
                          {it.notes && (
                            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#dc2626', marginLeft: '1rem' }}>
                              &gt;&gt; {it.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {notes && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, display: 'block' }}>NOTAS ESPECIALES:</span>
                      <span style={{ fontSize: '12px' }}>{notes}</span>
                    </div>
                  )}

                  <div style={{ height: '2px', backgroundColor: '#000000', margin: '0.85rem 0 0.5rem 0' }} />
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800 }}>
                    FIN DE COMANDA
                  </div>
                </div>
              ) : template === 'formal' ? (
                /* PLANTILLA 2: FACTURA FORMAL GUEST CHECK / CARTA */
                <div>
                  {/* Encabezado Formal */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#1f1e1c' }}>
                        MI BARRUNTO
                      </h2>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d91c2b', display: 'block' }}>
                        Cevichería & Cocina Peruana
                      </span>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                        21 Mill st, Paterson, NJ 07011<br />
                        Tel: (973) 653-3749 · info@mibarruntonj.com
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1f1e1c', display: 'block' }}>
                        GUEST CHECK
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b7280' }}>
                        {invoiceNumber}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>
                        {currentDateStr}
                      </span>
                    </div>
                  </div>

                  {/* Datos del Cliente y Mesa */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      padding: '0.85rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 700, display: 'block' }}>CLIENTE:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f1e1c' }}>{customerName}</span>
                      {customerPhone && <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Tel: {customerPhone}</span>}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 700, display: 'block' }}>UBICACIÓN / SERVICIO:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f1e1c' }}>Mesa: {tableNumber}</span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Mesero: {waiterName}</span>
                    </div>
                  </div>

                  {/* Tabla de Productos */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}>CANT</th>
                        <th style={{ padding: '0.5rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}>DESCRIPCIÓN</th>
                        <th style={{ padding: '0.5rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, textAlign: 'right' }}>PRECIO</th>
                        <th style={{ padding: '0.5rem 0.65rem', fontSize: '0.72rem', fontWeight: 800, textAlign: 'right' }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem', fontWeight: 800 }}>{it.quantity}</td>
                          <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 700, color: '#1f1e1c' }}>{it.name}</span>
                            {it.notes && <span style={{ display: 'block', fontSize: '0.68rem', color: '#6b7280' }}>{it.notes}</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem', textAlign: 'right' }}>${Number(it.unit_price).toFixed(2)}</td>
                          <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.78rem', fontWeight: 800, textAlign: 'right' }}>${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Resumen Total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#6b7280' }}>Subtotal:</span>
                        <span style={{ fontWeight: 800 }}>${subtotal.toFixed(2)}</span>
                      </div>

                      {taxEnabled && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#6b7280' }}>Sales Tax ({taxRate}%):</span>
                          <span style={{ fontWeight: 800 }}>${taxAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {cardFeeEnabled && cardFeeAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#6b7280' }}>Tarifa Tarjeta (4%):</span>
                          <span style={{ fontWeight: 800 }}>${cardFeeAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {deliveryEnabled && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#6b7280' }}>Delivery / Envío:</span>
                          <span style={{ fontWeight: 800 }}>${deliveryFee.toFixed(2)}</span>
                        </div>
                      )}

                      {tipEnabled && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#6b7280' }}>Propina / Gratuity:</span>
                          <span style={{ fontWeight: 800 }}>${tipAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div
                        style={{
                          height: '2px',
                          backgroundColor: '#1f1e1c',
                          margin: '0.35rem 0'
                        }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900 }}>
                        <span>TOTAL USD:</span>
                        <span style={{ color: '#d91c2b' }}>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
                    ¡Gracias por su visita a Mi Barrunto! ¡Esperamos verle pronto!
                  </div>
                </div>
              ) : (
                /* PLANTILLA 3 & 4: TÉRMICO 80mm / 58mm (ESTILO ROLL PAPER) */
                <div>
                  {/* Encabezado Térmico */}
                  <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: template === 'thermal58' ? '14px' : '17px', fontWeight: 900, display: 'block', letterSpacing: '0.5px' }}>
                      MI BARRUNTO
                    </span>
                    <span style={{ fontSize: template === 'thermal58' ? '9px' : '10px', display: 'block', fontWeight: 700 }}>
                      CEVICHERIA & SABOR PERUANO
                    </span>
                    <span style={{ fontSize: template === 'thermal58' ? '8px' : '9px', color: '#4b5563', display: 'block' }}>
                      21 Mill st, Paterson, NJ 07011
                    </span>
                    <span style={{ fontSize: template === 'thermal58' ? '8px' : '9px', color: '#4b5563', display: 'block' }}>
                      TEL: (973) 653-3749
                    </span>
                  </div>

                  <div style={{ borderBottom: '1px dashed #000000', margin: '0.4rem 0' }} />

                  {/* Metadatos */}
                  <div style={{ fontSize: template === 'thermal58' ? '9px' : '10px', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>FECHA: {currentDateStr}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>DOC: {invoiceNumber}</span>
                      <span>MESA: {tableNumber}</span>
                    </div>
                    <div>
                      <span>CLIENTE: {customerName}</span>
                    </div>
                    <div>
                      <span>MESERO: {waiterName}</span>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px dashed #000000', margin: '0.4rem 0' }} />

                  {/* Detalle de Platos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {items.map((it, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span style={{ flex: 1, paddingRight: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {it.quantity}x {it.name}
                          </span>
                          <span>${(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</span>
                        </div>
                        {it.notes && (
                          <span style={{ fontSize: '9px', color: '#4b5563', display: 'block', paddingLeft: '0.5rem' }}>
                            * {it.notes}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ borderBottom: '1px dashed #000000', margin: '0.5rem 0' }} />

                  {/* Resumen */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: template === 'thermal58' ? '10px' : '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SUBTOTAL:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    {taxEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TAX ({taxRate}%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {cardFeeEnabled && cardFeeAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TARJETA (4%):</span>
                        <span>${cardFeeAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {deliveryEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ENVIO / DELIVERY:</span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}

                    {tipEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PROPINA / TIP:</span>
                        <span>${tipAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ borderBottom: '1px solid #000000', margin: '0.3rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: template === 'thermal58' ? '12px' : '14px', fontWeight: 900 }}>
                      <span>TOTAL USD:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#4b5563', marginTop: '0.2rem' }}>
                      <span>PAGO: {paymentMethod.toUpperCase()}</span>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px dashed #000000', margin: '0.5rem 0' }} />

                  {/* Pie del Ticket */}
                  <div style={{ textAlign: 'center', fontSize: template === 'thermal58' ? '8px' : '9px', color: '#4b5563' }}>
                    <span>*** GRACIAS POR SU PREFERENCIA ***</span><br />
                    <span>¡EL AUTÉNTICO SABOR PERUANO EN NJ!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
