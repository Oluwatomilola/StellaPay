import React from 'react';

export const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  const baseStyles = 'rounded-lg p-4 mb-4 flex items-center justify-between';
  
  const typeStyles = {
    error: 'bg-red-100 text-red-800 border border-red-300',
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  };

  const icons = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${className}`}>
      <span className="flex items-center gap-2">
        <span>{icons[type]}</span>
        <span>{message}</span>
      </span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm font-bold hover:opacity-70"
        >
          ✕
        </button>
      )}
    </div>
  );
};
