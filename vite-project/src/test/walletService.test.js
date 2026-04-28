import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAccount = vi.fn();

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock('@stellar/stellar-sdk', () => ({
  SorobanRpc: {
    Server: vi.fn(() => ({
      getAccount: mockGetAccount,
    })),
  },
}));

vi.mock('../services/monitoringService.js', () => ({
  default: {
    captureException: vi.fn((error) => error),
  },
}));

describe('walletService', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetAccount.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('connects and stores the public key', async () => {
    const walletService = (await import('../services/walletService.js')).default;
    const Freighter = await import('@stellar/freighter-api');

    Freighter.isConnected.mockResolvedValue(true);
    Freighter.getAddress.mockResolvedValue(
      'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX'
    );

    const result = await walletService.connect();

    expect(result).toContain('GBUQW');
    expect(walletService.isConnected()).toBe(true);
  });

  it('loads balance for the connected wallet', async () => {
    const walletService = (await import('../services/walletService.js')).default;
    const Freighter = await import('@stellar/freighter-api');

    Freighter.isConnected.mockResolvedValue(true);
    Freighter.getAddress.mockResolvedValue(
      'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX'
    );
    mockGetAccount.mockResolvedValue({
      balances: [{ asset_type: 'native', balance: '320.50' }],
    });

    await walletService.connect();
    const balance = await walletService.getBalance();

    expect(balance.native).toBe('320.50');
  });

  it('disconnects cleanly', async () => {
    const walletService = (await import('../services/walletService.js')).default;
    const Freighter = await import('@stellar/freighter-api');

    Freighter.isConnected.mockResolvedValue(true);
    Freighter.getAddress.mockResolvedValue(
      'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX'
    );

    await walletService.connect();
    walletService.disconnect();

    expect(walletService.isConnected()).toBe(false);
    expect(walletService.getPublicKey()).toBeNull();
  });
});
