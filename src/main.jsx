import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AlertConfirmProvider } from './context/AlertConfirmContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { purgePwaAndUnregisterSW } from './registerSW';
import App from './App.jsx';
import './index.css';

// Purga inmediata de Service Workers y cachés antiguas
purgePwaAndUnregisterSW();

// Inicializar telemetría de visitas para el panel de administración
(function() {
  let tracked = false;
  const startTracker = () => {
    if (tracked) return;
    tracked = true;
    import('./utils/visitTracker').then(({ visitTracker }) => visitTracker.init()).catch(() => {});
  };
  window.addEventListener('scroll', startTracker, { once: true, passive: true });
  window.addEventListener('touchstart', startTracker, { once: true, passive: true });
  window.addEventListener('pointerdown', startTracker, { once: true, passive: true });
  window.addEventListener('mousemove', startTracker, { once: true, passive: true });
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AlertConfirmProvider>
          <App />
          <SpeedInsights />
        </AlertConfirmProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
