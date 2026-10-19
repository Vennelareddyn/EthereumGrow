
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther } from "ethers";

describe("SaveChain gas baseline", async function () {
  const { ethers } = await network.connect();

  it("measures deployment, goal, deposit and withdrawal gas", async function () {
    const [owner] = await ethers.getSigners();

    // 1. Deploy the contract
    const factory = await ethers.getContractFactory("SaveChain");
    const saveChain = await factory.deploy();
    const deploymentReceipt = await saveChain.deploymentTransaction()!.wait();

    assert.ok(deploymentReceipt);

    console.log("\n--- SaveChain Gas Baseline ---");
    console.log("Deployment gas:", deploymentReceipt.gasUsed.toString());

    // 2. Set a savings goal
    const goalTx = await saveChain.setSavingsGoal(parseEther("2"));
    const goalReceipt = await goalTx.wait();

    assert.ok(goalReceipt);
    console.log("Set goal gas:", goalReceipt.gasUsed.toString());

    // 3. Deposit 1 test ETH
    const depositTx = await saveChain.deposit({
      value: parseEther("1"),
    });
    const depositReceipt = await depositTx.wait();

    assert.ok(depositReceipt);
    console.log("Deposit gas:", depositReceipt.gasUsed.toString());

    // 4. Withdraw 0.4 test ETH
    const withdrawTx = await saveChain.withdraw(parseEther("0.4"));
    const withdrawReceipt = await withdrawTx.wait();

    assert.ok(withdrawReceipt);
    console.log("Withdrawal gas:", withdrawReceipt.gasUsed.toString());

    // Confirm that the operations preserved the expected balance.
    assert.equal(
      await saveChain.savings(owner.address),
      parseEther("0.6")
    );

    console.log("------------------------------\n");
  });
});
