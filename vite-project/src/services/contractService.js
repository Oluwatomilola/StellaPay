import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { CONTRACT_ID } from '../utils/constants.js';
import walletService from './walletService.js';
import { StellaPayError, handleError } from '../utils/errors.js';

class ContractService {
  constructor() {
    this.contractId = CONTRACT_ID;
  }

  /**
   * Set last payment in the contract
   */
  async setLastPayment(toAddress, amount, memo) {
    try {
      if (!walletService.isConnected()) {
        throw new StellaPayError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }

      const server = walletService.getServer();
      const account = await server.getAccount(walletService.getPublicKey());
      const contract = new Contract(this.contractId);

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: walletService.getNetworkPassphrase(),
      })
        .addOperation(
          contract.call(
            'set_last_payment',
            nativeToScVal(toAddress, 'address'),
            nativeToScVal(amount, 'i128'),
            nativeToScVal(memo, 'string')
          )
        )
        .setTimeout(30)
        .build();

      // Simulate transaction
      const simulated = await this.simulateTransaction(tx);

      // Add auth and footprint
      tx.addAuthorization(simulated.result.auth[0]);
      tx.addFootprint(simulated.result.footprint);

      // Sign transaction
      const signedXDR = await walletService.signTransaction(tx);
      const signedTx = TransactionBuilder.fromXDR(
        signedXDR,
        walletService.getNetworkPassphrase()
      );

      // Submit transaction
      const result = await server.sendTransaction(signedTx);

      return {
        hash: result.hash,
        status: result.status,
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  /**
   * Get last payment from the contract
   */
  async getLastPayment() {
    try {
      if (!walletService.isConnected()) {
        throw new StellaPayError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }

      const server = walletService.getServer();
      const account = await server.getAccount(walletService.getPublicKey());
      const contract = new Contract(this.contractId);

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: walletService.getNetworkPassphrase(),
      })
        .addOperation(contract.call('last_payment'))
        .setTimeout(30)
        .build();

      // Simulate transaction
      const simulated = await this.simulateTransaction(tx);

      // Parse result
      if (simulated.result.retval) {
        const decoded = scValToNative(simulated.result.retval);
        return decoded;
      }

      return null;
    } catch (error) {
      throw handleError(error);
    }
  }

  /**
   * Simulate a transaction
   */
  async simulateTransaction(tx) {
    try {
      const server = walletService.getServer();
      const simulated = await server.simulateTransaction(tx);

      if (simulated.error) {
        throw new StellaPayError(
          `Simulation error: ${simulated.error}`,
          'SIMULATION_ERROR'
        );
      }

      if (!simulated.result) {
        throw new StellaPayError('No simulation result', 'NO_SIMULATION_RESULT');
      }

      return simulated;
    } catch (error) {
      throw handleError(error);
    }
  }

  /**
   * Check transaction status
   */
  async getTransactionStatus(hash) {
    try {
      const server = walletService.getServer();
      const transaction = await server.getTransaction(hash);
      return transaction;
    } catch (error) {
      throw handleError(error);
    }
  }
}

export default new ContractService();
