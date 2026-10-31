import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Smartphone, Monitor, Clock, ShoppingCart, 
  TrendingUp, Globe, RefreshCw, Calendar, ArrowUpRight, 
  ShieldCheck, Eye, Compass
} from 'lucide-react';
import { supabase } from '../services/supabase';

export function AdminAnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedRange, setSelectedRange] = useState('today'); // 'today', 'week', 'all'
  const [isLoading, setIsLoading] = useState(true);

  // Cargar analíticas desde Supabase (restaurant_config)
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const todayKey = `analytics_${new Date().toISOString().split('T')[0]}`;
      
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('key, value, updated_at')
        .ilike('key', 'analytics_%')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Consolidar métricas según el rango seleccionado
        let totalPageviews = 0;
        let uniqueVisitorsCount = 0;
        let devices = { mobile: 0, desktop: 0, tablet: 0 };
        let browsers = {};
        let operatingSystems = {};
        let totalDuration = 0;
        let durationSamples = 0;
        let totalOrders = 0;
        let totalRevenue = 0;
        let allSessions = [];

        const filteredEntries = selectedRange === 'today' 
          ? data.filter(d => d.key === todayKey)
          : data;

        filteredEntries.forEach(entry => {
          const val = entry.value || {};
          totalPageviews += (val.total_pageviews || 0);

          if (val.unique_visitors) {
            uniqueVisitorsCount += Object.keys(val.unique_visitors).length;
          }

          if (val.devices) {
            devices.mobile += (val.devices.mobile || 0);
            devices.desktop += (val.devices.desktop || 0);
            devices.tablet += (val.devices.tablet || 0);
          }

          if (val.browsers) {
            Object.entries(val.browsers).forEach(([b, count]) => {
              browsers[b] = (browsers[b] || 0) + count;
            });
          }

          if (val.operating_systems) {
            Object.entries(val.operating_systems).forEach(([os, count]) => {
              operatingSystems[os] = (operatingSystems[os] || 0) + count;
            });
          }

          if (Array.isArray(val.durations) && val.durations.length > 0) {
            const sum = val.durations.reduce((a, b) => a + b, 0);
            totalDuration += sum;
            durationSamples += val.durations.length;
          }

          if (val.conversions) {
            totalOrders += (val.conversions.orders || 0);
            totalRevenue += (val.conversions.revenue || 0);
          }

          if (Array.isArray(val.recent_sessions)) {
            allSessions.push(...val.recent_sessions);
          }
        });

        // Ordenar sesiones por fecha más reciente
        allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const avgDurationSeconds = durationSamples > 0 
          ? Math.round(totalDuration / durationSamples) 
          : 0;

        const conversionRate = uniqueVisitorsCount > 0 
          ? ((totalOrders / uniqueVisitorsCount) * 100).toFixed(1) 
          : '0.0';

        setAnalyticsData({
          totalPageviews,
          uniqueVisitorsCount,
          devices,
          browsers,
          operatingSystems,
          avgDurationSeconds,
          totalOrders,
          totalRevenue,
          conversionRate,
          recentSessions: allSessions.slice(0, 30)
        });
      } else {
        // Estado inicial sin visitas todavía registradas
        setAnalyticsData({
          totalPageviews: 0,
          uniqueVisitorsCount: 0,
          devices: { mobile: 0, desktop: 0, tablet: 0 },
          browsers: {},
          operatingSystems: {},
          avgDurationSeconds: 0,
          totalOrders: 0,
          totalRevenue: 0,
          conversionRate: '0.0',
          recentSessions: []
        });
      }
    } catch (err) {
      console.error('Error cargando analíticas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresco cada 20 segundos
    const timer = setInterval(fetchAnalytics, 20000);
    return () => clearInterval(timer);
  }, [selectedRange]);

  // Formato amigable de duración
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return 'Menos de 1m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const totalDevCount = useMemo(() => {
    if (!analyticsData) return 1;
    const { mobile, desktop, tablet } = analyticsData.devices;
    return (mobile + desktop + tablet) || 1;
  }, [analyticsData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* HEADER DE CONTROL */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        backgroundColor: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '16px',
        border: '1px solid #e7e5e4',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={22} color="var(--rojo, #d91c2b)" />
            Analíticas de Tráfico &amp; Conversión en Vivo
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#78716c' }}>
            Monitoreo en tiempo real de visitas, dispositivos, tiempo de sesión y pedidos completados.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Selector de Rango */}
          <div style={{ display: 'flex', backgroundColor: '#f5f5f4', borderRadius: '10px', padding: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setSelectedRange('today')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedRange === 'today' ? '#ffffff' : 'transparent',
                color: selectedRange === 'today' ? '#1c1917' : '#78716c',
                boxShadow: selectedRange === 'today' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange('all')}
              style={{
                border: 'none',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedRange === 'all' ? '#ffffff' : 'transparent',
                color: selectedRange === 'all' ? '#1c1917' : '#78716c',
                boxShadow: selectedRange === 'all' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Histórico Completo
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            title="Refrescar métricas"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#f5f5f4',
              border: '1px solid #e7e5e4',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#44403c'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS PRINCIPALES (KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.9rem'
      }}>
        {/* KPI 1: Visitantes Únicos */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.1rem',
          border: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>
              Visitantes Únicos
            </span>
            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.35rem', borderRadius: '10px' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1c1917', margin: '0.4rem 0 0.1rem 0' }}>
            {analyticsData?.uniqueVisitorsCount || 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ArrowUpRight size={13} /> Dispositivos individuales
          </span>
        </div>

        {/* KPI 2: Visitas / Páginas Vistas */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.1rem',
          border: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>
              Total de Vistas
            </span>
            <div style={{ backgroundColor: '#fef2f2', color: 'var(--rojo, #d91c2b)', padding: '0.35rem', borderRadius: '10px' }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1c1917', margin: '0.4rem 0 0.1rem 0' }}>
            {analyticsData?.totalPageviews || 0}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 600 }}>
            Interacciones en la carta
          </span>
        </div>

        {/* KPI 3: Tiempo Promedio de Sesión */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.1rem',
          border: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>
              Permanencia Media
            </span>
            <div style={{ backgroundColor: '#fefce8', color: '#ca8a04', padding: '0.35rem', borderRadius: '10px' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1c1917', margin: '0.4rem 0 0.1rem 0' }}>
            {formatDuration(analyticsData?.avgDurationSeconds)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 600 }}>
            Tiempo explorando el menú
          </span>
        </div>

        {/* KPI 4: Conversión y Pedidos */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.1rem',
          border: '1px solid #e7e5e4',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>
              Conversión de Compra
            </span>
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.35rem', borderRadius: '10px' }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', margin: '0.4rem 0 0.1rem 0' }}>
            {analyticsData?.conversionRate || '0.0'}%
          </div>
          <span style={{ fontSize: '0.72rem', color: '#44403c', fontWeight: 700 }}>
            {analyticsData?.totalOrders || 0} pedidos completados
          </span>
        </div>
      </div>

      {/* SECCIÓN INTERMEDIA: DISPOSITIVOS Y NAVEGADORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Distribución por Dispositivo */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #e7e5e4'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={18} color="#2563eb" /> Dispositivos de los Clientes
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Móviles */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Smartphone size={14} /> Celulares / Móviles</span>
                <span>{analyticsData?.devices?.mobile || 0} ({Math.round(((analyticsData?.devices?.mobile || 0) / totalDevCount) * 100)}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f5f5f4', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(((analyticsData?.devices?.mobile || 0) / totalDevCount) * 100)}%`, height: '100%', backgroundColor: '#2563eb' }} />
              </div>
            </div>

            {/* Computadoras */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Monitor size={14} /> Computadoras (Desktop/Laptop)</span>
                <span>{analyticsData?.devices?.desktop || 0} ({Math.round(((analyticsData?.devices?.desktop || 0) / totalDevCount) * 100)}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f5f5f4', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(((analyticsData?.devices?.desktop || 0) / totalDevCount) * 100)}%`, height: '100%', backgroundColor: '#16a34a' }} />
              </div>
            </div>

            {/* Tablets */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Compass size={14} /> Tablets / iPads</span>
                <span>{analyticsData?.devices?.tablet || 0} ({Math.round(((analyticsData?.devices?.tablet || 0) / totalDevCount) * 100)}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f5f5f4', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(((analyticsData?.devices?.tablet || 0) / totalDevCount) * 100)}%`, height: '100%', backgroundColor: '#f59e0b' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Navegadores & Sistemas Operativos */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #e7e5e4'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="#16a34a" /> Navegadores y Sistemas
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Navegadores */}
            <div style={{ backgroundColor: '#fafaf9', padding: '0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>Navegadores</span>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {Object.keys(analyticsData?.browsers || {}).length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Sin registros aún</span>
                ) : (
                  Object.entries(analyticsData.browsers).slice(0, 4).map(([name, count]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                      <span style={{ color: '#44403c' }}>{name}</span>
                      <span style={{ color: '#78716c' }}>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sistemas Operativos */}
            <div style={{ backgroundColor: '#fafaf9', padding: '0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase' }}>Sistema Operativo</span>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {Object.keys(analyticsData?.operatingSystems || {}).length === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Sin registros aún</span>
                ) : (
                  Object.entries(analyticsData.operatingSystems).slice(0, 4).map(([name, count]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                      <span style={{ color: '#44403c' }}>{name}</span>
                      <span style={{ color: '#78716c' }}>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE SESIONES EN VIVO */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e7e5e4',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f5f5f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1c1917' }}>
              Registro de Sesiones de Clientes (En Vivo)
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
              Historial detallado con resolución de pantalla, permanencia y si realizaron pedido.
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafaf9', borderBottom: '1px solid #e7e5e4', color: '#78716c', fontWeight: 800 }}>
                <th style={{ padding: '0.75rem 1rem' }}>Hora / Fecha</th>
                <th style={{ padding: '0.75rem 1rem' }}>Dispositivo &amp; Navegador</th>
                <th style={{ padding: '0.75rem 1rem' }}>Resolución</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ubicación</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tiempo de Permanencia</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>¿Compró?</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData?.recentSessions?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#a8a29e', fontWeight: 600 }}>
                    Esperando las primeras visitas de clientes en vivo...
                  </td>
                </tr>
              ) : (
                analyticsData?.recentSessions?.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid #f5f5f4' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#1c1917', fontWeight: 600 }}>
                      {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <div style={{ fontSize: '0.68rem', color: '#a8a29e' }}>
                        {new Date(s.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#1c1917', textTransform: 'capitalize' }}>
                        {s.deviceType === 'mobile' ? '📱 Móvil' : s.deviceType === 'desktop' ? '💻 Computadora' : '📟 Tablet'}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: '#78716c' }}>
                        {s.browser} · {s.os}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                      {s.screenRes}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#44403c' }}>
                      {s.city || 'Paterson'} ({s.country || 'US'})
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#ca8a04' }}>
                      {formatDuration(s.durationSeconds)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {s.hasOrdered ? (
                        <span style={{
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}>
                          Sí (${Number(s.orderTotal || 0).toFixed(2)})
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: '#f5f5f4',
                          color: '#78716c',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.72rem'
                        }}>
                          Exploró Carta
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

