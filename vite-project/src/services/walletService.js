import * as Freighter from '@stellar/freighter-api';
import { SorobanRpc } from '@stellar/stellar-sdk';
import {
  ERROR_MESSAGES,
  NETWORK_PASSPHRASE,
  SIMULATION_ACCOUNT,
  SOROBAN_SERVER_URL,
} from '../utils/constants.js';
import { StellaPayError, handleError } from '../utils/errors.js';
import monitoringService from './monitoringService.js';

class WalletService {
  constructor() {
    this.server = new SorobanRpc.Server(SOROBAN_SERVER_URL);
    this.publicKey = null;
    this.isInitialized = false;
  }

  async isFreighterAvailable() {
    try {
      return await Freighter.isConnected();
    } catch (error) {
      monitoringService.captureException(error, { service: 'wallet', action: 'isFreighterAvailable' });
      return false;
    }
  }

  async connect() {
    try {
      const isAvailable = await this.isFreighterAvailable();
      if (!isAvailable) {
        throw new StellaPayError(ERROR_MESSAGES.NO_WALLET, 'WALLET_NOT_AVAILABLE');
      }

      const publicKey = await Freighter.getAddress();
      if (!publicKey) {
        throw new StellaPayError('Failed to retrieve a Stellar public key.', 'NO_PUBLIC_KEY');
      }

      this.publicKey = publicKey;
      this.isInitialized = true;
      return publicKey;
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'wallet',
        action: 'connect',
      });
    }
  }

  async getBalance() {
    try {
      if (!this.publicKey) {
        throw new StellaPayError(ERROR_MESSAGES.NO_WALLET, 'WALLET_NOT_CONNECTED');
      }

      const account = await this.server.getAccount(this.publicKey);
      const nativeBalance = account.balances.find((balance) => balance.asset_type === 'native');

      return {
        native: nativeBalance?.balance || '0',
        account,
      };
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'wallet',
        action: 'getBalance',
      });
    }
  }

  async signTransaction(tx) {
    try {
      if (!this.publicKey) {
        throw new StellaPayError(ERROR_MESSAGES.NO_WALLET, 'WALLET_NOT_CONNECTED');
      }

      const signedXdr = await Freighter.signTransaction(tx.toXDR(), {
        network: this.getNetworkName(),
      });

      return signedXdr;
    } catch (error) {
      throw monitoringService.captureException(error, {
        service: 'wallet',
        action: 'signTransaction',
      });
    }
  }

  async getReadAccount() {
    try {
      const sourceAccount = this.publicKey || SIMULATION_ACCOUNT;

      if (!sourceAccount) {
        throw new StellaPayError(ERROR_MESSAGES.NO_READ_ACCOUNT, 'NO_READ_ACCOUNT');
      }

      return await this.server.getAccount(sourceAccount);
    } catch (error) {
      throw monitoringService.captureException(handleError(error), {
        service: 'wallet',
        action: 'getReadAccount',
      });
    }
  }

  hasReadAccount() {
    return Boolean(this.publicKey || SIMULATION_ACCOUNT);
  }

  getNetworkName() {
    return NETWORK_PASSPHRASE.includes('Test') ? 'TESTNET' : 'PUBLIC';
  }

  getNetworkPassphrase() {
    return NETWORK_PASSPHRASE;
  }

  disconnect() {
    this.publicKey = null;
    this.isInitialized = false;
  }

  getPublicKey() {
    return this.publicKey;
  }

  isConnected() {
    return this.isInitialized && this.publicKey !== null;
  }

  getServer() {
    return this.server;
  }
}

export default new WalletService();
