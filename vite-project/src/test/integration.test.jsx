import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App.jsx';
import contractService from '../services/contractService.js';

vi.mock('../services/contractService.js', () => ({
  default: {
    canRead: vi.fn(() => true),
    getConfig: vi.fn(),
    getTokenMetadata: vi.fn(),
    getPoolState: vi.fn(),
    getRecentPayments: vi.fn(),
    getLastPayment: vi.fn(),
    getProviderPosition: vi.fn(),
    getRewardPoints: vi.fn(),
    quotePayment: vi.fn(),
  },
}));

vi.mock('../services/monitoringService.js', () => ({
  default: {
    captureException: vi.fn((error) => ({ message: error?.message || 'error' })),
  },
}));

vi.mock('../hooks/index.js', () => ({
  useWallet: vi.fn(() => ({
    publicKey: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVXA',
    balance: '42.00',
    isConnected: true,
    refreshBalance: vi.fn(),
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    clearError: vi.fn(),
    error: null,
    isLoading: false,
  })),
  useContractEvents: vi.fn(() => ({
    events: [
      {
        id: 'evt-1',
        label: 'TokenPaymentSettledEvent',
        ledger: 42,
        txHash: 'abc123hash',
        txHashShort: 'abc123...3hash',
        createdAt: '2026-04-22T20:00:00.000Z',
        payload: { amount: '10000000' },
      },
    ],
    error: null,
    refresh: vi.fn(),
  })),
}));

describe('App dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contractService.getConfig.mockResolvedValue({
      payment_fee_bps: 100,
      reward_rate_bps: 500,
      pool_token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    });
    contractService.getTokenMetadata.mockResolvedValue({
      token: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      symbol: 'USDC',
      decimals: 7,
    });
    contractService.getPoolState.mockResolvedValue({
      total_liquidity: '100000000',
      reward_reserve: '5000000',
      collected_fees: '1000000',
      payment_count: '9',
    });
    contractService.getRecentPayments.mockResolvedValue([
      {
        id: '1',
        to: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVXA',
        amount: '25000000',
        fee_amount: '250000',
        reward_points: '1250000',
        memo: 'Invoice 1001',
      },
    ]);
    contractService.getLastPayment.mockResolvedValue({
      to: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVXA',
      amount: '10000000',
      memo: 'Legacy snapshot',
    });
    contractService.getProviderPosition.mockResolvedValue({
      shares: '100000000',
      redeemable_amount: '101000000',
    });
    contractService.getRewardPoints.mockResolvedValue('1250000');
    contractService.quotePayment.mockResolvedValue({
      recipient_amount: '9900000',
      fee_amount: '100000',
      reward_points: '500000',
    });
  });

  it('renders the production dashboard and recent activity', async () => {
    render(<App />);

    expect(
      screen.getByText(/Inter-contract payments, liquidity accounting, and live Soroban telemetry/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Payment Rail')).toBeInTheDocument();
      expect(screen.getByText('Liquidity Engine')).toBeInTheDocument();
      expect(screen.getByText('Contract Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Invoice 1001')).toBeInTheDocument();
      expect(screen.getByText('TokenPaymentSettledEvent')).toBeInTheDocument();
    });
  });
});
