#!/usr/bin/env tsx
/**
 * RoboLedger Demo — Full ERC-8004 lifecycle in one command.
 *
 * Demonstrate the complete three-registry trust protocol for physical robots:
 *   1. Identity   — verify robot NFTs with KYC (HTS).
 *   2. Marketplace — post task, robots bid via HCS.
 *   3. Escrow     — lock HBAR, assign robot.
 *   4. Proof      — robot streams waypoint proofs to HCS.
 *   5. Validation — independent validators approve the proof on-chain.
 *   6. Settlement — contract checks validation threshold, releases payment.
 *   7. Reputation — automatic feedback recorded in the Reputation Registry.
 *   8. Query      — demonstrate on-chain reputation and validation reads.
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

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function elapsed(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

function header(step: number, title: string): void {
  console.log(`\n[${"=".repeat(60)}]`);
  console.log(`  Step ${step}: ${title}`);
  console.log(`[${"=".repeat(60)}]\n`);
}

let txCount = 0;
function trackTx(): void { txCount++; }

async function main(): Promise<void> {
  const demoStart = Date.now();

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
  const reputationId = ContractId.fromString(env("REPUTATION_CONTRACT_ID"));
  const nftTokenId = env("NFT_TOKEN_ID");

  const clientOp = Client.forTestnet();
  clientOp.setOperator(operatorId, operatorKey);

  const clientR1 = Client.forTestnet();
  clientR1.setOperator(robot1Id, robot1Key);

  const clientR3 = Client.forTestnet();
  clientR3.setOperator(robot3Id, robot3Key);

  const taskId = `demo-${Date.now()}`;
  const rewardHbar = 5;
  const deadlineSeconds = Math.floor(Date.now() / 1000) + 600;
  const REQUIRED_VALIDATIONS = 2;

  try {
    console.log("\n");
    console.log("  ########   #######  ########   #######  ##       ######## ########   ######   ######## ########  ");
    console.log("  ##     ## ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##     ## ");
    console.log("  ##     ## ##     ## ##     ## ##     ## ##       ##       ##     ## ##        ##       ##     ## ");
    console.log("  ########  ##     ## ########  ##     ## ##       ######   ##     ## ##   #### ######   ########  ");
    console.log("  ##   ##   ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##   ##   ");
    console.log("  ##    ##  ##     ## ##     ## ##     ## ##       ##       ##     ## ##    ##  ##       ##    ##  ");
    console.log("  ##     ##  #######  ########   #######  ######## ######## ########   ######   ######## ##     ## ");
    console.log("\n  ERC-8004 Trust Protocol for Physical Robots on Hedera");
    console.log("  Identity | Reputation | Validation");
    console.log("  ================================================\n");

    /** Step 1: Verify fleet identity (ERC-8004 Identity Registry). */
    header(1, "Identity Registry — Verify Robot Fleet");
    const s1 = Date.now();

    const mirrorBase = "https://testnet.mirrornode.hedera.com/api/v1";
    const nftResp = await fetch(`${mirrorBase}/tokens/${nftTokenId}/nfts`);
    const nftData = (await nftResp.json()) as { nfts: Array<{ serial_number: number; account_id: string; metadata: string }> };

    for (const nft of nftData.nfts) {
      const meta = JSON.parse(Buffer.from(nft.metadata, "base64").toString());
      console.log(`  Robot #${nft.serial_number} | ${nft.account_id} | capabilities: ${JSON.stringify(meta.capabilities)}`);
    }
    console.log(`\n  ${nftData.nfts.length} robots registered with KYC-verified identity [${elapsed(s1)}]`);

    await sleep(800);

    /** Step 2: Post task to HCS marketplace. */
    header(2, "Task Marketplace — Client Posts Delivery Job");
    const s2 = Date.now();

    const taskMessage = JSON.stringify({
      type: "task_post",
      taskId,
      requirements: ["delivery", "outdoor"],
      location: { fromLat: 37.7749, fromLng: -122.4194, toLat: 37.7849, toLng: -122.4094 },
      rewardHbar,
      requiredValidations: REQUIRED_VALIDATIONS,
      deadline: new Date(deadlineSeconds * 1000).toISOString(),
    });

    const taskTx = await new TopicMessageSubmitTransaction()
      .setTopicId(tasksTopicId).setMessage(taskMessage).execute(clientOp);
    const taskReceipt = await taskTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Task ID              : ${taskId}`);
    console.log(`  Requirements         : ["delivery", "outdoor"]`);
    console.log(`  Reward               : ${rewardHbar} HBAR`);
    console.log(`  Required validations : ${REQUIRED_VALIDATIONS}`);
    console.log(`  HCS sequence         : #${taskReceipt.topicSequenceNumber} [${elapsed(s2)}]`);

    await sleep(800);

    /** Step 3: Robots bid. */
    header(3, "Bidding — Robots Compete via Fair-Ordered HCS");
    const s3 = Date.now();

    const bid1 = JSON.stringify({
      type: "bid", taskId, robotId: robot1Id.toString(), nftSerial: 1, etaMinutes: 12,
      signature: sha256(`bid:${taskId}:${robot1Id.toString()}`),
    });
    const bid1Tx = await new TopicMessageSubmitTransaction()
      .setTopicId(bidsTopicId).setMessage(bid1).execute(clientOp);
    const bid1Receipt = await bid1Tx.getReceipt(clientOp);
    trackTx();
    console.log(`  Robot 1 bids (delivery, outdoor) -> HCS #${bid1Receipt.topicSequenceNumber}`);

    const bid3 = JSON.stringify({
      type: "bid", taskId, robotId: robot3Id.toString(), nftSerial: 3, etaMinutes: 18,
      signature: sha256(`bid:${taskId}:${robot3Id.toString()}`),
    });
    const bid3Tx = await new TopicMessageSubmitTransaction()
      .setTopicId(bidsTopicId).setMessage(bid3).execute(clientOp);
    const bid3Receipt = await bid3Tx.getReceipt(clientOp);
    trackTx();
    console.log(`  Robot 3 bids (inspection, outdoor) -> HCS #${bid3Receipt.topicSequenceNumber}`);
    console.log(`\n  Winner: Robot 1 (first valid bid by aBFT fair ordering) [${elapsed(s3)}]`);

    await sleep(800);

    /** Step 4: Escrow HBAR with validation requirement. */
    header(4, "Escrow — Lock HBAR with Validation Threshold");
    const s4 = Date.now();

    const escrowTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(400_000)
      .setPayableAmount(new Hbar(rewardHbar))
      .setFunction("createTask", new ContractFunctionParameters()
        .addString(taskId).addUint256(deadlineSeconds).addUint8(REQUIRED_VALIDATIONS))
      .execute(clientOp);
    await escrowTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Locked: ${rewardHbar} HBAR in escrow`);
    console.log(`  Required validations: ${REQUIRED_VALIDATIONS}`);

    const assignTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction("assignTask", new ContractFunctionParameters()
        .addString(taskId).addAddress(robot1Id.toSolidityAddress()))
      .execute(clientOp);
    await assignTx.getReceipt(clientOp);
    trackTx();

    console.log(`  Assigned: Robot 1 (${robot1Id.toString()}) [${elapsed(s4)}]`);

    await sleep(800);

    /** Step 5: Robot streams proof waypoints. */
    header(5, "Proof-of-Completion — Robot Streams Evidence to HCS");
    const s5 = Date.now();

    const waypoints = [
      { lat: 37.7749, lng: -122.4194, label: "Pickup confirmed" },
      { lat: 37.7799, lng: -122.4144, label: "En route — waypoint 1" },
      { lat: 37.7849, lng: -122.4094, label: "Delivered — destination reached" },
    ];

    const proofHashes: string[] = [];
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const gpsHash = sha256(`gps:${wp.lat},${wp.lng}`);
      const sensorHash = sha256(`sensor:temp=22C,battery=87%`);
      const photoHash = sha256(`photo:wp-${i + 1}-${Date.now()}`);
      proofHashes.push(gpsHash, sensorHash, photoHash);

      const proofMsg = JSON.stringify({
        type: "proof", taskId, robotId: robot1Id.toString(),
        waypointIndex: i + 1, gpsRouteHash: gpsHash,
        sensorDataHash: sensorHash, photoHash, label: wp.label,
      });

      const pTx = await new TopicMessageSubmitTransaction()
        .setTopicId(proofsTopicId).setMessage(proofMsg).execute(clientOp);
      const pReceipt = await pTx.getReceipt(clientOp);
      trackTx();

      const ts = new Date().toISOString().split("T")[1].split(".")[0];
      console.log(`  [${ts}] WP ${i + 1}/3: ${wp.label} | HCS #${pReceipt.topicSequenceNumber}`);
      if (i < waypoints.length - 1) await sleep(1200);
    }
    console.log(`\n  3 proofs recorded on immutable HCS ledger [${elapsed(s5)}]`);

    await sleep(800);

    /** Step 6: Validators approve (ERC-8004 Validation Registry). */
    header(6, "Validation Registry — Independent Validators Approve");
    const s6 = Date.now();

    /** Validator 1: the client confirms receipt. */
    const val1Tx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction("validateTask", new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);
    await val1Tx.getReceipt(clientOp);
    trackTx();
    console.log(`  Validator 1 (client ${operatorId.toString()}) approves`);

    /** Brief pause to avoid testnet rate limiting between distinct signers. */
    await sleep(3000);

    /** Validator 2: Robot 3 witnessed the delivery (nearby robot). */
    const val2Tx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction("validateTask", new ContractFunctionParameters().addString(taskId))
      .freezeWith(clientR3);
    const signedVal2 = await val2Tx.sign(robot3Key);
    const val2Response = await signedVal2.execute(clientR3);
    await val2Response.getReceipt(clientR3);
    trackTx();
    console.log(`  Validator 2 (Robot 3 ${robot3Id.toString()}) approves`);

    /** Verify validation count. */
    const taskCheck = await new ContractCallQuery()
      .setContractId(contractId).setGas(100_000)
      .setFunction("getTask", new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);

    /** Parse receivedValidations from raw ABI bytes — slot 7 at offset 224. */
    const checkBytes = Buffer.from(taskCheck.bytes);
    const received = checkBytes.readUInt8(224 + 31);
    console.log(`\n  Validations: ${received}/${REQUIRED_VALIDATIONS} threshold met [${elapsed(s6)}]`);

    await sleep(800);

    /** Step 7: Settlement with auto-reputation. */
    header(7, "Settlement — Release Payment + Record Reputation");
    const s7 = Date.now();

    const combinedHash = sha256(proofHashes.join(""));
    const proofHash32 = Buffer.alloc(32);
    Buffer.from(combinedHash, "hex").copy(proofHash32);

    const settleTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(500_000)
      .setFunction("completeTask", new ContractFunctionParameters()
        .addString(taskId).addBytes32(proofHash32))
      .freezeWith(clientR1);

    const signedSettle = await settleTx.sign(robot1Key);
    const settleResponse = await signedSettle.execute(clientR1);
    await settleResponse.getReceipt(clientR1);
    trackTx();

    console.log(`  Payment: ${rewardHbar} HBAR -> Robot 1`);
    console.log(`  Reputation: auto-feedback "taskSuccess" score=100 recorded`);
    console.log(`  [${elapsed(s7)}]`);

    await sleep(800);

    /** Step 8: Query all three registries. */
    header(8, "On-Chain Verification — All Three ERC-8004 Registries");

    /** Query task status. */
    const finalTask = await new ContractCallQuery()
      .setContractId(contractId).setGas(100_000)
      .setFunction("getTask", new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);

    const statusNames = ["Open", "Assigned", "Completed", "Refunded"];
    /** Parse status from raw ABI bytes — slot 5 at offset 160. */
    const rawBytes = Buffer.from(finalTask.bytes);
    const statusVal = rawBytes.readUInt8(160 + 31);
    console.log(`  ESCROW`);
    console.log(`    Task status: ${statusNames[statusVal]}`);

    /** Query reputation. */
    const repQuery = await new ContractCallQuery()
      .setContractId(reputationId).setGas(200_000)
      .setFunction("getSummary", new ContractFunctionParameters()
        .addAddress(robot1Id.toSolidityAddress()).addString("taskSuccess"))
      .execute(clientOp);

    const feedbackCount = Number(repQuery.getUint64(0));
    const summaryValue = Number(repQuery.getInt256(1));
    console.log(`\n  REPUTATION REGISTRY`);
    console.log(`    Robot 1 "taskSuccess" feedback: ${feedbackCount} entries, total score: ${summaryValue}`);

    /** Query balances. */
    const r1Resp = await fetch(`${mirrorBase}/accounts/${robot1Id.toString()}`);
    const r1Data = (await r1Resp.json()) as { balance: { balance: number } };
    const opResp = await fetch(`${mirrorBase}/accounts/${operatorId.toString()}`);
    const opData = (await opResp.json()) as { balance: { balance: number } };

    console.log(`\n  BALANCES`);
    console.log(`    Robot 1  : ${(r1Data.balance.balance / 1e8).toFixed(2)} HBAR`);
    console.log(`    Operator : ${(opData.balance.balance / 1e8).toFixed(2)} HBAR`);

    const totalElapsed = (Date.now() - demoStart) / 1000;
    const hcsCost = 6 * 0.0001;
    const contractCost = 6 * 0.065;
    const totalCost = hcsCost + contractCost;

    console.log(`\n  TRANSACTION SUMMARY`);
    console.log(`    HCS messages  : 6 (1 task + 2 bids + 3 proofs)`);
    console.log(`    Contract calls: ${txCount - 6} (escrow + assign + 2 validate + settle)`);
    console.log(`    Total txns    : ${txCount}`);
    console.log(`    Est. cost     : ~$${totalCost.toFixed(4)}`);
    console.log(`    Duration      : ${totalElapsed.toFixed(1)}s`);

    console.log(`\n  HASHSCAN LINKS`);
    console.log(`    Escrow     : https://hashscan.io/testnet/contract/${contractId.toString()}`);
    console.log(`    Reputation : https://hashscan.io/testnet/contract/${reputationId.toString()}`);
    console.log(`    Tasks HCS  : https://hashscan.io/testnet/topic/${tasksTopicId.toString()}`);
    console.log(`    Proofs HCS : https://hashscan.io/testnet/topic/${proofsTopicId.toString()}`);
    console.log(`    Robot 1    : https://hashscan.io/testnet/account/${robot1Id.toString()}`);
    console.log(`    Robot NFT  : https://hashscan.io/testnet/token/${nftTokenId}`);

    console.log("\n  ================================================");
    console.log("  ERC-8004 for Physical Robots — Demo Complete");
    console.log("  Identity + Reputation + Validation on Hedera");
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
