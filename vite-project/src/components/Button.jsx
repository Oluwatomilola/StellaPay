import React from 'react';

export const Button = ({
  children,
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const classes = ['stella-button', `stella-button--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {isLoading ? 'Working...' : children}
    </button>
  );
};
