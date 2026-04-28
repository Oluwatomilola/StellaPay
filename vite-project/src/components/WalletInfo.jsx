import React from 'react';
import { formatAmount, truncateAddress } from '../utils/errors.js';

export const WalletInfo = ({ publicKey, balance, isConnected }) => {
  if (!isConnected) {
    return null;
  }

  return (
    <div className="wallet-panel">
      <div>
        <span className="wallet-panel__label">Connected wallet</span>
        <strong>{truncateAddress(publicKey)}</strong>
        <p>{publicKey}</p>
      </div>
      <div>
        <span className="wallet-panel__label">XLM balance</span>
        <strong>{formatAmount(balance, 2)}</strong>
        <p>Used for fees and Freighter signing.</p>
      </div>
    </div>
  );
};
