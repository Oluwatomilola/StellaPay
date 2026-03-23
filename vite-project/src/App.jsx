import React from 'react';
import './App.css';
import { WalletConnect } from './components/WalletConnect.jsx';
import { SetPaymentForm } from './components/SetPaymentForm.jsx';
import { GetPaymentDisplay } from './components/GetPaymentDisplay.jsx';
import { Card, CardHeader, CardBody } from './components/Card.jsx';

function App() {
  const handlePaymentSuccess = (result) => {
    console.log('Payment set successfully:', result);
  };

  const handlePaymentRetrieved = (payment) => {
    console.log('Payment retrieved:', payment);
  };

  return (
    <div className="min-h-screen bg-stellar-gray py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stellar-blue mb-2">💰 StellaPay</h1>
          <p className="text-gray-600">A complete mini-dApp for Stellar payments</p>
          <p className="text-xs text-gray-500 mt-2">Built with React, Vite, and Soroban</p>
        </div>

        {/* Wallet Connection */}
        <WalletConnect />

        {/* Main Content - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Set Payment */}
          <div>
            <SetPaymentForm onSuccess={handlePaymentSuccess} />
          </div>

          {/* Get Payment */}
          <div>
            <GetPaymentDisplay onPaymentRetrieved={handlePaymentRetrieved} />
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-lg font-bold text-stellar-blue">ℹ️ About This dApp</h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Set Last Payment:</strong> Record a payment transaction to the contract</li>
              <li>• <strong>Get Last Payment:</strong> Retrieve the most recently recorded payment</li>
              <li>• <strong>Testnet Only:</strong> This dApp operates on Stellar's testnet</li>
              <li>• <strong>Requires Freighter:</strong> Install and unlock Freighter wallet to interact</li>
              <li>• <strong>Open Source:</strong> View code on{' '}
                <a
                  href="https://github.com/yourusername/stella-pay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stellar-lightblue hover:underline"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>© 2024 StellaPay. Built with ❤️ for the Stellar Community</p>
        </div>
      </div>
    </div>
  );
}

export default App;