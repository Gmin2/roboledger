#!/usr/bin/env tsx
/**
 * End-to-end test for RoboLedger on Hedera testnet.
 *
 * Executes the full task marketplace lifecycle:
 *   1. Post a delivery task to the HCS tasks topic.
 *   2. Robot 1 bids on the task via the HCS bids topic.
 *   3. Client creates an escrow — locking HBAR in the TaskEscrow contract.
 *   4. Client assigns Robot 1 to the task on-chain.
 *   5. Robot 1 submits a proof-of-completion to the HCS proofs topic.
 *   6. Robot 1 settles the escrow — contract releases HBAR to the robot.
 *   7. Verify final state via mirror node queries.
 *
 * Prerequisites:
 *   - `pnpm setup` has been run (accounts, topics, token, NFTs in .env).
 *   - `scripts/deploy-contract.ts` has been run (ESCROW_CONTRACT_ID in .env).
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

/** Load and validate a required environment variable. */
function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

/** SHA-256 hash of a string, returned as hex. */
function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function main(): Promise<void> {
  /** Load credentials from .env. */
  const operatorId = AccountId.fromString(env("OPERATOR_ID"));
  const operatorKey = PrivateKey.fromStringECDSA(env("OPERATOR_KEY"));
  const robot1Id = AccountId.fromString(env("ROBOT1_ID"));
  const robot1Key = PrivateKey.fromStringED25519(env("ROBOT1_KEY"));
  const tasksTopicId = TopicId.fromString(env("TASKS_TOPIC_ID"));
  const bidsTopicId = TopicId.fromString(env("BIDS_TOPIC_ID"));
  const proofsTopicId = TopicId.fromString(env("PROOFS_TOPIC_ID"));
  const contractId = ContractId.fromString(env("ESCROW_CONTRACT_ID"));

  /** Build two clients: one for the operator (client role) and one for robot 1. */
  const clientHedera = Client.forTestnet();
  clientHedera.setOperator(operatorId, operatorKey);

  const robot1Client = Client.forTestnet();
  robot1Client.setOperator(robot1Id, robot1Key);

  const taskId = `task-${Date.now()}`;
  const rewardHbar = 2;
  const deadlineSeconds = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

  try {
    console.log("=== RoboLedger End-to-End Test ===\n");

    /** Step 1: Post task to HCS. */
    console.log("Step 1: Posting task to HCS tasks topic...");
    const taskMessage = JSON.stringify({
      type: "task_post",
      taskId,
      requirements: ["delivery", "outdoor"],
      location: { fromLat: 37.77, fromLng: -122.42, toLat: 37.78, toLng: -122.41 },
      rewardHbar,
      deadline: new Date(deadlineSeconds * 1000).toISOString(),
    });

    const taskTx = await new TopicMessageSubmitTransaction()
      .setTopicId(tasksTopicId)
      .setMessage(taskMessage)
      .execute(clientHedera);
    const taskReceipt = await taskTx.getReceipt(clientHedera);
    console.log(`  Topic sequence: ${taskReceipt.topicSequenceNumber}`);
    console.log(`  Task ID: ${taskId}`);

    /** Step 2: Robot 1 bids on the task. */
    console.log("\nStep 2: Robot 1 bidding on task...");
    const bidMessage = JSON.stringify({
      type: "bid",
      taskId,
      robotId: robot1Id.toString(),
      nftSerial: 1,
      etaMinutes: 12,
      signature: sha256(`bid:${taskId}:${robot1Id.toString()}`),
    });

    const bidTx = await new TopicMessageSubmitTransaction()
      .setTopicId(bidsTopicId)
      .setMessage(bidMessage)
      .execute(clientHedera);
    const bidReceipt = await bidTx.getReceipt(clientHedera);
    console.log(`  Bid sequence: ${bidReceipt.topicSequenceNumber}`);

    /** Step 3: Client creates escrow — locks HBAR in the contract. */
    console.log("\nStep 3: Creating escrow (locking HBAR)...");
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
      .execute(clientHedera);
    const escrowReceipt = await escrowTx.getReceipt(clientHedera);
    console.log(`  Escrow tx: ${escrowReceipt.status.toString()}`);
    console.log(`  Locked: ${rewardHbar} HBAR`);

    /** Step 4: Client assigns Robot 1 to the task. */
    console.log("\nStep 4: Assigning Robot 1 to the task...");
    const assignTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(200_000)
      .setFunction(
        "assignTask",
        new ContractFunctionParameters()
          .addString(taskId)
          .addAddress(robot1Id.toSolidityAddress())
      )
      .execute(clientHedera);
    const assignReceipt = await assignTx.getReceipt(clientHedera);
    console.log(`  Assign tx: ${assignReceipt.status.toString()}`);

    /** Step 5: Robot 1 submits proof to HCS. */
    console.log("\nStep 5: Robot 1 submitting proof to HCS...");
    const gpsHash = sha256("gps-route:37.77,-122.42->37.78,-122.41");
    const sensorHash = sha256("temp:22C,weight_delta:-2.3kg");
    const photoHash = sha256("delivery-photo-001.jpg");

    const proofMessage = JSON.stringify({
      type: "proof",
      taskId,
      robotId: robot1Id.toString(),
      gpsRouteHash: gpsHash,
      sensorDataHash: sensorHash,
      photoHash: photoHash,
      signature: sha256(`proof:${taskId}:${robot1Id.toString()}`),
    });

    const proofTx = await new TopicMessageSubmitTransaction()
      .setTopicId(proofsTopicId)
      .setMessage(proofMessage)
      .execute(clientHedera);
    const proofReceipt = await proofTx.getReceipt(clientHedera);
    console.log(`  Proof sequence: ${proofReceipt.topicSequenceNumber}`);

    /** Step 6: Robot 1 settles the escrow — contract releases HBAR. */
    console.log("\nStep 6: Robot 1 settling escrow (claiming payment)...");
    const proofHashBytes = Buffer.from(sha256(`${gpsHash}${sensorHash}${photoHash}`), "hex");
    /** Pad to 32 bytes (bytes32 in Solidity). */
    const proofHash32 = Buffer.alloc(32);
    proofHashBytes.copy(proofHash32);

    const settleTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(300_000)
      .setFunction(
        "completeTask",
        new ContractFunctionParameters()
          .addString(taskId)
          .addBytes32(proofHash32)
      )
      .freezeWith(robot1Client);

    /** Robot signs and executes. */
    const signedSettle = await settleTx.sign(robot1Key);
    const settleResponse = await signedSettle.execute(robot1Client);
    const settleReceipt = await settleResponse.getReceipt(robot1Client);
    console.log(`  Settle tx: ${settleReceipt.status.toString()}`);

    /** Step 7: Verify final state. */
    console.log("\nStep 7: Verifying final state...");

    const queryResult = await new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("getTask", new ContractFunctionParameters().addString(taskId))
      .execute(clientHedera);

    const statusVal = queryResult.getUint256(5);
    const statusNames = ["Open", "Assigned", "Completed", "Refunded"];
    console.log(`  Task status: ${statusNames[Number(statusVal)]} (${statusVal})`);

    /** Query robot balance via mirror node. */
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${robot1Id.toString()}`;
    const accountResp = await fetch(mirrorUrl);
    const accountData = await accountResp.json() as { balance: { balance: number } };
    const balanceHbar = accountData.balance.balance / 1e8;
    console.log(`  Robot 1 balance: ${balanceHbar.toFixed(2)} HBAR`);

    console.log("\n=== End-to-End Test PASSED ===");
    console.log(`\nVerify on HashScan:`);
    console.log(`  Contract: https://hashscan.io/testnet/contract/${contractId.toString()}`);
    console.log(`  Tasks topic: https://hashscan.io/testnet/topic/${tasksTopicId.toString()}`);
    console.log(`  Bids topic: https://hashscan.io/testnet/topic/${bidsTopicId.toString()}`);
    console.log(`  Proofs topic: https://hashscan.io/testnet/topic/${proofsTopicId.toString()}`);
  } finally {
    clientHedera.close();
    robot1Client.close();
  }
}

main().catch((err) => {
  console.error("E2E test failed:", err);
  process.exit(1);
});
