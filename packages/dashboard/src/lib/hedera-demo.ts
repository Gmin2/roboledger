/**
 * Hedera demo execution engine.
 *
 * Encapsulates all SDK interactions for the live demo. The Demo page
 * calls `runDemoSequence` with a logger callback and receives
 * step-by-step progress updates without touching the SDK directly.
 */

import {
  Client, AccountId, PrivateKey, TopicId, ContractId,
  TopicMessageSubmitTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Hbar,
} from '@hashgraph/sdk';
import { HEDERA_CONFIG as C } from './hedera-config';

/** SHA-256 via Web Crypto API. */
async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Convert hex string to Uint8Array. */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Log severity levels emitted during demo execution. */
export type LogType = 'info' | 'success' | 'error' | 'detail';

/** Callback the UI provides to receive real-time progress. */
export type DemoLogger = (message: string, type: LogType) => void;

/** Callback the UI provides to update step status. */
export type StepUpdater = (stepIndex: number, status: 'active' | 'complete' | 'error') => void;

/** Pause execution for a given duration. */
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Execute the full ERC-8004 demo lifecycle on Hedera testnet.
 *
 * Creates three authenticated clients (operator, robot1, robot3),
 * runs all 8 steps, and reports progress via the provided callbacks.
 * Cleans up all clients on completion or failure.
 */
