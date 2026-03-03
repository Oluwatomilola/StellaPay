# Stellar Simple Payment dApp

A beginner-friendly Stellar Soroban project that pairs a Rust contract with a React + Vite frontend.

## What you get

- **Soroban contract** (`contract/`) that stores the latest payment (destination, amount, memo) and emits a `payment:set` event.
- **React + TypeScript frontend** (`vite-project/`) that connects to Freighter, fetches the XLM balance, and submits Soroban transactions against the deployed contract.

## Prerequisites

- Node.js 18+ for the frontend.
- Rust toolchain + `cargo` for the contract + Soroban CLI (`cargo install --locked soroban-cli`).
- Freighter browser extension configured for the Testnet network.

## Smart contract workflow

1. Install the Soroban CLI (if not already installed):
   ```bash
   cargo install --locked soroban-cli
   ```
2. Run the unit tests to ensure the contract compiles:
   ```bash
   cd contract
   cargo +nightly test
   ```
3. Build the WASM artifact for deployment:
   ```bash
   soroban contract build
   ```
4. Deploy to Horizon Testnet and note the returned contract ID:
   ```bash
   soroban contract deploy --wasm target/wasm32-unknown-unknown/release/simple_payment.wasm --network testnet
   ```
5. Copy the `contract id` from the deployment response and keep it for the frontend.

> ⚠️ This environment cannot talk to Testnet, so the deployment must be run locally. Use the steps above and paste the resulting contract id into your frontend `.env`.

## Frontend setup

1. Install dependencies and link the workspace:
   ```bash
   cd vite-project
   npm install
   ```
2. Create a `.env.local` (or `.env`) file containing:
   ```text
   VITE_SOROBAN_CONTRACT_ID=<paste-contract-id-here>
   ```
3. Launch the dev server with Freighter open:
   ```bash
   npm run dev
   ```
4. The app lets you:

   - Connect/disconnect your Freighter wallet.
   - View your native XLM balance.
   - Enter a destination account, amount (converted to stroops), and optional memo.
   - Build a Soroban `set_last_payment` invocation and submit it through Freighter.
   - Surface success/error feedback plus a link to Stellar Expert for the transaction.

5. For production builds:
   ```bash
   npm run build
   ```

## Testing & verification

- Contract: `cd contract && cargo +nightly test`.
- Frontend: `cd vite-project && npm run build`.

## Notes

- The contract uses `symbol!` keys so that the frontend can always read the last stored payment.
- The frontend relies on `@stellar/stellar-sdk` for Soroban tooling and `@stellar/freighter-api` to request signatures from the extension.
- Keep your testnet Freighter wallet funded via Friendbot before attempting transactions.
