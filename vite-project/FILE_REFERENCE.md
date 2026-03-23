# File Reference Guide

## Quick Navigation

### 🎯 Entry Points
- `src/main.jsx` - Application entry point
- `src/App.jsx` - Main application component
- `index.html` - HTML template

### 🎨 Components (`src/components/`)

| Component | Purpose | Props | Usage |
|-----------|---------|-------|-------|
| `Button.jsx` | Reusable button | `onClick`, `disabled`, `isLoading`, `variant` | `<Button onClick={...}>Click</Button>` |
| `Card.jsx` | Container layout | Children | `<Card><CardHeader>...</CardHeader></Card>` |
| `Alert.jsx` | Notification | `type`, `message`, `onClose` | `<Alert type="success" message="..." />` |
| `Input.jsx` | Form input | `type`, `label`, `value`, `onChange`, `error` | `<Input label="Name" onChange={...} />` |
| `WalletInfo.jsx` | Wallet display | `publicKey`, `balance`, `isConnected` | Display only |
| `WalletConnect.jsx` | Connection UI | None | `<WalletConnect />` |
| `SetPaymentForm.jsx` | Payment form | `onSuccess` | `<SetPaymentForm onSuccess={...} />` |
| `GetPaymentDisplay.jsx` | Payment display | `onPaymentRetrieved` | `<GetPaymentDisplay />` |

### 🔧 Services (`src/services/`)

#### walletService.js
```javascript
import walletService from '../services/walletService.js';

// Methods
await walletService.connect()                    // Connect wallet
await walletService.disconnect()                 // Disconnect
await walletService.getBalance()                 // Get balance
await walletService.signTransaction(tx)          // Sign transaction
walletService.getPublicKey()                     // Get current key
walletService.isConnected()                      // Check status
walletService.getServer()                        // Get RPC server
walletService.getNetworkPassphrase()             // Get network
```

#### contractService.js
```javascript
import contractService from '../services/contractService.js';

// Methods
await contractService.setLastPayment(to, amount, memo)  // Set payment
await contractService.getLastPayment()                  // Get payment
await contractService.simulateTransaction(tx)           // Simulate tx
await contractService.getTransactionStatus(hash)        // Check status
```

### 🎯 Hooks (`src/hooks/`)

#### Custom Hooks
```javascript
import { useWallet, useFormatAddress, useFormatXLM } from '../hooks/';

// useWallet()
const {
  publicKey,
  balance,
  isConnected,
  isLoading,
  error,
  connectWallet,
  disconnectWallet,
  refreshBalance,
  clearError
} = useWallet();

// useFormatAddress(address)
const formatted = useFormatAddress('GBUQ...');  // 'GBUQ...GVGVX'

// useFormatXLM(amount)
const formatted = useFormatXLM('100.50');       // '100.50 XLM'
```

### 🌍 Context (`src/contexts/`)

#### WalletContext.jsx
```javascript
import { WalletProvider, WalletContext } from '../contexts/WalletContext.jsx';

// Wrap your app:
<WalletProvider>
  <App />
</WalletProvider>

// Use in any component:
import { useWallet } from '../hooks/';
const wallet = useWallet();
```

### 🛠️ Utilities (`src/utils/`)

#### constants.js
```javascript
import {
  SOROBAN_SERVER_URL,
  CONTRACT_ID,
  NETWORK,
  NETWORKS,
  NETWORK_PASSPHRASE,
  BASE_TRANSACTION_FEE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../utils/constants.js';
```

#### errors.js
```javascript
import {
  StellaPayError,
  handleError,
  isValidStellarAddress,
  formatAmount,
  formatHash,
  getStellarExpertLink
} from '../utils/errors.js';

// Examples:
if (!isValidStellarAddress(addr)) { /* ... */ }
const formatted = formatAmount('100.456', 2);  // '100.46'
const link = getStellarExpertLink(hash, 'testnet');
```

### 🧪 Tests (`src/test/`)

| Test File | Coverage |
|-----------|----------|
| `utils.test.js` | Error utilities |
| `walletService.test.js` | Wallet service |
| `Button.test.jsx` | Button component |
| `Alert.test.jsx` | Alert component |
| `Input.test.jsx` | Input component |
| `integration.test.jsx` | Complete workflows |

## Import Patterns

