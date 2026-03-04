import { useState } from "react";
import {
  getAddress,
  signTransaction,
  isConnected
} from "@stellar/freighter-api";
import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Address,
  Contract,
  nativeToScVal
} from "@stellar/stellar-sdk";

const contractId =
  "CA2CPSF57SRXTKGSS2ZBR2FQ2X64O5VMJF6JRFT4PAAN5EDPVYLPX4XN";

const server = new SorobanRpc.Server(
  "https://soroban-testnet.stellar.org"
);

function App() {
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState("");
  const [lastPayment, setLastPayment] = useState("");

  async function connectWallet() {
    const connected = await isConnected();
    if (!connected) {
      alert("Connect Freighter first");
      return;
    }

    const address = await getAddress();
    setPublicKey(address);

    const account = await server.getAccount(address);
    const bal = account.balances.find(b => b.asset_type === "native");
    setBalance(bal.balance);
  }

  async function setPayment() {
    const account = await server.getAccount(publicKey);
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(
        contract.call(
          "set_last_payment",
          nativeToScVal(100)
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    tx.addFootprint(simulated.result.footprint);

    const signed = await signTransaction(tx.toXDR(), {
      network: "TESTNET"
    });

    const signedTx = TransactionBuilder.fromXDR(
      signed,
      Networks.TESTNET
    );

    const result = await server.sendTransaction(signedTx);

    alert("Transaction Sent: " + result.hash);
  }

  async function getPayment() {
    const contract = new Contract(contractId);

    const account = await server.getAccount(publicKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(contract.call("last_payment"))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);

    const value = simulated.result.retval;
    const decoded = value._value.toString();

    setLastPayment(decoded);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>StellaPay</h1>

      <button onClick={connectWallet}>
        Connect Wallet
      </button>

      <p>Public Key: {publicKey}</p>
      <p>Balance: {balance} XLM</p>

      <hr />

      <button onClick={setPayment}>
        Send Test Payment (100)
      </button>

      <button onClick={getPayment}>
        Get Last Payment
      </button>

      <p>Last Payment: {lastPayment}</p>
    </div>
  );
}

export default App;