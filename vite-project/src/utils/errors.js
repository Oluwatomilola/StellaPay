// Custom error class for application-specific errors
export class StellaPayError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'StellaPayError';
    this.code = code;
  }
}

// Error handling utility
export const handleError = (error) => {
  console.error('Error:', error);

  if (error instanceof StellaPayError) {
    return {
      message: error.message,
      code: error.code,
      isDApp: true,
    };
  }

  // Freighter wallet errors
  if (error.message?.includes('Freighter')) {
    return {
      message: 'Wallet error: ' + error.message,
      code: 'WALLET_ERROR',
      isDApp: false,
    };
  }

  // Soroban RPC errors
  if (error.message?.includes('RPC')) {
    return {
      message: 'Network error: ' + error.message,
      code: 'NETWORK_ERROR',
      isDApp: false,
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    isDApp: false,
  };
};

// Validate Stellar address format
export const isValidStellarAddress = (address) => {
  const pattern = /^G[A-Z2-7]{56}$/;
  return pattern.test(address);
};

// Format large numbers for display
export const formatAmount = (amount, decimals = 2) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

// Format transaction hash for display
export const formatHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
};

// Get Stellar Expert link
export const getStellarExpertLink = (hash, network = 'testnet') => {
  const domain = network === 'public' ? 'stellar.expert' : 'testnet.stellar.expert';
  return `https://${domain}/tx/${hash}`;
};
