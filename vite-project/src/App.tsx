import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { Buffer } from 'buffer';
import FreighterApi from '@stellar/freighter-api';
import {
  networks,
  Operation,
  Server,
  SorobanClient,
  TransactionBuilder,
  xdr,
  StrKey,
} from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = networks.TESTNET;

const contractId = import.meta.env.VITE_SOROBAN_CONTRACT_ID;

type LastPayment = {
  to: string;
  amount: string;
  memo: string;
};

const toStroops = (xlm: string) => {
  const value = parseFloat(xlm);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Please enter a positive amount');
  }
  return BigInt(Math.round(value * 1e7));
};

const toScValAddress = (address: string) => {
  const raw = StrKey.decodeEd25519PublicKey(address);
  const accountId = new xdr.AccountId({
    ed25519: new xdr.Uint256(raw),
  });
  const scAddress = xdr.ScAddress.scAddressTypeAccount(accountId);
  return xdr.ScVal.scvAddress(scAddress);
};

const toScValI128 = (value: bigint) => {
  const mask = BigInt('0xffffffffffffffff');
  const hi = Number((value >> BigInt(64)) & mask);
  const lo = Number(value & mask);
  return xdr.ScVal.scvI128(
    new xdr.Int128({
      hi,
      lo,
    })
  );
};

const toScValString = (value: string) => xdr.ScVal.scvString(value);

const buildHostFunction = (to: string, amount: bigint, memo: string) => {
  if (!contractId) {
    throw new Error('Missing contract id');
  }
  const hostFunction = xdr.HostFunction.invokeContract(
    new xdr.InvokeContractArgs({
      contractId: new xdr.Hash(Buffer.from(contractId, 'hex')),
      functionName: new xdr.ScSymbol('set_last_payment'),
      args: new xdr.ScVec({
        value: [
          toScValAddress(to),
          toScValI128(amount),
          toScValString(memo),
        ],
        length: 3,
      }),
    })
  );
  return hostFunction;
};

const App = () => {
  const server = useMemo(() => new Server(HORIZON_URL), []);
  const sorobanClient = useMemo(() => new SorobanClient(SOROBAN_RPC_URL), []);
  const freighter = useMemo(() => new FreighterApi(), []);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Idle');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [balance, setBalance] = useState<string>('');
  const [lastPayment, setLastPayment] = useState<LastPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBalance = useCallback(
    async (address: string) => {
      try {
        const account = await server.loadAccount(address);
        const native = account.balances.find((b) => b.asset_type === 'native');
        setBalance(native?.balance ?? '0');
      } catch (error) {
        console.error('balance error', error);
        setBalance('0');
      }
    },
    [server]
  );

  const connectWallet = useCallback(async () => {
    try {
      await freighter.connect();
      const key = await freighter.getPublicKey();
      setWalletAddress(key);
      setStatus('Wallet connected');
      await fetchBalance(key);
      await fetchLastPayment();
    } catch (error) {
      console.error(error);
      setStatus('Connection failed');
    }
  }, [fetchBalance, freighter]);

  const disconnectWallet = () => {
    setWalletAddress(null);
    setStatus('Wallet disconnected');
    setBalance('');
  };

  const fetchLastPayment = useCallback(async () => {
    if (!contractId) return;
    try {
      const response = await sorobanClient.call({
        contractId,
        functionName: 'last_payment',
        args: [],
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      if (response?.error) {
        console.warn('read error', response);
        return;
      }
      const parsed: LastPayment | null = response?.value
        ? {
            to: response.value.to ?? '',
            amount: response.value.amount ?? '0',
            memo: response.value.memo ?? '',
          }
        : null;
      setLastPayment(parsed);
    } catch (error) {
      console.warn('fetch last payment', error);
    }
  }, [sorobanClient]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!walletAddress) {
        setStatus('Connect wallet first');
        return;
      }
      if (!contractId) {
        setStatus('Missing contract id');
        return;
      }
      setSubmitting(true);
      setStatus('Building transaction...');
      try {
        const amountStroops = toStroops(amount);
        const account = await server.loadAccount(walletAddress);
        const tx = new TransactionBuilder(account, {
          fee: 100,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(
            Operation.invokeHostFunction({
              function: buildHostFunction(destination, amountStroops, memo),
              auth: [],
            })
          )
          .setTimeout(30)
          .build();

        const signed = await freighter.signTransaction(tx.toXDR(), {
          network: NETWORK_PASSPHRASE,
        });
        const result = await sorobanClient.sendTransaction(signed);
        setStatus('Transaction submitted');
        setLastPayment({ to: destination, amount, memo });
        console.log('result', result);
      } catch (error: any) {
        console.error(error);
        setStatus(error?.message ?? 'Transaction failed');
      } finally {
        setSubmitting(false);
      }
    },
    [destination, amount, memo, walletAddress, server, sorobanClient, freighter]
  );

  return (
    <div className="app">
      <header>
        <h1>Stellar Simple Payment</h1>
        <p>Interact with the deployed Soroban contract via Freighter.</p>
      </header>
      <section className="card">
        <p className="status">{status}</p>
        {walletAddress ? (
          <button onClick={disconnectWallet} className="secondary">
            Disconnect
          </button>
        ) : (
          <button onClick={connectWallet}>Connect Freighter</button>
        )}
        <div className="grid">
          <div>
            <p>Wallet</p>
            <strong>{walletAddress ?? 'Not connected'}</strong>
          </div>
          <div>
            <p>Balance</p>
            <strong>{balance || '—'} XLM</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Set Last Payment</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Destination (G...)
            <input value={destination} onChange={(event) => setDestination(event.target.value)} required />
          </label>
          <label>
            Amount (XLM)
            <input type="number" step="0.0000001" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label>
            Memo
            <input value={memo} onChange={(event) => setMemo(event.target.value)} />
          </label>
          <button type="submit" disabled={submitting || !walletAddress}>
            {submitting ? 'Sending…' : 'Submit Transaction'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Last Payment</h2>
        <button onClick={fetchLastPayment}>Refresh contract state</button>
        {lastPayment ? (
          <div className="payment">
            <p>Destination: {lastPayment.to}</p>
            <p>Amount: {lastPayment.amount}</p>
            <p>Memo: {lastPayment.memo}</p>
          </div>
        ) : (
          <p>No payment yet.</p>
        )}
      </section>
    </div>
  );
};

export default App;
