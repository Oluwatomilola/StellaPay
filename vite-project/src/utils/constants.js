export const SOROBAN_SERVER_URL = import.meta.env.VITE_SOROBAN_SERVER_URL || 'https://soroban-testnet.stellar.org';
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || 'CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN';
export const NETWORK = import.meta.env.VITE_NETWORK || 'testnet';
export const BASE_TRANSACTION_FEE = '100';

// Network configuration
export const NETWORKS = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
};

export const NETWORK_PASSPHRASE = NETWORKS[NETWORK] || NETWORKS.testnet;

// Common error messages
export const ERROR_MESSAGES = {
  NO_WALLET: 'Freighter wallet not connected. Please install and connect your wallet.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction.',
  INVALID_ADDRESS: 'Invalid Stellar address provided.',
  INVALID_AMOUNT: 'Amount must be a positive number.',
  USER_CANCELLED: 'Transaction was cancelled by user.',
  SIMULATION_FAILED: 'Failed to simulate transaction.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  PAYMENT_SET: 'Payment recorded successfully!',
  PAYMENT_RETRIEVED: 'Payment retrieved successfully!',
};
