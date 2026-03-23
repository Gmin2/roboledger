#!/usr/bin/env node
/**
 * RoboLedger CLI bridge.
 *
 * Provide a subprocess-callable interface between Python ROS2 nodes and the
 * Hedera network. Every command writes deterministic JSON to stdout on success
 * and error JSON to stderr on failure, so the caller can parse output without
 * ambiguity.
 *
 * Supported commands:
 *   submit-proof <json>   Submit a proof message to the proofs HCS topic.
 *   bid-task <json>       Submit a bid message to the bids HCS topic.
 *   post-task <json>      Submit a task message to the tasks HCS topic.
 *   get-tasks             Fetch all messages from the tasks topic via mirror node.
 *   get-robot-info <id>   Fetch account information from the mirror node.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Load environment variables from the project root .env file. */
config({ path: resolve(__dirname, "../../../.env") });

const MIRROR_BASE_URL = "https://testnet.mirrornode.hedera.com";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Build an authenticated Hedera testnet client from environment variables.
 *
 * @returns Configured Client instance.
 */
function buildClient(): Client {
  const operatorId = process.env.OPERATOR_ID;
  const operatorKey = process.env.OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error(
      "OPERATOR_ID and OPERATOR_KEY must be set in the .env file"
    );
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(operatorId),
    PrivateKey.fromStringECDSA(operatorKey)
  );
  return client;
}

/**
 * Require an environment variable or throw.
 *
 * @param name - Environment variable name.
 * @returns The variable value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Submit a JSON message to the specified HCS topic.
 *
 * @param topicIdStr - Hedera topic ID string (e.g. "0.0.12345").
 * @param payload - Arbitrary JSON string to publish.
 * @returns Transaction receipt fields as a plain object.
 */
async function submitMessage(
  topicIdStr: string,
  payload: string
): Promise<Record<string, unknown>> {
  const client = buildClient();
  try {
    const topicId = TopicId.fromString(topicIdStr);
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(payload);

    const response = await tx.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      status: receipt.status.toString(),
      topicId: topicIdStr,
      sequenceNumber: receipt.topicSequenceNumber?.toString() ?? null,
    };
  } finally {
    client.close();
  }
}

/**
 * Fetch topic messages from the Hedera mirror node REST API.
 *
 * @param topicIdStr - Hedera topic ID string.
 * @returns Array of decoded message objects.
 */
async function fetchTopicMessages(
  topicIdStr: string
): Promise<Record<string, unknown>[]> {
  const url = `${MIRROR_BASE_URL}/api/v1/topics/${topicIdStr}/messages`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Mirror node request failed: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as {
    messages: Array<{
      consensus_timestamp: string;
      message: string;
      sequence_number: number;
      payer_account_id: string;
    }>;
  };

  return data.messages.map((msg) => {
    const decoded = Buffer.from(msg.message, "base64").toString("utf-8");
    let content: unknown;
    try {
      content = JSON.parse(decoded);
    } catch {
      content = decoded;
    }
    return {
      sequenceNumber: msg.sequence_number,
      consensusTimestamp: msg.consensus_timestamp,
      payerAccountId: msg.payer_account_id,
      content,
    };
  });
}

/**
 * Fetch account information from the Hedera mirror node REST API.
 *
 * @param accountId - Hedera account ID string (e.g. "0.0.12345").
 * @returns Account information object.
 */
async function fetchAccountInfo(
  accountId: string
): Promise<Record<string, unknown>> {
  const url = `${MIRROR_BASE_URL}/api/v1/accounts/${accountId}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Mirror node request failed: ${res.status} ${res.statusText}`
    );
  }

  return (await res.json()) as Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Command dispatch                                                  */
/* ------------------------------------------------------------------ */

/**
 * Parse argv and dispatch the appropriate command handler.
 *
 * Exit code 0 with JSON to stdout on success.
 * Exit code 1 with error JSON to stderr on failure.
 */
async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    const usage = [
      "Usage: roboledger <command> [args]",
      "",
      "Commands:",
      "  submit-proof <json>        Submit proof to the proofs topic",
      "  bid-task <json>            Submit bid to the bids topic",
      "  post-task <json>           Submit task to the tasks topic",
      "  get-tasks                  Fetch all task messages from mirror node",
      "  get-robot-info <accountId> Fetch account info from mirror node",
    ].join("\n");

    process.stderr.write(
      JSON.stringify({ error: "No command specified", usage }) + "\n"
    );
    process.exit(1);
  }

  switch (command) {
    case "submit-proof": {
      const json = args[0];
      if (!json) throw new Error("submit-proof requires a JSON argument");
      JSON.parse(json); // validate
      const topicId = requireEnv("PROOFS_TOPIC_ID");
      const result = await submitMessage(topicId, json);
      process.stdout.write(JSON.stringify(result) + "\n");
      break;
    }

    case "bid-task": {
      const json = args[0];
      if (!json) throw new Error("bid-task requires a JSON argument");
      JSON.parse(json); // validate
      const topicId = requireEnv("BIDS_TOPIC_ID");
      const result = await submitMessage(topicId, json);
      process.stdout.write(JSON.stringify(result) + "\n");
      break;
    }

    case "post-task": {
      const json = args[0];
      if (!json) throw new Error("post-task requires a JSON argument");
      JSON.parse(json); // validate
      const topicId = requireEnv("TASKS_TOPIC_ID");
      const result = await submitMessage(topicId, json);
      process.stdout.write(JSON.stringify(result) + "\n");
      break;
    }

    case "get-tasks": {
      const topicId = requireEnv("TASKS_TOPIC_ID");
      const messages = await fetchTopicMessages(topicId);
      process.stdout.write(JSON.stringify(messages) + "\n");
      break;
    }

    case "get-robot-info": {
      const accountId = args[0];
      if (!accountId)
        throw new Error("get-robot-info requires an accountId argument");
      const info = await fetchAccountInfo(accountId);
      process.stdout.write(JSON.stringify(info) + "\n");
      break;
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((err: Error) => {
  process.stderr.write(
    JSON.stringify({ error: err.message, command: process.argv.slice(2) }) +
      "\n"
  );
  process.exit(1);
});
