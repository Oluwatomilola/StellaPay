import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../../components/Alert.jsx';

describe('Alert Component', () => {
  it('should render success alert', () => {
    render(<Alert type="success" message="Success message" />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should render error alert', () => {
    render(<Alert type="error" message="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('should render warning alert', () => {
    render(<Alert type="warning" message="Warning message" />);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should render info alert', () => {
    render(<Alert type="info" message="Info message" />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(<Alert type="error" message="Error" onClose={handleClose} />);
    
    const closeButton = screen.getByText('✕');
    closeButton.click();
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
