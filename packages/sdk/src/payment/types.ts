/**
 * Type definitions for the escrow payment lifecycle.
 *
 * The marketplace uses a Solidity escrow contract on Hedera to hold
 * HBAR in trust until task completion is proven or the deadline lapses.
 * These types parameterize each phase of that lifecycle.
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
