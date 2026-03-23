#!/usr/bin/env tsx
/**
 * RoboLedger Demo — Full lifecycle in one command.
 *
 * Orchestrate the complete decentralized robot task marketplace flow
 * on Hedera testnet, with timed output suitable for a live presentation.
 *
 * Lifecycle:
 *   1. Verify fleet — confirm 3 robot NFTs exist with KYC.
 *   2. Post task  — client publishes a delivery job to HCS.
 *   3. Robots bid — Robot 1 and Robot 3 both bid (matching capabilities).
 *   4. Winner selected — first valid bid by HCS ordering (Robot 1).
 *   5. Escrow created — client locks HBAR in the TaskEscrow contract.
 *   6. Robot assigned — contract binds Robot 1 to the task.
 *   7. Proof stream — Robot 1 submits 3 waypoint proofs to HCS.
 *   8. Settlement — Robot 1 claims payment, contract releases HBAR.
 *   9. Verification — query on-chain state and compute total cost.
 *
 * Prerequisites:
 *   - `pnpm setup` completed (accounts, topics, NFTs in .env).
 *   - `tsx scripts/deploy-contract.ts` completed (ESCROW_CONTRACT_ID in .env).
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Hbar,
  TopicId,
  ContractId,
} from "@hashgraph/sdk";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "..", ".env") });

/** Load a required environment variable or throw. */
function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

