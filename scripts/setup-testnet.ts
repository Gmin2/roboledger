#!/usr/bin/env tsx
/**
 * Testnet bootstrap script for RoboLedger.
 *
 * Create every on-chain resource the project requires: robot accounts, HCS
 * topics, the Robot NFT token collection, and initial NFT mints.  Results are
 * printed to the console and persisted to the project root .env file so that
 * all other packages can consume them immediately.
 *
 * Prerequisites:
 *   - OPERATOR_ID and OPERATOR_KEY set in .env (funded testnet account).
 *
 * Execution:
 *   pnpm setup          (from project root)
 *   tsx scripts/setup-testnet.ts
 */

import {
  Client,
  AccountId,
  PrivateKey,
  AccountCreateTransaction,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenAssociateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  TokenGrantKycTransaction,
  Hbar,
  TokenId,
  NftId,
} from "@hashgraph/sdk";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, readFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(PROJECT_ROOT, ".env");

config({ path: ENV_PATH });

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Build an authenticated Hedera testnet client from environment variables.
 *
 * @returns Configured Client instance.
 */
function buildClient(): Client {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = process.env.OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error(
      "OPERATOR_ID and OPERATOR_KEY must be set in the .env file before running setup"
    );
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );
  return client;
}

/**
 * Append or update a key=value pair in the .env file.
 *
 * @param entries - Map of environment variable names to values.
 */
function updateEnvFile(entries: Record<string, string>): void {
  let content = "";
  if (existsSync(ENV_PATH)) {
    content = readFileSync(ENV_PATH, "utf-8");
  }

  for (const [key, value] of Object.entries(entries)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `${key}=${value}\n`;
    }
  }

  writeFileSync(ENV_PATH, content, "utf-8");
}

