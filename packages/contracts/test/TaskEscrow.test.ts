/// Test suite for the TaskEscrow contract.
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
    escrow = (await factory.deploy()) as TaskEscrow;
    await escrow.waitForDeployment();
  });

  /// Return a deadline `offsetSeconds` into the future.
  async function futureDeadline(offsetSeconds: number): Promise<number> {
    const latest = await time.latest();
    return latest + offsetSeconds;
  }

  // ---------------------------------------------------------------------------
  // createTask
  // ---------------------------------------------------------------------------

  it("should create a task with escrowed funds", async function () {
    const deadline = await futureDeadline(3600);

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD })
    ).to.emit(escrow, "TaskCreated");

    const task = await escrow.getTask(TASK_ID);
    expect(task.client).to.equal(client.address);
    expect(task.reward).to.equal(REWARD);
    expect(task.status).to.equal(0n); // Open
    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(
      REWARD
    );
  });

  it("should reject duplicate task IDs", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD })
    ).to.be.revertedWith("Task already exists");
  });

  // ---------------------------------------------------------------------------
  // assignTask
  // ---------------------------------------------------------------------------

  it("should assign a task to a robot", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(escrow.connect(client).assignTask(TASK_ID, robot.address))
      .to.emit(escrow, "TaskAssigned");

    const task = await escrow.getTask(TASK_ID);
    expect(task.robot).to.equal(robot.address);
    expect(task.status).to.equal(1n); // Assigned
  });

  it("should only allow client to assign", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(other).assignTask(TASK_ID, robot.address)
    ).to.be.revertedWith("Only client can assign");
  });

  // ---------------------------------------------------------------------------
  // completeTask
  // ---------------------------------------------------------------------------

  it("should complete task and release payment", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    const robotBalanceBefore = await ethers.provider.getBalance(robot.address);

    const tx = await escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

    const robotBalanceAfter = await ethers.provider.getBalance(robot.address);
    expect(robotBalanceAfter).to.equal(robotBalanceBefore + REWARD - gasUsed);

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(2n); // Completed
    expect(task.proofHash).to.equal(PROOF_HASH);
  });

  it("should only allow assigned robot to complete", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await expect(
      escrow.connect(other).completeTask(TASK_ID, PROOF_HASH)
    ).to.be.revertedWith("Only assigned robot");
  });

  it("should reject completion after deadline", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    // Advance time past the deadline.
    await time.increaseTo(deadline + 1);

    await expect(
      escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH)
    ).to.be.revertedWith("Deadline passed");
  });

  // ---------------------------------------------------------------------------
  // refundTask
  // ---------------------------------------------------------------------------

  it("should refund after deadline passes", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    // Advance time past the deadline.
    await time.increaseTo(deadline + 1);

    const clientBalanceBefore = await ethers.provider.getBalance(client.address);

    // Anyone can trigger the refund.
    await escrow.connect(other).refundTask(TASK_ID);

    const clientBalanceAfter = await ethers.provider.getBalance(client.address);
    expect(clientBalanceAfter).to.equal(clientBalanceBefore + REWARD);

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(3n); // Refunded
  });

  it("should reject refund before deadline", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, { value: REWARD });

    await expect(
      escrow.connect(other).refundTask(TASK_ID)
    ).to.be.revertedWith("Deadline not reached");
  });
});
