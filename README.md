# EthereumGrow 🌱

**Grow your goals. Your ETH. Your growth.**

EthereumGrow is a decentralized savings-goal DApp built with Solidity, Hardhat, React, TypeScript, ethers.js, and MetaMask. It allows users to set savings goals, deposit ETH into a smart contract, track their savings progress, and withdraw funds recorded for their wallet.

> **Network:** Ethereum Sepolia Testnet  
> **Project type:** Blockchain / Web3 learning project  
> **Status:** Development and testing

## ✨ Features

- Connect a wallet using MetaMask.
- Set a personal savings goal.
- Deposit ETH into a smart contract.
- Track savings recorded on the blockchain.
- View savings goals and progress.
- Withdraw available recorded savings.
- Review transactions on Sepolia Etherscan.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Solidity | Smart contract development |
| Hardhat | Contract compilation, testing, and deployment |
| React | Frontend user interface |
| TypeScript | Type-safe frontend development |
| ethers.js | Communication with Ethereum |
| MetaMask | Wallet connection and transaction signing |
| Ethereum Sepolia | Blockchain test network |
| Vite | Frontend development server |

## 🏗️ Architecture

```text
User
  |
  v
React Frontend
  |
  v
ethers.js
  |
  v
MetaMask Wallet
  |
  | User reviews and approves transaction
  v
Ethereum Sepolia Network
  |
  v
EthereumGrow Smart Contract
  |
  v
Updated On-chain State
  |
  v
Frontend Refreshes Savings Data
```

## 🔄 How Transactions Work

1. The user clicks an action such as **Set Goal**, **Deposit**, or **Withdraw**.
2. The React frontend calls the smart contract through ethers.js.
3. MetaMask opens a transaction confirmation window for state-changing operations.
4. The user reviews the transaction details, network, amount, and estimated gas fee.
5. If approved, MetaMask signs the transaction and broadcasts it to Ethereum Sepolia.
6. The network processes the transaction and executes the smart contract function.
7. After confirmation, the frontend reads the updated blockchain state and refreshes the dashboard.

Read-only operations generally do not require transaction approval and do not cost the user gas.

## 📜 Smart Contract Functions

The `SaveChain` smart contract currently supports:

| Function | Description |
|---|---|
| `setSavingsGoal(goal)` | Sets a non-zero savings goal for the caller. |
| `deposit()` | Deposits ETH and credits it to the caller's savings. |
| `savings(address)` | Reads the savings recorded for a wallet. |
| `savingsGoal(address)` | Reads the savings goal for a wallet. |
| `getSavingsProgress()` | Calculates savings progress as a percentage of the goal. |
| `withdraw(amount)` | Withdraws an amount covered by the caller's recorded savings. |

**Note:** Reaching a savings goal does not automatically withdraw funds. The user must initiate a withdrawal. The contract checks the caller's recorded savings before processing it.

## 🌐 Sepolia Deployment

- **Network:** Ethereum Sepolia
- **Chain ID:** `11155111`
- **Contract address:** `0xEE1Da0220bF8216F8e247b4024eEDA3740aF3Cba`
- **Contract explorer:** [View EthereumGrow on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xEE1Da0220bF8216F8e247b4024eEDA3740aF3Cba)
- **Deployment transaction:** [View deployment transaction](https://sepolia.etherscan.io/tx/0x8af54a0b2008693d60b90b118af7e9ef2ddcde4873db40d096559289a25abc34)

If the contract is redeployed, update the contract address in the frontend configuration and this section.

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js and npm
- Git
- MetaMask browser extension
- Sepolia test ETH for transactions

### 1. Clone the repository

```bash
git clone https://github.com/Vennelareddyn/EthereumGrow.git
cd EthereumGrow
```

### 2. Install root dependencies

```bash
npm install
```

### 3. Configure environment variables

For deployment, create a local `.env` file in the project root:

```dotenv
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url.example
SEPOLIA_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```

These are **dummy placeholders only**. Replace them locally with valid configuration when needed.

Never commit your real private key or expose it in frontend code.

### 4. Compile and test the contract

From the project root:

```bash
npx hardhat compile
npx hardhat test
```

### 5. Configure the frontend

Create `frontend/.env.local`:

```dotenv
VITE_SAVECHAIN_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

Replace the placeholder with the actual deployed contract address when running locally.

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

Connect MetaMask and switch to **Ethereum Sepolia**.

Restart the Vite server after changing frontend environment variables.

## 🚢 Deploying the Smart Contract

Deployment is optional when using the existing deployed contract.

To deploy a new contract instance, configure the root `.env` file and ensure the deployment wallet has sufficient Sepolia test ETH.

Run from the project root:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

A new deployment creates a new contract address. Update the frontend configuration if you want the application to use that new deployment.

## 🔐 Security Considerations

- Never commit private keys, recovery phrases, or wallet backups.
- Never put private keys in frontend environment variables beginning with `VITE_`.
- Review MetaMask transaction details and estimated gas before approving.
- Reject unfamiliar or unexpected wallet requests.
- Use test ETH for development and testing.
- Remember that public blockchain transactions are visible on the blockchain.
- Do not treat this learning project as an audited financial application.

## 📌 Current Limitations

- The project is intended for learning and demonstration.
- Savings goals are targets and do not automatically trigger withdrawals.
- Progress may exceed 100% if savings exceed the goal.
- A wallet's ETH balance is different from the savings recorded in the contract.
- Transaction success should be verified using the transaction receipt and contract state.

## 🗂️ Repository Structure

```text
EthereumGrow/
├── contracts/
│   └── SaveChain.sol
├── frontend/
│   └── src/
├── scripts/
│   └── deploy.ts
├── test/
├── ignition/
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## 🔗 Useful Links

- **GitHub Repository:** https://github.com/Vennelareddyn/EthereumGrow
- **Sepolia Etherscan:** https://sepolia.etherscan.io/
- **Sepolia Faucet:** https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- **Solidity Documentation:** https://docs.soliditylang.org/
- **Hardhat Documentation:** https://hardhat.org/docs
- **ethers.js Documentation:** https://docs.ethers.org/
- **MetaMask Documentation:** https://support.metamask.io/

## 📄 License

No license has been selected yet. Unless a license is added, others do not automatically receive permission to reuse, distribute, or modify this project.

---

Built to explore smart contracts, wallet interactions, and decentralized applications on Ethereum.
