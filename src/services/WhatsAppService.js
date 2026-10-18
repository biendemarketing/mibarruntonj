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

    const customer = cart.customer;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString();

    let msg = `PEDIDO - CEVICHERIA MI BARRUNTO\n`;
    msg += `----------------------------------------\n`;
    msg += `Fecha: ${dateStr} - Hora: ${timeStr}\n`;
    
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
    const url = this.getWhatsAppUrl(cart);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