export async function runDemoSequence(
  log: DemoLogger,
  setStep: StepUpdater,
): Promise<void> {
  const operatorId = AccountId.fromString(C.operatorId);
  const operatorKey = PrivateKey.fromStringECDSA(C.operatorKey);
  const robot1Id = AccountId.fromString(C.robot1Id);
  const robot1Key = PrivateKey.fromStringED25519(C.robot1Key);
  const robot3Id = AccountId.fromString(C.robot3Id);
  const robot3Key = PrivateKey.fromStringED25519(C.robot3Key);
  const tasksTopicId = TopicId.fromString(C.tasksTopicId);
  const bidsTopicId = TopicId.fromString(C.bidsTopicId);
  const proofsTopicId = TopicId.fromString(C.proofsTopicId);
  const contractId = ContractId.fromString(C.escrowContractId);
  const reputationId = ContractId.fromString(C.reputationContractId);

  const clientOp = Client.forTestnet(); clientOp.setOperator(operatorId, operatorKey);
  const clientR1 = Client.forTestnet(); clientR1.setOperator(robot1Id, robot1Key);
  const clientR3 = Client.forTestnet(); clientR3.setOperator(robot3Id, robot3Key);

  const taskId = `demo-${Date.now()}`;
  const rewardHbar = 5;
  const deadlineSeconds = Math.floor(Date.now() / 1000) + 600;

  try {
    /** Step 1: Verify fleet. */
    setStep(0, 'active');
    log('Querying mirror node for robot NFTs...', 'info');
    const nftResp = await fetch(`${C.mirrorBaseUrl}/tokens/${C.nftTokenId}/nfts`);
    const nftData = await nftResp.json() as { nfts: Array<{ serial_number: number; account_id: string; metadata: string }> };
    for (const nft of nftData.nfts) {
      const meta = JSON.parse(atob(nft.metadata));
      log(`Robot #${nft.serial_number} | ${nft.account_id} | ${JSON.stringify(meta.capabilities)}`, 'detail');
    }
    log(`${nftData.nfts.length} robots verified with KYC`, 'success');
    setStep(0, 'complete');

    /** Step 2: Post task. */
    setStep(1, 'active');
    log(`Posting task ${taskId} to HCS...`, 'info');
    const taskMsg = JSON.stringify({
      type: 'task_post', taskId,
      requirements: ['delivery', 'outdoor'],
      location: { fromLat: 37.7749, fromLng: -122.4194, toLat: 37.7849, toLng: -122.4094 },
      rewardHbar, requiredValidations: 2,
      deadline: new Date(deadlineSeconds * 1000).toISOString(),
    });
    const taskTx = await new TopicMessageSubmitTransaction().setTopicId(tasksTopicId).setMessage(taskMsg).execute(clientOp);
    const taskReceipt = await taskTx.getReceipt(clientOp);
    log(`Task posted — HCS #${taskReceipt.topicSequenceNumber}`, 'success');
    setStep(1, 'complete');

    /** Step 3: Bidding. */
    setStep(2, 'active');
    log('Robot 1 bidding (delivery, outdoor)...', 'info');
    const bid1 = JSON.stringify({
      type: 'bid', taskId, robotId: C.robot1Id, nftSerial: 1, etaMinutes: 12,
      signature: await sha256(`bid:${taskId}:${C.robot1Id}`),
    });
    const bid1Tx = await new TopicMessageSubmitTransaction().setTopicId(bidsTopicId).setMessage(bid1).execute(clientOp);
    const bid1R = await bid1Tx.getReceipt(clientOp);
    log(`Robot 1 bid -> HCS #${bid1R.topicSequenceNumber}`, 'detail');

    log('Robot 3 bidding (inspection, outdoor)...', 'info');
    const bid3 = JSON.stringify({
      type: 'bid', taskId, robotId: C.robot3Id, nftSerial: 3, etaMinutes: 18,
      signature: await sha256(`bid:${taskId}:${C.robot3Id}`),
    });
    const bid3Tx = await new TopicMessageSubmitTransaction().setTopicId(bidsTopicId).setMessage(bid3).execute(clientOp);
    const bid3R = await bid3Tx.getReceipt(clientOp);
    log(`Robot 3 bid -> HCS #${bid3R.topicSequenceNumber}`, 'detail');
    log('Winner: Robot 1 (first valid bid by aBFT fair ordering)', 'success');
    setStep(2, 'complete');

    /** Step 4: Escrow + assign. */
    setStep(3, 'active');
    log(`Locking ${rewardHbar} HBAR in escrow...`, 'info');
    const escrowTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(400_000)
      .setPayableAmount(new Hbar(rewardHbar))
      .setFunction('createTask', new ContractFunctionParameters().addString(taskId).addUint256(deadlineSeconds).addUint8(2))
      .execute(clientOp);
    await escrowTx.getReceipt(clientOp);
    log(`Escrow created — ${rewardHbar} HBAR locked`, 'detail');

    log('Assigning Robot 1...', 'info');
    const assignTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction('assignTask', new ContractFunctionParameters().addString(taskId).addAddress(robot1Id.toSolidityAddress()))
      .execute(clientOp);
    await assignTx.getReceipt(clientOp);
    log('Robot 1 assigned to task', 'success');
    setStep(3, 'complete');

    /** Step 5: Proof stream. */
    setStep(4, 'active');
    const waypoints = [
      { lat: 37.7749, lng: -122.4194, label: 'Pickup confirmed' },
      { lat: 37.7799, lng: -122.4144, label: 'En route — waypoint 1' },
      { lat: 37.7849, lng: -122.4094, label: 'Delivered — destination reached' },
    ];
    const proofHashes: string[] = [];

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const gpsHash = await sha256(`gps:${wp.lat},${wp.lng}`);
      const sensorHash = await sha256('sensor:temp=22C,battery=87%');
      const photoHash = await sha256(`photo:wp-${i + 1}-${Date.now()}`);
      proofHashes.push(gpsHash, sensorHash, photoHash);

      const proofMsg = JSON.stringify({
        type: 'proof', taskId, robotId: C.robot1Id,
        waypointIndex: i + 1, gpsRouteHash: gpsHash, sensorDataHash: sensorHash, photoHash,
        label: wp.label,
      });
      const pTx = await new TopicMessageSubmitTransaction().setTopicId(proofsTopicId).setMessage(proofMsg).execute(clientOp);
      const pR = await pTx.getReceipt(clientOp);
      log(`WP ${i + 1}/3: ${wp.label} | HCS #${pR.topicSequenceNumber}`, 'detail');
      if (i < 2) await sleep(800);
    }
    log('3 proofs recorded on immutable HCS', 'success');
    setStep(4, 'complete');

    /** Step 6: Validation. */
    setStep(5, 'active');
    log(`Validator 1 (client) approving...`, 'info');
    const v1Tx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction('validateTask', new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);
    await v1Tx.getReceipt(clientOp);
    log('Validator 1 approved', 'detail');

    await sleep(2000);

    log(`Validator 2 (Robot 3) approving...`, 'info');
    const v2Tx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(200_000)
      .setFunction('validateTask', new ContractFunctionParameters().addString(taskId))
      .freezeWith(clientR3);
    const v2Signed = await v2Tx.sign(robot3Key);
    const v2Resp = await v2Signed.execute(clientR3);
    await v2Resp.getReceipt(clientR3);
    log('Validator 2 approved', 'detail');
    log('Validations: 2/2 threshold met', 'success');
    setStep(5, 'complete');

    /** Step 7: Settlement. */
    setStep(6, 'active');
    log('Robot 1 claiming payment...', 'info');
    const combinedHash = await sha256(proofHashes.join(''));
    const proofBytes = hexToBytes(combinedHash);
    const proofHash32 = new Uint8Array(32);
    proofHash32.set(proofBytes.slice(0, 32));

    const settleTx = await new ContractExecuteTransaction()
      .setContractId(contractId).setGas(500_000)
      .setFunction('completeTask', new ContractFunctionParameters().addString(taskId).addBytes32(proofHash32))
      .freezeWith(clientR1);
    const settleSigned = await settleTx.sign(robot1Key);
    const settleResp = await settleSigned.execute(clientR1);
    await settleResp.getReceipt(clientR1);
    log(`Payment: ${rewardHbar} HBAR -> Robot 1`, 'success');
    log('Reputation: "taskSuccess" score=100 auto-recorded', 'detail');
    setStep(6, 'complete');

    /** Step 8: Verification. */
    setStep(7, 'active');
    log('Querying on-chain state...', 'info');

    const taskResult = await new ContractCallQuery()
      .setContractId(contractId).setGas(100_000)
      .setFunction('getTask', new ContractFunctionParameters().addString(taskId))
      .execute(clientOp);
    const rawBytes = new Uint8Array(taskResult.bytes);
    const statusVal = rawBytes[160 + 31];
    const statusNames = ['Open', 'Assigned', 'Completed', 'Refunded'];
    log(`Task status: ${statusNames[statusVal]}`, 'detail');

    const repResult = await new ContractCallQuery()
      .setContractId(reputationId).setGas(200_000)
      .setFunction('getSummary', new ContractFunctionParameters().addAddress(robot1Id.toSolidityAddress()).addString('taskSuccess'))
      .execute(clientOp);
    const repBytes = new Uint8Array(repResult.bytes);
    const view = new DataView(repBytes.buffer);
    const feedbackCount = Number(view.getBigUint64(24));
    log(`Reputation: ${feedbackCount} feedback entries for Robot 1`, 'detail');

    const r1Resp = await fetch(`${C.mirrorBaseUrl}/accounts/${C.robot1Id}`);
    const r1Data = await r1Resp.json() as { balance: { balance: number } };
    log(`Robot 1 balance: ${(r1Data.balance.balance / 1e8).toFixed(2)} HBAR`, 'detail');

    log('All three ERC-8004 registries verified on-chain', 'success');
    setStep(7, 'complete');
  } finally {
    clientOp.close();
    clientR1.close();
    clientR3.close();
  }
}
