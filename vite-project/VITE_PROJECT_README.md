# StellaPay - Complete End-to-End Mini-dApp

A production-quality Soroban mini-dApp built with **React**, **Vite**, and **Tailwind CSS** for managing Stellar payments on testnet.

## Features

✨ **Complete Features:**
- 🔐 Freighter wallet integration with secure connection handling
- 💳 Set and retrieve payment data on Soroban contract
- 📱 Fully responsive design with Tailwind CSS
- ⚡ Real-time balance updates
- 🛡️ Comprehensive error handling and validation
- 🧪 Full test coverage with Vitest and React Testing Library
- 🎯 Type-safe development with JSDoc
- 📊 Transaction explorer links
- 🎨 Professional UI components library

## Project Structure

```
src/
├── components/           # Reusable React components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Alert.jsx
│   ├── Input.jsx
│   ├── WalletInfo.jsx
│   ├── WalletConnect.jsx
│   ├── SetPaymentForm.jsx
│   └── GetPaymentDisplay.jsx
├── contexts/            # React Context for state management
│   └── WalletContext.jsx
├── services/            # Business logic services
│   ├── walletService.js
│   └── contractService.js
├── hooks/              # Custom React hooks
│   └── index.js
├── utils/              # Utility functions
│   ├── constants.js
│   └── errors.js
├── test/               # Test files
│   ├── setup.js
│   ├── utils.test.js
│   ├── walletService.test.js
│   ├── Button.test.jsx
│   ├── Alert.test.jsx
│   └── Input.test.jsx
├── App.jsx             # Main application component
├── main.jsx            # Entry point
├── App.css             # Application styles
└── main.css            # Tailwind CSS imports
```

## Setup & Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- [Freighter Wallet](https://www.freighter.app/) browser extension
- Access to Stellar testnet

### Installation

1. **Install dependencies:**
```bash
cd vite-project
npm install
```

2. **Configure environment variables:**
Create a `.env.local` file:
```env
VITE_SOROBAN_SERVER_URL=https://soroban-testnet.stellar.org
VITE_CONTRACT_ID=CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN
VITE_NETWORK=testnet
```

## Development

### Start Development Server
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Test Files Coverage
- ✅ `utils.test.js` - Utility function tests
- ✅ `walletService.test.js` - Wallet service tests  
- ✅ `Button.test.jsx` - Button component tests
- ✅ `Alert.test.jsx` - Alert component tests
- ✅ `Input.test.jsx` - Input component tests

## Key Components

### 🔐 WalletContext
Global state management for wallet connection and balance.

```jsx
const { publicKey, balance, isConnected, connectWallet, disconnectWallet } = useWallet();
```

### 💼 Services

**walletService.js:**
- Connect/disconnect wallet
- Fetch account balance
- Sign transactions
- Network configuration

**contractService.js:**
- Set last payment
- Get last payment
- Simulate transactions
- Handle contract interactions

### 🎨 Reusable Components

- **Button** - Multiple variants (primary, secondary, danger)
- **Card** - Container with header, body, footer
- **Alert** - Error/success/warning/info notifications
- **Input** - Form inputs with validation
- **WalletConnect** - Wallet connection UI
- **SetPaymentForm** - Payment submission form
- **GetPaymentDisplay** - Payment retrieval display

## Error Handling

The app includes comprehensive error handling:

- ✅ Wallet connection errors
- ✅ Network/RPC errors
- ✅ Validation errors
- ✅ Transaction simulation failures
- ✅ User cancellation handling
- ✅ Input validation with custom messages

## Styling

Built with **Tailwind CSS** for:
- Responsive design (mobile-first)
- Stellar-themed colors
- Consistent spacing and typography
- Dark mode ready

### Custom Colors
```
stellar-blue: #001f4d
stellar-lightblue: #0066cc
stellar-gray: #f7f7f8
```

## Smart Features

### Auto-Persistence
- Wallet connection state saved to localStorage
- Auto-reconnect on page reload

### Real-time Updates
- Balance refresh on payment
- Transaction status checking
- Stellar Expert explorer links

### User Experience
- Loading states on all async operations
- Clear error messages
- Success confirmations
- Address formatting (truncated display)
- Amount formatting with decimals

## Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy the dist/ folder
```

## Contract Integration

The dApp interacts with a Soroban contract with two main functions:

```rust
pub fn set_last_payment(env: Env, to: Address, amount: i128, memo: String)
pub fn last_payment(env: Env) -> Option<LastPayment>
```

Contract address: `CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN`

## Technologies Used

- **Frontend Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **Testing:** Vitest + React Testing Library
- **Blockchain:** Stellar SDK + Soroban RPC
- **Wallet:** Freighter API
- **State Management:** React Context API

## Code Quality

- ✅ Comprehensive error handling
- ✅ Input validation with clear feedback
- ✅ Clean component architecture
- ✅ Service layer separation of concerns
- ✅ Utility functions for reusability
- ✅ Test coverage for critical paths
- ✅ Responsive and accessible UI

## Performance

- ⚡ Fast page load with Vite
- ⚡ Minimal bundle size
- ⚡ Efficient re-renders with React hooks
- ⚡ Lazy loading on demand

## Security Considerations

- ✅ No private keys stored client-side
- ✅ All transactions signed by Freighter
- ✅ Input validation and sanitization
- ✅ HTTPS only in production
- ✅ Environment variables for sensitive data

## Troubleshooting

### Wallet Not Connecting
1. Ensure Freighter is installed and unlocked
2. Check network is set to testnet
3. Refresh page and try again

### Transaction Failed
1. Ensure sufficient balance
2. Check contract ID is correct
3. Verify network connection

### Tests Failing
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Run: `npm test -- --clearCache`

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

## License

MIT License - feel free to use in your projects!

## Resources

- [Stellar Docs](https://developers.stellar.org/)
- [Soroban Docs](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ for the Stellar Community**
