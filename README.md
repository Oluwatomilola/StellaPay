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
## Deployment checklist

1. Build the contract (`soroban contract build`).
2. Deploy the WASM to Testnet (`soroban contract deploy …`).
3. Update `vite-project/.env.local` with the contract ID.
4. Run `npm run dev` and connect via Freighter to invoke `set_last_payment` or view the stored payment.
5. Confirm the deployment by fetching the contract metadata or invoking a read-only method:
   - `soroban contract info --id <CONTRACT_ID> --network testnet`
   - `soroban contract call --id <CONTRACT_ID> --fn last_payment --network testnet`
   Alternatively, open the Vite frontend and hit “Refresh contract state” once the wallet is connected; if the UI reads `last_payment`, the contract is responding.

## Testing & verification

- Soroban contract: `cd contract && cargo +nightly test`.
- Frontend: `cd vite-project && npm run build`.

## Notes

- The frontend talks directly to Horizon/Soroban RPC and the Freighter extension; there is no intermediate server.
- All sensitive payloads (transaction XDRs) are signed by Freighter before being submitted to the Soroban RPC.
- Keep your Testnet account funded via Friendbot before sending transactions.


--network testnet
ℹ️  Simulating install transaction…
ℹ️  Signing transaction: 1ef983a7cd8d082a479f9cf2a3a39907f8002829d93811ee47578a612868e418
🌎 Submitting install transaction…
ℹ️  Using wasm hash c6c47f013f1d38d9d30e2a333e05916512d51ddb66bda693bc54c64757b781ad
ℹ️  Simulating deploy transaction…
ℹ️  Transaction hash is 9d59c41e83501989630da96d24621f174ccf752fcdfa94a0fdd8821606368a8b
🔗 https://stellar.expert/explorer/testnet/tx/9d59c41e83501989630da96d24621f174ccf752fcdfa94a0fdd8821606368a8b
ℹ️  Signing transaction: 9d59c41e83501989630da96d24621f174ccf752fcdfa94a0fdd8821606368a8b
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN
✅ Deployed!
Contract Address:
CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN

## FrontEnd UI Screenshot
<img width="1440" height="765" alt="Screenshot 2026-03-04 at 17 11 38" src="https://github.com/user-attachments/assets/7c933207-0c40-4ad5-9677-09b943aa3b40" />


