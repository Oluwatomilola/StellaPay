import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from './contexts/WalletContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import monitoringService from './services/monitoringService.js';
import './main.css';

// Polyfill for ethereum provider to suppress wallet extension conflicts
if (!window.ethereum) {
  window.ethereum = {
    isConnected: () => false,
    request: async () => {
      throw new Error('No Ethereum provider found. Use Stellar Freighter instead.');
    },
  };
}

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
