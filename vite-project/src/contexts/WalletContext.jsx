import React, { createContext, useState, useCallback, useEffect } from 'react';
import walletService from '../services/walletService.js';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletState, setWalletState] = useState({
    publicKey: null,
    balance: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setWalletState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const publicKey = await walletService.connect();
      const balanceData = await walletService.getBalance();

      setWalletState({
        publicKey,
        balance: balanceData.native,
        isConnected: true,
        isLoading: false,
        error: null,
      });

      // Store in localStorage for persistence
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_publicKey', publicKey);
    } catch (error) {
      const errorMessage = error.message || 'Failed to connect wallet';
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Wallet connection error:', error);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    walletService.disconnect();
    setWalletState({
      publicKey: null,
      balance: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_publicKey');
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletState.isConnected) return;

    try {
      const balanceData = await walletService.getBalance();
      setWalletState(prev => ({
        ...prev,
        balance: balanceData.native,
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh balance',
      }));
    }
  }, [walletState.isConnected]);

  // Clear error
  const clearError = useCallback(() => {
    setWalletState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true';
    if (wasConnected) {
      connectWallet();
    }
  }, []);

  const value = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
