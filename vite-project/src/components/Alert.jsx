import React from 'react';

export const Alert = ({ type = 'info', message, onClose, className = '' }) => {
  return (
    <div className={['stella-alert', `stella-alert--${type}`, className].filter(Boolean).join(' ')}>
      <span>{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose} className="stella-alert__close" aria-label="Dismiss alert">
          x
        </button>
      ) : null}
    </div>
  );
};
