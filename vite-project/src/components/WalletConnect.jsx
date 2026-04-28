import React from 'react';
import { Button } from './Button.jsx';
import { WalletInfo } from './WalletInfo.jsx';
import { Alert } from './Alert.jsx';
import { useWallet } from '../hooks/index.js';

export const WalletConnect = () => {
  const {
    publicKey,
    balance,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
  } = useWallet();

  return (
    <div className="wallet-connect">
      {error ? <Alert type="error" message={error} onClose={clearError} /> : null}
      <WalletInfo publicKey={publicKey} balance={balance} isConnected={isConnected} />
      <div className="wallet-actions">
        {!isConnected ? (
          <Button onClick={connectWallet} isLoading={isLoading}>
            Connect Freighter
          </Button>
        ) : (
          <Button onClick={disconnectWallet} variant="secondary">
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};
