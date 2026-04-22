import React, { createContext, useCallback, useEffect, useState } from 'react';
import walletService from '../services/walletService.js';
import monitoringService from '../services/monitoringService.js';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletState, setWalletState] = useState({
    publicKey: null,
    balance: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setWalletState((previous) => ({
      ...previous,
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

      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_public_key', publicKey);
    } catch (error) {
      const normalized = monitoringService.captureException(error, {
        context: 'WalletProvider.connectWallet',
      });

      setWalletState((previous) => ({
        ...previous,
        isLoading: false,
        error: normalized.message,
      }));
    }
  }, []);

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
    localStorage.removeItem('wallet_public_key');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!walletState.isConnected) {
      return;
    }

    try {
      const balanceData = await walletService.getBalance();
      setWalletState((previous) => ({
        ...previous,
        balance: balanceData.native,
        error: null,
      }));
    } catch (error) {
      const normalized = monitoringService.captureException(error, {
        context: 'WalletProvider.refreshBalance',
      });

      setWalletState((previous) => ({
        ...previous,
        error: normalized.message,
      }));
    }
  }, [walletState.isConnected]);

  const clearError = useCallback(() => {
    setWalletState((previous) => ({
      ...previous,
      error: null,
    }));
  }, []);

  useEffect(() => {
    const wasConnected = localStorage.getItem('wallet_connected') === 'true';
    if (wasConnected) {
      connectWallet();
    }
  }, [connectWallet]);

  const value = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
