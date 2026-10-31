import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://scvlxcgmhbwjmvycrttf.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdmx4Y2dtaGJ3am12eWNydHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjA2MzAsImV4cCI6MjEwNzkzNjYzMH0.XuSQAMlh6XCYXDSLxwuWsvptluV0kGvUYw0zKuq9kKc';

const globalKey = '__mb_supabase_client__';

export const supabase = (typeof window !== 'undefined' && window[globalKey])
  ? window[globalKey]
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

if (typeof window !== 'undefined') {
  window[globalKey] = supabase;
}

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
    taxAmount = 0,
    cardFeeAmount = 0,
    tipAmount = 0,
    totalAmount = 0,
    paymentMethod = 'efectivo',
    dinerCount = 1,
    notes = ''
  }) {
    // Generar número de pedido amigable: MB-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MB-${randomSuffix}`;

    const numSubtotal = Number(subtotal) || 0;
    const numTax = Number(taxAmount) || 0;
    const numCardFee = Number(cardFeeAmount) || 0;
    const numTip = Number(tipAmount) || 0;
    const numTotal = Number(totalAmount) || (numSubtotal + numTax + numCardFee + numTip);

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
        subtotal: numSubtotal,
        tax_enabled: numTax > 0,
        tax_amount: numTax,
        card_fee_amount: numCardFee,
        tip_amount: numTip,
        total_amount: numTotal,
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

    // Registrar conversión en analíticas internas del restaurante
    try {
      import('../utils/visitTracker').then(({ visitTracker }) => {
        visitTracker.recordOrderConversion(numTotal);
      }).catch(() => {});
    } catch (_) {}

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
    // Ping automático para indexación inmediata del nuevo plato en Google & Bing
    try {
      notifySearchEngines(`https://mibarruntonj.com/plato/${data.id || id}`);
    } catch (_) {}
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

  // Actualizar completamente una orden (edición integral de platos, mesa, cliente, notas, etc.)
  async updateOrderFull(orderId, orderData, items = []) {
    const updatePayload = {
      customer_name: orderData.customer_name || 'Walk-in Customer',
      customer_phone: orderData.customer_phone || null,
      table_number: String(orderData.table_number || '1'),
      status: orderData.status || 'pending',
      subtotal: Number(orderData.subtotal) || 0,
      tax_enabled: Boolean(orderData.tax_enabled),
      tax_amount: Number(orderData.tax_amount) || 0,
      card_fee_amount: Number(orderData.card_fee_amount) || 0,
      delivery_enabled: Boolean(orderData.delivery_enabled),
      delivery_amount: Number(orderData.delivery_amount) || 0,
      tip_amount: Number(orderData.tip_amount) || 0,
      total_amount: Number(orderData.total_amount) || 0,
      payment_method: orderData.payment_method || 'efectivo',
      notes: orderData.notes || '',
      updated_at: new Date().toISOString()
    };

    if (orderData.waiter_id) updatePayload.waiter_id = orderData.waiter_id;
    if (orderData.table_id) updatePayload.table_id = orderData.table_id;
    if (orderData.customer_id) updatePayload.customer_id = orderData.customer_id;

    const { data: updatedOrder, error: orderError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (orderError) throw orderError;

    // Si se enviaron items, reemplazar los items existentes
    if (Array.isArray(items) && items.length > 0) {
      await supabase.from('order_items').delete().eq('order_id', orderId);

      const itemsToInsert = items.map(item => ({
        order_id: orderId,
        dish_id: String(item.dish_id || item.dishId || item.id || ''),
        dish_name: item.dish_name || item.dishName || item.name || '',
        dish_price: Number(item.dish_price || item.price || 0),
        quantity: Number(item.quantity) || 1,
        subtotal: Number(item.subtotal || ((Number(item.dish_price || item.price || 0)) * (Number(item.quantity) || 1))),
        notes: item.notes || item.note || ''
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) console.error('Error actualizando items:', itemsErr);
    }

    return updatedOrder;
  },

  // Eliminar orden
  async deleteOrder(orderId) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) throw error;
    return true;
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

// Helper local para metadatos extendidos de personal (username y permission_level)
const getWaitersLocalMeta = () => {
  try {
    const raw = localStorage.getItem('mb_waiters_meta');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveWaiterLocalMeta = (id, meta) => {
  try {
    const all = getWaitersLocalMeta();
    all[id] = { ...(all[id] || {}), ...meta };
    localStorage.setItem('mb_waiters_meta', JSON.stringify(all));
  } catch {}
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
    const meta = getWaitersLocalMeta();

    return (data || []).map(w => {
      const waiterMeta = meta[w.id] || {};
      const fallbackUser = w.name ? w.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'mesero';
      return {
        ...w,
        username: w.username || waiterMeta.username || fallbackUser,
        permission_level: w.permission_level || waiterMeta.permission_level || (w.role === 'admin' ? 'admin_completo' : w.role === 'capitan' ? 'pedidos_y_mesas' : 'solo_pedidos')
      };
    });
  },

  async createWaiter({ name, username, pin = '1234', phone = '', role = 'mesero', permission_level = 'solo_pedidos' }) {
    const cleanUser = (username || name.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase().trim();
    const basePayload = {
      name,
      pin: String(pin),
      phone: phone || '',
      role: role || 'mesero',
      is_active: true
    };

    try {
      // Intentar insertar con columnas extendidas
      const { data, error } = await supabase
        .from('waiters')
        .insert({
          ...basePayload,
          username: cleanUser,
          permission_level
        })
        .select()
        .single();

      if (!error && data) {
        saveWaiterLocalMeta(data.id, { username: cleanUser, permission_level });
        return { ...data, username: cleanUser, permission_level };
      }

      // Si falla por columna no existente, insertar base y guardar metadatos localmente
      if (error) {
        console.warn('Fallback a inserción básica de mesero:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('waiters')
          .insert(basePayload)
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        saveWaiterLocalMeta(fallbackData.id, { username: cleanUser, permission_level });
        return { ...fallbackData, username: cleanUser, permission_level };
      }
    } catch (err) {
      console.error('Error creando mesero en Supabase:', err);
      throw err;
    }
  },

  async updateWaiter(id, updates) {
    const { username, permission_level, ...restUpdates } = updates;
    if (username || permission_level) {
      saveWaiterLocalMeta(id, {
        ...(username ? { username: username.toLowerCase().trim() } : {}),
        ...(permission_level ? { permission_level } : {})
      });
    }

    try {
      const { data, error } = await supabase
        .from('waiters')
        .update(updates)
        .select()
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          ...data,
          username: username || data.username,
          permission_level: permission_level || data.permission_level
        };
      }

      // Fallback a campos base si la columna no existe
      if (error && error.message?.includes('column')) {
        const { data: baseData, error: baseErr } = await supabase
          .from('waiters')
          .update(restUpdates)
          .select()
          .eq('id', id)
          .single();

        if (baseErr) throw baseErr;
        return {
          ...baseData,
          username: username || baseData.username,
          permission_level: permission_level || baseData.permission_level
        };
      }

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error actualizando mesero:', err);
      throw err;
    }
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
 * SERVICIO DE AUTENTICACIÓN / SESIÓN ADMINISTRATIVA Y DE MESEROS
 */
export const adminAuthService = {
  isAuthenticated() {
    try {
      const token = localStorage.getItem('mb-admin-auth');
      return token === 'active_admin_session' || token === 'waiter_session';
    } catch {
      return false;
    }
  },

  getAuthRole() {
    try {
      const token = localStorage.getItem('mb-admin-auth');
      if (token === 'active_admin_session') return 'admin';
      if (token === 'waiter_session') return 'waiter';
      return null;
    } catch {
      return null;
    }
  },

  getCurrentWaiter() {
    try {
      const raw = localStorage.getItem('mb-waiter-info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  login(enteredPasscode) {
    const trimmed = (enteredPasscode || '').trim();
    if (trimmed === '2026' || trimmed === 'barrunto2026' || trimmed === 'admin2026') {
      try {
        localStorage.setItem('mb-admin-auth', 'active_admin_session');
        localStorage.setItem('mb-admin-user', 'admin@mibarrunto.com');
        localStorage.removeItem('mb-waiter-info');
      } catch {}
      return true;
    }
    return false;
  },

  async loginWithCredentials(userOrEmail, password) {
    const u = (userOrEmail || '').trim();
    const p = (password || '').trim();
    const emailToTry = u.includes('@') ? u : `${u}@mibarrunto.com`;

    // 1. Intentar autenticar contra Supabase Auth oficial
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToTry,
        password: p
      });

      if (!error && data?.session) {
        localStorage.setItem('mb-admin-auth', 'active_admin_session');
        localStorage.setItem('mb-admin-user', data.user.email || emailToTry);
        localStorage.removeItem('mb-waiter-info');
        return { success: true, user: data.user, role: 'admin' };
      }
    } catch (e) {
      console.warn('Supabase Auth error:', e.message);
    }

    // 2. Fallback de contingencia con credenciales autorizadas del restaurante
    const validUsers = ['admin@mibarrunto.com', 'admin', 'gerencia@mibarrunto.com', 'barrunto'];
    const validPasswords = ['barrunto2026', 'admin2026', '2026'];

    if ((validUsers.includes(u.toLowerCase()) && validPasswords.includes(p)) || p === 'barrunto2026' || p === '2026') {
      try {
        localStorage.setItem('mb-admin-auth', 'active_admin_session');
        localStorage.setItem('mb-admin-user', u || 'admin@mibarrunto.com');
        localStorage.removeItem('mb-waiter-info');
      } catch {}
      return { success: true, user: { email: u || 'admin@mibarrunto.com' }, role: 'admin' };
    }

    return { success: false, error: 'Credenciales de administrador inválidas' };
  },

  loginWaiter(username, pin, waitersList = []) {
    const u = (username || '').toLowerCase().trim();
    const p = String(pin || '').trim();

    if (!u || !p) {
      return { success: false, error: 'Por favor ingresa tu usuario y PIN de acceso.' };
    }

    const foundWaiter = waitersList.find(w => {
      const wUser = (w.username || w.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '').toLowerCase().trim();
      const wName = (w.name || '').toLowerCase().trim();
      const wPin = String(w.pin || '').trim();
      return (wUser === u || wName === u) && wPin === p;
    });

    if (foundWaiter) {
      try {
        localStorage.setItem('mb-admin-auth', 'waiter_session');
        localStorage.setItem('mb-admin-user', foundWaiter.name);
        localStorage.setItem('mb-waiter-info', JSON.stringify(foundWaiter));
      } catch {}
      return { success: true, waiter: foundWaiter, role: 'waiter' };
    }

    return { success: false, error: 'Usuario o PIN incorrecto. Verifica con administración.' };
  },

  getCurrentUser() {
    try {
      return localStorage.getItem('mb-admin-user') || 'admin@mibarrunto.com';
    } catch {
      return 'admin@mibarrunto.com';
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem('mb-admin-auth');
      localStorage.removeItem('mb-admin-user');
      localStorage.removeItem('mb-waiter-info');
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
  },

  async getQrModeConfig() {
    try {
      const local = typeof window !== 'undefined' ? localStorage.getItem('mb-qr-mode') : null;
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('value')
        .eq('key', 'qr_mode')
        .single();

      if (!error && data?.value) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb-qr-mode', data.value);
        }
        return data.value;
      }
      return local || 'single';
    } catch {
      return (typeof window !== 'undefined' && localStorage.getItem('mb-qr-mode')) || 'single';
    }
  },

  async updateQrModeConfig(mode) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb-qr-mode', mode);
      }
      await supabase
        .from('restaurant_config')
        .upsert({
          key: 'qr_mode',
          value: mode,
          updated_at: new Date().toISOString()
        });
      return mode;
    } catch (err) {
      console.warn('Guardado local de modo QR:', err);
      return mode;
    }
  }
};

// ============================================================================
// SERVICIO DE CLIENTES (DIRECTORIO, POS Y FACTURACIÓN)
// ============================================================================
export const customersService = {
  async getCustomers(search = '') {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Fallback local para clientes:', err);
      const local = localStorage.getItem('mb_customers_local');
      let list = local ? JSON.parse(local) : [
        { id: 'walkin-default', name: 'Walk-in Customer', phone: '', notes: 'Mostrador / General' }
      ];
      if (search && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
      }
      return list;
    }
  },

  async createCustomer(customerData) {
    try {
      const payload = {
        name: customerData.name.trim(),
        phone: customerData.phone?.trim() || null,
        email: customerData.email?.trim() || null,
        address: customerData.address?.trim() || null,
        notes: customerData.notes?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Creando cliente en almacenamiento local:', err);
      const newCust = {
        id: `local-cust-${Date.now()}`,
        name: customerData.name.trim(),
        phone: customerData.phone?.trim() || '',
        email: customerData.email?.trim() || '',
        address: customerData.address?.trim() || '',
        notes: customerData.notes?.trim() || '',
        is_active: true,
        created_at: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('mb_customers_local') || '[]');
      existing.push(newCust);
      localStorage.setItem('mb_customers_local', JSON.stringify(existing));
      return newCust;
    }
  },

  async updateCustomer(id, updates) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Actualizando cliente localmente:', err);
      const existing = JSON.parse(localStorage.getItem('mb_customers_local') || '[]');
      const updated = existing.map(c => c.id === id ? { ...c, ...updates } : c);
      localStorage.setItem('mb_customers_local', JSON.stringify(updated));
      return { id, ...updates };
    }
  },

  async deleteCustomer(id) {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch {
      const existing = JSON.parse(localStorage.getItem('mb_customers_local') || '[]');
      const filtered = existing.filter(c => c.id !== id);
      localStorage.setItem('mb_customers_local', JSON.stringify(filtered));
      return true;
    }
  }
};

