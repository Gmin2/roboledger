/**
 * Hedera smart contract query functions.
 *
 * Wraps ContractCallQuery and ContractExecuteTransaction for the
 * TaskEscrow, ReputationRegistry, and ValidationRegistry contracts.
 * All SDK imports are isolated here — pages never import @hashgraph/sdk.
 */

import {
  Client, AccountId, PrivateKey,
  ContractId, ContractCallQuery, ContractFunctionParameters,
} from '@hashgraph/sdk';
import { HEDERA_CONFIG as C } from './hedera-config';

/** Build a read-only Hedera client for contract queries. */
function buildClient(): Client {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(C.operatorId),
    PrivateKey.fromStringECDSA(C.operatorKey),
  );
  return client;
}

/** Parsed task state from the TaskEscrow contract. */
export interface OnChainTask {
  client: string;
  robot: string;
  reward: bigint;
  deadline: number;
  proofHash: string;
  status: 'Open' | 'Assigned' | 'Completed' | 'Refunded';
  requiredValidations: number;
  receivedValidations: number;
}

const STATUS_NAMES = ['Open', 'Assigned', 'Completed', 'Refunded'] as const;

/** Query the TaskEscrow contract for a task's on-chain state. */
export async function queryTask(taskId: string): Promise<OnChainTask> {
  const client = buildClient();
  try {
    const result = await new ContractCallQuery()
      .setContractId(ContractId.fromString(C.escrowContractId))
      .setGas(100_000)
      .setFunction('getTask', new ContractFunctionParameters().addString(taskId))
      .execute(client);

    const raw = new Uint8Array(result.bytes);
    const view = new DataView(raw.buffer);

    return {
      client: '0x' + Buffer.from(raw.slice(12, 32)).toString('hex'),
      robot: '0x' + Buffer.from(raw.slice(44, 64)).toString('hex'),
      reward: view.getBigUint64(64 + 24),
      deadline: Number(view.getBigUint64(96 + 24)),
      proofHash: '0x' + Buffer.from(raw.slice(128, 160)).toString('hex'),
      status: STATUS_NAMES[raw[160 + 31]] ?? 'Open',
      requiredValidations: raw[192 + 31],
      receivedValidations: raw[224 + 31],
    };
  } finally {
    client.close();
  }
}

/** Reputation summary from the ReputationRegistry contract. */
export interface ReputationSummary {
  count: number;
  totalScore: number;
  averageScore: number;
}

/** Query reputation summary for a robot. */
export async function queryReputation(
  robotAccountId: string,
  tag: string = 'taskSuccess',
): Promise<ReputationSummary> {
  const client = buildClient();
  try {
    const robotAddress = AccountId.fromString(robotAccountId).toSolidityAddress();

    const result = await new ContractCallQuery()
      .setContractId(ContractId.fromString(C.reputationContractId))
      .setGas(200_000)
      .setFunction('getSummary', new ContractFunctionParameters()
        .addAddress(robotAddress)
        .addString(tag))
      .execute(client);

    const raw = new Uint8Array(result.bytes);
    const view = new DataView(raw.buffer);
    const count = Number(view.getBigUint64(24));
    const totalScore = Number(view.getBigInt64(48));

    return {
      count,
      totalScore,
      averageScore: count > 0 ? Math.round(totalScore / count) : 0,
    };
  } finally {
    client.close();
  }
}
