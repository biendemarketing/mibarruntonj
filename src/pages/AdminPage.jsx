import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Utensils, Layers, QrCode, Users, LogOut, 
  ExternalLink, Lock, Check, ShieldCheck, KeyRound, 
  Clock, Volume2, VolumeX, ArrowLeft, RefreshCw, Printer,
  Menu, X, Mail, ShieldAlert, Sparkles, ChefHat, User
} from 'lucide-react';
import { 
  ordersService, menuService, tablesService, 
  waitersService, adminAuthService 
} from '../services/supabase';
import { AdminOrdersTab } from '../components/AdminOrdersTab';
import { AdminDishesTab } from '../components/AdminDishesTab';
import { AdminCategoriesTab } from '../components/AdminCategoriesTab';
import { AdminTablesTab } from '../components/AdminTablesTab';
import { AdminWaitersTab } from '../components/AdminWaitersTab';
import { AdminPrintableTab } from '../components/AdminPrintableTab';
import { playOrderNotificationSound } from '../utils/orderSound';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminPage() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlertConfirm();

  // Estado de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());
  const [loginUser, setLoginUser] = useState('admin@mibarrunto.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

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

  // Estados de carga y sonido
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cargar datos completos desde Supabase
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedOrders, fetchedDishes, fetchedCategories, fetchedTables, fetchedWaiters] = await Promise.all([
        ordersService.getAllOrders().catch(() => []),
        menuService.getDishes().catch(() => []),
        menuService.getCategories().catch(() => []),
        tablesService.getTables().catch(() => []),
        waitersService.getWaiters().catch(() => [])
      ]);

      setOrders(fetchedOrders);
      setDishes(fetchedDishes);
      setCategories(fetchedCategories);
      setTables(fetchedTables);
      setWaiters(fetchedWaiters);
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
        triggerHaptic([30, 80, 50]);
        if (soundEnabled) {
          playOrderNotificationSound();
        }
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

  // Login Handler con Usuario + Contraseña y Referencia
  const handleLogin = (e) => {
    e.preventDefault();
    triggerHaptic(10);
    const success = adminAuthService.loginWithCredentials(loginUser, loginPassword);
    if (success) {
      setIsAuthenticated(true);
      setLoginError(false);
      setLoginPassword('');
    } else {
      setLoginError(true);
      triggerHaptic([40, 60, 40]);
      setTimeout(() => setLoginError(false), 2500);
    }
  };

  const handleLogout = async () => {
    triggerHaptic(10);
    const confirmed = await showConfirm({
      title: '¿Cerrar Sesión?',
      message: '¿Deseas salir del panel administrativo de Mi Barrunto?',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Permanecer',
      isDestructive: true
    });
    if (confirmed) {
      adminAuthService.logout();
      setIsAuthenticated(false);
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

  const handleMarkOrderPaid = async (orderId, isPaid = true) => {
    triggerHaptic(10);
    await ordersService.markOrderPaid(orderId, isPaid);
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      is_paid: isPaid, 
      payment_status: isPaid ? 'paid' : 'pending',
      paid_at: isPaid ? new Date().toISOString() : null 
    } : o));
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
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const navTabs = [
    { id: 'orders', label: 'Pedidos en Vivo', icon: Bell, badge: pendingCount },
    { id: 'dishes', label: 'Gestión de Platos', icon: Utensils, badge: dishes.length },
    { id: 'categories', label: 'Categorías', icon: Layers, badge: categories.length },
    { id: 'tables', label: 'Mesas & QR', icon: QrCode, badge: tables.length },
    { id: 'waiters', label: 'Personal & Meseros', icon: Users, badge: waiters.length },
    { id: 'printable', label: 'Menú Imprimible', icon: Printer }
  ];

  // 1. Pantalla de Login en TEMA LIGHT
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#fbf7ee',
          color: '#1f1e1c',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: 'var(--font-primary, system-ui, sans-serif)'
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
              Mi Barrunto · Administración
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#78716c', margin: 0 }}>
              Acceso seguro para administración, cocina y meseros
            </p>
          </div>

          {/* Caja de Referencia de Credenciales */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#f8f4ec',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--rojo, #d91c2b)', fontWeight: 800, fontSize: '0.78rem' }}>
              <ShieldCheck size={16} />
              <span>Credenciales de Acceso:</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#57534e', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span><strong>Usuario / Correo:</strong> <code style={{ backgroundColor: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>admin@mibarrunto.com</code></span>
              <span><strong>Contraseña:</strong> <code style={{ backgroundColor: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>barrunto2026</code> (o PIN: <code style={{ backgroundColor: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>2026</code>)</span>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Campo Usuario o Correo */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                Usuario o Correo Electrónico
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
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
              </div>
            </div>

            {/* Campo Contraseña o PIN */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                Contraseña o Clave Maestra
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
                  Credenciales incorrectas. Verifica el correo y la contraseña.
                </span>
              )}
            </div>

            <button
              type="submit"
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
              Ingresar al Panel
            </button>

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
          </form>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD ADMINISTRATIVO COMPLETO EN TEMA LIGHT CON SIDEBAR
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fbf7ee',
        color: '#1f1e1c',
        fontFamily: 'var(--font-primary, system-ui, sans-serif)',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative'
      }}
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: '270px',
          backgroundColor: '#ffffff',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 800,
          padding: '1.5rem 1rem'
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
                  title="Conectado a Supabase en Vivo"
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 600 }}>
                Panel Administrativo
              </span>
            </div>
          </div>

          {/* Menú de Navegación Lateral */}
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

        {/* Parte Inferior del Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
          {/* Toggle Sonido de Pedidos */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setSoundEnabled(!soundEnabled);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              backgroundColor: '#f8f4ec',
              color: soundEnabled ? '#15803d' : '#78716c',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Notificación Sonora Activa' : 'Sonido Silenciado'}</span>
          </button>

          {/* Enlace al Menú Público */}
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important'
            }}
          >
            <ExternalLink size={15} />
            <span>Ver Carta del Menú</span>
          </button>

          {/* Usuario y Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: '14px',
              backgroundColor: '#f8f4ec'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(217, 28, 43, 0.1)',
                  color: 'var(--rojo, #d91c2b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <User size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#1f1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {adminAuthService.getCurrentUser()}
                </p>
                <span style={{ fontSize: '0.68rem', color: '#78716c' }}>Administrador</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '0.45rem',
                borderRadius: '8px',
                border: 'none !important',
                cursor: 'pointer'
              }}
              title="Cerrar sesión"
            >
              <LogOut size={15} />
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
        {/* Topbar Superior */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 700,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '0.85rem 1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          {/* Botón Hamburguesa en Móvil + Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              className="admin-hamburger-btn"
              onClick={() => {
                triggerHaptic(8);
                setIsMobileSidebarOpen(true);
              }}
              style={{
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                padding: '0.5rem',
                borderRadius: '10px',
                border: 'none !important',
                cursor: 'pointer',
                display: 'none' // Se muestra en CSS para móviles
              }}
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#1f1e1c' }}>
                {navTabs.find(t => t.id === activeTab)?.label || 'Panel de Administración'}
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
                Sistema Centralizado en Supabase
              </span>
            </div>
          </div>

          {/* Acciones Rápidas del Topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={loadAllData}
              disabled={isLoading}
              style={{
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                padding: '0.55rem 0.95rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none !important',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
              <span>Sincronizar</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                padding: '0.55rem 1.05rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none !important',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 15px rgba(217, 28, 43, 0.25)'
              }}
            >
              <ExternalLink size={14} />
              <span>Ver Menú</span>
            </button>
          </div>
        </header>

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
              onUpdateStatus={handleUpdateOrderStatus}
              onAssignWaiter={handleAssignWaiter}
              onMarkOrderPaid={handleMarkOrderPaid}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onRefresh={loadAllData}
              isLoading={isLoading}
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
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
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

      {/* Estilos CSS específicos para responsive del sidebar */}
      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar-desktop {
            display: none !important;
          }
          .admin-hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