### Component Imports
```javascript
// Single component
import { Button } from '../components/Button.jsx';
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card.jsx';
import { Alert } from '../components/Alert.jsx';
import { Input } from '../components/Input.jsx';
import { WalletConnect } from '../components/WalletConnect.jsx';
import { SetPaymentForm } from '../components/SetPaymentForm.jsx';
import { GetPaymentDisplay } from '../components/GetPaymentDisplay.jsx';
```

### Service Imports
```javascript
import walletService from '../services/walletService.js';
import contractService from '../services/contractService.js';
```

### Hook Imports
```javascript
import { useWallet, useFormatAddress, useFormatXLM } from '../hooks/';
```

### Utility Imports
```javascript
import {
  SOROBAN_SERVER_URL,
  CONTRACT_ID,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../utils/constants.js';

import {
  StellaPayError,
  handleError,
  isValidStellarAddress,
  formatAmount,
  formatHash,
  getStellarExpertLink
} from '../utils/errors.js';
```

### Context Imports
```javascript
import { WalletProvider } from '../contexts/WalletContext.jsx';
import { useWallet } from '../hooks/';  // Use instead
```

## File Organization by Feature

### Payment Setting Feature
- Component: `SetPaymentForm.jsx`
- Service: `contractService.setLastPayment()`
- Hook: `useWallet()`
- Utils: `isValidStellarAddress()`, `getStellarExpertLink()`

### Payment Retrieval Feature
- Component: `GetPaymentDisplay.jsx`
- Service: `contractService.getLastPayment()`
- Hook: `useWallet()`

### Wallet Connection Feature
- Component: `WalletConnect.jsx`, `WalletInfo.jsx`
- Service: `walletService.connect/disconnect()`
- Hook: `useWallet()`, `useFormatAddress()`
- Context: `WalletContext.jsx`

## Configuration Files

### Build & Development
- `vite.config.js` - Vite configuration
- `vitest.config.js` - Testing configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Environment
- `.env.local` - Environment variables
- `.env.example` - Environment template

### Dependencies
- `package.json` - npm dependencies
- `package-lock.json` - Dependency lock

## Data Flow Example

```
User clicks "Connect Wallet"
    ↓
WalletConnect component calls useWallet()
    ↓
connectWallet() from WalletContext
    ↓
walletService.connect() → Freighter API
    ↓
WalletContext updates global state
    ↓
Components re-render with new wallet data
```

## Common Tasks

### Connect to Wallet
```javascript
import { useWallet } from '../hooks/';

function MyComponent() {
  const { connectWallet, isConnected, publicKey } = useWallet();
  
  return (
    <button onClick={connectWallet}>
      {isConnected ? `Connected: ${publicKey}` : 'Connect'}
    </button>
  );
}
```

### Submit Payment
```javascript
import contractService from '../services/contractService.js';
import { isValidStellarAddress } from '../utils/errors.js';

async function submitPayment(to, amount, memo) {
  if (!isValidStellarAddress(to)) {
    console.error('Invalid address');
    return;
  }
  
  try {
    const result = await contractService.setLastPayment(to, amount, memo);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Get Last Payment
```javascript
import contractService from '../services/contractService.js';

async function getPayment() {
  try {
    const payment = await contractService.getLastPayment();
    if (payment) {
      console.log('Recipient:', payment.to);
      console.log('Amount:', payment.amount);
      console.log('Memo:', payment.memo);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Display Formatted Address
```javascript
import { useFormatAddress } from '../hooks/';

function AddressDisplay({ address }) {
  const formatted = useFormatAddress(address);
  return <div>{formatted}</div>;
}
```

### Handle Form with Validation
```javascript
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';
import { isValidStellarAddress } from '../utils/errors.js';

function PaymentForm() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidStellarAddress(address)) {
      setError('Invalid address');
      return;
    }
    // Process...
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        error={error}
      />
      <Button>Submit</Button>
    </form>
  );
}
```

## Type Hints (JSDoc)

All functions have JSDoc comments. View them for:
- Parameter types
- Return types
- Usage examples
- Error scenarios

Example viewing in VS Code:
1. Hover over function name
2. See JSDoc popup
3. Click to view full documentation

## Best Practices

✅ **DO:**
- Import only what you use
- Use hooks for state access
- Handle errors with try-catch
- Validate input before use
- Test your changes
- Update documentation

❌ **DON'T:**
- Store private keys
- Log sensitive data
- Make direct RPC calls (use services)
- Ignore errors
- Bypass validation
- Hardcode values (use constants)

---

**Need help? Refer to VITE_PROJECT_README.md or FRONTEND_DOCUMENTATION.md**
