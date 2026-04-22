import {
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import {
  CONTRACT_ID,
  TRANSACTION_POLL_ATTEMPTS,
  TRANSACTION_POLL_INTERVAL,
} from '../utils/constants.js';
import {
  StellaPayError,
  handleError,
  normalizeContractValue,
} from '../utils/errors.js';
import walletService from './walletService.js';
import monitoringService from './monitoringService.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ContractService {
  constructor() {
    this.contractId = CONTRACT_ID;
  }

  canRead() {
    return walletService.hasReadAccount();
  }

  buildContract() {
    if (!this.contractId) {
      throw new StellaPayError('Missing VITE_CONTRACT_ID configuration.', 'MISSING_CONTRACT_ID');
    }

    return new Contract(this.contractId);
  }

  normalizeResult(retval) {
    if (!retval) {
      return null;
    }

    return normalizeContractValue(scValToNative(retval));
  }

  async buildTransaction(method, args = [], options = {}) {
    const { requiresWallet = false } = options;
    const sourceAccount = requiresWallet
      ? await walletService.getServer().getAccount(walletService.getPublicKey())
      : await walletService.getReadAccount();

    const contract = this.buildContract();

    return new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: walletService.getNetworkPassphrase(),
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();
  }

  async simulateTransaction(tx) {
    try {
      const server = walletService.getServer();
      const simulated = await server.simulateTransaction(tx);

      if (simulated.error) {
        throw new StellaPayError(simulated.error, 'SIMULATION_ERROR');
      }

      if (!simulated.result) {
        throw new StellaPayError('Simulation did not return a result.', 'NO_SIMULATION_RESULT');
      }

      return simulated;
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'contract',
        action: 'simulateTransaction',
      });
    }
  }

  async readMethod(method, args = []) {
    try {
      const tx = await this.buildTransaction(method, args, { requiresWallet: false });
      const simulated = await this.simulateTransaction(tx);
      return this.normalizeResult(simulated.result.retval);
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'contract',
        action: method,
        mode: 'read',
      });
    }
  }

  async submitMethod(method, args = []) {
    try {
      if (!walletService.isConnected()) {
        throw new StellaPayError('Connect your wallet before submitting a transaction.', 'WALLET_NOT_CONNECTED');
      }

      const tx = await this.buildTransaction(method, args, { requiresWallet: true });
      const simulated = await this.simulateTransaction(tx);

      if (simulated.result.auth?.[0]) {
        tx.addAuthorization(simulated.result.auth[0]);
      }

      if (simulated.result.footprint) {
        tx.addFootprint(simulated.result.footprint);
      }

      const signedXdr = await walletService.signTransaction(tx);
      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        walletService.getNetworkPassphrase()
      );

      const submission = await walletService.getServer().sendTransaction(signedTx);
      const transaction = await this.waitForTransaction(submission.hash);

      return {
        hash: submission.hash,
        status: submission.status,
        transaction,
        returnValue: this.normalizeResult(transaction?.returnValue),
      };
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'contract',
        action: method,
        mode: 'write',
      });
    }
  }

  async waitForTransaction(hash) {
    for (let attempt = 0; attempt < TRANSACTION_POLL_ATTEMPTS; attempt += 1) {
      const transaction = await walletService.getServer().getTransaction(hash);

      if (transaction.status === 'SUCCESS') {
        return transaction;
      }

      if (transaction.status === 'FAILED') {
        throw new StellaPayError('Transaction execution failed.', 'TRANSACTION_FAILED', transaction);
      }

      await sleep(TRANSACTION_POLL_INTERVAL);
    }

    throw new StellaPayError(
      'Transaction submission timed out while waiting for confirmation.',
      'TRANSACTION_TIMEOUT'
    );
  }

  async getConfig() {
    return this.readMethod('config');
  }

  async getTokenMetadata() {
    return this.readMethod('token_metadata');
  }

  async getPoolState() {
    return this.readMethod('pool_state');
  }

  async quotePayment(amount) {
    return this.readMethod('quote_payment', [nativeToScVal(amount, { type: 'i128' })]);
  }

  async getProviderPosition(provider) {
    return this.readMethod('provider_position', [nativeToScVal(provider, { type: 'address' })]);
  }

  async getRewardPoints(user) {
    return this.readMethod('reward_points', [nativeToScVal(user, { type: 'address' })]);
  }

  async getRecentPayments(limit = 6) {
    return this.readMethod('recent_payments', [nativeToScVal(limit, { type: 'u32' })]);
  }

  async settleTokenPayment(payer, toAddress, amount, memo) {
    return this.submitMethod('settle_token_payment', [
      nativeToScVal(payer, { type: 'address' }),
      nativeToScVal(toAddress, { type: 'address' }),
      nativeToScVal(amount, { type: 'i128' }),
      nativeToScVal(memo, { type: 'string' }),
    ]);
  }

  async addLiquidity(provider, amount) {
    return this.submitMethod('add_liquidity', [
      nativeToScVal(provider, { type: 'address' }),
      nativeToScVal(amount, { type: 'i128' }),
    ]);
  }

  async removeLiquidity(provider, shares) {
    return this.submitMethod('remove_liquidity', [
      nativeToScVal(provider, { type: 'address' }),
      nativeToScVal(shares, { type: 'i128' }),
    ]);
  }

  async claimRewards(user) {
    return this.submitMethod('claim_rewards', [nativeToScVal(user, { type: 'address' })]);
  }

  async setLastPayment(toAddress, amount, memo) {
    return this.submitMethod('set_last_payment', [
      nativeToScVal(toAddress, { type: 'address' }),
      nativeToScVal(amount, { type: 'i128' }),
      nativeToScVal(memo, { type: 'string' }),
    ]);
  }

  async getLastPayment() {
    return this.readMethod('last_payment');
  }

  async getTransactionStatus(hash) {
    try {
      return await walletService.getServer().getTransaction(hash);
    } catch (error) {
      throw monitoringService.captureException(handleError(error), {
        service: 'contract',
        action: 'getTransactionStatus',
      });
    }
  }
}

export default new ContractService();
