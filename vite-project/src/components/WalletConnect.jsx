import React from 'react';
import { Button } from './Button.jsx';
import { WalletInfo } from './WalletInfo.jsx';
import { useWallet } from '../hooks/index.js';

export const WalletConnect = () => {
  const { publicKey, balance, isConnected, isLoading, error, connectWallet, disconnectWallet, clearError } = useWallet();

  return (
    <div className="mb-6">
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4 flex justify-between items-center">
          <p>{error}</p>
          <button onClick={clearError} className="text-sm font-bold">✕</button>
        </div>
      )}
      
      <WalletInfo
        publicKey={publicKey}
        balance={balance}
        isConnected={isConnected}
      />

      <div className="flex gap-3">
        {!isConnected ? (
          <Button
            onClick={connectWallet}
            isLoading={isLoading}
            className="flex-1"
          >
            🔑 Connect Wallet
          </Button>
        ) : (
          <Button
            onClick={disconnectWallet}
            variant="secondary"
            className="flex-1"
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};
