
import { useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  isAddress,
  parseEther,
} from "ethers";
import "./App.css";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
    };
  }
}

const SEPOLIA_CHAIN_ID = 11155111;

const ABI = [
  "function savings(address) view returns (uint256)",
  "function savingsGoal(address) view returns (uint256)",
  "function getSavingsProgress() view returns (uint256)",
  "function setSavingsGoal(uint256 goal)",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
];

const CONTRACT_ADDRESS = (
  import.meta.env.VITE_SAVECHAIN_CONTRACT_ADDRESS as string | undefined
)?.trim();

function formatEth(value: bigint) {
  return Number(formatEther(value)).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState("0");
  const [savings, setSavings] = useState("0");
  const [goal, setGoal] = useState("0");
  const [progress, setProgress] = useState(0);

  const [goalInput, setGoalInput] = useState("1");
  const [depositInput, setDepositInput] = useState("0.01");
  const [withdrawInput, setWithdrawInput] = useState("0.01");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const contractReady =
    !!CONTRACT_ADDRESS && isAddress(CONTRACT_ADDRESS);

  const connected = !!account;
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  async function getProvider() {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask was not detected. Install the official MetaMask extension."
      );
    }

    return new BrowserProvider(window.ethereum as never);
  }

  async function loadContractData(
    provider: BrowserProvider,
    address: string
  ) {
    if (!contractReady || !CONTRACT_ADDRESS) return;

    const contract = new Contract(
      CONTRACT_ADDRESS,
      ABI,
      provider
    );

    const [saved, target, percentage, wallet] = await Promise.all([
      contract.savings(address) as Promise<bigint>,
      contract.savingsGoal(address) as Promise<bigint>,
      contract.getSavingsProgress() as Promise<bigint>,
      provider.getBalance(address),
    ]);

    setSavings(formatEth(saved));
    setGoal(formatEth(target));
    setProgress(Number(percentage));
    setWalletBalance(formatEth(wallet));
  }

  async function connectWallet() {
    setError("");
    setMessage("");

    try {
      if (!window.ethereum) {
        window.open("https://metamask.io/", "_blank", "noopener,noreferrer");
        throw new Error(
          "Install MetaMask, then return here and click Connect Wallet."
        );
      }

      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
        const err = switchError as { code?: number };

        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                nativeCurrency: {
                  name: "Sepolia Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setAccount(address);
      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error(
          "Please switch MetaMask to Sepolia and try connecting again."
        );
      }

      if (contractReady) {
        await loadContractData(provider, address);
        setMessage("Wallet connected to SaveChain.");
      } else {
        setWalletBalance(
          formatEth(await provider.getBalance(address))
        );
        setMessage(
          "Wallet connected! Contract actions will be enabled after deployment."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect wallet."
      );
    }
  }

  async function refreshData() {
    setError("");
    setMessage("");

    try {
      const provider = await getProvider();
      const network = await provider.getNetwork();

      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error("Switch MetaMask to Sepolia first.");
      }

      if (!account) {
        throw new Error("Connect your wallet first.");
      }

      if (!contractReady) {
        setWalletBalance(
          formatEth(await provider.getBalance(account))
        );
        setMessage("Wallet balance refreshed. Contract not deployed yet.");
        return;
      }

      await loadContractData(provider, account);
      setMessage("Savings information refreshed.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh data."
      );
    }
  }

  async function runTransaction(
    operation: (contract: Contract) => Promise<unknown>,
    successMessage: string
  ) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (!account) throw new Error("Connect your wallet first.");
      if (!onSepolia) throw new Error("Connect to Sepolia first.");
      if (!contractReady || !CONTRACT_ADDRESS) {
        throw new Error(
          "SaveChain is not deployed yet. We'll add its address after deployment."
        );
      }

      const provider = await getProvider();
      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const tx = (await operation(contract)) as {
        wait: () => Promise<unknown>;
        hash: string;
      };

      setMessage(`Transaction submitted: ${tx.hash}`);

      await tx.wait();

      await loadContractData(provider, account);
      setMessage(`${successMessage} Transaction confirmed: ${tx.hash}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed.";

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function setSavingsGoal() {
    try {
      const amount = parseEther(goalInput);
      if (amount <= 0n) throw new Error("Goal must be greater than zero.");

      await runTransaction(
        (contract) => contract.setSavingsGoal(amount),
        "Savings goal updated!"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid savings goal."
      );
    }
  }

  async function deposit() {
    try {
      const amount = parseEther(depositInput);
      if (amount <= 0n) throw new Error("Deposit must be greater than zero.");

      await runTransaction(
        (contract) => contract.deposit({ value: amount }),
        "Deposit successful!"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid deposit amount.");
    }
  }

  async function withdraw() {
    try {
      const amount = parseEther(withdrawInput);
      if (amount <= 0n) {
        throw new Error("Withdrawal must be greater than zero.");
      }

      await runTransaction(
        (contract) => contract.withdraw(amount),
        "Withdrawal successful!"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid withdrawal amount."
      );
    }
  }

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  const numericGoal = Number(goal);
  const numericSavings = Number(savings);
  const remaining = Math.max(numericGoal - numericSavings, 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SaveChain home">
          <span className="brand-icon">S</span>
          <span>SaveChain</span>
        </a>

        <div className="topbar-right">
          <span className={`network-pill ${onSepolia ? "online" : ""}`}>
            <span className="status-dot" />
            {onSepolia ? "Sepolia Testnet" : "Testnet"}
          </span>

          <button
            className="wallet-button"
            onClick={connectWallet}
            disabled={busy}
          >
            {connected ? shortAddress : "Connect Wallet"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            YOUR ON-CHAIN SAVINGS
          </div>

          <h1>
            Save with purpose.
            <br />
            <span>Build your future.</span>
          </h1>

          <p className="hero-description">
            Set a goal, track your progress, and manage your savings
            transparently on Ethereum.
          </p>
        </div>

        <div className="hero-decoration" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="hero-coin">Ξ</div>
        </div>
      </section>

      {!connected && (
        <section className="connect-banner">
          <div>
            <strong>Start with your wallet</strong>
            <p>Connect MetaMask to view your wallet and savings.</p>
          </div>
          <button className="primary-button" onClick={connectWallet}>
            Connect MetaMask <span>↗</span>
          </button>
        </section>
      )}

      {connected && !onSepolia && (
        <section className="notice warning">
          <strong>Wrong network</strong>
          <p>Switch MetaMask to Sepolia to continue.</p>
          <button className="secondary-button" onClick={connectWallet}>
            Switch to Sepolia
          </button>
        </section>
      )}

      {connected && onSepolia && !contractReady && (
        <section className="notice">
          <strong>Your wallet is connected!</strong>
          <p>
            We're preparing the smart contract. Savings actions will become
            available after we deploy SaveChain and configure its address.
          </p>
        </section>
      )}

      {error && (
        <div className="feedback error" role="alert">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {message && (
        <div className="feedback success" role="status">
          <span>✓</span>
          <p>{message}</p>
          <button onClick={() => setMessage("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="section-heading">
        <div>
          <h2>Your overview</h2>
          <p>A simple view of your savings journey.</p>
        </div>
        <button
          className="refresh-button"
          onClick={refreshData}
          disabled={!connected || busy}
        >
          ↻ Refresh
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card main-stat">
          <div className="stat-label">Total saved</div>
          <div className="stat-value">
            {savings} <span>ETH</span>
          </div>
          <div className="stat-footnote">
            {contractReady ? "Recorded by SaveChain" : "Contract not deployed"}
          </div>
          <div className="stat-icon">↗</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Savings goal</div>
          <div className="stat-value">
            {goal} <span>ETH</span>
          </div>
          <div className="stat-footnote">Your target amount</div>
          <div className="stat-icon">◎</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Wallet balance</div>
          <div className="stat-value">
            {walletBalance} <span>ETH</span>
          </div>
          <div className="stat-footnote">Sepolia test ETH</div>
          <div className="stat-icon">◇</div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Goal progress</h2>
              <p>Every step gets you closer.</p>
            </div>
            <span className="progress-badge">{progress}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>

          <div className="progress-numbers">
            <div>
              <span>Saved so far</span>
              <strong>{savings} ETH</strong>
            </div>
            <div className="align-right">
              <span>Goal</span>
              <strong>{goal} ETH</strong>
            </div>
          </div>

          <div className="remaining-box">
            <span className="remaining-icon">✦</span>
            <div>
              <strong>
                {numericGoal > 0
                  ? remaining === 0
                    ? "Goal reached!"
                    : `${remaining.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })} ETH to go`
                  : "Set your first goal"}
              </strong>
              <p>Progress is calculated from your on-chain savings.</p>
            </div>
          </div>
        </article>

        <article className="panel goal-panel">
          <div className="panel-heading">
            <div>
              <h2>Set your goal</h2>
              <p>Choose your savings target.</p>
            </div>
            <span className="panel-icon">◎</span>
          </div>

          <label htmlFor="goalInput">Target amount (ETH)</label>
          <div className="input-wrap">
            <input
              id="goalInput"
              type="number"
              min="0"
              step="0.001"
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="e.g. 1"
            />
            <span>ETH</span>
          </div>

          <button
            className="primary-button full-width"
            onClick={setSavingsGoal}
            disabled={!contractReady || !connected || !onSepolia || busy}
          >
            {busy ? "Processing..." : "Update savings goal"}
          </button>
        </article>
      </section>

      <section className="section-heading actions-heading">
        <div>
          <h2>Manage savings</h2>
          <p>Deposit test ETH or withdraw your recorded savings.</p>
        </div>
      </section>

      <section className="actions-grid">
        <article className="panel action-panel">
          <div className="action-title">
            <span className="action-icon deposit-icon">↓</span>
            <div>
              <h3>Deposit</h3>
              <p>Add test ETH to your savings.</p>
            </div>
          </div>

          <label htmlFor="depositInput">Amount to deposit</label>
          <div className="input-wrap">
            <input
              id="depositInput"
              type="number"
              min="0"
              step="0.001"
              value={depositInput}
              onChange={(event) => setDepositInput(event.target.value)}
            />
            <span>ETH</span>
          </div>

          <button
            className="primary-button full-width"
            onClick={deposit}
            disabled={!contractReady || !connected || !onSepolia || busy}
          >
            Deposit ETH <span>↗</span>
          </button>
        </article>

        <article className="panel action-panel">
          <div className="action-title">
            <span className="action-icon withdraw-icon">↑</span>
            <div>
              <h3>Withdraw</h3>
              <p>Return your recorded savings to your wallet.</p>
            </div>
          </div>

          <label htmlFor="withdrawInput">Amount to withdraw</label>
          <div className="input-wrap">
            <input
              id="withdrawInput"
              type="number"
              min="0"
              step="0.001"
              value={withdrawInput}
              onChange={(event) => setWithdrawInput(event.target.value)}
            />
            <span>ETH</span>
          </div>

          <button
            className="secondary-button full-width"
            onClick={withdraw}
            disabled={!contractReady || !connected || !onSepolia || busy}
          >
            Withdraw ETH <span>↗</span>
          </button>
        </article>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-icon">S</span>
          <strong>SaveChain</strong>
        </div>
        <p>Educational project · Sepolia testnet · No real funds intended</p>
        {connected && (
          <a
            href={`https://sepolia.etherscan.io/address/${account}`}
            target="_blank"
            rel="noreferrer"
          >
            View wallet on Etherscan ↗
          </a>
        )}
      </footer>
    </main>
  );
}

export default App;
