import * as Freighter from '@stellar/freighter-api';
import { SorobanRpc, Networks, BASE_FEE } from '@stellar/stellar-sdk';
import { SOROBAN_SERVER_URL, NETWORK_PASSPHRASE } from '../utils/constants.js';
import { StellaPayError, handleError } from '../utils/errors.js';

class WalletService {
  constructor() {
    this.server = new SorobanRpc.Server(SOROBAN_SERVER_URL);
    this.publicKey = null;
    this.isInitialized = false;
  }

  /**
   * Check if Freighter wallet is available
   */
  async isFreighterAvailable() {
    try {
      return await Freighter.isConnected();
    } catch (error) {
      console.error('Error checking Freighter availability:', error);
      return false;
    }
  }

  /**
   * Connect to wallet and retrieve public key
   */
  async connect() {
    try {
      const isAvailable = await this.isFreighterAvailable();
      if (!isAvailable) {
        throw new StellaPayError(
          'Freighter wallet is not available. Please install or unlock Freighter.',
          'WALLET_NOT_AVAILABLE'
        );
      }

      const publicKey = await Freighter.getAddress();
      if (!publicKey) {
        throw new StellaPayError('Failed to retrieve public key', 'NO_PUBLIC_KEY');
      }

      this.publicKey = publicKey;
      this.isInitialized = true;
      return publicKey;
    } catch (error) {
      throw handleError(error);
    }
  }

  /**
   * Get current connected account balance
   */
  async getBalance() {
    try {
      if (!this.publicKey) {
        throw new StellaPayError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }

      const account = await this.server.getAccount(this.publicKey);
      const nativeBalance = account.balances.find(b => b.asset_type === 'native');
      
      return {
        native: nativeBalance?.balance || '0',
        account: account,
      };
    } catch (error) {
      throw handleError(error);
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(tx) {
    try {
      if (!this.publicKey) {
        throw new StellaPayError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }

      const signedXDR = await Freighter.signTransaction(tx.toXDR(), {
        network: this.getNetworkName(),
      });

      return signedXDR;
    } catch (error) {
      if (error.message?.includes('cancelled')) {
        throw new StellaPayError('Transaction cancelled by user', 'USER_CANCELLED');
      }
      throw handleError(error);
    }
  }

  /**
   * Get the network name for Freighter
   */
  getNetworkName() {
    return NETWORK_PASSPHRASE.includes('Test') ? 'TESTNET' : 'PUBLIC';
  }

  /**
   * Get the network passphrase
   */
  getNetworkPassphrase() {
    return NETWORK_PASSPHRASE;
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.publicKey = null;
    this.isInitialized = false;
  }

  /**
   * Get current public key
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return this.isInitialized && this.publicKey !== null;
  }

  /**
   * Get RPC server
   */
  getServer() {
    return this.server;
  }
}

export default new WalletService();
