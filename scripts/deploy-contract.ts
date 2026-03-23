#!/usr/bin/env tsx
/**
 * Deploy the TaskEscrow contract to Hedera testnet using the native SDK.
 *
 * Reads the compiled Hardhat artifact for bytecode, then deploys via
 * `ContractCreateFlow` which handles file creation and contract
 * instantiation in a single call.
 *
 * Persists the resulting contract ID to `.env` as `ESCROW_CONTRACT_ID`.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
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
const ARTIFACT_PATH = resolve(
  PROJECT_ROOT,
  "packages/contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json"
);

config({ path: ENV_PATH });

async function main(): Promise<void> {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = process.env.OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error("OPERATOR_ID and OPERATOR_KEY must be set in .env");
  }

  if (!existsSync(ARTIFACT_PATH)) {
    throw new Error(
      "Contract artifact not found. Run `pnpm --filter @roboledger/contracts compile` first."
    );
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );

  /** Read compiled bytecode from Hardhat artifact. */
  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf-8"));
  const bytecode = artifact.bytecode;

  console.log("Deploying TaskEscrow to Hedera testnet...");
  console.log(`  Bytecode size: ${bytecode.length / 2 - 1} bytes`);

  const contractTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(2_000_000)
    .setInitialBalance(new Hbar(0));

  const response = await contractTx.execute(client);
  const receipt = await response.getReceipt(client);
  const contractId = receipt.contractId!;

  console.log(`  Contract ID : ${contractId.toString()}`);
  console.log(`  EVM address : ${contractId.toSolidityAddress()}`);

  /** Append contract ID to .env. */
  let envContent = "";
  if (existsSync(ENV_PATH)) {
    envContent = readFileSync(ENV_PATH, "utf-8");
  }

  const key = "ESCROW_CONTRACT_ID";
  const value = contractId.toString();
  const evmKey = "ESCROW_CONTRACT_EVM";
  const evmValue = contractId.toSolidityAddress();

  if (envContent.includes(`${key}=`)) {
    envContent = envContent.replace(
      new RegExp(`^${key}=.*$`, "m"),
      `${key}=${value}`
    );
  } else {
    envContent += `\n${key}=${value}`;
  }

  if (envContent.includes(`${evmKey}=`)) {
    envContent = envContent.replace(
      new RegExp(`^${evmKey}=.*$`, "m"),
      `${evmKey}=${evmValue}`
    );
  } else {
    envContent += `\n${evmKey}=${evmValue}`;
  }

  writeFileSync(ENV_PATH, envContent.trim() + "\n");
  console.log(`  Written to .env`);
  console.log("\nDeployment complete.");

  client.close();
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
