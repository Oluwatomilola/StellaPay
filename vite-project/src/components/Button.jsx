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
  const baseStyles = 'font-semibold py-2 px-4 rounded transition duration-200';
  
  const variantStyles = {
    primary: 'bg-stellar-lightblue text-white hover:bg-stellar-blue disabled:bg-gray-400',
    secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400 disabled:bg-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
