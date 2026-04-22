import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Input } from '../components/Input.jsx';

describe('Input', () => {
  it('renders a label and hint', () => {
    render(<Input label="Amount" hint="Supports 7 decimals" />);

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Supports 7 decimals')).toBeInTheDocument();
  });

  it('renders an error state', () => {
    render(<Input label="Recipient" error="Address is invalid" />);
    expect(screen.getByText('Address is invalid')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('stella-input--error');
  });

  it('forwards change events', () => {
    const handleChange = vi.fn();
    render(<Input label="Memo" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Payroll' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
