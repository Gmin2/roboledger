/**
 * Task bidding via Hedera Consensus Service.
 *
 * Allows a robot to submit a bid on an open task, recording the bid
 * immutably on the HCS topic for transparent marketplace operation.
 */

import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { TaskBid } from "./types.js";

/**
 * Submit a bid on an existing task to the marketplace HCS topic.
 *
 * @param client - Authenticated Hedera client.
 * @param topicId - HCS topic ID for the task marketplace.
 * @param bid - Bid details (the `type` field is added automatically).
 * @returns The consensus sequence number and transaction ID.
 */
export async function bidOnTask(
  client: Client,
  topicId: string,
  bid: Omit<TaskBid, "type">,
): Promise<{ sequenceNumber: number; transactionId: string }> {
  const message: TaskBid = { type: "bid", ...bid };

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
