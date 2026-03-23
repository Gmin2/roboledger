#!/usr/bin/env tsx
/**
 * Deploy all RoboLedger contracts to Hedera testnet.
 *
 * Deploys in order:
 *   1. ReputationRegistry  (standalone, no constructor args)
 *   2. ValidationRegistry   (standalone, no constructor args)
 *   3. TaskEscrow           (constructor takes reputationRegistry address)
 *
 * Reads compiled Hardhat artifacts for bytecode, deploys via
 * `ContractCreateFlow`, and persists all contract IDs to `.env`.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  Hbar,
} from "@hashgraph/sdk";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(PROJECT_ROOT, ".env");
const ARTIFACTS_BASE = resolve(PROJECT_ROOT, "packages/contracts/artifacts/contracts");

config({ path: ENV_PATH });

/** Load artifact bytecode from the Hardhat compilation output. */
function loadBytecode(contractPath: string, contractName: string): string {
  const artifactPath = resolve(ARTIFACTS_BASE, contractPath, `${contractName}.json`);
  if (!existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run \`pnpm --filter @roboledger/contracts compile\` first.`);
  }
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
  return artifact.bytecode;
}

/** Upsert a key=value pair in the .env file content. */
function upsertEnv(content: string, key: string, value: string): string {
  if (content.includes(`${key}=`)) {
    return content.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${value}`);
  }
  return content + `\n${key}=${value}`;
}

async function main(): Promise<void> {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = process.env.OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error("OPERATOR_ID and OPERATOR_KEY must be set in .env");
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );

  let envContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf-8") : "";

  try {
    /** Step 1: Deploy ReputationRegistry. */
    console.log("Step 1: Deploying ReputationRegistry...");
    const repBytecode = loadBytecode("ReputationRegistry.sol", "ReputationRegistry");
    console.log(`  Bytecode: ${repBytecode.length / 2 - 1} bytes`);

    const repTx = new ContractCreateFlow()
      .setBytecode(repBytecode)
      .setGas(2_000_000)
      .setInitialBalance(new Hbar(0));

    const repResponse = await repTx.execute(client);
    const repReceipt = await repResponse.getReceipt(client);
    const repContractId = repReceipt.contractId!;

    console.log(`  Contract ID : ${repContractId.toString()}`);
    envContent = upsertEnv(envContent, "REPUTATION_CONTRACT_ID", repContractId.toString());
    envContent = upsertEnv(envContent, "REPUTATION_CONTRACT_EVM", repContractId.toSolidityAddress());

    /** Step 2: Deploy ValidationRegistry. */
    console.log("\nStep 2: Deploying ValidationRegistry...");
    const valBytecode = loadBytecode("ValidationRegistry.sol", "ValidationRegistry");
    console.log(`  Bytecode: ${valBytecode.length / 2 - 1} bytes`);

    const valTx = new ContractCreateFlow()
      .setBytecode(valBytecode)
      .setGas(2_000_000)
      .setInitialBalance(new Hbar(0));

    const valResponse = await valTx.execute(client);
    const valReceipt = await valResponse.getReceipt(client);
    const valContractId = valReceipt.contractId!;

    console.log(`  Contract ID : ${valContractId.toString()}`);
    envContent = upsertEnv(envContent, "VALIDATION_CONTRACT_ID", valContractId.toString());
    envContent = upsertEnv(envContent, "VALIDATION_CONTRACT_EVM", valContractId.toSolidityAddress());

    /** Step 3: Deploy TaskEscrow with reputation registry address. */
    console.log("\nStep 3: Deploying TaskEscrow...");
    const escrowBytecode = loadBytecode("TaskEscrow.sol", "TaskEscrow");
    console.log(`  Bytecode: ${escrowBytecode.length / 2 - 1} bytes`);

    const escrowTx = new ContractCreateFlow()
      .setBytecode(escrowBytecode)
      .setGas(2_000_000)
      .setInitialBalance(new Hbar(0))
      .setConstructorParameters(
        new ContractFunctionParameters().addAddress(repContractId.toSolidityAddress())
      );

    const escrowResponse = await escrowTx.execute(client);
    const escrowReceipt = await escrowResponse.getReceipt(client);
    const escrowContractId = escrowReceipt.contractId!;

    console.log(`  Contract ID : ${escrowContractId.toString()}`);
    envContent = upsertEnv(envContent, "ESCROW_CONTRACT_ID", escrowContractId.toString());
    envContent = upsertEnv(envContent, "ESCROW_CONTRACT_EVM", escrowContractId.toSolidityAddress());

    /** Write all IDs to .env. */
    writeFileSync(ENV_PATH, envContent.trim() + "\n");

    console.log("\n========================================");
    console.log("  All Contracts Deployed");
    console.log("========================================");
    console.log(`  ReputationRegistry : ${repContractId.toString()}`);
    console.log(`  ValidationRegistry : ${valContractId.toString()}`);
    console.log(`  TaskEscrow         : ${escrowContractId.toString()}`);
    console.log("\n  All IDs written to .env");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
