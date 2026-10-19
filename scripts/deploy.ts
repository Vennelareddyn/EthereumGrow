
import { network } from "hardhat";

const { ethers } = await network.connect();

const [deployer] = await ethers.getSigners();

const networkInfo = await ethers.provider.getNetwork();
const balance = await ethers.provider.getBalance(deployer.address);

console.log("Network:", networkInfo.name);
console.log("Chain ID:", networkInfo.chainId.toString());
console.log("Deployer:", deployer.address);
console.log("Balance:", ethers.formatEther(balance), "ETH");

if (networkInfo.chainId !== 11155111n) {
  throw new Error("Wrong network. Expected Ethereum Sepolia.");
}

if (balance === 0n) {
  throw new Error(
    "Deployer has no ETH. Get Sepolia test ETH before deploying."
  );
}

console.log("Deploying SaveChain...");

const saveChain = await ethers.deployContract("SaveChain");

const deploymentTx = saveChain.deploymentTransaction();

if (!deploymentTx) {
  throw new Error("Deployment transaction was not created.");
}

console.log("Deployment transaction:", deploymentTx.hash);

await saveChain.waitForDeployment();

const address = await saveChain.getAddress();

console.log("SaveChain deployed at:", address);
console.log(
  `Explorer: https://sepolia.etherscan.io/address/${address}`
);
