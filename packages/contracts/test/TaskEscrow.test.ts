/// @file TaskEscrow.test.ts
/// @notice Test suite for the TaskEscrow contract.
///
/// Covers the full lifecycle: creation, assignment, completion, and refund,
/// along with access-control and deadline enforcement.

import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { TaskEscrow } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TaskEscrow", function () {
  let escrow: TaskEscrow;
  let client: HardhatEthersSigner;
  let robot: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const TASK_ID = "task-001";
  const REWARD = ethers.parseEther("1");
  const PROOF_HASH = ethers.keccak256(ethers.toUtf8Bytes("proof-payload"));

  /// Deploy a fresh contract before each test.
  beforeEach(async function () {
    [client, robot, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("TaskEscrow");
    escrow = (await factory.deploy()) as unknown as TaskEscrow;
    await escrow.waitForDeployment();
  });

  /// Return a unix timestamp `offsetSeconds` into the future.
  async function futureDeadline(offsetSeconds: number): Promise<bigint> {
    const latest = await time.latest();
    return BigInt(latest) + BigInt(offsetSeconds);
  }

  /** createTask */

  it("should create a task with escrowed funds", async function () {
    const deadline = await futureDeadline(3600);

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD })
    ).to.emit(escrow, "TaskCreated");

    const task = await escrow.getTask(TASK_ID);
    expect(task.client).to.equal(client.address);
    expect(task.reward).to.equal(REWARD);
    expect(task.status).to.equal(0n); // Open

    const contractAddr = await escrow.getAddress();
    expect(await ethers.provider.getBalance(contractAddr)).to.equal(REWARD);
  });

  it("should reject duplicate task IDs", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD })
    ).to.be.revertedWithCustomError(escrow, "TaskAlreadyExists");
  });

  it("should reject zero reward", async function () {
    const deadline = await futureDeadline(3600);

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, { value: 0 })
    ).to.be.revertedWithCustomError(escrow, "ZeroReward");
  });

  it("should reject deadline in the past", async function () {
    const pastDeadline = BigInt((await time.latest()) - 100);

    await expect(
      escrow.connect(client).createTask(TASK_ID, pastDeadline, { value: REWARD })
    ).to.be.revertedWithCustomError(escrow, "DeadlineNotFuture");
  });

  /** assignTask */

  it("should assign a robot to an open task", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(escrow.connect(client).assignTask(TASK_ID, robot.address))
      .to.emit(escrow, "TaskAssigned");

    const task = await escrow.getTask(TASK_ID);
    expect(task.robot).to.equal(robot.address);
    expect(task.status).to.equal(1n); // Assigned
  });

  it("should reject assignment from non-client", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(other).assignTask(TASK_ID, robot.address)
    ).to.be.revertedWithCustomError(escrow, "OnlyClient");
  });

  it("should reject assignment of zero address", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(client).assignTask(TASK_ID, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(escrow, "InvalidRobotAddress");
  });

  /** completeTask */

  it("should complete task and release payment to robot", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    const balanceBefore = await ethers.provider.getBalance(robot.address);

    const tx = await escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH);
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;

    const balanceAfter = await ethers.provider.getBalance(robot.address);
    expect(balanceAfter).to.equal(balanceBefore + REWARD - gasCost);

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(2n); // Completed
    expect(task.proofHash).to.equal(PROOF_HASH);
  });

  it("should reject completion from non-assigned robot", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await expect(
      escrow.connect(other).completeTask(TASK_ID, PROOF_HASH)
    ).to.be.revertedWithCustomError(escrow, "OnlyAssignedRobot");
  });

  it("should reject completion after deadline", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await time.increase(120);

    await expect(
      escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH)
    ).to.be.revertedWithCustomError(escrow, "DeadlineElapsed");
  });

  /** refundTask */

  it("should refund after deadline passes", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await time.increase(120);

    const balanceBefore = await ethers.provider.getBalance(client.address);

    /// Anyone can trigger the refund — use `other` to prove it.
    const tx = await escrow.connect(other).refundTask(TASK_ID);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(client.address);
    expect(balanceAfter).to.equal(balanceBefore + REWARD);

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(3n); // Refunded
  });

  it("should reject refund before deadline", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(other).refundTask(TASK_ID)
    ).to.be.revertedWithCustomError(escrow, "DeadlineNotReached");
  });
});
