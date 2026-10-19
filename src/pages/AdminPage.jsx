import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Utensils, Layers, QrCode, Users, LogOut, 
  ExternalLink, Lock, Check, ShieldCheck, KeyRound, 
  Clock, Volume2, VolumeX, ArrowLeft, RefreshCw 
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
import { playOrderNotificationSound } from '../utils/orderSound';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminPage() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlertConfirm();

  // Estado de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminAuthService.isAuthenticated());
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Pestaña Activa
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'dishes', 'categories', 'tables', 'waiters'

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

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    triggerHaptic(10);
    const success = adminAuthService.login(enteredPasscode);
    if (success) {
      setIsAuthenticated(true);
      setLoginError(false);
      setEnteredPasscode('');
    } else {
      setLoginError(true);
      triggerHaptic([40, 60, 40]);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = async () => {
    triggerHaptic(10);
    const confirmed = await showConfirm({
      title: '¿Cerrar Sesión?',
      message: '¿Deseas salir del panel administrativo?',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Permanecer'
    });
    if (confirmed) {
      adminAuthService.logout();
      setIsAuthenticated(false);
    }
  };

  // --- HANDLERS DE PEDIDOS ---
  const handleUpdateOrderStatus = async (orderId, status, estimatedTime = null) => {
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

  // Si no está autenticado, mostrar pantalla de PIN/Clave Maestra
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0e0f12',
          color: '#ffffff',
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
            maxWidth: '380px',
            backgroundColor: 'var(--bg-card, #1c1d22)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            border: 'none !important',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          {/* Logo y Candado */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(217, 28, 43, 0.15)',
              color: 'var(--rojo, #d91c2b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
              Mi Barrunto · Admin
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0.35rem 0 0 0' }}>
              Ingresa el PIN o clave de acceso administrativo
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <input
                type="password"
                required
                autoFocus
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value)}
                placeholder="PIN o Clave (Ej: 2026)"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '3px',
                  fontWeight: 800,
                  padding: '0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '16px',
                  border: 'none !important',
                  outline: 'none',
                  boxShadow: loginError ? '0 0 0 2px #ef4444' : 'none'
                }}
              />
              {loginError && (
                <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>
                  Código incorrecto. Intenta nuevamente.
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
                fontSize: '0.95rem',
                padding: '0.85rem',
                borderRadius: '14px',
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 8px 25px rgba(217, 28, 43, 0.4)'
              }}
            >
              Ingresar al Panel
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none !important',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <ArrowLeft size={14} />
              <span>Volver a la Carta del Menú</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Contador de pedidos pendientes
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c0d10',
        color: '#ffffff',
        fontFamily: 'var(--font-primary, system-ui, sans-serif)',
        paddingBottom: '4rem'
      }}
    >
      {/* 1. Header Administrativo Fijo */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: 'rgba(16, 17, 21, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          border: 'none !important',
          padding: '0.75rem 1.25rem'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Logo y Estado en Vivo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1rem'
              }}
            >
              MB
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                  Mi Barrunto · Administración
                </h1>
                {/* Indicador en vivo de Supabase */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 8px #10b981'
                    }}
                  />
                  <span>En Vivo</span>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                Sistema de Pedidos, Cocina & Catálogo Supabase
              </span>
            </div>
          </div>

          {/* Acciones Rápidas del Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Abrir la carta interactiva del cliente"
            >
              <ExternalLink size={14} />
              <span>Ver Menú</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Cerrar sesión administrativa"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Barra de Pestañas Principales */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0.75rem auto 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}
        >
          {[
            { id: 'orders', label: 'Pedidos en Vivo', icon: Bell, badge: pendingCount },
            { id: 'dishes', label: 'Gestión de Platos', icon: Utensils, badge: dishes.length },
            { id: 'categories', label: 'Categorías', icon: Layers, badge: categories.length },
            { id: 'tables', label: 'Mesas & QR', icon: QrCode, badge: tables.length },
            { id: 'waiters', label: 'Personal & Meseros', icon: Users, badge: waiters.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setActiveTab(tab.id);
                }}
                style={{
                  backgroundColor: isActive ? 'var(--rojo, #d91c2b)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '12px',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 15px rgba(217, 28, 43, 0.35)' : 'none'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    style={{
                      backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
                      color: isActive ? 'var(--rojo, #d91c2b)' : '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px'
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Contenedor del Cuerpo */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '1.5rem auto 0 auto',
          padding: '0 1rem'
        }}
      >
        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            waiters={waiters}
            onUpdateStatus={handleUpdateOrderStatus}
            onAssignWaiter={handleAssignWaiter}
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
            onCreateTable={handleCreateTable}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
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
      </main>
    </div>
  );
}
