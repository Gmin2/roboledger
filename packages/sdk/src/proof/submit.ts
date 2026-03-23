/**
 * Delivery proof submission via Hedera Consensus Service.
 *
 * Records an immutable proof-of-completion on the HCS topic, anchoring
 * off-chain evidence hashes so that the escrow contract can verify
 * task fulfillment and release payment.
 */

import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { ProofSubmission } from "./types.js";

/**
 * Submit a delivery proof to the marketplace HCS topic.
 *
 * @param client - Authenticated Hedera client.
 * @param topicId - HCS topic ID for proof submissions.
 * @param proof - Proof details (the `type` field is added automatically).
 * @returns The consensus sequence number and transaction ID.
 */
export async function submitProof(
  client: Client,
  topicId: string,
  proof: Omit<ProofSubmission, "type">,
): Promise<{ sequenceNumber: number; transactionId: string }> {
  const message: ProofSubmission = { type: "proof", ...proof };

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify(message));

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    sequenceNumber: receipt.topicSequenceNumber!.toNumber(),
    transactionId: response.transactionId.toString(),
  };
}
