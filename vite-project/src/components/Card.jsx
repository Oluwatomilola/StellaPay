import React from 'react';

export const Card = ({ children, className = '' }) => (
  <section className={['stella-card', className].filter(Boolean).join(' ')}>{children}</section>
);

export const CardHeader = ({ children, className = '' }) => (
  <header className={['stella-card__header', className].filter(Boolean).join(' ')}>{children}</header>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={['stella-card__body', className].filter(Boolean).join(' ')}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <footer className={['stella-card__footer', className].filter(Boolean).join(' ')}>{children}</footer>
);