/* ------------------------------------------------------------------ */
/*  Main setup                                                        */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const client = buildClient();
  const operatorId = AccountId.fromString(process.env.OPERATOR_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY!);
  const envUpdates: Record<string, string> = {};

  try {
    /* -------------------------------------------------------------- */
    /*  Step 1: Operator loaded                                       */
    /* -------------------------------------------------------------- */
    console.log("Step 1: Operator loaded");
    console.log(`  Operator ID : ${operatorId.toString()}`);

    /* -------------------------------------------------------------- */
    /*  Step 2: Generate robot keypairs                                */
    /* -------------------------------------------------------------- */
    console.log("\nStep 2: Generating Ed25519 keypairs for 3 robots...");
    const robotKeys: PrivateKey[] = [];
    for (let i = 0; i < 3; i++) {
      const key = PrivateKey.generateED25519();
      robotKeys.push(key);
      console.log(`  Robot ${i + 1} public key: ${key.publicKey.toString()}`);
    }

    /* -------------------------------------------------------------- */
    /*  Step 3: Create robot accounts                                 */
    /* -------------------------------------------------------------- */
    console.log("\nStep 3: Creating robot accounts (10 HBAR each)...");
    const robotAccountIds: AccountId[] = [];
    for (let i = 0; i < 3; i++) {
      const tx = new AccountCreateTransaction()
        .setKey(robotKeys[i].publicKey)
        .setInitialBalance(new Hbar(10));

      const response = await tx.execute(client);
      const receipt = await response.getReceipt(client);
      const accountId = receipt.accountId!;
      robotAccountIds.push(accountId);

      const idx = i + 1;
      envUpdates[`ROBOT${idx}_ID`] = accountId.toString();
      envUpdates[`ROBOT${idx}_KEY`] = robotKeys[i].toStringRaw();
      console.log(`  Robot ${idx} account: ${accountId.toString()}`);
    }

    /* -------------------------------------------------------------- */
    /*  Step 4: Create HCS topics                                     */
    /* -------------------------------------------------------------- */
    console.log("\nStep 4: Creating HCS topics...");
    const topicConfigs: Array<{ name: string; envKey: string; memo: string }> = [
      {
        name: "Tasks",
        envKey: "TASKS_TOPIC_ID",
        memo: "RoboLedger Task Marketplace",
      },
      {
        name: "Bids",
        envKey: "BIDS_TOPIC_ID",
        memo: "RoboLedger Task Bids",
      },
      {
        name: "Proofs",
        envKey: "PROOFS_TOPIC_ID",
        memo: "RoboLedger Completion Proofs",
      },
    ];

    for (const cfg of topicConfigs) {
      const tx = new TopicCreateTransaction().setTopicMemo(cfg.memo);
      const response = await tx.execute(client);
      const receipt = await response.getReceipt(client);
      const topicId = receipt.topicId!;

      envUpdates[cfg.envKey] = topicId.toString();
      console.log(`  ${cfg.name} topic: ${topicId.toString()}`);
    }

    /* -------------------------------------------------------------- */
    /*  Step 5: Generate NFT role keys                                */
    /* -------------------------------------------------------------- */
    console.log("\nStep 5: Generating NFT token role keys...");
    const supplyKey = PrivateKey.generateED25519();
    const kycKey = PrivateKey.generateED25519();
    const freezeKey = PrivateKey.generateED25519();
    const metadataKey = PrivateKey.generateED25519();
    console.log("  Supply key generated");
    console.log("  KYC key generated");
    console.log("  Freeze key generated");
    console.log("  Metadata key generated");

    /* -------------------------------------------------------------- */
    /*  Step 6: Create Robot NFT token                                */
    /* -------------------------------------------------------------- */
    console.log("\nStep 6: Creating Robot NFT token (ROBO)...");
    const tokenTx = new TokenCreateTransaction()
      .setTokenName("RoboLedger Robot")
      .setTokenSymbol("ROBO")
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorKey.publicKey)
      .setSupplyKey(supplyKey.publicKey)
      .setKycKey(kycKey.publicKey)
      .setFreezeKey(freezeKey.publicKey)
      .setMetadataKey(metadataKey.publicKey)
      .freezeWith(client);

    /** Sign with all role keys — Hedera requires each key holder to sign. */
    const tokenSigned = await (
      await (
        await (
          await tokenTx.sign(supplyKey)
        ).sign(kycKey)
      ).sign(freezeKey)
    ).sign(metadataKey);

    const tokenResponse = await tokenSigned.execute(client);
    const tokenReceipt = await tokenResponse.getReceipt(client);
    const tokenId = tokenReceipt.tokenId!;

    envUpdates["NFT_TOKEN_ID"] = tokenId.toString();
    envUpdates["NFT_SUPPLY_KEY"] = supplyKey.toStringRaw();
    envUpdates["NFT_KYC_KEY"] = kycKey.toStringRaw();
    envUpdates["NFT_FREEZE_KEY"] = freezeKey.toStringRaw();
    envUpdates["NFT_METADATA_KEY"] = metadataKey.toStringRaw();
    console.log(`  Token ID: ${tokenId.toString()}`);

    /* -------------------------------------------------------------- */
    /*  Step 7: Associate token with robot accounts                   */
    /* -------------------------------------------------------------- */
    console.log("\nStep 7: Associating token with robot accounts...");
    for (let i = 0; i < 3; i++) {
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(robotAccountIds[i])
        .setTokenIds([tokenId])
        .freezeWith(client);

      const signedTx = await associateTx.sign(robotKeys[i]);
      const associateResponse = await signedTx.execute(client);
      await associateResponse.getReceipt(client);
      console.log(
        `  Robot ${i + 1} (${robotAccountIds[i].toString()}) associated`
      );
    }

    /* -------------------------------------------------------------- */
    /*  Step 8: Mint 3 NFTs with robot-specific metadata              */
    /* -------------------------------------------------------------- */
    console.log("\nStep 8: Minting 3 robot NFTs...");
    const robotMetadata = [
      { robot: 1, capabilities: ["delivery", "outdoor"] },
      { robot: 2, capabilities: ["delivery", "indoor"] },
      { robot: 3, capabilities: ["inspection", "outdoor"] },
    ];

    const serialNumbers: number[] = [];
    for (const meta of robotMetadata) {
      const metadataBytes = Buffer.from(JSON.stringify(meta), "utf-8");
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(metadataBytes)
        .freezeWith(client);

      const signedMintTx = await mintTx.sign(supplyKey);
      const mintResponse = await signedMintTx.execute(client);
      const mintReceipt = await mintResponse.getReceipt(client);
      const serial = mintReceipt.serials[0].toNumber();
      serialNumbers.push(serial);
      console.log(
        `  NFT serial ${serial} minted: ${JSON.stringify(meta.capabilities)}`
      );
    }

    /* -------------------------------------------------------------- */
    /*  Step 9: Grant KYC to all robot accounts                       */
    /* -------------------------------------------------------------- */
    console.log("\nStep 9: Granting KYC to robot accounts...");
    for (let i = 0; i < 3; i++) {
      const kycTx = new TokenGrantKycTransaction()
        .setAccountId(robotAccountIds[i])
        .setTokenId(tokenId)
        .freezeWith(client);

      const signedKycTx = await kycTx.sign(kycKey);
      const kycResponse = await signedKycTx.execute(client);
      await kycResponse.getReceipt(client);
      console.log(`  KYC granted to Robot ${i + 1} (${robotAccountIds[i].toString()})`);
    }

    /* -------------------------------------------------------------- */
    /*  Step 10: Transfer NFTs to robot accounts                      */
    /* -------------------------------------------------------------- */
    console.log("\nStep 10: Transferring NFTs to robot accounts...");
    for (let i = 0; i < 3; i++) {
      const nftId = new NftId(tokenId, serialNumbers[i]);
      const transferTx = new TransferTransaction()
        .addNftTransfer(nftId, operatorId, robotAccountIds[i])
        .freezeWith(client);

      const transferResponse = await transferTx.execute(client);
      await transferResponse.getReceipt(client);
      console.log(
        `  NFT serial ${serialNumbers[i]} -> Robot ${i + 1} (${robotAccountIds[i].toString()})`
      );
    }

    /* -------------------------------------------------------------- */
    /*  Step 11: Persist to .env and print summary                    */
    /* -------------------------------------------------------------- */
    console.log("\nStep 11: Writing configuration to .env...");
    updateEnvFile(envUpdates);
    console.log(`  Updated ${ENV_PATH}`);

    console.log("\n========================================");
    console.log("  RoboLedger Testnet Setup Complete");
    console.log("========================================\n");
    console.log("Robot Accounts:");
    for (let i = 0; i < 3; i++) {
      console.log(`  Robot ${i + 1}: ${robotAccountIds[i].toString()}`);
    }
    console.log("\nHCS Topics:");
    console.log(`  Tasks  : ${envUpdates["TASKS_TOPIC_ID"]}`);
    console.log(`  Bids   : ${envUpdates["BIDS_TOPIC_ID"]}`);
    console.log(`  Proofs : ${envUpdates["PROOFS_TOPIC_ID"]}`);
    console.log(`\nNFT Token: ${tokenId.toString()}`);
    console.log(`NFT Serials: ${serialNumbers.join(", ")}`);
    console.log("\nAll values written to .env. Ready to run.\n");
  } finally {
    client.close();
  }
}

main().catch((err: Error) => {
  console.error("Setup failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});
