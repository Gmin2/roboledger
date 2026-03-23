/**
 * RoboLedger SDK — domain-specific wrapper around @hashgraph/sdk.
 *
 * Provides a high-level API for the ERC-8004 robot task marketplace:
 * identity (HTS NFTs), reputation (on-chain feedback), validation
 * (multi-party approval), task bidding via HCS, proof streaming,
 * and escrow settlement through smart contracts.
 *
 * @packageDocumentation
 */

/** Client */
export { createClient } from "./client.js";

/** Robot identity (ERC-8004 Identity Registry) */
export { mintRobot } from "./robot/mint.js";
export { verifyRobot } from "./robot/verify.js";
export type { RobotMetadata, MintRobotParams, MintRobotResult } from "./robot/types.js";

/** Task marketplace (HCS) */
export { postTask } from "./task/post.js";
export { bidOnTask } from "./task/bid.js";
export { listenToTasks } from "./task/listen.js";
export type { TaskPost, TaskBid } from "./task/types.js";

/** Delivery proof (HCS) */
export { submitProof } from "./proof/submit.js";
export type { ProofSubmission } from "./proof/types.js";

/** Escrow payments */
export { createEscrow } from "./payment/escrow.js";
export { settlePayment } from "./payment/settle.js";
export { refundPayment } from "./payment/refund.js";

/** Validation (ERC-8004 Validation Registry) */
export { validateTask } from "./payment/validate.js";

/** Reputation (ERC-8004 Reputation Registry) */
export { queryReputation } from "./payment/reputation.js";

/** Types */
export type {
  EscrowParams,
  SettleParams,
  RefundParams,
  ValidateParams,
  ReputationQueryParams,
  ReputationSummary,
} from "./payment/types.js";
