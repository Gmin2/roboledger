/**
 * Type definitions for the task marketplace messaging protocol.
 *
 * Tasks and bids are exchanged as JSON messages over Hedera Consensus
 * Service topics. These types define the wire format for each message kind.
 */

/** A task posted by a customer requesting robot services. */
export interface TaskPost {
  /** Discriminator for message routing. */
  type: "task_post";
  /** Unique identifier for this task. */
  taskId: string;
  /** List of capabilities the robot must possess. */
  requirements: string[];
  /** Geographic coordinates defining the pickup and drop-off points. */
  location: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  };
  /** Reward offered for task completion, denominated in HBAR. */
  rewardHbar: number;
  /** ISO-8601 deadline by which the task must be completed. */
  deadline: string;
}

/** A bid submitted by a robot in response to a posted task. */
export interface TaskBid {
  /** Discriminator for message routing. */
  type: "bid";
  /** ID of the task being bid on. */
  taskId: string;
  /** Unique identifier of the bidding robot. */
  robotId: string;
  /** Serial number of the robot's identity NFT. */
  nftSerial: number;
  /** Estimated time to complete the task, in minutes. */
  etaMinutes: number;
  /** Cryptographic signature proving the bid originated from the robot's key. */
  signature: string;
}
