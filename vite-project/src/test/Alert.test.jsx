import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Alert } from '../components/Alert.jsx';

describe('Alert', () => {
  it('renders a success message', () => {
    render(<Alert type="success" message="Rewards claimed." />);
    expect(screen.getByText('Rewards claimed.')).toBeInTheDocument();
    expect(screen.getByText('Rewards claimed.').closest('.stella-alert')).toHaveClass(
      'stella-alert--success'
    );
  });

  it('calls onClose when dismissed', () => {
    const handleClose = vi.fn();
    render(<Alert type="error" message="Network issue" onClose={handleClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
