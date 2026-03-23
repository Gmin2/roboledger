/**
 * Type definitions for the robot identity and NFT minting domain.
 *
 * Each physical robot is represented on-chain as a non-fungible token.
 * These types capture the metadata embedded in that NFT and the
 * parameters required to mint and transfer it.
 */

import { Client, PrivateKey } from "@hashgraph/sdk";

/** On-chain metadata embedded in a robot NFT. */
export interface RobotMetadata {
  /** Name of the hardware manufacturer. */
  manufacturer: string;
  /** Model identifier of the robot. */
  model: string;
  /** List of task capabilities the robot supports (e.g. "delivery", "inspection"). */
  capabilities: string[];
  /** SHA-256 hash of the robot's verified firmware binary. */
  firmwareHash: string;
  /** ISO-8601 date when the safety certificate expires. */
  safetyCertExpiry: string;
}

/** Parameters required to mint a new robot NFT and assign it to an account. */
export interface MintRobotParams {
  /** Authenticated Hedera client. */
  client: Client;
  /** Token ID of the robot NFT collection. */
  tokenId: string;
  /** Supply key authorized to mint new serials. */
  supplyKey: PrivateKey;
  /** Metadata to embed in the NFT. */
  metadata: RobotMetadata;
  /** Account ID that will receive the minted NFT. */
  robotAccountId: string;
  /** KYC key used to grant KYC on the token for the receiving account. */
  kycKey: PrivateKey;
}

/** Result returned after successfully minting and transferring a robot NFT. */
export interface MintRobotResult {
  /** Serial number assigned to the newly minted NFT. */
  serialNumber: number;
  /** Hedera transaction ID of the mint operation. */
  transactionId: string;
}
