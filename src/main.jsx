import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AlertConfirmProvider } from './context/AlertConfirmContext';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AlertConfirmProvider>
        <App />
      </AlertConfirmProvider>
    </BrowserRouter>
  </React.StrictMode>
);
