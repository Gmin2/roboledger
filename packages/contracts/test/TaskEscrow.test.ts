/// @file TaskEscrow.test.ts
/// @notice Test suite for the TaskEscrow contract with ERC-8004 registry integration.

import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { TaskEscrow, ReputationRegistry } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TaskEscrow", function () {
  let escrow: TaskEscrow;
  let reputation: ReputationRegistry;
  let client: HardhatEthersSigner;
  let robot: HardhatEthersSigner;
  let validator1: HardhatEthersSigner;
  let validator2: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const TASK_ID = "task-001";
  const REWARD = ethers.parseEther("1");
  const PROOF_HASH = ethers.keccak256(ethers.toUtf8Bytes("proof-payload"));

  beforeEach(async function () {
    [client, robot, validator1, validator2, other] = await ethers.getSigners();

    const repFactory = await ethers.getContractFactory("ReputationRegistry");
    reputation = (await repFactory.deploy()) as unknown as ReputationRegistry;
    await reputation.waitForDeployment();

    const escrowFactory = await ethers.getContractFactory("TaskEscrow");
    escrow = (await escrowFactory.deploy(
      await reputation.getAddress()
    )) as unknown as TaskEscrow;
    await escrow.waitForDeployment();
  });

  async function futureDeadline(offsetSeconds: number): Promise<bigint> {
    const latest = await time.latest();
    return BigInt(latest) + BigInt(offsetSeconds);
  }

  /** createTask */

  it("should create a task with validation requirements", async function () {
    const deadline = await futureDeadline(3600);

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD })
    ).to.emit(escrow, "TaskCreated");

    const task = await escrow.getTask(TASK_ID);
    expect(task.client).to.equal(client.address);
    expect(task.requiredValidations).to.equal(2);
    expect(task.receivedValidations).to.equal(0);
  });

  it("should create a task with zero validations required", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });

    const task = await escrow.getTask(TASK_ID);
    expect(task.requiredValidations).to.equal(0);
  });

  it("should reject duplicate task IDs", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });

    await expect(
      escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD })
    ).to.be.revertedWithCustomError(escrow, "TaskAlreadyExists");
  });

  /** validateTask */

  it("should accept validation from any address", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await expect(
      escrow.connect(validator1).validateTask(TASK_ID)
    ).to.emit(escrow, "TaskValidated");

    const task = await escrow.getTask(TASK_ID);
    expect(task.receivedValidations).to.equal(1);
  });

  it("should reject duplicate validation from same address", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);
    await escrow.connect(validator1).validateTask(TASK_ID);

    await expect(
      escrow.connect(validator1).validateTask(TASK_ID)
    ).to.be.revertedWithCustomError(escrow, "AlreadyValidated");
  });

  it("should reject validation for non-assigned task", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD });

    await expect(
      escrow.connect(validator1).validateTask(TASK_ID)
    ).to.be.revertedWithCustomError(escrow, "TaskNotAssigned");
  });

  /** completeTask with validation */

  it("should complete task when validation threshold met", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);
    await escrow.connect(validator1).validateTask(TASK_ID);
    await escrow.connect(validator2).validateTask(TASK_ID);

    await expect(
      escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH)
    ).to.emit(escrow, "TaskCompleted");

    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(2n); // Completed
  });

  it("should reject completion when validations insufficient", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 2, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);
    await escrow.connect(validator1).validateTask(TASK_ID); // only 1 of 2

    await expect(
      escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH)
    ).to.be.revertedWithCustomError(escrow, "InsufficientValidations");
  });

  it("should allow completion without validation when required=0", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await expect(
      escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH)
    ).to.emit(escrow, "TaskCompleted");
  });

  it("should release payment to robot on completion", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    const balanceBefore = await ethers.provider.getBalance(robot.address);
    const tx = await escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH);
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(robot.address);

    expect(balanceAfter).to.equal(balanceBefore + REWARD - gasCost);
  });

  /** Reputation integration */

  it("should submit positive feedback on completion", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);
    await escrow.connect(robot).completeTask(TASK_ID, PROOF_HASH);

    /// Escrow contract is the feedback author.
    const escrowAddr = await escrow.getAddress();
    const lastIdx = await reputation.getLastIndex(robot.address, escrowAddr);
    expect(lastIdx).to.equal(1);

    const [value, , tag1] = await reputation.readFeedback(
      robot.address, escrowAddr, 1
    );
    expect(value).to.equal(100);
    expect(tag1).to.equal("taskSuccess");
  });

  it("should submit negative feedback on refund of assigned task", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });
    await escrow.connect(client).assignTask(TASK_ID, robot.address);

    await time.increase(120);
    await escrow.connect(other).refundTask(TASK_ID);

    const escrowAddr = await escrow.getAddress();
    const lastIdx = await reputation.getLastIndex(robot.address, escrowAddr);
    expect(lastIdx).to.equal(1);

    const [value, , tag1] = await reputation.readFeedback(
      robot.address, escrowAddr, 1
    );
    expect(value).to.equal(0);
    expect(tag1).to.equal("taskFailed");
  });

  /** refundTask */

  it("should refund after deadline", async function () {
    const deadline = await futureDeadline(60);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });

    await time.increase(120);

    const balanceBefore = await ethers.provider.getBalance(client.address);
    await escrow.connect(other).refundTask(TASK_ID);
    const balanceAfter = await ethers.provider.getBalance(client.address);

    expect(balanceAfter).to.equal(balanceBefore + REWARD);
    const task = await escrow.getTask(TASK_ID);
    expect(task.status).to.equal(3n); // Refunded
  });

  it("should reject refund before deadline", async function () {
    const deadline = await futureDeadline(3600);
    await escrow.connect(client).createTask(TASK_ID, deadline, 0, { value: REWARD });

    await expect(
      escrow.connect(other).refundTask(TASK_ID)
    ).to.be.revertedWithCustomError(escrow, "DeadlineNotReached");
  });
});
