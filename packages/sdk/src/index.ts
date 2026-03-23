/**
 * RoboLedger SDK -- domain-specific wrapper around @hashgraph/sdk.
 *
 * Provides a high-level API for the robot task marketplace: minting
 * robot identity NFTs, posting and bidding on tasks via HCS, submitting
 * delivery proofs, and managing escrow payments through smart contracts.
 *
 * @packageDocumentation
 */

/* Client */
export { createClient } from "./client.js";

/* Robot identity */
export { mintRobot } from "./robot/mint.js";
export { verifyRobot } from "./robot/verify.js";
export type { RobotMetadata, MintRobotParams, MintRobotResult } from "./robot/types.js";

/* Task marketplace */
export { postTask } from "./task/post.js";
export { bidOnTask } from "./task/bid.js";
export { listenToTasks } from "./task/listen.js";
export type { TaskPost, TaskBid } from "./task/types.js";

/* Delivery proof */
export { submitProof } from "./proof/submit.js";
export type { ProofSubmission } from "./proof/types.js";

/* Escrow payments */
export { createEscrow } from "./payment/escrow.js";
export { settlePayment } from "./payment/settle.js";
export { refundPayment } from "./payment/refund.js";
export type { EscrowParams, SettleParams, RefundParams } from "./payment/types.js";
