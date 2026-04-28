import { ERROR_MESSAGES } from './constants.js';

export class StellaPayError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'StellaPayError';
    this.code = code;
    this.details = details;
  }
}

export const handleError = (error) => {
  if (error instanceof StellaPayError) {
    return error;
  }

  if (error?.message?.includes('cancelled')) {
    return new StellaPayError(ERROR_MESSAGES.USER_CANCELLED, 'USER_CANCELLED', error);
  }

  if (error?.message?.includes('simulate')) {
    return new StellaPayError(ERROR_MESSAGES.SIMULATION_FAILED, 'SIMULATION_ERROR', error);
  }

  if (error?.message?.includes('RPC') || error?.message?.includes('fetch')) {
    return new StellaPayError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR', error);
  }

  return new StellaPayError(
    error?.message || 'An unexpected error occurred.',
    error?.code || 'UNKNOWN_ERROR',
    error
  );
};

export const normalizeContractValue = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeContractValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeContractValue(nestedValue)])
    );
  }

  return value;
};

export const isValidStellarAddress = (address) => {
  const pattern = /^G[A-Z2-7]{55}$/;
  return pattern.test(address);
};

export const parseTokenAmount = (value, decimals = 7) => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new StellaPayError(ERROR_MESSAGES.INVALID_AMOUNT, 'INVALID_AMOUNT');
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new StellaPayError(ERROR_MESSAGES.INVALID_AMOUNT, 'INVALID_AMOUNT');
  }

  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > decimals) {
    throw new StellaPayError(
      `Amount supports up to ${decimals} decimal places.`,
      'INVALID_AMOUNT_PRECISION'
    );
  }

  const paddedFraction = fraction.padEnd(decimals, '0');
  return BigInt(`${whole}${paddedFraction || ''}`);
};

export const formatTokenAmount = (
  value,
  decimals = 7,
  maximumFractionDigits = 4
) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const raw = typeof value === 'bigint' ? value : BigInt(String(value));
  const isNegative = raw < 0n;
  const absolute = isNegative ? raw * -1n : raw;
  const divisor = 10n ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = absolute % divisor;
  const fractionString = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionString
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, '');

  return `${isNegative ? '-' : ''}${whole.toString()}${
    trimmedFraction ? `.${trimmedFraction}` : ''
  }`;
};

export const formatAmount = (amount, decimals = 2) => {
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return '0';
  return num.toFixed(decimals);
};

export const formatHash = (hash) => {
  if (!hash) return '';
  if (hash.length <= 12) {
    return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
  }
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
};

export const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const getStellarExpertLink = (hash, network = 'testnet') => {
  const domain = network === 'public' ? 'stellar.expert' : 'testnet.stellar.expert';
  return `https://${domain}/tx/${hash}`;
};
