/**
 * Type definitions for the escrow payment lifecycle.
 *
 * The marketplace uses a Solidity escrow contract on Hedera to hold
 * HBAR in trust until task completion is proven and validated, or the
 * deadline lapses.  Integrates with ERC-8004 validation and reputation.
 */

import { Client, PrivateKey } from "@hashgraph/sdk";

/** Parameters for creating a new escrow (funding a task). */
export interface EscrowParams {
  /** Authenticated Hedera client. */
  client: Client;
  /** Contract ID of the deployed escrow smart contract. */
  contractId: string;
  /** Unique identifier of the task to fund. */
  taskId: string;
  /** HBAR amount to lock in escrow as the task reward. */
  rewardHbar: number;
  /** Unix timestamp (seconds) after which the escrow becomes refundable. */
  deadlineTimestamp: number;
  /** Number of validator approvals required before settlement (0 = none). */
  requiredValidations: number;
}

/** Parameters for settling an escrow (releasing payment to the robot). */
export interface SettleParams {
  /** Authenticated Hedera client. */
  client: Client;
  /** Contract ID of the deployed escrow smart contract. */
  contractId: string;
  /** Unique identifier of the completed task. */
  taskId: string;
  /** Hex-encoded SHA-256 hash of the aggregated delivery proof. */
  proofHash: string;
  /** Robot's private key required to co-sign the settlement transaction. */
  robotKey: PrivateKey;
}

/** Parameters for refunding an escrow (returning HBAR to the customer). */
export interface RefundParams {
  /** Authenticated Hedera client. */
  client: Client;
  /** Contract ID of the deployed escrow smart contract. */
  contractId: string;
  /** Unique identifier of the expired or cancelled task. */
  taskId: string;
}

/** Parameters for submitting a validation approval on a task. */
export interface ValidateParams {
  /** Authenticated Hedera client (signer is the validator). */
  client: Client;
  /** Contract ID of the deployed escrow smart contract. */
  contractId: string;
  /** Unique identifier of the task to validate. */
  taskId: string;
}

/** Parameters for querying reputation from the ReputationRegistry. */
export interface ReputationQueryParams {
  /** Authenticated Hedera client. */
  client: Client;
  /** Contract ID of the deployed ReputationRegistry. */
  reputationContractId: string;
  /** Hedera account address of the robot (EVM format). */
  robotAddress: string;
  /** Optional tag filter (e.g. "taskSuccess"). Empty string = all. */
  tag: string;
}

/** Reputation summary returned by the registry. */
export interface ReputationSummary {
  /** Number of non-revoked feedback entries matching the filter. */
  count: number;
  /** Sum of all matching feedback values. */
  totalScore: number;
  /** Average score (totalScore / count), or 0 if count is 0. */
  averageScore: number;
}
