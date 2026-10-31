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
setTimeout(() => { import('./utils/visitTracker').then(({ visitTracker }) => visitTracker.init()).catch(() => {}); }, 1500);

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
