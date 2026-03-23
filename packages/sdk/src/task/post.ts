/**
 * Task posting via Hedera Consensus Service.
 *
 * Submits a new task request to the marketplace topic so registered
 * robots can discover and bid on available work.
 */

import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { TaskPost } from "./types.js";

/**
 * Post a new task to the marketplace HCS topic.
 *
 * @param client - Authenticated Hedera client.
 * @param topicId - HCS topic ID for the task marketplace.
 * @param task - Task details (the `type` field is added automatically).
 * @returns The consensus sequence number and transaction ID.
 */
export async function postTask(
  client: Client,
  topicId: string,
  task: Omit<TaskPost, "type">,
): Promise<{ sequenceNumber: number; transactionId: string }> {
  const message: TaskPost = { type: "task_post", ...task };

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
