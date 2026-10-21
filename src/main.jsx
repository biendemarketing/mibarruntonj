import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AlertConfirmProvider } from './context/AlertConfirmContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerServiceWorker } from './registerSW';
import App from './App.jsx';
import './index.css';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AlertConfirmProvider>
          <App />
        </AlertConfirmProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
