import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './contexts/WalletContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import monitoringService from './services/monitoringService.js';
import './main.css';

monitoringService.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
