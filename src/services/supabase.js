import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * SERVICIO DE PEDIDOS (ORDERS)
 */
export const ordersService = {
  // Crear un nuevo pedido con sus items
  async createOrder({
    clientUuid,
    customerName,
    customerPhone = '',
    tableNumber,
    tableId = null,
    waiterId = null,
    items = [],
    subtotal = 0,
    tipAmount = 0,
    totalAmount = 0,
    paymentMethod = 'efectivo',
    dinerCount = 1,
    notes = ''
  }) {
    // Generar número de pedido amigable: MB-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MB-${randomSuffix}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        client_uuid: clientUuid,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_number: String(tableNumber),
        table_id: tableId,
        waiter_id: waiterId,
        status: 'pending',
        estimated_time: '15-20 min',
        subtotal: Number(subtotal) || 0,
        tip_amount: Number(tipAmount) || 0,
        total_amount: Number(totalAmount) || 0,
        payment_method: paymentMethod,
        diner_count: Number(dinerCount) || 1,
        notes: notes || ''
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insertar items del pedido
    if (items.length > 0) {
      const orderItemsToInsert = items.map(item => ({
        order_id: order.id,
        dish_id: String(item.dishId || item.id || ''),
        dish_name: item.dishName || item.name || '',
        dish_price: Number(item.price || item.dishPrice || 0),
        quantity: Number(item.quantity) || 1,
        subtotal: Number(item.subtotal || (item.price * item.quantity) || 0),
        notes: item.note || item.notes || ''
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) console.error('Error insertando items del pedido:', itemsError);
    }

    return order;
  },

  // Obtener pedidos del cliente actual (historial / activo)
  async getClientOrders(clientUuid) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('client_uuid', clientUuid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtener todos los pedidos (para el Panel de Administración)
  async getAllOrders(statusFilter = 'all') {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        waiters:waiter_id (id, name, phone)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Actualizar estado y/o tiempo estimado de un pedido
  async updateOrderStatus(orderId, status, estimatedTime = null) {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };
    if (estimatedTime !== null) {
      updatePayload.estimated_time = estimatedTime;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Marcar una orden como pagada
  async markOrderPaid(orderId, isPaid = true, paymentMethod = 'efectivo') {
    const { data, error } = await supabase
      .from('orders')
      .update({
        is_paid: isPaid,
        payment_status: isPaid ? 'paid' : 'pending',
        paid_at: isPaid ? new Date().toISOString() : null,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Asignar mesero a un pedido
  async assignWaiter(orderId, waiterId) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        waiter_id: waiterId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Suscripción en tiempo real para un pedido específico (del lado del cliente)
  subscribeToClientOrder(orderId, onUpdate) {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Suscripción en tiempo real a TODOS los pedidos (del lado del Administrador)
  subscribeToAllOrders(onInsert, onUpdate, onDelete) {
    const channel = supabase
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          // Traer items vinculados para entrega completa al admin
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', payload.new.id);
          onInsert({ ...payload.new, order_items: items || [] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          if (onDelete) onDelete(payload.old);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

/**
 * SERVICIO DE MENÚ (CATEGORÍAS Y PLATOS)
 */
export const menuService = {
  // Obtener categorías
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear categoría
  async createCategory(cat) {
    const id = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id,
        name: cat.name,
        name_en: cat.nameEn || cat.name_en || '',
        icon: cat.icon || 'UtensilsCrossed',
        sort_order: Number(cat.sort_order) || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar categoría
  async updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar categoría
  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Obtener todos los platos
  async getDishes() {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Crear plato
  async createDish(dish) {
    const id = dish.id || `dish-${Date.now()}`;
    const { data, error } = await supabase
      .from('dishes')
      .insert({
        id,
        code: dish.code || '',
        name: dish.name,
        name_en: dish.name_en || dish.nameEn || '',
        description: dish.description || '',
        description_en: dish.description_en || dish.descriptionEn || '',
        price: Number(dish.price) || 0,
        category_id: dish.category_id || dish.category,
        image_url: dish.image_url || dish.image || '',
        platos_image: dish.platos_image || dish.platosImage || '',
        images: Array.isArray(dish.images) ? dish.images : [],
        is_active: dish.is_active !== false,
        is_available: dish.is_available !== false,
        badge: dish.badge || '',
        pairings: dish.pairings || [],
        sort_order: Number(dish.sort_order) || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualizar plato
  async updateDish(id, updates) {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alternar disponibilidad rápida de un plato (Disponible / Agotado)
  async toggleDishAvailability(id, isAvailable) {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alternar visibilidad de un plato (Ocultar / Mostrar en la carta del cliente)
  async toggleDishVisibility(id, isActive) {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar plato
  async deleteDish(id) {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Subir imagen al Bucket 'dishes' de Supabase Storage
  async uploadImage(file) {
    if (!file) throw new Error('No se seleccionó ningún archivo de imagen');

    const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : 'webp';
    const fileName = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dishes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/webp'
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('dishes')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
};

/**
 * SERVICIO DE MESAS (TABLES)
 */
export const tablesService = {
  async getTables() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createTable({ number, name, capacity = 4, status = 'available' }) {
    const { data, error } = await supabase
      .from('tables')
      .insert({
        number: Number(number),
        name: name || `Mesa ${number}`,
        capacity: Number(capacity) || 4,
        status: status || 'available',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTable(id, updates) {
    const { data, error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTable(id) {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Cerrar mesa: marca la mesa como disponible y archiva/pasa pedidos activos a entregados/pagados
  async closeTable(tableId, tableNumber) {
    // 1. Marcar mesa como disponible
    const { data: updatedTable, error: tableErr } = await supabase
      .from('tables')
      .update({ status: 'available' })
      .eq('id', tableId)
      .select()
      .single();

    if (tableErr) throw tableErr;

    // 2. Marcar pedidos activos de esta mesa como entregados y pagados
    if (tableNumber) {
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          is_paid: true,
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .ilike('table_number', `%${tableNumber}%`)
        .in('status', ['pending', 'in_kitchen', 'accepted', 'ready']);
    }

    return updatedTable;
  }
};

/**
 * SERVICIO DE MESEROS / PERSONAL (WAITERS)
 */
export const waitersService = {
  async getWaiters() {
    const { data, error } = await supabase
      .from('waiters')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createWaiter({ name, pin = '1234', phone = '', role = 'mesero' }) {
    const { data, error } = await supabase
      .from('waiters')
      .insert({
        name,
        pin,
        phone,
        role,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWaiter(id, updates) {
    const { data, error } = await supabase
      .from('waiters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWaiter(id) {
    const { error } = await supabase
      .from('waiters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

/**
 * SERVICIO DE AUTENTICACIÓN / SESIÓN ADMINISTRATIVA
 */
export const adminAuthService = {
  isAuthenticated() {
    try {
      const token = localStorage.getItem('mb-admin-auth');
      return token === 'active_admin_session';
    } catch {
      return false;
    }
  },

  login(enteredPasscode) {
    const trimmed = (enteredPasscode || '').trim();
    if (trimmed === '2026' || trimmed === 'barrunto2026' || trimmed === 'admin2026') {
      try {
        localStorage.setItem('mb-admin-auth', 'active_admin_session');
        localStorage.setItem('mb-admin-user', 'admin@mibarrunto.com');
      } catch {}
      return true;
    }
    return false;
  },

  loginWithCredentials(userOrEmail, password) {
    const u = (userOrEmail || '').trim().toLowerCase();
    const p = (password || '').trim();

    const validUsers = ['admin@mibarrunto.com', 'admin', 'gerencia@mibarrunto.com', 'barrunto'];
    const validPasswords = ['barrunto2026', 'admin2026', '2026'];

    if ((validUsers.includes(u) && validPasswords.includes(p)) || p === 'barrunto2026' || p === '2026') {
      try {
        localStorage.setItem('mb-admin-auth', 'active_admin_session');
        localStorage.setItem('mb-admin-user', u || 'admin@mibarrunto.com');
      } catch {}
      return true;
    }
    return false;
  },

  getCurrentUser() {
    try {
      return localStorage.getItem('mb-admin-user') || 'admin@mibarrunto.com';
    } catch {
      return 'admin@mibarrunto.com';
    }
  },

  logout() {
    try {
      localStorage.removeItem('mb-admin-auth');
      localStorage.removeItem('mb-admin-user');
    } catch {}
  }
};

/**
 * SERVICIO DE CONFIGURACIÓN Y MENÚ IMPRIMIBLE
 */
export const restaurantConfigService = {
  async getPrintableMenuConfig() {
    try {
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('value')
        .eq('key', 'printable_menu')
        .single();

      if (error) return null;
      return data?.value || null;
    } catch {
      return null;
    }
  },

  async updatePrintableMenuConfig(config) {
    const { data, error } = await supabase
      .from('restaurant_config')
      .upsert({
        key: 'printable_menu',
        value: config,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data?.value;
  }
};

