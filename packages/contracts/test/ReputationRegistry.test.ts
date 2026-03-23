/// @file ReputationRegistry.test.ts
/// @notice Test suite for the ERC-8004 Reputation Registry.

import { expect } from "chai";
import { ethers } from "hardhat";
import type { ReputationRegistry } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReputationRegistry", function () {
  let registry: ReputationRegistry;
  let client: HardhatEthersSigner;
  let robot: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async function () {
    [client, robot, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ReputationRegistry");
    registry = (await factory.deploy()) as unknown as ReputationRegistry;
    await registry.waitForDeployment();
  });

  /** giveFeedback */

  it("should accept feedback and emit event", async function () {
    await expect(
      registry.connect(client).giveFeedback(robot.address, 85, 0, "taskSuccess", "delivery")
    ).to.emit(registry, "NewFeedback");

    const [value, decimals, tag1, tag2, revoked] = await registry.readFeedback(
      robot.address, client.address, 1
    );
    expect(value).to.equal(85);
    expect(decimals).to.equal(0);
    expect(tag1).to.equal("taskSuccess");
    expect(tag2).to.equal("delivery");
    expect(revoked).to.equal(false);
  });

  it("should increment feedback index per client-robot pair", async function () {
    await registry.connect(client).giveFeedback(robot.address, 90, 0, "taskSuccess", "");
    await registry.connect(client).giveFeedback(robot.address, 75, 0, "deliverySpeed", "");

    expect(await registry.getLastIndex(robot.address, client.address)).to.equal(2);
  });

  it("should reject self-feedback", async function () {
    await expect(
      registry.connect(robot).giveFeedback(robot.address, 100, 0, "taskSuccess", "")
    ).to.be.revertedWithCustomError(registry, "SelfFeedback");
  });

  it("should reject invalid decimals", async function () {
    await expect(
      registry.connect(client).giveFeedback(robot.address, 100, 19, "taskSuccess", "")
    ).to.be.revertedWithCustomError(registry, "InvalidDecimals");
  });

  /** revokeFeedback */

  it("should allow client to revoke their feedback", async function () {
    await registry.connect(client).giveFeedback(robot.address, 50, 0, "taskSuccess", "");

    await expect(
      registry.connect(client).revokeFeedback(robot.address, 1)
    ).to.emit(registry, "FeedbackRevoked");

    const [, , , , revoked] = await registry.readFeedback(robot.address, client.address, 1);
    expect(revoked).to.equal(true);
  });

  it("should not allow others to revoke feedback", async function () {
    await registry.connect(client).giveFeedback(robot.address, 50, 0, "taskSuccess", "");

    /// `other` has no feedback at index 1 for this robot, so it reverts.
    await expect(
      registry.connect(other).revokeFeedback(robot.address, 1)
    ).to.be.revertedWithCustomError(registry, "FeedbackNotFound");
  });

  /** getSummary */

  it("should aggregate non-revoked feedback in summary", async function () {
    await registry.connect(client).giveFeedback(robot.address, 80, 0, "taskSuccess", "");
    await registry.connect(other).giveFeedback(robot.address, 90, 0, "taskSuccess", "");

    const [count, summaryValue] = await registry.getSummary(robot.address, "taskSuccess");
    expect(count).to.equal(2);
    expect(summaryValue).to.equal(170); // 80 + 90
  });

  it("should exclude revoked feedback from summary", async function () {
    await registry.connect(client).giveFeedback(robot.address, 80, 0, "taskSuccess", "");
    await registry.connect(other).giveFeedback(robot.address, 90, 0, "taskSuccess", "");
    await registry.connect(client).revokeFeedback(robot.address, 1);

    const [count, summaryValue] = await registry.getSummary(robot.address, "taskSuccess");
    expect(count).to.equal(1);
    expect(summaryValue).to.equal(90);
  });

  it("should filter summary by tag", async function () {
    await registry.connect(client).giveFeedback(robot.address, 80, 0, "taskSuccess", "");
    await registry.connect(client).giveFeedback(robot.address, 95, 0, "deliverySpeed", "");

    const [count] = await registry.getSummary(robot.address, "deliverySpeed");
    expect(count).to.equal(1);
  });

  it("should return all feedback when tag is empty", async function () {
    await registry.connect(client).giveFeedback(robot.address, 80, 0, "taskSuccess", "");
    await registry.connect(client).giveFeedback(robot.address, 95, 0, "deliverySpeed", "");

    const [count] = await registry.getSummary(robot.address, "");
    expect(count).to.equal(2);
  });

  /** getClients */

  it("should track all clients that gave feedback", async function () {
    await registry.connect(client).giveFeedback(robot.address, 80, 0, "taskSuccess", "");
    await registry.connect(other).giveFeedback(robot.address, 90, 0, "taskSuccess", "");

    const clients = await registry.getClients(robot.address);
    expect(clients).to.include(client.address);
    expect(clients).to.include(other.address);
  });
});
