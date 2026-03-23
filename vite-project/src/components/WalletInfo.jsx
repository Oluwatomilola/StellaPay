import React from 'react';

export const WalletInfo = ({ publicKey, balance, isConnected }) => {
  if (!isConnected) {
    return null;
  }

  const formatAddress = (addr) => addr && `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  const formatBalance = (bal) => bal && parseFloat(bal).toFixed(2);

  return (
    <div className="bg-stellar-gray rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Address</p>
          <p className="font-mono text-sm font-semibold truncate">
            {formatAddress(publicKey)}
          </p>
          <p className="text-xs text-gray-500 truncate">{publicKey}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Balance</p>
          <p className="text-lg font-bold text-stellar-blue">
            {formatBalance(balance)} XLM
          </p>
        </div>
      </div>
    </div>
  );
};
