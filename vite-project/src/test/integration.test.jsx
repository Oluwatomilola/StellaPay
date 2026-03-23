import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletProvider } from '../../contexts/WalletContext.jsx';
import { SetPaymentForm } from '../../components/SetPaymentForm.jsx';
import { GetPaymentDisplay } from '../../components/GetPaymentDisplay.jsx';
import walletService from '../../services/walletService.js';
import contractService from '../../services/contractService.js';

// Mock services
vi.mock('../../services/walletService.js', () => ({
  default: {
    isConnected: vi.fn(() => true),
    getPublicKey: vi.fn(() => 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX'),
    getNetworkPassphrase: vi.fn(() => 'Test SDF Network ; September 2015'),
    getServer: vi.fn(() => ({})),
    signTransaction: vi.fn(),
  },
}));

vi.mock('../../services/contractService.js', () => ({
  default: {
    setLastPayment: vi.fn(),
    getLastPayment: vi.fn(),
  },
}));

describe('Integration Tests - Payment Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SetPaymentForm Component', () => {
    it('should display form fields when wallet is connected', () => {
      render(<SetPaymentForm />);
      
      expect(screen.getByLabelText(/Recipient Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Memo/i)).toBeInTheDocument();
    });

    it('should validate form before submission', async () => {
      const user = userEvent.setup();
      render(<SetPaymentForm />);

      const submitButton = screen.getByRole('button', { name: /Submit Payment/i });
      await user.click(submitButton);

      // Should show validation errors
      expect(screen.getByText(/Address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Amount is required/i)).toBeInTheDocument();
    });

    it('should validate Stellar address format', async () => {
      const user = userEvent.setup();
      render(<SetPaymentForm />);

      const addressInput = screen.getByLabelText(/Recipient Address/i);
      await user.type(addressInput, 'INVALID');
      
      const submitButton = screen.getByRole('button', { name: /Submit Payment/i });
      await user.click(submitButton);

      expect(screen.getByText(/Invalid Stellar address/i)).toBeInTheDocument();
    });

    it('should submit valid payment data', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      
      contractService.setLastPayment.mockResolvedValue({
        hash: 'abc123def456',
        status: 'pending',
      });

      render(<SetPaymentForm onSuccess={onSuccess} />);

      const addressInput = screen.getByLabelText(/Recipient Address/i);
      const amountInput = screen.getByLabelText(/Amount/i);
      const memoInput = screen.getByLabelText(/Memo/i);
      const submitButton = screen.getByRole('button', { name: /Submit Payment/i });

      await user.type(addressInput, 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX');
      await user.type(amountInput, '100');
      await user.type(memoInput, 'Test payment');
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(contractService.setLastPayment).toHaveBeenCalledWith(
          'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX',
          100,
          'Test payment'
        );
      });
    });
  });

  describe('GetPaymentDisplay Component', () => {
    it('should display payment data when retrieved', async () => {
      const user = userEvent.setup();
      const mockPayment = {
        to: 'GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX',
        amount: 100,
        memo: 'Test payment',
      };

      contractService.getLastPayment.mockResolvedValue(mockPayment);

      render(<GetPaymentDisplay />);

      const button = screen.getByRole('button', { name: /Get Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJOCCQ26B7YPGD5CQ67GVGVX/)).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Test payment')).toBeInTheDocument();
      });
    });

    it('should handle errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to retrieve payment';

      contractService.getLastPayment.mockRejectedValue(new Error(errorMessage));

      render(<GetPaymentDisplay />);

      const button = screen.getByRole('button', { name: /Get Payment/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate amount is positive', async () => {
      const user = userEvent.setup();
      render(<SetPaymentForm />);

      const amountInput = screen.getByLabelText(/Amount/i);
      const submitButton = screen.getByRole('button', { name: /Submit Payment/i });

      await user.type(amountInput, '-100');
      await user.click(submitButton);

      expect(screen.getByText(/Amount must be a positive number/i)).toBeInTheDocument();
    });

    it('should validate memo length', async () => {
      const user = userEvent.setup();
      render(<SetPaymentForm />);

      const memoInput = screen.getByLabelText(/Memo/i);
      const submitButton = screen.getByRole('button', { name: /Submit Payment/i });

      // Type 29 characters (max is 28)
      await user.type(memoInput, 'a'.repeat(29));
      await user.click(submitButton);

      expect(screen.getByText(/Memo must be 28 characters or less/i)).toBeInTheDocument();
    });
  });
});
