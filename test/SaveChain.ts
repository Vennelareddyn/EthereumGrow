
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther } from "ethers";

describe("SaveChain", async function () {
  const { ethers } = await network.connect();

  async function deploySaveChain() {
    const [owner, user2] = await ethers.getSigners();
    const saveChain = await ethers.deployContract("SaveChain");
    await saveChain.waitForDeployment();

    return { owner, user2, saveChain };
  }

  it("accepts deposits and updates savings", async function () {
    const { owner, saveChain } = await deploySaveChain();

    await (await saveChain.deposit({ value: parseEther("1") })).wait();

    assert.equal(
      await saveChain.savings(owner.address),
      parseEther("1")
    );
  });

  it("rejects zero deposits", async function () {
    const { saveChain } = await deploySaveChain();

    await assert.rejects(
      saveChain.deposit({ value: 0n })
    );
  });

  it("sets a savings goal", async function () {
    const { owner, saveChain } = await deploySaveChain();

    await (
      await saveChain.setSavingsGoal(parseEther("2"))
    ).wait();

    assert.equal(
      await saveChain.savingsGoal(owner.address),
      parseEther("2")
    );
  });

  it("withdraws funds and updates savings", async function () {
    const { owner, saveChain } = await deploySaveChain();

    await (await saveChain.deposit({ value: parseEther("1") })).wait();
    await (
      await saveChain.withdraw(parseEther("0.4"))
    ).wait();

    assert.equal(
      await saveChain.savings(owner.address),
      parseEther("0.6")
    );
  });

  it("rejects withdrawals exceeding savings", async function () {
    const { saveChain } = await deploySaveChain();

    await assert.rejects(
      saveChain.withdraw(parseEther("1"))
    );
  });

  it("keeps savings separate for different wallets", async function () {
    const { owner, user2, saveChain } = await deploySaveChain();

    await (await saveChain.deposit({ value: parseEther("1") })).wait();

    assert.equal(
      await saveChain.savings(user2.address),
      0n
    );
    assert.equal(
      await saveChain.savings(owner.address),
      parseEther("1")
    );
  });

  it("calculates savings progress", async function () {
    const { saveChain } = await deploySaveChain();

    await (
      await saveChain.setSavingsGoal(parseEther("2"))
    ).wait();

    await (await saveChain.deposit({ value: parseEther("1") })).wait();

    assert.equal(await saveChain.getSavingsProgress(), 50n);
  });
});
