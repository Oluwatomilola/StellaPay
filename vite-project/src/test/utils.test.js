import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidStellarAddress, formatAmount, formatHash, getStellarExpertLink } from '../../utils/errors.js';

describe('Error utilities', () => {
  describe('isValidStellarAddress', () => {
    it('should validate correct Stellar address', () => {
      const validAddress = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX';
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it('should reject invalid address - wrong format', () => {
      expect(isValidStellarAddress('INVALID')).toBe(false);
      expect(isValidStellarAddress('12345')).toBe(false);
    });

    it('should reject empty address', () => {
      expect(isValidStellarAddress('')).toBe(false);
    });
  });

  describe('formatAmount', () => {
    it('should format amount with decimals', () => {
      expect(formatAmount('100.456')).toBe('100.46');
      expect(formatAmount('100.4')).toBe('100.40');
    });

    it('should handle invalid input', () => {
      expect(formatAmount('abc')).toBe('0');
      expect(formatAmount('')).toBe('0');
    });

    it('should use custom decimal places', () => {
      expect(formatAmount('100.456789', 3)).toBe('100.457');
      expect(formatAmount('100', 0)).toBe('100');
    });
  });

  describe('formatHash', () => {
    it('should format hash for display', () => {
      const hash = '1234567890abcdefghij1234567890abcdefghij';
      expect(formatHash(hash)).toBe('123456...fghij');
    });

    it('should handle short hashes', () => {
      const hash = 'short';
      expect(formatHash(hash)).toBe('sh...rt');
    });

    it('should return empty string for empty input', () => {
      expect(formatHash('')).toBe('');
      expect(formatHash(null)).toBe('');
    });
  });

  describe('getStellarExpertLink', () => {
    it('should generate testnet link', () => {
      const hash = 'abc123';
      const link = getStellarExpertLink(hash, 'testnet');
      expect(link).toBe('https://testnet.stellar.expert/tx/abc123');
    });

    it('should generate mainnet link', () => {
      const hash = 'abc123';
      const link = getStellarExpertLink(hash, 'public');
      expect(link).toBe('https://stellar.expert/tx/abc123');
    });
  });
});
