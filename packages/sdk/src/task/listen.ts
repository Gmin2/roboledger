/**
 * Real-time task and bid subscription via Hedera Consensus Service.
 *
 * Opens a persistent subscription to the marketplace HCS topic,
 * parsing inbound messages and dispatching them to the caller's handler.
 */

import { Client, TopicMessageQuery } from "@hashgraph/sdk";
import { TaskPost, TaskBid } from "./types.js";

/**
 * Subscribe to the marketplace HCS topic and invoke a callback for each message.
 *
 * Parses each incoming message as JSON and forwards it to `onMessage`.
 * Messages that fail to parse are silently dropped to maintain stream continuity.
 *
 * @param client - Authenticated Hedera client.
 * @param topicId - HCS topic ID for the task marketplace.
 * @param onMessage - Callback invoked with each parsed task post or bid.
 */
export function listenToTasks(
  client: Client,
  topicId: string,
  onMessage: (msg: TaskPost | TaskBid) => void,
): void {
  new TopicMessageQuery()
    .setTopicId(topicId)
    .subscribe(client, null, (message) => {
      try {
        const contents = Buffer.from(message.contents).toString("utf-8");
        const parsed = JSON.parse(contents) as TaskPost | TaskBid;
        onMessage(parsed);
      } catch {
        /* Malformed messages are dropped to preserve stream stability. */
      }
    });
}