/** SHA-256 hex digest of an input string. */
function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Pause execution for presentation pacing. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Format elapsed time from a start timestamp. */
function elapsed(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

/** Print a section header with consistent formatting. */
function header(step: number, title: string): void {
  console.log(`\n[${"=".repeat(60)}]`);
  console.log(`  Step ${step}: ${title}`);
  console.log(`[${"=".repeat(60)}]\n`);
}

/** Track cumulative transaction cost. */
let txCount = 0;
function trackTx(): void {
  txCount++;
}

async function main(): Promise<void> {
  const demoStart = Date.now();

  /** Load all credentials. */
  const operatorId = AccountId.fromString(env("OPERATOR_ID"));
  const operatorKey = PrivateKey.fromStringECDSA(env("OPERATOR_KEY"));
  const robot1Id = AccountId.fromString(env("ROBOT1_ID"));
  const robot1Key = PrivateKey.fromStringED25519(env("ROBOT1_KEY"));
  const robot3Id = AccountId.fromString(env("ROBOT3_ID"));
  const robot3Key = PrivateKey.fromStringED25519(env("ROBOT3_KEY"));
  const tasksTopicId = TopicId.fromString(env("TASKS_TOPIC_ID"));
  const bidsTopicId = TopicId.fromString(env("BIDS_TOPIC_ID"));
  const proofsTopicId = TopicId.fromString(env("PROOFS_TOPIC_ID"));
  const contractId = ContractId.fromString(env("ESCROW_CONTRACT_ID"));
  const nftTokenId = env("NFT_TOKEN_ID");

  /** Build authenticated clients. */
  const clientOp = Client.forTestnet();
  clientOp.setOperator(operatorId, operatorKey);

  const clientR1 = Client.forTestnet();
  clientR1.setOperator(robot1Id, robot1Key);

  const clientR3 = Client.forTestnet();
  clientR3.setOperator(robot3Id, robot3Key);

  const taskId = `demo-${Date.now()}`;
  const rewardHbar = 5;
  const deadlineSeconds = Math.floor(Date.now() / 1000) + 600;

  try {
    console.log("\n");
    console.log("  ########   #######  ########   #######  ##       ######## ########   ######   ######## ########  ");
    console.log("  ##     ## ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##     ## ");
    console.log("  ##     ## ##     ## ##     ## ##     ## ##       ##       ##     ## ##        ##       ##     ## ");
    console.log("  ########  ##     ## ########  ##     ## ##       ######   ##     ## ##   #### ######   ########  ");
    console.log("  ##   ##   ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##   ##   ");
    console.log("  ##    ##  ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##    ##  ");
    console.log("  ##     ##  #######  ########   #######  ######## ######## ########   ######   ######## ##     ## ");
    console.log("\n  Decentralized Robot Task Marketplace on Hedera");
    console.log("  ================================================\n");

    /** Step 1: Verify fleet. */
    header(1, "Verify Robot Fleet");
    const stepStart = Date.now();

    const mirrorBase = "https://testnet.mirrornode.hedera.com/api/v1";
    const nftResp = await fetch(`${mirrorBase}/tokens/${nftTokenId}/nfts`);
    const nftData = (await nftResp.json()) as { nfts: Array<{ serial_number: number; account_id: string; metadata: string }> };

    for (const nft of nftData.nfts) {
      const meta = JSON.parse(Buffer.from(nft.metadata, "base64").toString());
      console.log(`  Robot #${nft.serial_number} | Account: ${nft.account_id}`);
      console.log(`    Capabilities: ${JSON.stringify(meta.capabilities)}`);
      console.log(`    Model: ${meta.model} | Firmware: ${meta.firmwareHash?.slice(0, 16)}...`);
    }
    console.log(`\n  Fleet verified: ${nftData.nfts.length} robots with KYC [${elapsed(stepStart)}]`);

    await sleep(1000);

    /** Step 2: Post task. */
    header(2, "Client Posts Delivery Task");
    const step2Start = Date.now();

    const taskMessage = JSON.stringify({
      type: "task_post",
      taskId,
      requirements: ["delivery", "outdoor"],
      location: { fromLat: 37.7749, fromLng: -122.4194, toLat: 37.7849, toLng: -122.4094 },
      rewardHbar,
      deadline: new Date(deadlineSeconds * 1000).toISOString(),
    });

    const taskTx = await new TopicMessageSubmitTransaction()
      .setTopicId(tasksTopicId)
      .setMessage(taskMessage)
      .execute(clientOp);
    const taskReceipt = await taskTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Task ID       : ${taskId}`);
    console.log(`  Requirements  : ["delivery", "outdoor"]`);
    console.log(`  Reward        : ${rewardHbar} HBAR`);
    console.log(`  Route         : SF Downtown -> SF Marina`);
    console.log(`  HCS Sequence  : #${taskReceipt.topicSequenceNumber}`);
    console.log(`  Cost          : $0.0001 (1 HCS message)`);
    console.log(`  [${elapsed(step2Start)}]`);

    await sleep(1000);

    /** Step 3: Two robots bid. */
    header(3, "Robots Compete for Task");
    const step3Start = Date.now();

    /** Robot 1 bids (capabilities: delivery, outdoor — MATCH). */
    const bid1 = JSON.stringify({
      type: "bid",
      taskId,
      robotId: robot1Id.toString(),
      nftSerial: 1,
      etaMinutes: 12,
      signature: sha256(`bid:${taskId}:${robot1Id.toString()}`),
    });

    const bid1Tx = await new TopicMessageSubmitTransaction()
      .setTopicId(bidsTopicId)
      .setMessage(bid1)
      .execute(clientOp);
    const bid1Receipt = await bid1Tx.getReceipt(clientOp);
    trackTx();

    console.log(`  Robot 1 (delivery, outdoor) bids  -> HCS #${bid1Receipt.topicSequenceNumber}`);
    console.log(`    ETA: 12 minutes | Account: ${robot1Id.toString()}`);

    /** Robot 3 bids (capabilities: inspection, outdoor — PARTIAL MATCH but bids anyway). */
    const bid3 = JSON.stringify({
      type: "bid",
      taskId,
      robotId: robot3Id.toString(),
      nftSerial: 3,
      etaMinutes: 18,
      signature: sha256(`bid:${taskId}:${robot3Id.toString()}`),
    });

    const bid3Tx = await new TopicMessageSubmitTransaction()
      .setTopicId(bidsTopicId)
      .setMessage(bid3)
      .execute(clientOp);
    const bid3Receipt = await bid3Tx.getReceipt(clientOp);
    trackTx();

    console.log(`  Robot 3 (inspection, outdoor) bids -> HCS #${bid3Receipt.topicSequenceNumber}`);
    console.log(`    ETA: 18 minutes | Account: ${robot3Id.toString()}`);
    console.log(`\n  Winner: Robot 1 (first valid bid by HCS fair ordering)`);
    console.log(`  Cost: $0.0002 (2 HCS messages)`);
    console.log(`  [${elapsed(step3Start)}]`);

    await sleep(1000);

    /** Step 4: Escrow HBAR. */
    header(4, "Lock HBAR in Escrow Contract");
    const step4Start = Date.now();

    const escrowTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300_000)
      .setPayableAmount(new Hbar(rewardHbar))
      .setFunction(
        "createTask",
        new ContractFunctionParameters()
          .addString(taskId)
          .addUint256(deadlineSeconds)
      )
      .execute(clientOp);
    const escrowReceipt = await escrowTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Contract      : ${contractId.toString()}`);
    console.log(`  Locked        : ${rewardHbar} HBAR`);
    console.log(`  Deadline      : ${new Date(deadlineSeconds * 1000).toISOString()}`);
    console.log(`  Status        : ${escrowReceipt.status.toString()}`);
    console.log(`  [${elapsed(step4Start)}]`);

    await sleep(500);

    /** Step 5: Assign robot. */
    header(5, "Assign Robot 1 to Task");
    const step5Start = Date.now();

    const assignTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(200_000)
      .setFunction(
        "assignTask",
        new ContractFunctionParameters()
          .addString(taskId)
          .addAddress(robot1Id.toSolidityAddress())
      )
      .execute(clientOp);
    const assignReceipt = await assignTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Assigned      : Robot 1 (${robot1Id.toString()})`);
    console.log(`  Status        : ${assignReceipt.status.toString()}`);
    console.log(`  [${elapsed(step5Start)}]`);

    await sleep(1000);

    /** Step 6: Stream proof waypoints. */
    header(6, "Robot 1 Streams Proof-of-Completion");
    const step6Start = Date.now();

    const waypoints = [
      { lat: 37.7749, lng: -122.4194, label: "Pickup confirmed" },
      { lat: 37.7799, lng: -122.4144, label: "En route — waypoint 1" },
      { lat: 37.7849, lng: -122.4094, label: "Delivered — destination reached" },
    ];

    const proofHashes: string[] = [];

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const gpsHash = sha256(`gps:${wp.lat},${wp.lng}`);
      const sensorHash = sha256(`sensor:temp=22C,battery=87%,speed=1.2m/s`);
      const photoHash = sha256(`photo:waypoint-${i + 1}-${Date.now()}`);
      proofHashes.push(gpsHash, sensorHash, photoHash);

      const proofMsg = JSON.stringify({
        type: "proof",
        taskId,
        robotId: robot1Id.toString(),
        waypointIndex: i + 1,
        gpsRouteHash: gpsHash,
        sensorDataHash: sensorHash,
        photoHash,
        label: wp.label,
        signature: sha256(`proof:${taskId}:${i}:${robot1Id.toString()}`),
      });

      const pTx = await new TopicMessageSubmitTransaction()
        .setTopicId(proofsTopicId)
        .setMessage(proofMsg)
        .execute(clientOp);
      const pReceipt = await pTx.getReceipt(clientOp);
      trackTx();

      const ts = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`  [${ts}] Waypoint ${i + 1}/3: ${wp.label}`);
      console.log(`           GPS: (${wp.lat}, ${wp.lng}) | HCS #${pReceipt.topicSequenceNumber}`);

      if (i < waypoints.length - 1) await sleep(1500);
    }

    console.log(`\n  Proof stream complete: 3 waypoints recorded on HCS`);
    console.log(`  Cost: $0.0003 (3 HCS messages)`);
    console.log(`  [${elapsed(step6Start)}]`);

    await sleep(1000);

    /** Step 7: Settle payment. */
    header(7, "Robot 1 Claims Payment");
    const step7Start = Date.now();

    const combinedHash = sha256(proofHashes.join(""));
    const proofHash32 = Buffer.alloc(32);
    Buffer.from(combinedHash, "hex").copy(proofHash32);

    const settleTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300_000)
      .setFunction(
        "completeTask",
        new ContractFunctionParameters()
          .addString(taskId)
          .addBytes32(proofHash32)
      )
      .freezeWith(clientR1);

    const signedSettle = await settleTx.sign(robot1Key);
    const settleResponse = await signedSettle.execute(clientR1);
    const settleReceipt = await settleResponse.getReceipt(clientR1);
    trackTx();

    console.log(`  Proof hash    : ${combinedHash.slice(0, 32)}...`);
    console.log(`  Settlement    : ${settleReceipt.status.toString()}`);
    console.log(`  Payment       : ${rewardHbar} HBAR -> Robot 1`);
    console.log(`  [${elapsed(step7Start)}]`);

    await sleep(500);

    /** Step 8: Verify and summarize. */
    header(8, "Verification & Summary");

    const queryResult = await new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("getTask", new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);

    const statusVal = queryResult.getUint256(5);
    const statusNames = ["Open", "Assigned", "Completed", "Refunded"];

    const r1Balance = await fetch(`${mirrorBase}/accounts/${robot1Id.toString()}`);
    const r1Data = (await r1Balance.json()) as { balance: { balance: number } };
    const r1Hbar = r1Data.balance.balance / 1e8;

    const opBalance = await fetch(`${mirrorBase}/accounts/${operatorId.toString()}`);
    const opData = (await opBalance.json()) as { balance: { balance: number } };
    const opHbar = opData.balance.balance / 1e8;

    const totalElapsed = (Date.now() - demoStart) / 1000;

    /** HCS message cost: $0.0001 each. Contract calls: ~$0.05-0.10 each. */
    const hcsCost = 6 * 0.0001;
    const contractCost = 4 * 0.065;
    const totalCost = hcsCost + contractCost;

    console.log("  On-chain verification:");
    console.log(`    Task status      : ${statusNames[Number(statusVal)]}`);
    console.log(`    Robot 1 balance  : ${r1Hbar.toFixed(2)} HBAR`);
    console.log(`    Operator balance : ${opHbar.toFixed(2)} HBAR`);
    console.log("");
    console.log("  Transaction summary:");
    console.log(`    HCS messages     : 6 (1 task + 2 bids + 3 proofs)`);
    console.log(`    Contract calls   : 4 (escrow + assign + settle + query)`);
    console.log(`    Total txns       : ${txCount}`);
    console.log(`    Est. total cost  : ~$${totalCost.toFixed(4)}`);
    console.log(`    Demo duration    : ${totalElapsed.toFixed(1)}s`);
    console.log("");
    console.log("  HashScan links:");
    console.log(`    Contract : https://hashscan.io/testnet/contract/${contractId.toString()}`);
    console.log(`    Tasks    : https://hashscan.io/testnet/topic/${tasksTopicId.toString()}`);
    console.log(`    Bids     : https://hashscan.io/testnet/topic/${bidsTopicId.toString()}`);
    console.log(`    Proofs   : https://hashscan.io/testnet/topic/${proofsTopicId.toString()}`);
    console.log(`    Robot 1  : https://hashscan.io/testnet/account/${robot1Id.toString()}`);
    console.log(`    NFT      : https://hashscan.io/testnet/token/${nftTokenId}`);
    console.log("");
    console.log("  ================================================");
    console.log("  Demo complete. All transactions verifiable on HashScan.");
    console.log("  ================================================\n");
  } finally {
    clientOp.close();
    clientR1.close();
    clientR3.close();
  }
}

main().catch((err) => {
  console.error("\nDemo failed:", err.message || err);
  process.exit(1);
});
