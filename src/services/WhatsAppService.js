/**
 * Servicio de Integración con WhatsApp
 * Arquitectura Orientada a Objetos
 * Formato minimalista, sin emojis, limpio y profesional
 */
export class WhatsAppService {
  /**
   * @param {string} defaultPhone - Número oficial de Cevichería Mi Barrunto (973) 653-3749
   */
  constructor(defaultPhone = '19736533749') {
    this.phone = defaultPhone;
  }

  setPhone(phone) {
    if (phone) {
      this.phone = phone.replace(/[^0-9]/g, '');
    }
  }

  /**
   * Genera el texto formal para WhatsApp sin emojis
   * @param {import('../models/Cart').Cart} cart 
   * @returns {string}
   */
  buildMessage(cart) {
    if (cart.isEmpty()) return '';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('es-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let msg = `PEDIDO - CEVICHERIA MI BARRUNTO\n`;
    msg += `----------------------------------------\n`;
    msg += `Hora del pedido: ${timeStr} | Fecha: ${dateStr}\n`;
    
    if (customer.name && customer.name.trim()) {
      msg += `Cliente: ${customer.name.trim()}\n`;
    }
    
    msg += `Modalidad: ${customer.getOrderTypeDisplay()}\n`;
    msg += `Metodo de pago: ${customer.getPaymentDisplay()}\n`;
    
    msg += `----------------------------------------\n`;
    msg += `DETALLE DEL PEDIDO:\n`;

    cart.items.forEach((item, index) => {
      msg += `\n${index + 1}. [${item.quantity}x] ${item.dish.name} - ${item.getFormattedSubtotal()}`;
      if (item.dish.nameEn) {
        msg += `\n   (${item.dish.nameEn})`;
      }
      if (item.note && item.note.trim()) {
        msg += `\n   Nota: ${item.note.trim()}`;
      }
    });

    msg += `\n\n----------------------------------------\n`;
    msg += `TOTAL: ${cart.getFormattedTotal()} USD\n`;
    msg += `Total de productos: ${cart.getTotalCount()}\n`;

    if (customer.generalNotes && customer.generalNotes.trim()) {
      msg += `\nIndicaciones adicionales:\n${customer.generalNotes.trim()}\n`;
    }

    msg += `\nPor favor confirmar recepcion y tiempo estimado.`;

    return msg;
  }

  getWhatsAppUrl(cart) {
    const text = this.buildMessage(cart);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${this.phone}?text=${encoded}`;
  }

  sendOrder(cart) {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      const serializable = {
        date: new Date().toISOString(),
        items: cart.items.map((i) => ({
          dishId: i.dish.id,
          quantity: i.quantity,
          note: i.note || ''
        })),
        customer: {
          name: cart.customer.name,
          orderType: cart.customer.orderType,
          table: cart.customer.table,
          address: cart.customer.address,
          phone: cart.customer.phone,
          paymentMethod: cart.customer.paymentMethod,
          generalNotes: cart.customer.generalNotes
        }
      };
      localStorage.setItem('mb-last-order', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Error al guardar last-order:', e);
    }

    const url = this.getWhatsAppUrl(cart);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
