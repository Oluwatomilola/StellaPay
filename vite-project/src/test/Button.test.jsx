import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../components/Button.jsx';

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
  });

  it('calls the click handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Connect</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables the control', () => {
    render(<Button isLoading>Submit</Button>);

    expect(screen.getByRole('button', { name: 'Working...' })).toBeDisabled();
  });

  it('applies the requested variant class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('stella-button--secondary');
  });
});