// ============================================================================
// SERVICIO DE FACTURACIÓN, TICKETS Y RECIBOS TERMALES (EE.UU. / NJ)
// ============================================================================
export const invoicesService = {
  async getInvoices(filters = {}) {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        const s = filters.search.trim();
        query = query.or(`invoice_number.ilike.%${s}%,customer_name.ilike.%${s}%,table_number.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Fallback local para facturas:', err);
      const local = localStorage.getItem('mb_invoices_local');
      return local ? JSON.parse(local) : [];
    }
  },

  async getInvoiceById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getNextInvoiceNumber() {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1);

      const year = new Date().getFullYear();
      if (!data || data.length === 0) {
        return `FAC-${year}-0001`;
      }

      const lastNum = data[0].invoice_number;
      const match = lastNum.match(/(\d+)$/);
      if (match) {
        const nextSeq = String(parseInt(match[1], 10) + 1).padStart(4, '0');
        return `FAC-${year}-${nextSeq}`;
      }
      return `FAC-${year}-${Date.now().toString().slice(-4)}`;
    } catch {
      return `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    }
  },

  async createInvoice(invoiceData, items = []) {
    let invoiceNumber = invoiceData.invoice_number;
    if (!invoiceNumber) {
      invoiceNumber = await this.getNextInvoiceNumber();
    }

    const invoicePayload = {
      invoice_number: invoiceNumber,
      order_id: invoiceData.order_id || null,
      customer_id: invoiceData.customer_id || null,
      customer_name: invoiceData.customer_name?.trim() || 'Walk-in Customer',
      customer_phone: invoiceData.customer_phone?.trim() || null,
      customer_email: invoiceData.customer_email?.trim() || null,
      table_number: String(invoiceData.table_number || 'Mostrador'),
      subtotal: Number(invoiceData.subtotal) || 0,
      tax_enabled: Boolean(invoiceData.tax_enabled),
      tax_rate: Number(invoiceData.tax_rate) || 6.625,
      tax_amount: Boolean(invoiceData.tax_enabled) ? (Number(invoiceData.tax_amount) || 0) : 0,
      delivery_enabled: Boolean(invoiceData.delivery_enabled),
      delivery_amount: Boolean(invoiceData.delivery_enabled) ? (Number(invoiceData.delivery_amount) || 0) : 0,
      tip_enabled: Boolean(invoiceData.tip_enabled),
      tip_amount: Boolean(invoiceData.tip_enabled) ? (Number(invoiceData.tip_amount) || 0) : 0,
      discount_amount: Number(invoiceData.discount_amount) || 0,
      total_amount: Number(invoiceData.total_amount) || 0,
      payment_method: invoiceData.payment_method || 'efectivo',
      status: invoiceData.status || 'paid',
      template_type: invoiceData.template_type || 'thermal_80mm',
      notes: invoiceData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: newInvoice, error: invErr } = await supabase
        .from('invoices')
        .insert(invoicePayload)
        .select()
        .single();

      if (invErr) throw invErr;

      let insertedItems = [];
      if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          invoice_id: newInvoice.id,
          dish_id: String(item.dish_id || item.dishId || item.id || ''),
          name: item.name || item.dish_name || item.dishName || 'Platillo',
          price: Number(item.price || item.dish_price || 0),
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal || ((Number(item.price || item.dish_price || 0)) * (Number(item.quantity) || 1))),
          notes: item.notes || item.note || ''
        }));

        const { data: itemsData, error: itemsErr } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert)
          .select();

        if (itemsErr) console.error('Error insertando items de factura:', itemsErr);
        insertedItems = itemsData || itemsToInsert;
      }

      // Si está vinculada a una orden, actualizar su estado en orders
      if (invoiceData.order_id) {
        await supabase
          .from('orders')
          .update({
            invoice_id: newInvoice.id,
            is_paid: true,
            payment_status: 'paid',
            tax_enabled: Boolean(invoiceData.tax_enabled),
            tax_amount: Number(invoiceData.tax_amount) || 0,
            delivery_enabled: Boolean(invoiceData.delivery_enabled),
            delivery_amount: Number(invoiceData.delivery_amount) || 0,
            tip_amount: Number(invoiceData.tip_amount) || 0,
            total_amount: Number(invoiceData.total_amount) || 0
          })
          .eq('id', invoiceData.order_id);
      }

      return { ...newInvoice, invoice_items: insertedItems };
    } catch (err) {
      console.warn('Creando factura localmente por fallback:', err);
      const localInvoice = {
        ...invoicePayload,
        id: `local-inv-${Date.now()}`,
        invoice_items: items
      };
      const existing = JSON.parse(localStorage.getItem('mb_invoices_local') || '[]');
      existing.unshift(localInvoice);
      localStorage.setItem('mb_invoices_local', JSON.stringify(existing));
      return localInvoice;
    }
  },

  async updateInvoice(id, invoiceData, items = null) {
    const updatePayload = {
      customer_name: invoiceData.customer_name?.trim() || 'Walk-in Customer',
      customer_phone: invoiceData.customer_phone?.trim() || null,
      customer_email: invoiceData.customer_email?.trim() || null,
      table_number: String(invoiceData.table_number || 'Mostrador'),
      subtotal: Number(invoiceData.subtotal) || 0,
      tax_enabled: Boolean(invoiceData.tax_enabled),
      tax_rate: Number(invoiceData.tax_rate) || 6.625,
      tax_amount: Boolean(invoiceData.tax_enabled) ? (Number(invoiceData.tax_amount) || 0) : 0,
      delivery_enabled: Boolean(invoiceData.delivery_enabled),
      delivery_amount: Boolean(invoiceData.delivery_enabled) ? (Number(invoiceData.delivery_amount) || 0) : 0,
      tip_enabled: Boolean(invoiceData.tip_enabled),
      tip_amount: Boolean(invoiceData.tip_enabled) ? (Number(invoiceData.tip_amount) || 0) : 0,
      discount_amount: Number(invoiceData.discount_amount) || 0,
      total_amount: Number(invoiceData.total_amount) || 0,
      payment_method: invoiceData.payment_method || 'efectivo',
      status: invoiceData.status || 'paid',
      template_type: invoiceData.template_type || 'thermal_80mm',
      notes: invoiceData.notes || '',
      updated_at: new Date().toISOString()
    };

    if (invoiceData.customer_id) updatePayload.customer_id = invoiceData.customer_id;

    try {
      const { data: updatedInvoice, error: invErr } = await supabase
        .from('invoices')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (invErr) throw invErr;

      let currentItems = items;
      if (items !== null && Array.isArray(items)) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
            invoice_id: id,
            dish_id: String(item.dish_id || item.dishId || item.id || ''),
            name: item.name || item.dish_name || item.dishName || 'Platillo',
            price: Number(item.price || item.dish_price || 0),
            quantity: Number(item.quantity) || 1,
            subtotal: Number(item.subtotal || ((Number(item.price || item.dish_price || 0)) * (Number(item.quantity) || 1))),
            notes: item.notes || item.note || ''
          }));
          const { data: inserted } = await supabase.from('invoice_items').insert(itemsToInsert).select();
          currentItems = inserted || itemsToInsert;
        }
      }

      return { ...updatedInvoice, invoice_items: currentItems };
    } catch (err) {
      console.warn('Actualizando factura localmente:', err);
      const existing = JSON.parse(localStorage.getItem('mb_invoices_local') || '[]');
      const updated = existing.map(inv => inv.id === id ? { ...inv, ...updatePayload, invoice_items: items || inv.invoice_items } : inv);
      localStorage.setItem('mb_invoices_local', JSON.stringify(updated));
      return { id, ...updatePayload, invoice_items: items };
    }
  },

  async deleteInvoice(id) {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      const existing = JSON.parse(localStorage.getItem('mb_invoices_local') || '[]');
      const filtered = existing.filter(inv => inv.id !== id);
      localStorage.setItem('mb_invoices_local', JSON.stringify(filtered));
      return true;
    }
  }
};

