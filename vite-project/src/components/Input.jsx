import React from 'react';

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error = null,
  label,
  hint,
  className = '',
  ...props
}) => {
  return (
    <label className="stella-field">
      {label ? <span className="stella-field__label">{label}</span> : null}
      {hint ? <span className="stella-field__hint">{hint}</span> : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={['stella-input', error ? 'stella-input--error' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? <span className="stella-field__error">{error}</span> : null}
    </label>
  );
};
