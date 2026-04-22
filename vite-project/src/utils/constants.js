export const SOROBAN_SERVER_URL =
  import.meta.env.VITE_SOROBAN_SERVER_URL || 'https://soroban-testnet.stellar.org';

export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID ||
  'CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN';

export const NETWORK = import.meta.env.VITE_NETWORK || 'testnet';
export const SIMULATION_ACCOUNT = import.meta.env.VITE_SIMULATION_ACCOUNT || '';
export const EVENT_POLL_INTERVAL = Number(import.meta.env.VITE_EVENT_POLL_INTERVAL || 7000);
export const TRANSACTION_POLL_INTERVAL = Number(
  import.meta.env.VITE_TRANSACTION_POLL_INTERVAL || 2000
);
export const TRANSACTION_POLL_ATTEMPTS = Number(
  import.meta.env.VITE_TRANSACTION_POLL_ATTEMPTS || 8
);

export const MONITORING = {
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
  errorWebhookUrl: import.meta.env.VITE_ERROR_WEBHOOK_URL || '',
  environment: import.meta.env.MODE || 'development',
};

export const NETWORKS = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
};

export const NETWORK_PASSPHRASE = NETWORKS[NETWORK] || NETWORKS.testnet;

export const ERROR_MESSAGES = {
  NO_WALLET:
    'Freighter wallet is not connected. Install or unlock Freighter to continue.',
  NO_READ_ACCOUNT:
    'Connect a wallet or configure VITE_SIMULATION_ACCOUNT to load contract data.',
  TRANSACTION_FAILED: 'Transaction failed before final confirmation.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to complete this transaction.',
  INVALID_ADDRESS: 'Invalid Stellar address provided.',
  INVALID_AMOUNT: 'Enter a valid positive amount.',
  USER_CANCELLED: 'Transaction was cancelled in Freighter.',
  SIMULATION_FAILED: 'The Soroban simulation step failed.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
};

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully.',
  PAYMENT_SETTLED: 'Payment submitted and waiting for confirmation.',
  LIQUIDITY_ADDED: 'Liquidity position updated.',
  LIQUIDITY_REMOVED: 'Liquidity withdrawn successfully.',
  REWARDS_CLAIMED: 'Rewards claimed successfully.',
};
