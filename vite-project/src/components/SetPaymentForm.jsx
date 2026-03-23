import React, { useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Card, CardHeader, CardBody, CardFooter } from './Card.jsx';
import { Alert } from './Alert.jsx';
import contractService from '../services/contractService.js';
import { useWallet } from '../hooks/index.js';
import { isValidStellarAddress, getStellarExpertLink } from '../utils/errors.js';

export const SetPaymentForm = ({ onSuccess }) => {
  const { publicKey, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [formData, setFormData] = useState({
    toAddress: '',
    amount: '',
    memo: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.toAddress.trim()) {
      newErrors.toAddress = 'Address is required';
    } else if (!isValidStellarAddress(formData.toAddress)) {
      newErrors.toAddress = 'Invalid Stellar address';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (formData.memo.length > 28) {
      newErrors.memo = 'Memo must be 28 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setTxHash(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await contractService.setLastPayment(
        formData.toAddress,
        parseInt(formData.amount),
        formData.memo
      );

      setTxHash(result.hash);
      setFormData({ toAddress: '', amount: '', memo: '' });
      setErrors({});
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      setGlobalError(error.message || 'Failed to set payment');
      console.error('Error setting payment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardBody>
          <p className="text-gray-600 text-center">Connect your wallet to set a payment</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-stellar-blue">💳 Set Last Payment</h2>
        <p className="text-sm text-gray-600 mt-1">Record the last payment transaction</p>
      </CardHeader>

      <CardBody>
        {globalError && (
          <Alert
            type="error"
            message={globalError}
            onClose={() => setGlobalError(null)}
          />
        )}

        {txHash && (
          <Alert
            type="success"
            message={`Transaction submitted! Hash: ${txHash.slice(0, 16)}...`}
          />
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Recipient Address"
            placeholder="G..."
            value={formData.toAddress}
            onChange={(e) => setFormData({ ...formData, toAddress: e.target.value })}
            error={errors.toAddress}
            disabled={loading}
          />

          <Input
            label="Amount (XLM)"
            type="number"
            placeholder="100"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            disabled={loading}
            min="0"
            step="0.01"
          />

          <Input
            label="Memo (optional)"
            placeholder="Payment note..."
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            error={errors.memo}
            disabled={loading}
            maxLength="28"
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-4"
          >
            Submit Payment
          </Button>
        </form>
      </CardBody>

      {txHash && (
        <CardFooter>
          <a
            href={getStellarExpertLink(txHash, 'testnet')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View on Explorer →
          </a>
        </CardFooter>
      )}
    </Card>
  );
};
