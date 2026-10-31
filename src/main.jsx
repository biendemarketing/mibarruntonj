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