// ============================================================================
// 8. SERVICIO DE TAREAS OPERATIVAS (TASKS & CHECKLIST)
// ============================================================================
export const tasksService = {
  async getTasks() {
    try {
      const { data, error } = await supabase
        .from('restaurant_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error cargando tareas de Supabase, usando respaldo local:', err);
      return JSON.parse(localStorage.getItem('mb_tasks_local') || '[]');
    }
  },

  async createTask(taskData) {
    const payload = {
      title: taskData.title?.trim(),
      description: taskData.description?.trim() || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'media',
      area: taskData.area || 'general',
      created_by_id: taskData.created_by_id || null,
      created_by_name: taskData.created_by_name || 'Administración',
      assigned_to_id: taskData.assigned_to_id || null,
      assigned_to_name: taskData.assigned_to_name || 'Equipo General',
      due_date: taskData.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('restaurant_tasks')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Guardando tarea localmente:', err);
      const newTask = { id: `local-${Date.now()}`, ...payload };
      const existing = JSON.parse(localStorage.getItem('mb_tasks_local') || '[]');
      localStorage.setItem('mb_tasks_local', JSON.stringify([newTask, ...existing]));
      return newTask;
    }
  },

  async updateTask(id, updates) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('restaurant_tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Actualizando tarea localmente:', err);
      const existing = JSON.parse(localStorage.getItem('mb_tasks_local') || '[]');
      const updated = existing.map(t => t.id === id ? { ...t, ...payload } : t);
      localStorage.setItem('mb_tasks_local', JSON.stringify(updated));
      return { id, ...payload };
    }
  },

  async toggleTaskStatus(id, currentStatus, employeeName = 'Personal') {
    const isCompleted = currentStatus === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    const payload = {
      status: newStatus,
      completed_at: isCompleted ? null : new Date().toISOString(),
      completed_by_name: isCompleted ? null : employeeName,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('restaurant_tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Toggle tarea localmente:', err);
      const existing = JSON.parse(localStorage.getItem('mb_tasks_local') || '[]');
      const updated = existing.map(t => t.id === id ? { ...t, ...payload } : t);
      localStorage.setItem('mb_tasks_local', JSON.stringify(updated));
      return { id, ...payload };
    }
  },

  async deleteTask(id) {
    try {
      const { error } = await supabase.from('restaurant_tasks').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      const existing = JSON.parse(localStorage.getItem('mb_tasks_local') || '[]');
      const filtered = existing.filter(t => t.id !== id);
      localStorage.setItem('mb_tasks_local', JSON.stringify(filtered));
      return true;
    }
  },

  subscribeToTasks(onUpdate) {
    return supabase
      .channel('public:restaurant_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tasks' }, (payload) => {
        if (typeof onUpdate === 'function') {
          onUpdate(payload);
        }
      })
      .subscribe();
  }
};



// Notificar automticamente a motores de bsqueda (Google & Bing / IndexNow) sobre nuevo contenido
export async function notifySearchEngines(url) {
  try {
    const endpoint = '/api/ping-search-engines';
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url || 'https://mibarruntonj.com/' })
    });
  } catch (err) {
    console.warn('[SEO] Ping silencioso a buscadores finalizado:', err.message);
  }
}
