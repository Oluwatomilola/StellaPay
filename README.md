# Stellar Simple Payment dApp

This project combines a minimal Soroban contract with a React + Vite frontend so you can store the most recent payment details on-chain and then read or update that value through a browser UI backed by Freighter.

## Project layout

- `contract/` contains the Rust Soroban contract plus unit tests.
- `vite-project/` is the React + TypeScript frontend that connects to Freighter, displays the XLM balance, and submits `set_last_payment` invocations.

## Prerequisites

1. **Rust toolchain + Soroban CLI** – install via `rustup default nightly` and then `cargo install soroban-cli --locked`. The project relies on `cargo +nightly` for testing.
2. **Node.js 18+** – for the Vite frontend.
3. **Freighter browser extension** configured to the Testnet network and funded via Friendbot.
4. **Soroban contract ID** – you will deploy the contract and paste the resulting ID (32-byte hex) into the frontend environment.

## Smart contract

The contract exposes two entry points:

- `set_last_payment(address, amount, memo)` – stores (destination, amount, memo) inside persistent storage and emits a typed `PaymentSetEvent` so tools can decode the new data.
- `last_payment()` – reads the last stored payment (same structure) so the frontend can display it.

### Build & test

```bash
cd contract
cargo +nightly test
soroban contract build
```

After a successful build, the WASM artifact lives at `target/wasm32-unknown-unknown/release/contract.wasm`.

### Deploy to Testnet

1. Deploy using the Soroban CLI and note the returned contract ID (the 32-byte hex string in the response).

   ```bash
   soroban contract deploy \ 
     --wasm target/wasm32-unknown-unknown/release/contract.wasm \ 
     --network testnet
   ```

2. Keep that contract ID handy; the frontend reads it from `VITE_SOROBAN_CONTRACT_ID`.

## Frontend (Vite + React)

The frontend lets you:

- Connect a Freighter wallet and display the native XLM balance.
- Enter a destination, amount, and memo, then dispatch the `set_last_payment` invocation signed by Freighter.
- Refresh and render the data returned by the contract’s `last_payment` getter.

### Setup

```bash
cd vite-project
npm install
cp .env.example .env.local # or create your own
```

Add your deployed contract ID to the `.env.local`:

```text
VITE_SOROBAN_CONTRACT_ID=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Dev server

```bash
npm run dev
```

Open the served URL with Freighter enabled (typically `http://localhost:5173`).

### Production build

```bash
npm run build
```

## Deployment checklist

1. Build the contract (`soroban contract build`).
2. Deploy the WASM to Testnet (`soroban contract deploy …`).
3. Update `vite-project/.env.local` with the contract ID.
4. Run `npm run dev` and connect via Freighter to invoke `set_last_payment` or view the stored payment.

## Testing & verification

- Soroban contract: `cd contract && cargo +nightly test`.
- Frontend: `cd vite-project && npm run build`.

## Notes

- The frontend talks directly to Horizon/Soroban RPC and the Freighter extension; there is no intermediate server.
- All sensitive payloads (transaction XDRs) are signed by Freighter before being submitted to the Soroban RPC.
- Keep your Testnet account funded via Friendbot before sending transactions.
