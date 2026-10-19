/**
 * Modelo de Dominio: Customer (Información de la Orden)
 * Arquitectura Orientada a Objetos
 * Formato minimalista sin emojis
 */
export class Customer {
  constructor({
    name = '',
    orderType = 'mesa',
    table = '',
    address = '',
    phone = '',
    paymentMethod = 'efectivo',
    dinerCount = 2,
    generalNotes = ''
  } = {}) {
    this.name = name;
    this.orderType = orderType; // 'mesa', 'llevar', 'delivery'
    this.table = table;
    this.address = address;
    this.phone = phone;
    this.paymentMethod = paymentMethod; // 'efectivo', 'yape', 'tarjeta', 'transferencia'
    this.dinerCount = dinerCount;
    this.generalNotes = generalNotes;
  }

  getOrderTypeDisplay() {
    switch (this.orderType) {
      case 'mesa':
        return `En Mesa${this.table ? ` (Mesa ${this.table})` : ''}`;
      case 'llevar':
        return 'Para Llevar';
      case 'delivery':
        return `Delivery${this.address ? `: ${this.address}` : ''}`;
      default:
        return this.orderType;
    }
  }

  getPaymentDisplay() {
    switch (this.paymentMethod) {
      case 'efectivo':
        return 'Efectivo';
      case 'yape':
        return 'Yape / Plin';
      case 'tarjeta':
        return 'Tarjeta / POS';
      case 'transferencia':
        return 'Transferencia Bancaria';
      default:
        return this.paymentMethod;
    }
  }

  clone() {
    return new Customer({
      name: this.name,
      orderType: this.orderType,
      table: this.table,
      address: this.address,
      phone: this.phone,
      paymentMethod: this.paymentMethod,
      generalNotes: this.generalNotes
    });
  }
}
