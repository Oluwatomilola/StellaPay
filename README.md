# StellaPay

StellaPay is a Soroban + React payment dashboard that has been upgraded from a single-value demo into a more production-shaped dApp.

## What’s new

- Inter-contract calls through the Soroban token interface.
- Token-backed payment settlement with fee routing.
- Liquidity pool style accounting with LP shares and redeemable positions.
- Reward pool funding and reward claiming.
- Real-time contract event streaming in the frontend.
- Error monitoring hooks, improved transaction polling, and CI for both the contract and app.
- A mobile-friendly dashboard for payments, liquidity, and telemetry.

## Project layout

- `contract/`: Soroban smart contract and Rust tests.
- `vite-project/`: React + Vite frontend for Freighter, RPC reads, event streaming, and dashboard UX.
- `.github/workflows/ci.yml`: CI pipeline for Rust and frontend validation.

## Contract capabilities

The contract now supports:

- `initialize(admin, pool_token, payment_fee_bps, reward_rate_bps)`
- `settle_token_payment(payer, to, amount, memo)`
- `add_liquidity(provider, amount)`
- `remove_liquidity(provider, shares)`
- `fund_reward_pool(admin, amount)`
- `claim_rewards(user)`
- Read APIs such as `config`, `token_metadata`, `pool_state`, `provider_position`, `quote_payment`, `recent_payments`, and `reward_points`
- Legacy compatibility for `set_last_payment` and `last_payment`

The advanced flows rely on a token contract, so you should redeploy this upgraded contract and call `initialize` after deployment.

## Local development

### Contract

```bash
cd contract
cargo +nightly test
```

To build the WASM artifact:

```bash
cd contract
cargo +nightly build --target wasm32-unknown-unknown --release
```

### Frontend

```bash
cd vite-project
npm install
cp .env.example .env.local
```

Set at least:

```bash
VITE_CONTRACT_ID=<your deployed Soroban contract id>
```

Optional but recommended for read-only dashboards without a connected wallet:

```bash
VITE_SIMULATION_ACCOUNT=<funded testnet account>
```

Run the app:

```bash
cd vite-project
npm run dev
```

## Monitoring and production hooks

- `VITE_SENTRY_DSN`: if Sentry is loaded in the browser, StellaPay will forward captured exceptions to it.
- `VITE_ERROR_WEBHOOK_URL`: optional beacon endpoint for lightweight client-side error reporting.
- `VITE_EVENT_POLL_INTERVAL`: controls the live event feed refresh interval.

## CI/CD

GitHub Actions now validates:

- Soroban contract tests
- WASM contract build
- Frontend unit/integration tests
- Frontend production build

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Verification

Verified locally with:

- `cd contract && cargo +nightly test`
- `cd vite-project && npm test -- --run`
- `cd vite-project && npm run build`
