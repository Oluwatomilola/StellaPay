import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import walletService from '../../services/walletService.js';
import * as Freighter from '@stellar/freighter-api';

vi.mock('@stellar/freighter-api');
vi.mock('@stellar/stellar-sdk', () => ({
  SorobanRpc: {
    Server: vi.fn(() => ({
      getAccount: vi.fn(),
    })),
  },
  Networks: {
    TESTNET: 'Test SDF Network ; September 2015',
  },
  BASE_FEE: '100',
}));

describe('Wallet Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletService.disconnect();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isFreighterAvailable', () => {
    it('should return true when Freighter is connected', async () => {
      Freighter.isConnected.mockResolvedValue(true);
      const result = await walletService.isFreighterAvailable();
      expect(result).toBe(true);
    });

    it('should return false when Freighter is not connected', async () => {
      Freighter.isConnected.mockResolvedValue(false);
      const result = await walletService.isFreighterAvailable();
      expect(result).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect to wallet and set public key', async () => {
      const testKey = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX';
      Freighter.isConnected.mockResolvedValue(true);
      Freighter.getAddress.mockResolvedValue(testKey);

      const result = await walletService.connect();
      expect(result).toBe(testKey);
      expect(walletService.getPublicKey()).toBe(testKey);
      expect(walletService.isConnected()).toBe(true);
    });

    it('should throw error if Freighter not available', async () => {
      Freighter.isConnected.mockResolvedValue(false);

      try {
        await walletService.connect();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe('WALLET_NOT_AVAILABLE');
      }
    });
  });

  describe('disconnect', () => {
    it('should disconnect wallet', async () => {
      const testKey = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX';
      Freighter.isConnected.mockResolvedValue(true);
      Freighter.getAddress.mockResolvedValue(testKey);

      await walletService.connect();
      expect(walletService.isConnected()).toBe(true);

      walletService.disconnect();
      expect(walletService.isConnected()).toBe(false);
      expect(walletService.getPublicKey()).toBeNull();
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(walletService.isConnected()).toBe(false);

      walletService.publicKey = 'test';
      walletService.isInitialized = true;
      expect(walletService.isConnected()).toBe(true);
    });
  });
});
