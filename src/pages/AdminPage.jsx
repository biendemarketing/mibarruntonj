import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellRing, Utensils, Layers, QrCode, Users, LogOut, 
  ExternalLink, Lock, Check, ShieldCheck, KeyRound, 
  Clock, Volume2, VolumeX, ArrowLeft, RefreshCw, Printer,
  Menu, X, Mail, ShieldAlert, Sparkles, ChefHat, User,
  UserCheck, Eye, EyeOff, ShoppingBag, Receipt, CheckSquare
} from 'lucide-react';
import { 
  ordersService, menuService, tablesService, 
  waitersService, adminAuthService, tasksService 
} from '../services/supabase';
import { AdminOrdersTab } from '../components/AdminOrdersTab';
import { AdminPOSTab } from '../components/AdminPOSTab';
import { AdminInvoicesTab } from '../components/AdminInvoicesTab';
import { AdminCustomersTab } from '../components/AdminCustomersTab';
import { AdminTasksTab } from '../components/AdminTasksTab';
import { AdminDishesTab } from '../components/AdminDishesTab';
import { AdminCategoriesTab } from '../components/AdminCategoriesTab';
import { AdminTablesTab } from '../components/AdminTablesTab';
import { AdminWaitersTab } from '../components/AdminWaitersTab';
import { AdminPrintableTab } from '../components/AdminPrintableTab';
import { 
  playOrderNotificationSound, 
  unlockAudio, 
  sendBrowserNotification, 
  requestNotificationPermission, 
  getNotificationPermissionStatus 
} from '../utils/orderSound';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminPage() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlertConfirm();

  // Estado de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());
  const [authRole, setAuthRole] = useState(() => adminAuthService.getAuthRole());
  const [currentWaiter, setCurrentWaiter] = useState(() => adminAuthService.getCurrentWaiter());

  const [loginMode, setLoginMode] = useState('admin'); // 'admin' | 'waiter'
  const [loginUser, setLoginUser] = useState('admin@mibarrunto.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [waiterUsername, setWaiterUsername] = useState('');
  const [waiterPin, setWaiterPin] = useState('');
  const [showWaiterPin, setShowWaiterPin] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Cargar lista de personal desde el inicio para permitir login de meseros
  useEffect(() => {
    waitersService.getWaiters().then(setWaiters).catch(() => {});
  }, []);

  // Pestaña Activa
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'dishes', 'categories', 'tables', 'waiters', 'printable'

  // Sidebar Móvil
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Datos en vivo desde Supabase
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  // Estados de carga, sonido y notificaciones
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermissionStatus());
  const [incomingOrderAlert, setIncomingOrderAlert] = useState(null);

  // Desbloqueo de AudioContext en la primera interacción táctil o clic
  useEffect(() => {
    const handleUnlock = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleUnlock, { once: true });
    window.addEventListener('touchstart', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });
    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, []);

  // Auto-cerrar alerta flotante de nuevo pedido tras 14 segundos
  useEffect(() => {
    if (!incomingOrderAlert) return;
    const timer = setTimeout(() => {
      setIncomingOrderAlert(null);
    }, 14000);
    return () => clearTimeout(timer);
  }, [incomingOrderAlert]);

  // Cargar datos completos desde Supabase
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedOrders, fetchedDishes, fetchedCategories, fetchedTables, fetchedWaiters, fetchedTasks] = await Promise.all([
        ordersService.getAllOrders().catch(() => []),
        menuService.getDishes().catch(() => []),
        menuService.getCategories().catch(() => []),
        tablesService.getTables().catch(() => []),
        waitersService.getWaiters().catch(() => []),
        tasksService.getTasks().catch(() => [])
      ]);

      setOrders(fetchedOrders);
      setDishes(fetchedDishes);
      setCategories(fetchedCategories);
      setTables(fetchedTables);
      setWaiters(fetchedWaiters);
      setPendingTasksCount((fetchedTasks || []).filter(t => t.status === 'pending').length);
    } catch (err) {
      console.error('Error cargando datos de Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Suscripción Realtime a Pedidos de Supabase
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = ordersService.subscribeToAllOrders(
      // On Insert (Nuevo Pedido en Vivo)
      (newOrder) => {
        triggerHaptic([40, 100, 60]);
        if (soundEnabled) {
          playOrderNotificationSound();
        }
        sendBrowserNotification(newOrder);
        setIncomingOrderAlert(newOrder);
        setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      },
      // On Update
      (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      },
      // On Delete
      (deletedOrder) => {
        setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, soundEnabled]);

  // Activar Notificaciones del Navegador
  const handleEnableNotifications = async () => {
    triggerHaptic(10);
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      sendBrowserNotification({
        order_number: 'DEMO',
        customer_name: 'Notificación Activada',
        table_number: 'Mesa Demo',
        total_amount: 28.50,
        items: [{ id: 1 }]
      });
      showAlert({
        title: '¡Avisos y Campana Activados!',
        message: 'Recibirás sonido de campana y notificaciones nativas en pantalla cuando los clientes envíen un pedido.',
        type: 'success'
      });
    } else {
      showAlert({
        title: 'Permiso Requerido',
        message: 'Por favor autoriza las notificaciones en la barra de direcciones de tu navegador para que los avisos lleguen a tu pantalla.',
        type: 'warning'
      });
    }
  };

  // Probar sonido y alerta de campana
  const handleTestChime = () => {
    triggerHaptic(12);
    unlockAudio();
    playOrderNotificationSound();
    sendBrowserNotification({
      order_number: 'TEST',
      customer_name: 'Prueba de Sonido',
      table_number: 'Mesa 4',
      total_amount: 35.00,
      items: [{ id: 1 }]
    });
    setIncomingOrderAlert({
      order_number: 'TEST',
      customer_name: 'Prueba de Campana',
      table_number: 'Mesa 4',
      total_amount: 35.00,
      items: [{ id: 1 }]
    });
  };

  // Login Handler con Usuario + Contraseña y Referencia
  const handleLogin = async (e) => {
    e.preventDefault();
    triggerHaptic(10);
    setIsLoading(true);
    const result = await adminAuthService.loginWithCredentials(loginUser, loginPassword);
    setIsLoading(false);
    if (result.success) {
      setIsAuthenticated(true);
      setAuthRole('admin');
      setCurrentWaiter(null);
      setLoginError(false);
      setLoginPassword('');
    } else {
      setLoginError(true);
      triggerHaptic([40, 60, 40]);
      setTimeout(() => setLoginError(false), 2500);
    }
  };

  const handleLoginWaiter = async (e) => {
    e.preventDefault();
    triggerHaptic(10);
    setIsLoading(true);

    let waiterList = waiters;
    if (!waiterList || waiterList.length === 0) {
      waiterList = await waitersService.getWaiters().catch(() => []);
      setWaiters(waiterList);
    }

    const result = adminAuthService.loginWaiter(waiterUsername, waiterPin, waiterList);
    setIsLoading(false);

    if (result.success) {
      setIsAuthenticated(true);
      setAuthRole('waiter');
      setCurrentWaiter(result.waiter);
      setActiveTab('orders');
      setLoginError(false);
      setWaiterPin('');
    } else {
      setLoginError(result.error || true);
      triggerHaptic([40, 60, 40]);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleLogout = async () => {
    triggerHaptic(10);
    const isWaiter = authRole === 'waiter';
    const confirmed = await showConfirm({
      title: isWaiter ? '¿Finalizar Turno de Mesero?' : '¿Cerrar Sesión de Administrador?',
      message: isWaiter
        ? `¿Confirmas finalizar el turno de ${currentWaiter?.name || 'mesero'}? Podrás volver a ingresar con tu PIN.`
        : '¿Deseas salir del panel administrativo central de Mi Barrunto?',
      confirmText: isWaiter ? 'Finalizar Turno' : 'Cerrar Sesión',
      cancelText: 'Permanecer',
      isDestructive: true
    });
    if (confirmed) {
      await adminAuthService.logout();
      setIsAuthenticated(false);
      setAuthRole(null);
      setCurrentWaiter(null);
    }
  };

  // --- HANDLERS DE PEDIDOS ---
  const handleUpdateOrderStatus = async (orderId, status, estimatedTime = null) => {
    // Si es cancelación, pedir confirmación obligatoria
    if (status === 'cancelled') {
      const confirmed = await showConfirm({
        title: '¿Cancelar Pedido?',
        message: '¿Estás seguro de cancelar este pedido? Se notificará a cocina y meseros.',
        confirmText: 'Sí, cancelar pedido',
        cancelText: 'Volver',
        isDestructive: true
      });
      if (!confirmed) return;
    }

    await ordersService.updateOrderStatus(orderId, status, estimatedTime);
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          ...(estimatedTime ? { estimated_time: estimatedTime } : {})
        };
      }
      return o;
    }));
  };

  const handleAssignWaiter = async (orderId, waiterId) => {
    triggerHaptic(8);
    await ordersService.assignWaiter(orderId, waiterId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, waiter_id: waiterId } : o));
  };

  const handleMarkOrderPaid = async (orderId, isPaid = true, paymentMethod = 'efectivo') => {
    triggerHaptic(10);
    await ordersService.markOrderPaid(orderId, isPaid, paymentMethod);
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      is_paid: isPaid, 
      payment_status: isPaid ? 'paid' : 'pending',
      payment_method: paymentMethod,
      paid_at: isPaid ? new Date().toISOString() : null 
    } : o));
  };

  // Desocupar y Liberar Mesa
  const handleFreeTable = async (tableNumber, orderId = null) => {
    triggerHaptic(12);
    try {
      const tableObj = tables.find(t => String(t.number) === String(tableNumber) || t.name?.includes(String(tableNumber)));
      if (tableObj) {
        await tablesService.closeTable(tableObj.id, tableNumber);
      }
      if (orderId) {
        await ordersService.updateOrderStatus(orderId, 'completed');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      }
      setTables(prev => prev.map(t => (String(t.number) === String(tableNumber)) ? { ...t, status: 'available' } : t));
    } catch (err) {
      console.error('Error liberando mesa:', err);
    }
  };

  // --- HANDLERS DE PLATOS ---
  const handleCreateDish = async (dishData) => {
    const created = await menuService.createDish(dishData);
    setDishes(prev => [...prev, created]);
  };

  const handleUpdateDish = async (id, updates) => {
    const updated = await menuService.updateDish(id, updates);
    setDishes(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
  };

  const handleDeleteDish = async (id) => {
    await menuService.deleteDish(id);
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const handleToggleAvailability = async (id, isAvailable) => {
    await menuService.toggleDishAvailability(id, isAvailable);
    setDishes(prev => prev.map(d => d.id === id ? { ...d, is_available: isAvailable } : d));
  };

  // --- HANDLERS DE CATEGORÍAS ---
  const handleCreateCategory = async (catData) => {
    const created = await menuService.createCategory(catData);
    setCategories(prev => [...prev, created]);
  };

  const handleUpdateCategory = async (id, updates) => {
    const updated = await menuService.updateCategory(id, updates);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteCategory = async (id) => {
    await menuService.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // --- HANDLERS DE MESAS ---
  const handleCreateTable = async (tableData) => {
    const created = await tablesService.createTable(tableData);
    setTables(prev => [...prev, created].sort((a, b) => a.number - b.number));
  };

  const handleUpdateTable = async (id, updates) => {
    const updated = await tablesService.updateTable(id, updates);
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const handleDeleteTable = async (id) => {
    await tablesService.deleteTable(id);
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const handleCloseTable = async (tableId, tableNumber) => {
    triggerHaptic(12);
    const confirmed = await showConfirm({
      title: `¿Cerrar Mesa #${tableNumber}?`,
      message: 'Todos los pedidos pendientes y en preparación de esta mesa se marcarán como completados y la mesa quedará disponible.',
      confirmText: 'Sí, cerrar mesa',
      cancelText: 'Cancelar',
      isDestructive: true
    });
    if (!confirmed) return;

    await tablesService.closeTable(tableId, tableNumber);
    await loadAllData();
    showAlert({
      title: 'Mesa Cerrada',
      message: `La Mesa #${tableNumber} quedó liberada y disponible.`,
      type: 'success'
    });
  };

  // --- HANDLERS DE MESEROS ---
  const handleCreateWaiter = async (waiterData) => {
    const created = await waitersService.createWaiter(waiterData);
    setWaiters(prev => [...prev, created]);
  };

  const handleUpdateWaiter = async (id, updates) => {
    const updated = await waitersService.updateWaiter(id, updates);
    setWaiters(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
  };

  const handleDeleteWaiter = async (id) => {
    await waitersService.deleteWaiter(id);
    setWaiters(prev => prev.filter(w => w.id !== id));
  };

  // Pestañas de navegación
  // Pestañas de navegación según rol y permisos
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const waiterPermLevel = currentWaiter?.permission_level || (currentWaiter?.role === 'capitan' ? 'pedidos_y_mesas' : 'solo_pedidos');

  const navTabs = useMemo(() => {
    const allTabs = [
      { id: 'orders', label: 'Pedidos en Vivo', icon: Bell, badge: pendingCount },
      { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag },
      { id: 'tasks', label: 'Tareas del Equipo', icon: CheckSquare, badge: pendingTasksCount },
      { id: 'invoices', label: 'Facturas & Tickets', icon: Receipt },
      { id: 'customers', label: 'Clientes', icon: Users },
      { id: 'dishes', label: 'Gestión de Platos', icon: Utensils, badge: dishes.length },
      { id: 'tables', label: 'Mesas & QR', icon: QrCode, badge: tables.length },
      { id: 'waiters', label: 'Personal & Meseros', icon: Users, badge: waiters.length },
      { id: 'printable', label: 'Menú Imprimible', icon: Printer }
    ];

    // La cuenta admin siempre puede ver todo
    if (authRole === 'admin') {
      return allTabs;
    }

    // Meseros con permisos según su nivel asignado
    if (authRole === 'waiter') {
      if (waiterPermLevel === 'admin_completo') {
        return allTabs;
      }
      if (waiterPermLevel === 'pedidos_y_mesas') {
        return allTabs.filter(t => t.id === 'orders' || t.id === 'pos' || t.id === 'tasks' || t.id === 'tables' || t.id === 'invoices');
      }
      // 'solo_pedidos' (predeterminado para meseros: pedidos, POS y tareas del equipo)
      return allTabs.filter(t => t.id === 'orders' || t.id === 'pos' || t.id === 'tasks');
    }

    return allTabs;
  }, [authRole, waiterPermLevel, pendingCount, pendingTasksCount, dishes.length, categories.length, tables.length, waiters.length]);

  // Si la pestaña activa no está permitida para el rol actual, redirigir a 'orders'
  useEffect(() => {
    if (navTabs.length > 0 && !navTabs.some(t => t.id === activeTab)) {
      setActiveTab(navTabs[0].id);
    }
  }, [navTabs, activeTab]);

  // 1. Pantalla de Login en TEMA LIGHT con Switcher Admin / Mesero
  if (!isAuthenticated) {
    return (
      <div
        className="admin-theme"
        style={{
          minHeight: '100vh',
          backgroundColor: '#fbf7ee',
          color: '#1f1e1c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: 'var(--font-admin-primary, "DM Sans", -apple-system, sans-serif)'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: '2.5rem 2rem',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.06)',
            border: 'none !important',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          {/* Logo Oficial */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src="/logo/logo.png"
              alt="Logo Mi Barrunto"
              style={{
                width: '74px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 12px rgba(217, 28, 43, 0.2))'
              }}
            />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#1f1e1c', letterSpacing: '-0.3px' }}>
              Mi Barrunto · Panel Operativo
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#78716c', margin: 0 }}>
              Acceso para administración general y meseros de sala
            </p>
          </div>

          {/* Switcher de Modo de Ingreso: Admin vs Mesero */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              backgroundColor: '#f5efe4',
              padding: '0.3rem',
              borderRadius: '14px',
              gap: '0.35rem'
            }}
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setLoginMode('admin');
                setLoginError(false);
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '10px',
                backgroundColor: loginMode === 'admin' ? '#ffffff' : 'transparent',
                color: loginMode === 'admin' ? 'var(--rojo, #d91c2b)' : '#6b635b',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: loginMode === 'admin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={15} />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setLoginMode('waiter');
                setLoginError(false);
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '10px',
                backgroundColor: loginMode === 'waiter' ? '#ffffff' : 'transparent',
                color: loginMode === 'waiter' ? '#2563eb' : '#6b635b',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: loginMode === 'waiter' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={15} />
              <span>Mesero / Sala</span>
            </button>
          </div>

          {/* Formulario Administrador */}
          {loginMode === 'admin' && (
            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Campo Usuario o Correo */}
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Usuario o Correo Administrador
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '1rem', color: '#78716c', pointerEvents: 'none' }}>
                    <Mail size={17} />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="admin@mibarrunto.com"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.85rem',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '16px',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Campo Contraseña Admin */}
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Contraseña de Administrador
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '1rem', color: '#78716c', pointerEvents: 'none' }}>
                    <KeyRound size={17} />
                  </div>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '16px',
                      border: 'none !important',
                      outline: 'none',
                      boxShadow: loginError ? '0 0 0 2px #ef4444' : 'none'
                    }}
                  />
                </div>
                {loginError && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
                    {typeof loginError === 'string' ? loginError : 'Credenciales incorrectas. Verifica el correo y la contraseña.'}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  padding: '0.9rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 8px 25px rgba(217, 28, 43, 0.35)',
                  marginTop: '0.35rem'
                }}
              >
                {isLoading ? 'Verificando...' : 'Ingresar como Administrador'}
              </button>
            </form>
          )}

          {/* Formulario Mesero (Usuario + PIN con Ojo) */}
          {loginMode === 'waiter' && (
            <form onSubmit={handleLoginWaiter} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Nombre de Usuario de Mesero
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '1rem', color: '#78716c', pointerEvents: 'none' }}>
                    <User size={17} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={waiterUsername}
                    onChange={(e) => setWaiterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="ej: carlosg"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.85rem',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '16px',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  PIN de Acceso (4 dígitos)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '1rem', color: '#78716c', pointerEvents: 'none' }}>
                    <KeyRound size={17} />
                  </div>
                  <input
                    type={showWaiterPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={waiterPin}
                    onChange={(e) => setWaiterPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    style={{
                      width: '100%',
                      padding: '0.85rem 2.85rem 0.85rem 2.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '16px',
                      border: 'none !important',
                      outline: 'none',
                      letterSpacing: showWaiterPin ? 'normal' : '3px',
                      boxShadow: loginError ? '0 0 0 2px #ef4444' : 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaiterPin(!showWaiterPin)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      background: 'none',
                      border: 'none !important',
                      color: '#78716c',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showWaiterPin ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {showWaiterPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginError && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
                    {typeof loginError === 'string' ? loginError : 'Usuario o PIN incorrecto. Consulta con administración.'}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  padding: '0.9rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: 'none !important',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)',
                  marginTop: '0.35rem'
                }}
              >
                {isLoading ? 'Verificando...' : 'Iniciar Turno de Mesero'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'transparent',
              color: '#78716c',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginTop: '0.25rem'
            }}
          >
            <ArrowLeft size={15} />
            <span>Volver a la Carta del Menú</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD ADMINISTRATIVO COMPLETO EN TEMA LIGHT CON SIDEBAR
  return (
    <div
      className="admin-theme"
      style={{
        minHeight: '100vh',
        backgroundColor: '#fbf7ee',
        color: '#1f1e1c',
        fontFamily: 'var(--font-admin-primary, "DM Sans", -apple-system, sans-serif)',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative'
      }}
    >
      {/* SIDEBAR DESKTOP FLOTANTE CON BORDES REDONDEADOS */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: '270px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          margin: '1.25rem 0 1.25rem 1.25rem',
          height: 'calc(100vh - 2.5rem)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: '1.25rem',
          zIndex: 800,
          padding: '1.5rem 1rem',
          border: 'none !important'
        }}
      >
        {/* Parte Superior del Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Logo y Nombre Oficial */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0 0.5rem' }}>
            <img
              src="/logo/logo.png"
              alt="Logo Mi Barrunto"
              style={{
                width: '42px',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#1f1e1c' }}>
                  Mi Barrunto
                </h2>
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }}
                  title="Sistema Conectado en Línea"
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 600 }}>
                Panel Administrativo
              </span>
            </div>
          </div>

          {/* Menú de Navegación Lateral */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 310px)',
              paddingRight: '0.2rem'
            }}
          >
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setActiveTab(tab.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    backgroundColor: isActive ? 'var(--rojo, #d91c2b)' : 'transparent',
                    color: isActive ? '#ffffff' : '#44403c',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    border: 'none !important',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 15px rgba(217, 28, 43, 0.3)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </div>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      style={{
                        backgroundColor: isActive ? '#ffffff' : '#f5efe4',
                        color: isActive ? 'var(--rojo, #d91c2b)' : '#1f1e1c',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '0.12rem 0.5rem',
                        borderRadius: '9999px'
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Parte Inferior del Sidebar: Barra Compacta de Utilidades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
          {/* Fila agrupada de 3 utilidades: Probar Sonido, Campana y Carta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.35rem',
              backgroundColor: '#f8f4ec',
              padding: '0.35rem',
              borderRadius: '14px'
            }}
          >
            {/* Probar Sonido */}
            <button
              type="button"
              onClick={handleTestChime}
              title="Probar sonido de campana y notificación"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.45rem 0.25rem',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: '#1f1e1c',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Bell size={14} color="var(--rojo, #d91c2b)" />
              <span>Probar</span>
            </button>

            {/* Toggle Sonido */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setSoundEnabled(!soundEnabled);
              }}
              title={soundEnabled ? 'Campana sonora activa' : 'Campana silenciada'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.45rem 0.25rem',
                borderRadius: '10px',
                backgroundColor: soundEnabled ? 'rgba(21, 128, 61, 0.1)' : '#ffffff',
                color: soundEnabled ? '#15803d' : '#78716c',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundEnabled ? 'Sonido' : 'Mudo'}</span>
            </button>

            {/* Enlace al Menú Público */}
            <button
              type="button"
              onClick={() => navigate('/')}
              title="Abrir la carta pública del menú"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.45rem 0.25rem',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                color: '#1f1e1c',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <ExternalLink size={14} />
              <span>Carta</span>
            </button>
          </div>

          {/* Activar Notificaciones Web Push si no están concedidas */}
          {notificationPermission !== 'granted' && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 28, 43, 0.08)',
                color: 'var(--rojo, #d91c2b)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none !important'
              }}
              title="Recibir avisos en pantalla incluso fuera del navegador"
            >
              <BellRing size={14} />
              <span>Activar Notificaciones Push</span>
            </button>
          )}

          {/* Usuario y Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.95rem',
              borderRadius: '16px',
              backgroundColor: '#f8f4ec'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: authRole === 'waiter' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(217, 28, 43, 0.1)',
                  color: authRole === 'waiter' ? '#2563eb' : 'var(--rojo, #d91c2b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {authRole === 'waiter' ? <UserCheck size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1f1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authRole === 'waiter' ? currentWaiter?.name || 'Mesero de Sala' : 'Administrador'}
                </p>
                <span style={{ fontSize: '0.7rem', color: authRole === 'waiter' ? '#2563eb' : '#78716c', fontWeight: 700 }}>
                  {authRole === 'waiter' 
                    ? `@${currentWaiter?.username || 'mesero'} · Turno Activo` 
                    : 'Acceso Total Central'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '0.5rem',
                borderRadius: '10px',
                border: 'none !important',
                cursor: 'pointer'
              }}
              title={authRole === 'waiter' ? 'Finalizar turno' : 'Cerrar sesión'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* DRAWER MÓVIL DEL SIDEBAR */}
      {isMobileSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex'
          }}
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            style={{
              width: '280px',
              maxWidth: '85%',
              backgroundColor: '#ffffff',
              height: '100%',
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src="/logo/logo.png" alt="Logo" style={{ width: '38px', height: 'auto' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1f1e1c' }}>
                      Mi Barrunto
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#78716c' }}>Panel Administrativo</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  style={{
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    borderRadius: '9999px',
                    padding: '0.4rem',
                    color: '#1f1e1c',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {navTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setActiveTab(tab.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        borderRadius: '14px',
                        backgroundColor: isActive ? 'var(--rojo, #d91c2b)' : 'transparent',
                        color: isActive ? '#ffffff' : '#44403c',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        border: 'none !important'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Icon size={18} />
                        <span>{tab.label}</span>
                      </div>

                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          style={{
                            backgroundColor: isActive ? '#ffffff' : '#f5efe4',
                            color: isActive ? 'var(--rojo, #d91c2b)' : '#1f1e1c',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '0.12rem 0.5rem',
                            borderRadius: '9999px'
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                <ExternalLink size={16} />
                <span>Ver Carta del Menú</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Barra Superior Mínima (Solo visible en Móvil/Tablet cuando el Sidebar lateral está oculto) */}
        <header
          className="admin-mobile-only-header"
          style={{
            position: 'sticky',
            top: '0.75rem',
            zIndex: 700,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            margin: '0.75rem 0.75rem 0 0.75rem',
            borderRadius: '16px',
            padding: '0.65rem 1rem',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setIsMobileSidebarOpen(true);
              }}
              style={{
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                padding: '0.45rem',
                borderRadius: '10px',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Abrir menú"
            >
              <Menu size={19} />
            </button>
            <div>
              <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1f1e1c', display: 'block', lineHeight: 1.2 }}>
                {navTabs.find(t => t.id === activeTab)?.label || 'Panel de Sala'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#78716c' }}>
                Mi Barrunto · {authRole === 'waiter' ? (currentWaiter?.name || 'Mesero') : 'Administración'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: authRole === 'waiter' ? '#2563eb' : 'var(--rojo, #d91c2b)',
                backgroundColor: authRole === 'waiter' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(217, 28, 43, 0.1)',
                padding: '0.25rem 0.6rem',
                borderRadius: '8px'
              }}
            >
              {authRole === 'waiter' ? (currentWaiter?.name?.split(' ')[0] || 'Mesero') : 'Admin'}
            </span>
          </div>
        </header>

        {/* ALERTA FLOTANTE EN VIVO CUANDO LLEGA UN PEDIDO */}
        {incomingOrderAlert && (
          <div
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 1200,
              backgroundColor: '#ffffff',
              borderRadius: '22px',
              padding: '1.15rem 1.35rem',
              boxShadow: '0 15px 45px rgba(217, 28, 43, 0.22)',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              maxWidth: '440px',
              width: 'calc(100vw - 2.5rem)',
              boxSizing: 'border-box',
              animation: 'modalFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BellRing size={24} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--rojo, #d91c2b)', letterSpacing: '0.5px' }}>
                  ¡Nuevo Pedido!
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#f5efe4', padding: '0.1rem 0.45rem', borderRadius: '6px' }}>
                  #{incomingOrderAlert.order_number || ''}
                </span>
              </div>
              <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.96rem', fontWeight: 800, color: '#1f1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {incomingOrderAlert.customer_name} · {incomingOrderAlert.table_number}
              </h4>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#78716c' }}>
                {incomingOrderAlert.items?.length || 1} platos · Total: ${Number(incomingOrderAlert.total_amount || 0).toFixed(2)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setActiveTab('orders');
                  setIncomingOrderAlert(null);
                }}
                style={{
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Ver
              </button>
              <button
                type="button"
                onClick={() => setIncomingOrderAlert(null)}
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#78716c',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.3rem',
                  borderRadius: '8px',
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Contenedor del Cuerpo */}
        <main
          style={{
            flex: 1,
            padding: '1.5rem',
            maxWidth: '1350px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              waiters={waiters}
              tables={tables}
              dishes={dishes}
              onUpdateStatus={handleUpdateOrderStatus}
              onAssignWaiter={handleAssignWaiter}
              onMarkOrderPaid={handleMarkOrderPaid}
              onFreeTable={handleFreeTable}
              onOrderUpdated={(updated) => {
                setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
              }}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'pos' && (
            <AdminPOSTab
              tables={tables}
              orders={orders}
              dishes={dishes}
              categories={categories}
              waiters={waiters}
              currentWaiter={currentWaiter}
              onOrderCreated={(newOrder) => setOrders(prev => [newOrder, ...prev])}
              onOrderUpdated={(updated) => setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))}
              onRefreshData={loadAllData}
            />
          )}

          {activeTab === 'invoices' && (
            <AdminInvoicesTab
              dishes={dishes}
              tables={tables}
              categories={categories}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersTab />
          )}

          {activeTab === 'tasks' && (
            <AdminTasksTab
              waiters={waiters}
              currentWaiter={currentWaiter}
              onTasksCountChange={setPendingTasksCount}
            />
          )}

          {activeTab === 'dishes' && (
            <AdminDishesTab
              dishes={dishes}
              categories={categories}
              onCreateDish={handleCreateDish}
              onUpdateDish={handleUpdateDish}
              onDeleteDish={handleDeleteDish}
              onToggleAvailability={handleToggleAvailability}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'tables' && (
            <AdminTablesTab
              tables={tables}
              orders={orders}
              onCreateTable={handleCreateTable}
              onUpdateTable={handleUpdateTable}
              onDeleteTable={handleDeleteTable}
              onCloseTable={handleCloseTable}
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'waiters' && (
            <AdminWaitersTab
              waiters={waiters}
              onCreateWaiter={handleCreateWaiter}
              onUpdateWaiter={handleUpdateWaiter}
              onDeleteWaiter={handleDeleteWaiter}
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'printable' && (
            <AdminPrintableTab />
          )}
        </main>
      </div>

      {/* BARRA DE NAVEGACIÓN FLOTANTE PARA TABLET Y MÓVIL */}
      <nav
        className="admin-floating-bottom-nav"
        style={{
          position: 'fixed',
          bottom: '12px',
          left: '12px',
          right: '12px',
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '0.4rem 0.65rem',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.12)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 890,
          border: 'none !important'
        }}
      >
        {/* Órdenes */}
        {navTabs.some(t => t.id === 'orders') && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('orders');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '16px',
              backgroundColor: activeTab === 'orders' ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
              color: activeTab === 'orders' ? 'var(--rojo, #d91c2b)' : '#6b635b',
              cursor: 'pointer',
              border: 'none !important',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Pedidos</span>
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Punto de Venta (POS) */}
        {navTabs.some(t => t.id === 'pos') && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('pos');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '16px',
              backgroundColor: activeTab === 'pos' ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
              color: activeTab === 'pos' ? 'var(--rojo, #d91c2b)' : '#6b635b',
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <ShoppingBag size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>TPV</span>
          </button>
        )}

        {/* Facturas */}
        {navTabs.some(t => t.id === 'invoices') && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('invoices');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '16px',
              backgroundColor: activeTab === 'invoices' ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
              color: activeTab === 'invoices' ? 'var(--rojo, #d91c2b)' : '#6b635b',
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <Receipt size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Facturas</span>
          </button>
        )}

        {/* Mesas & QR */}
        {navTabs.some(t => t.id === 'tables') && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('tables');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '16px',
              backgroundColor: activeTab === 'tables' ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
              color: activeTab === 'tables' ? 'var(--rojo, #d91c2b)' : '#6b635b',
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <QrCode size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Mesas</span>
          </button>
        )}

        {/* Platos */}
        {navTabs.some(t => t.id === 'dishes') && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setActiveTab('dishes');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '16px',
              backgroundColor: activeTab === 'dishes' ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
              color: activeTab === 'dishes' ? 'var(--rojo, #d91c2b)' : '#6b635b',
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <Utensils size={20} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Platos</span>
          </button>
        )}

        {/* Más Opciones (Abre Drawer Lateral Completo) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            setIsMobileSidebarOpen(true);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '16px',
            backgroundColor: isMobileSidebarOpen ? 'rgba(217, 28, 43, 0.1)' : 'transparent',
            color: isMobileSidebarOpen ? 'var(--rojo, #d91c2b)' : '#6b635b',
            cursor: 'pointer',
            border: 'none !important'
          }}
        >
          <Menu size={20} />
          <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Más</span>
        </button>
      </nav>

      {/* Estilos CSS específicos para responsive Tablet y Móvil */}
      <style>{`
        @media (max-width: 1024px) {
          .admin-sidebar-desktop {
            display: none !important;
          }
          .admin-mobile-only-header {
            display: flex !important;
          }
          .admin-floating-bottom-nav {
            display: flex !important;
          }
          main {
            padding-bottom: 90px !important;
          }
        }
      `}</style>
    </div>
  );
}
