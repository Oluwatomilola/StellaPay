import React, { useState } from 'react';
import { Button } from './Button.jsx';
import { Card, CardHeader, CardBody, CardFooter } from './Card.jsx';
import { Alert } from './Alert.jsx';
import contractService from '../services/contractService.js';
import { useWallet } from '../hooks/index.js';

export const GetPaymentDisplay = ({ onPaymentRetrieved }) => {
  const { isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  const handleGetPayment = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await contractService.getLastPayment();
      setPayment(result);
      
      if (onPaymentRetrieved) {
        onPaymentRetrieved(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve payment');
      console.error('Error getting payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardBody>
          <p className="text-gray-600 text-center">Connect your wallet to retrieve payment data</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-stellar-blue">📋 Last Payment</h2>
        <p className="text-sm text-gray-600 mt-1">View the most recent recorded payment</p>
      </CardHeader>

      <CardBody>
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {payment && (
          <div className="bg-stellar-gray rounded p-4 mb-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Recipient</p>
                <p className="font-mono text-sm font-semibold truncate">{payment.to}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Amount</p>
                <p className="text-lg font-bold text-stellar-blue">{payment.amount} XLM</p>
              </div>
              {payment.memo && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Memo</p>
                  <p className="text-sm">{payment.memo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={handleGetPayment}
          isLoading={loading}
          className="w-full"
        >
          {payment ? 'Refresh' : 'Get Payment'}
        </Button>
      </CardBody>

      {payment && (
        <CardFooter>
          <p className="text-xs text-gray-600">
            Last updated just now
          </p>
        </CardFooter>
      )}
    </Card>
  );
};
