import React, { useState, useEffect } from 'react';
import { 
  Printer, Save, RefreshCw, ExternalLink, FileText, 
  Clock, Phone, MapPin, Percent, Sparkles, CheckCircle2 
} from 'lucide-react';
import { restaurantConfigService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminPrintableTab() {
  const { showAlert } = useAlertConfirm();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [config, setConfig] = useState({
    title: 'MI BARRUNTO',
    subtitle: 'Restaurant & Grocery',
    tagline: 'Comida criolla peruana',
    bannerText: 'TRADICIÓN & SAZÓN PERUANA',
    address: '21 Mill St, #9, Paterson, NJ 07501',
    phone: '(973) 653-3749',
    schedule: 'Atención 24 Horas',
    gratitudeTextEs: 'Agradecimiento del 18% en las mesas con 2 ó más personas',
    gratitudeTextEn: 'Gratitude of 18% on table 2 or more people',
    footerNotes: 'Cevichería tradicional, mariscos frescos, brasas y sazón criolla al instante.'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const data = await restaurantConfigService.getPrintableMenuConfig();
      if (data && typeof data === 'object') {
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error cargando configuración del menú imprimible:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      triggerHaptic(12);
      setIsSaving(true);
      await restaurantConfigService.updatePrintableMenuConfig(config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      showAlert({
        title: 'Configuración Guardada',
        message: 'Los textos del menú imprimible han sido actualizados en Supabase y se sincronizarán con la carta.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error guardando configuración:', err);
      showAlert({
        title: 'Error al Guardar',
        message: err.message || 'No se pudo guardar la configuración.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPrintableMenu = (mode = 'light') => {
    triggerHaptic(10);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/menu_imprimible.html${mode === 'dark' ? '?dark=1' : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.35rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: 'none !important'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={22} color="var(--rojo, #d91c2b)" />
            Personalización del Menú Imprimible (11x8.5)
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#78716c' }}>
            Modifica títulos, horarios, teléfonos, leyendas y nota de servicio del 18% reflejados en la carta PDF e imprimible.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={loadConfig}
            disabled={isLoading}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Recargar</span>
          </button>

          <button
            type="button"
            onClick={() => openPrintableMenu('light')}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 1.15rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
            title="Abrir vista previa del menú imprimible"
          >
            <ExternalLink size={15} />
            <span>Ver Carta Imprimible</span>
          </button>
        </div>
      </div>

      {/* Formulario de Configuración */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Bloque 1: Identidad y Portada */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '1.35rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileText size={18} />
              Cabecera y Títulos de Portada
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Nombre / Título Principal
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleChange('title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Subtítulo (Ej: Restaurant & Grocery)
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Slogan / Especialidad (Ej: Comida criolla peruana)
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Cinta / Medallón Destacado
              </label>
              <input
                type="text"
                value={config.bannerText}
                onChange={(e) => handleChange('bannerText', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Bloque 2: Información de Contacto, Horario y Propina */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '1.35rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#d97706', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Clock size={18} />
              Horarios, Contacto y Leyenda del 18%
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Horario de Atención (Ej: Atención 24 Horas)
              </label>
              <input
                type="text"
                value={config.schedule}
                onChange={(e) => handleChange('schedule', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Teléfono de Contacto & Pedidos
              </label>
              <input
                type="text"
                value={config.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Dirección Física
              </label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => handleChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Aviso de Gratitud del 18% (Español)
              </label>
              <input
                type="text"
                value={config.gratitudeTextEs}
                onChange={(e) => handleChange('gratitudeTextEs', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#1f1e1c', fontWeight: 800, marginBottom: '0.35rem' }}>
                Aviso de Gratitud del 18% (Inglés)
              </label>
              <input
                type="text"
                value={config.gratitudeTextEn}
                onChange={(e) => handleChange('gratitudeTextEn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  border: 'none !important',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              backgroundColor: savedSuccess ? '#10b981' : 'var(--rojo, #d91c2b)',
              color: '#ffffff',
              padding: '0.85rem 2rem',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              boxShadow: '0 4px 20px rgba(217, 28, 43, 0.35)',
              transition: 'all 0.25s ease'
            }}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>¡Guardado con Éxito!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar Cambios del Menú Imprimible'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
