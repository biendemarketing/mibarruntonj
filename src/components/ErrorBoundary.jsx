import React from 'react';
import { RotateCcw, AlertTriangle, Home } from 'lucide-react';
import {
  isChunkLoadError,
  recoverFromChunkError,
  purgeCachesAndServiceWorkers
} from '../utils/chunkRecovery';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error no capturado en la aplicación:', error, errorInfo);
    try {
      localStorage.setItem(
        'mb_last_error',
        JSON.stringify({ message: String(error?.message || error), at: new Date().toISOString() })
      );
    } catch {}
    // Si es una desincronización de bundle (nuevo deploy), recuperar automáticamente una vez
    if (isChunkLoadError(error)) {
      recoverFromChunkError();
    }
  }

  handleReload = async () => {
    try {
      sessionStorage.clear();
      await purgeCachesAndServiceWorkers();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#0a0b0e',
          color: '#ffffff',
          fontFamily: 'var(--font-primary, system-ui, sans-serif)'
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: 'rgba(22, 24, 32, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '24px',
            padding: '2.2rem 1.8rem',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            border: 'none !important'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(227, 24, 55, 0.14)',
              color: 'var(--rojo, #e31837)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 24px rgba(227, 24, 55, 0.2)'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Sincronizando Menú de Mi Barrunto
            </h2>

            <p style={{
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.5,
              marginBottom: '1.8rem'
            }}>
              Se ha detectado una actualización en la carta interactiva o un refresco de conexión. Pulsa el botón inferior para recargar la versión más reciente.
            </p>

            {this.state.error && (
              <p style={{
                fontSize: '0.68rem',
                color: 'rgba(255, 255, 255, 0.35)',
                marginTop: '-1.1rem',
                marginBottom: '1.4rem',
                wordBreak: 'break-word'
              }}>
                Código: {String(this.state.error?.message || this.state.error).slice(0, 80)}
              </p>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--rojo, #e31837)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: 'none !important',
                  outline: 'none !important',
                  boxShadow: '0 8px 24px rgba(227, 24, 55, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <RotateCcw size={16} />
                <span>Recargar Menú</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: 'none !important',
                  outline: 'none !important'
                }}
              >
                <Home size={15} />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
