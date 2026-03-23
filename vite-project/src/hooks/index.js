import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext.jsx';

/**
 * Hook to use wallet context
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

/**
 * Hook to format Stellar address
 */
export const useFormatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

/**
 * Hook to format amount with XLM symbol
 */
export const useFormatXLM = (amount) => {
  if (!amount) return '0 XLM';
  const formatted = parseFloat(amount).toFixed(2);
  return `${formatted} XLM`;
};
