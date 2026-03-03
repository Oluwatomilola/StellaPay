import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api'
import {
  Address,
  BASE_FEE,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
  nativeToScVal,
} from '@stellar/stellar-sdk'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new Server(HORIZON_URL)
const NETWORK = Networks.TESTNET

type Status = { type: 'info' | 'success' | 'error'; message: string }

export default function Stellar() {
  const [accountId, setAccountId] = useState('')
  const [balance, setBalance] = useState<string>()
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1.5')
  const [memo, setMemo] = useState('')
  const [status, setStatus] = useState<Status | null>(null)
  const [txHash, setTxHash] = useState('')
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(false)

  const hasFreighter = useMemo(
    () => typeof window !== 'undefined' && Boolean(window.freighter),
    [],
  )

  const contractId = import.meta.env.VITE_SOROBAN_CONTRACT_ID || ''

  const fetchBalance = useCallback(
    async (publicKey: string) => {
      try {
        const account = await server.loadAccount(publicKey)
        const native = account.balances.find((b) => b.asset_type === 'native')
        setBalance(native?.balance ?? '0')
      } catch (error) {
        console.error(error)
        setBalance(undefined)
      }
    },
    [],
  )

  const connect = useCallback(async () => {
    setStatus({ type: 'info', message: 'Asking Freighter for access…' })
    try {
      const { address, error } = await requestAccess()
      if (error) {
        setStatus({ type: 'error', message: error.message })
        return
      }
      if (!address) {
        setStatus({ type: 'error', message: 'Freighter denied access' })
        return
      }
      setAccountId(address)
      setConnected(true)
      await fetchBalance(address)
      setStatus({ type: 'success', message: 'Connected to Freighter' })
    } catch (error) {
      console.error(error)
      setStatus({ type: 'error', message: 'Could not connect to Freighter' })
    }
  }, [fetchBalance])

  const disconnect = useCallback(() => {
    setConnected(false)
    setAccountId('')
    setBalance(undefined)
    setStatus(null)
  }, [])

  const handleSend = useCallback(async () => {
    if (!contractId) {
      setStatus({
        type: 'error',
        message: 'Set VITE_SOROBAN_CONTRACT_ID before submitting a transaction.',
      })
      return
    }
    if (!accountId) {
      setStatus({ type: 'error', message: 'Connect your Freighter wallet first.' })
      return
    }
    if (!destination) {
      setStatus({ type: 'error', message: 'Provide a destination address.' })
      return
    }
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid amount greater than 0.' })
      return
    }
    setBusy(true)
    setStatus({ type: 'info', message: 'Building Soroban transaction…' })

    try {
      const stroops = BigInt(Math.round(parsed * 1_0000000))
      const account = await server.loadAccount(accountId)
      const invokeArgs = [
        new Address(destination),
        nativeToScVal(stroops, { type: 'i128' }),
        nativeToScVal(memo || '', { type: 'string' }),
      ]

      const unsigned = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: contractId,
            function: 'set_last_payment',
            args: invokeArgs,
          }),
        )
        .setTimeout(120)
        .build()

      const prepared = await server.prepareTransaction(unsigned)
      const { signedTxXdr, error } = await signTransaction(prepared.toXDR(), {
        networkPassphrase: NETWORK,
        address: accountId,
      })

      if (error || !signedTxXdr) {
        throw new Error(error?.message ?? 'Freighter rejected the transaction')
      }

      const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK)
      const result = await server.submitTransaction(signed)

      setTxHash(result.hash)
      setStatus({
        type: 'success',
        message: `Contract call submitted (hash ${result.hash}).`,
      })
      await fetchBalance(accountId)
    } catch (sendError) {
      console.error(sendError)
      const message =
        sendError instanceof Error ? sendError.message : 'Transaction failed'
      setStatus({ type: 'error', message })
    } finally {
      setBusy(false)
    }
  }, [accountId, amount, contractId, destination, fetchBalance, memo])

  useEffect(() => {
    if (accountId) {
      fetchBalance(accountId)
    }
  }, [accountId, fetchBalance])

  const txLink = txHash
    ? `https://stellar.expert/explorer/testnet/tx/${txHash}`
    : undefined

  return (
    <div className="stellar-shell">
      <header className="hero">
        <p className="eyebrow">Simple Payment dApp</p>
        <h1>Stellar Soroban explorer</h1>
        <p>
          Connect with Freighter, inspect your XLM balance, and invoke the
          deployed `SimplePayment` contract without leaving this page.
        </p>
      </header>

      <section className="controls">
        <div className="box">
          <div className="box-header">
            <h2>Wallet</h2>
            <span className={`status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'connected' : 'disconnected'}
            </span>
          </div>

          <p className="muted">
            {hasFreighter
              ? 'Freighter is installed in this browser.'
              : 'Install Freighter to proceed (testnet only).'}
          </p>

          <div className="wallet-actions">
            <button
              type="button"
              onClick={connected ? disconnect : connect}
              disabled={!hasFreighter}
            >
              {connected ? 'Disconnect' : 'Connect Freighter'}
            </button>
            {accountId && (
              <div className="wallet-meta">
                <span className="label">Account</span>
                <code>{accountId}</code>
                <span className="label">Balance</span>
                <strong>{balance ?? 'loading…'} XLM</strong>
              </div>
            )}
          </div>
        </div>

        <div className="box">
          <div className="box-header">
            <h2>Contract</h2>
            <span className="badge">{contractId ? 'Ready' : 'Missing ID'}</span>
          </div>
          <p className="muted">
            The front-end uses <code>VITE_SOROBAN_CONTRACT_ID</code> to call
            <code>set_last_payment</code>. Deploy the contract, publish the
            ID, and paste it into <code>.env.local</code>.
          </p>
          {contractId ? (
            <div className="contract-id">
              <code>{contractId}</code>
            </div>
          ) : (
            <div className="error-callout">
              Add <code>VITE_SOROBAN_CONTRACT_ID</code> to run contract calls.
            </div>
          )}
        </div>
      </section>

      <section className="interaction">
        <div className="box">
          <h2>Send payment to contract</h2>
          <label>
            Destination (G… address)
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="G..."
            />
          </label>

          <label>
            Amount (XLM)
            <input
              type="number"
              min="0"
              step="0.0000001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label>
            Memo (optional)
            <input
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="Payment note"
            />
          </label>

          <div className="interaction-actions">
            <button
              type="button"
              onClick={handleSend}
              disabled={busy || !connected || !contractId}
            >
              {busy ? 'Submitting…' : 'Invoke contract'}
            </button>
            {txLink && (
              <a className="ghost" href={txLink} target="_blank" rel="noreferrer">
                View transaction
              </a>
            )}
          </div>

          {status && (
            <p className={`status-line ${status.type}`}>{status.message}</p>
          )}
        </div>
      </section>
    </div>
  )
}

declare global {
  interface Window {
    freighter?: boolean
  }
}
