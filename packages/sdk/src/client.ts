/**
 * Hedera client factory for the RoboLedger marketplace.
 *
 * Centralizes operator configuration so every downstream module receives
 * a consistently-initialized Client instance bound to Hedera testnet.
 */

import { Client, PrivateKey } from "@hashgraph/sdk";

/**
 * Create a Hedera Client pre-configured for testnet with the given operator.
 *
 * @param operatorId - The account ID that pays for transactions (e.g. "0.0.12345").
 * @param operatorKey - The ED25519 private key string for the operator account.
 * @returns A `Client` instance ready to submit transactions to Hedera testnet.
 */
export function createClient(operatorId: string, operatorKey: string): Client {
  const client = Client.forTestnet();
  client.setOperator(operatorId, PrivateKey.fromStringED25519(operatorKey));
  return client;
}
