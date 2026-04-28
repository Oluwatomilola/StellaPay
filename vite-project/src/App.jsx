import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { WalletConnect } from './components/WalletConnect.jsx';
import { Button } from './components/Button.jsx';
import { Input } from './components/Input.jsx';
import { Card, CardBody, CardFooter, CardHeader } from './components/Card.jsx';
import { Alert } from './components/Alert.jsx';
import { useContractEvents, useWallet } from './hooks/index.js';
import contractService from './services/contractService.js';
import monitoringService from './services/monitoringService.js';
import {
  formatHash,
  formatTokenAmount,
  getStellarExpertLink,
  isValidStellarAddress,
  parseTokenAmount,
  truncateAddress,
} from './utils/errors.js';
import { NETWORK } from './utils/constants.js';

const emptyPaymentForm = {
  recipient: '',
  amount: '',
  memo: '',
};

const emptyLiquidityForm = {
  depositAmount: '',
};

const eventPreview = (payload) => {
  if (payload === null || payload === undefined) {
    return 'No payload';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  return JSON.stringify(payload);
};

function App() {
  const {
    publicKey,
    balance,
    isConnected,
    refreshBalance,
  } = useWallet();
  const { events, error: eventsError, refresh: refreshEvents } = useContractEvents({
    enabled: true,
    limit: 10,
  });

  const [dashboard, setDashboard] = useState({
    config: null,
    tokenMetadata: null,
    poolState: null,
    providerPosition: null,
    rewardPoints: '0',
    recentPayments: [],
    lastPayment: null,
  });
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [liquidityForm, setLiquidityForm] = useState(emptyLiquidityForm);
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [notice, setNotice] = useState(null);

  const tokenDecimals = Number(dashboard.tokenMetadata?.decimals ?? 7);
  const tokenSymbol = dashboard.tokenMetadata?.symbol || 'TOK';

  const formatDisplayAmount = useCallback(
    (value, precision = 4) => `${formatTokenAmount(value ?? '0', tokenDecimals, precision)} ${tokenSymbol}`,
    [tokenDecimals, tokenSymbol]
  );

  const canRead = contractService.canRead();

  const loadDashboard = useCallback(async () => {
    if (!canRead) {
      startTransition(() => {
        setDashboard((current) => ({
          ...current,
          recentPayments: [],
        }));
      });
      return;
    }

    setLoadingDashboard(true);

    try {
      const [config, tokenMetadata, poolState, recentPayments, lastPayment, providerPosition, rewardPoints] =
        await Promise.all([
          contractService.getConfig(),
          contractService.getTokenMetadata(),
          contractService.getPoolState(),
          contractService.getRecentPayments(6),
          contractService.getLastPayment(),
          isConnected && publicKey
            ? contractService.getProviderPosition(publicKey)
            : Promise.resolve(null),
          isConnected && publicKey
            ? contractService.getRewardPoints(publicKey)
            : Promise.resolve('0'),
        ]);

      startTransition(() => {
        setDashboard({
          config,
          tokenMetadata,
          poolState,
          recentPayments: recentPayments || [],
          lastPayment,
          providerPosition,
          rewardPoints: rewardPoints || '0',
        });
      });
    } catch (error) {
      const normalized = monitoringService.captureException(error, {
        screen: 'App',
        action: 'loadDashboard',
      });
      setNotice({ type: 'error', message: normalized.message });
    } finally {
      setLoadingDashboard(false);
    }
  }, [canRead, isConnected, publicKey]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!paymentForm.amount.trim() || !canRead) {
        setPaymentQuote(null);
        return;
      }

      try {
        const parsedAmount = parseTokenAmount(paymentForm.amount, tokenDecimals);
        const quote = await contractService.quotePayment(parsedAmount);
        setPaymentQuote(quote);
      } catch (error) {
        setPaymentQuote(null);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canRead, paymentForm.amount, tokenDecimals]);

  const heroMetrics = useMemo(
    () => [
      {
        label: 'Pool liquidity',
        value: dashboard.poolState ? formatDisplayAmount(dashboard.poolState.total_liquidity) : 'Not loaded',
      },
      {
        label: 'Reward reserve',
        value: dashboard.poolState ? formatDisplayAmount(dashboard.poolState.reward_reserve) : 'Not loaded',
      },
      {
        label: 'Collected fees',
        value: dashboard.poolState ? formatDisplayAmount(dashboard.poolState.collected_fees) : 'Not loaded',
      },
      {
        label: 'Payments settled',
        value: dashboard.poolState?.payment_count || '0',
      },
    ],
    [dashboard.poolState, formatDisplayAmount]
  );

  const runAction = useCallback(
    async (actionName, action) => {
      setBusyAction(actionName);
      setNotice(null);

      try {
        const result = await action();
        await Promise.allSettled([loadDashboard(), refreshEvents(), refreshBalance()]);
        return result;
      } catch (error) {
        const normalized = monitoringService.captureException(error, {
          screen: 'App',
          action: actionName,
        });
        setNotice({ type: 'error', message: normalized.message });
        return null;
      } finally {
        setBusyAction('');
      }
    },
    [loadDashboard, refreshBalance, refreshEvents]
  );

  const handleSettlePayment = async (event) => {
    event.preventDefault();

    if (!isConnected || !publicKey) {
      setNotice({ type: 'warning', message: 'Connect Freighter before settling a payment.' });
      return;
    }

    if (!isValidStellarAddress(paymentForm.recipient)) {
      setNotice({ type: 'warning', message: 'Enter a valid Stellar recipient address.' });
      return;
    }

    let parsedAmount;

    try {
      parsedAmount = parseTokenAmount(paymentForm.amount, tokenDecimals);
    } catch (error) {
      setNotice({ type: 'warning', message: error.message });
      return;
    }

    const result = await runAction('settle-payment', async () =>
      contractService.settleTokenPayment(
        publicKey,
        paymentForm.recipient,
        parsedAmount,
        paymentForm.memo || ''
      )
    );

    if (result?.hash) {
      setPaymentForm(emptyPaymentForm);
      setNotice({
        type: 'success',
        message: `Payment submitted. Transaction ${formatHash(result.hash)} is confirmed.`,
      });
    }
  };

  const handleAddLiquidity = async (event) => {
    event.preventDefault();

    if (!isConnected || !publicKey) {
      setNotice({ type: 'warning', message: 'Connect Freighter before adding liquidity.' });
      return;
    }

    let parsedAmount;

    try {
      parsedAmount = parseTokenAmount(liquidityForm.depositAmount, tokenDecimals);
    } catch (error) {
      setNotice({ type: 'warning', message: error.message });
      return;
    }
    const result = await runAction('add-liquidity', async () =>
      contractService.addLiquidity(publicKey, parsedAmount)
    );

    if (result?.hash) {
      setLiquidityForm(emptyLiquidityForm);
      setNotice({
        type: 'success',
        message: `Liquidity deposited successfully. Transaction ${formatHash(result.hash)} is confirmed.`,
      });
    }
  };

  const handleRemoveLiquidity = async (percentage) => {
    if (!isConnected || !publicKey || !dashboard.providerPosition?.shares) {
      return;
    }

    const currentShares = BigInt(dashboard.providerPosition.shares);
    if (currentShares <= 0n) {
      return;
    }

    const sharesToWithdraw = percentage === 100
      ? currentShares
      : (currentShares * BigInt(percentage)) / 100n;

    if (sharesToWithdraw <= 0n) {
      setNotice({ type: 'warning', message: 'Your current position is too small for that withdrawal size.' });
      return;
    }

    const result = await runAction(`remove-liquidity-${percentage}`, async () =>
      contractService.removeLiquidity(publicKey, sharesToWithdraw)
    );

    if (result?.hash) {
      setNotice({
        type: 'success',
        message: `Liquidity withdrawal confirmed. Transaction ${formatHash(result.hash)} is settled.`,
      });
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !publicKey) {
      setNotice({ type: 'warning', message: 'Connect Freighter before claiming rewards.' });
      return;
    }

    const result = await runAction('claim-rewards', async () =>
      contractService.claimRewards(publicKey)
    );

    if (result?.hash) {
      setNotice({
        type: 'success',
        message: `Rewards claimed successfully. Transaction ${formatHash(result.hash)} is confirmed.`,
      });
    }
  };

  return (
    <div className="app-shell">
      <div className="shell-backdrop" />
      <main className="app-layout">
        <section className="hero-panel">
          <div>
            <span className="eyebrow">StellaPay Production Console</span>
            <h1>Inter-contract payments, liquidity accounting, and live Soroban telemetry.</h1>
            <p>
              This dashboard now sits on top of a token-backed Soroban contract with fee routing,
              reward claims, liquidity shares, and a real-time event stream.
            </p>
          </div>
          <div className="hero-grid">
            {heroMetrics.map((metric) => (
              <article key={metric.label} className="metric-tile">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>
        </section>

        {notice ? (
          <Alert
            type={notice.type}
            message={notice.message}
            onClose={() => setNotice(null)}
          />
        ) : null}

        {!canRead ? (
          <Alert
            type="info"
            message="Connect Freighter or set VITE_SIMULATION_ACCOUNT to unlock contract reads."
          />
        ) : null}

        <WalletConnect />

        <section className="dashboard-grid">
          <Card className="dashboard-span">
            <CardHeader>
              <span className="eyebrow">Payment Rail</span>
              <h2>Settle token payments with fee and reward previews</h2>
            </CardHeader>
            <CardBody>
              <form className="panel-form" onSubmit={handleSettlePayment}>
                <Input
                  label="Recipient address"
                  placeholder="G..."
                  value={paymentForm.recipient}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      recipient: event.target.value,
                    }))
                  }
                />
                <Input
                  label={`Amount (${tokenSymbol})`}
                  placeholder="25.50"
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  hint={`Supports up to ${tokenDecimals} decimals.`}
                />
                <Input
                  label="Memo"
                  placeholder="Payroll, invoice, escrow release"
                  value={paymentForm.memo}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      memo: event.target.value,
                    }))
                  }
                />
                <Button type="submit" isLoading={busyAction === 'settle-payment'}>
                  Settle payment
                </Button>
              </form>

              <div className="quote-grid">
                <article className="quote-tile">
                  <span>Recipient receives</span>
                  <strong>
                    {paymentQuote
                      ? formatDisplayAmount(paymentQuote.recipient_amount)
                      : 'Quote unavailable'}
                  </strong>
                </article>
                <article className="quote-tile">
                  <span>Pool fee</span>
                  <strong>
                    {paymentQuote ? formatDisplayAmount(paymentQuote.fee_amount) : 'Quote unavailable'}
                  </strong>
                </article>
                <article className="quote-tile">
                  <span>Reward points</span>
                  <strong>
                    {paymentQuote
                      ? formatDisplayAmount(paymentQuote.reward_points)
                      : 'Quote unavailable'}
                  </strong>
                </article>
              </div>
            </CardBody>
            <CardFooter>
              {dashboard.lastPayment ? (
                <p>
                  Last legacy payment record: {formatDisplayAmount(dashboard.lastPayment.amount)} to{' '}
                  {truncateAddress(dashboard.lastPayment.to)}.
                </p>
              ) : (
                <p>No legacy payment snapshot has been stored yet.</p>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <span className="eyebrow">Liquidity Engine</span>
              <h2>Provide liquidity and withdraw performance fees</h2>
            </CardHeader>
            <CardBody>
              <div className="stack-list">
                <div className="data-row">
                  <span>Your redeemable position</span>
                  <strong>
                    {dashboard.providerPosition
                      ? formatDisplayAmount(dashboard.providerPosition.redeemable_amount)
                      : 'Connect wallet'}
                  </strong>
                </div>
                <div className="data-row">
                  <span>Your share balance</span>
                  <strong>{dashboard.providerPosition?.shares || '0'}</strong>
                </div>
                <div className="data-row">
                  <span>Your reward points</span>
                  <strong>{formatDisplayAmount(dashboard.rewardPoints)}</strong>
                </div>
              </div>

              <form className="panel-form" onSubmit={handleAddLiquidity}>
                <Input
                  label={`Deposit amount (${tokenSymbol})`}
                  placeholder="100"
                  value={liquidityForm.depositAmount}
                  onChange={(event) =>
                    setLiquidityForm({
                      depositAmount: event.target.value,
                    })
                  }
                />
                <Button type="submit" isLoading={busyAction === 'add-liquidity'}>
                  Add liquidity
                </Button>
              </form>

              <div className="action-row">
                {[25, 50, 100].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="secondary"
                    onClick={() => handleRemoveLiquidity(percentage)}
                    isLoading={busyAction === `remove-liquidity-${percentage}`}
                  >
                    Withdraw {percentage}%
                  </Button>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleClaimRewards}
                isLoading={busyAction === 'claim-rewards'}
              >
                Claim reward pool
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <span className="eyebrow">Contract Telemetry</span>
              <h2>Production-oriented runtime details</h2>
            </CardHeader>
            <CardBody>
              <div className="stack-list">
                <div className="data-row">
                  <span>Token contract</span>
                  <strong>{truncateAddress(dashboard.tokenMetadata?.token || dashboard.config?.pool_token)}</strong>
                </div>
                <div className="data-row">
                  <span>Token symbol</span>
                  <strong>{dashboard.tokenMetadata?.symbol || 'Not loaded'}</strong>
                </div>
                <div className="data-row">
                  <span>Fee rate</span>
                  <strong>{dashboard.config?.payment_fee_bps || 0} bps</strong>
                </div>
                <div className="data-row">
                  <span>Reward rate</span>
                  <strong>{dashboard.config?.reward_rate_bps || 0} bps</strong>
                </div>
                <div className="data-row">
                  <span>Network</span>
                  <strong>{NETWORK}</strong>
                </div>
                <div className="data-row">
                  <span>Read mode</span>
                  <strong>{canRead ? (isConnected ? 'Wallet-backed' : 'Simulation account') : 'Unavailable'}</strong>
                </div>
                <div className="data-row">
                  <span>Wallet XLM</span>
                  <strong>{balance ? `${balance} XLM` : 'Not connected'}</strong>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="dashboard-span">
            <CardHeader>
              <span className="eyebrow">Live Stream</span>
              <h2>Contract events and recent settlements</h2>
            </CardHeader>
            <CardBody className="feed-layout">
              <div>
                <div className="section-heading">
                  <strong>Recent payment records</strong>
                  <span>{loadingDashboard ? 'Refreshing...' : 'Synced'}</span>
                </div>
                <div className="feed-list">
                  {dashboard.recentPayments.length ? (
                    dashboard.recentPayments.map((payment) => (
                      <article key={payment.id} className="feed-item">
                        <div className="feed-item__header">
                          <strong>{formatDisplayAmount(payment.amount)}</strong>
                          <span>{truncateAddress(payment.to)}</span>
                        </div>
                        <p>{payment.memo || 'No memo provided'}</p>
                        <small>
                          Fee {formatDisplayAmount(payment.fee_amount)} and rewards{' '}
                          {formatDisplayAmount(payment.reward_points)}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">No payment records have been loaded yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="section-heading">
                  <strong>RPC event stream</strong>
                  <span>{eventsError ? 'Degraded' : 'Live'}</span>
                </div>
                {eventsError ? <Alert type="warning" message={eventsError} /> : null}
                <div className="feed-list">
                  {events.length ? (
                    events.map((event) => (
                      <article key={event.id} className="feed-item">
                        <div className="feed-item__header">
                          <strong>{event.label}</strong>
                          <a
                            href={getStellarExpertLink(event.txHash, NETWORK)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {event.txHashShort}
                          </a>
                        </div>
                        <p>{eventPreview(event.payload)}</p>
                        <small>
                          Ledger {event.ledger} • {new Date(event.createdAt).toLocaleTimeString()}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">Event polling has not returned contract events yet.</p>
                  )}
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <div className="footer-actions">
                <Button type="button" variant="secondary" onClick={loadDashboard}>
                  Refresh contract data
                </Button>
                <Button type="button" variant="secondary" onClick={refreshEvents}>
                  Refresh event feed
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default App;
