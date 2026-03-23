/// @file ValidationRegistry.test.ts
/// @notice Test suite for the ERC-8004 Validation Registry.

import { expect } from "chai";
import { ethers } from "hardhat";
import type { ValidationRegistry } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ValidationRegistry", function () {
  let registry: ValidationRegistry;
  let requester: HardhatEthersSigner;
  let validator: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const ROBOT_ID = 1;
  const REQUEST_HASH = ethers.keccak256(ethers.toUtf8Bytes("proof-data-001"));
  const REQUEST_URI = "https://proofs.roboledger.io/task-001";

  beforeEach(async function () {
    [requester, validator, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("ValidationRegistry");
    registry = (await factory.deploy()) as unknown as ValidationRegistry;
    await registry.waitForDeployment();
  });

  /** validationRequest */

  it("should create a validation request and emit event", async function () {
    await expect(
      registry.connect(requester).validationRequest(
        validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
      )
    ).to.emit(registry, "ValidationRequest");

    expect(await registry.requestExists(REQUEST_HASH)).to.equal(true);
  });

  it("should reject duplicate request hashes", async function () {
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );

    await expect(
      registry.connect(requester).validationRequest(
        validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
      )
    ).to.be.revertedWithCustomError(registry, "RequestAlreadyExists");
  });

  /** validationResponse */

  it("should accept response from designated validator", async function () {
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );

    await expect(
      registry.connect(validator).validationResponse(
        REQUEST_HASH, 100, "", ethers.ZeroHash, "delivery-proof"
      )
    ).to.emit(registry, "ValidationResponse");

    const record = await registry.getValidationStatus(REQUEST_HASH);
    expect(record.response).to.equal(100);
    expect(record.tag).to.equal("delivery-proof");
    expect(record.lastUpdate).to.be.gt(0);
  });

  it("should reject response from non-designated validator", async function () {
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );

    await expect(
      registry.connect(other).validationResponse(
        REQUEST_HASH, 100, "", ethers.ZeroHash, ""
      )
    ).to.be.revertedWithCustomError(registry, "OnlyDesignatedValidator");
  });

  it("should reject response > 100", async function () {
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );

    await expect(
      registry.connect(validator).validationResponse(
        REQUEST_HASH, 101, "", ethers.ZeroHash, ""
      )
    ).to.be.revertedWithCustomError(registry, "InvalidResponse");
  });

  it("should allow progressive validation (multiple responses)", async function () {
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );

    await registry.connect(validator).validationResponse(
      REQUEST_HASH, 50, "", ethers.ZeroHash, "soft-finality"
    );
    await registry.connect(validator).validationResponse(
      REQUEST_HASH, 100, "", ethers.ZeroHash, "hard-finality"
    );

    const record = await registry.getValidationStatus(REQUEST_HASH);
    expect(record.response).to.equal(100);
    expect(record.tag).to.equal("hard-finality");
  });

  it("should reject response for non-existent request", async function () {
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("does-not-exist"));

    await expect(
      registry.connect(validator).validationResponse(
        fakeHash, 100, "", ethers.ZeroHash, ""
      )
    ).to.be.revertedWithCustomError(registry, "RequestNotFound");
  });

  /** getSummary */

  it("should compute summary across multiple validations", async function () {
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("proof-data-002"));

    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, hash2
    );

    await registry.connect(validator).validationResponse(
      REQUEST_HASH, 80, "", ethers.ZeroHash, ""
    );
    await registry.connect(validator).validationResponse(
      hash2, 100, "", ethers.ZeroHash, ""
    );

    const [count, avg] = await registry.getSummary(ROBOT_ID, []);
    expect(count).to.equal(2);
    expect(avg).to.equal(90); // (80 + 100) / 2
  });

  it("should filter summary by validator address", async function () {
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("proof-data-003"));

    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );
    await registry.connect(requester).validationRequest(
      other.address, ROBOT_ID, REQUEST_URI, hash2
    );

    await registry.connect(validator).validationResponse(
      REQUEST_HASH, 80, "", ethers.ZeroHash, ""
    );
    await registry.connect(other).validationResponse(
      hash2, 100, "", ethers.ZeroHash, ""
    );

    const [count, avg] = await registry.getSummary(ROBOT_ID, [validator.address]);
    expect(count).to.equal(1);
    expect(avg).to.equal(80);
  });

  /** getAgentValidations */

  it("should track all request hashes for a robot", async function () {
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("proof-data-004"));

    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, REQUEST_HASH
    );
    await registry.connect(requester).validationRequest(
      validator.address, ROBOT_ID, REQUEST_URI, hash2
    );

    const hashes = await registry.getAgentValidations(ROBOT_ID);
    expect(hashes.length).to.equal(2);
  });
});
