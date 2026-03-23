/**
 * Reputation query for the ERC-8004 Reputation Registry.
 *
 * Read aggregated reputation scores for a robot from the on-chain
 * ReputationRegistry contract. The escrow contract auto-submits feedback
 * on settlement and refund — this module provides read access.
 */

import {
  ContractCallQuery,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { ReputationQueryParams, ReputationSummary } from "./types.js";

/**
 * Query the on-chain reputation summary for a robot.
 *
 * Calls `getSummary(address robotId, string tag1)` on the
 * ReputationRegistry and parses the ABI-encoded return values.
 *
 * @param params - Query parameters including robot address and optional tag filter.
 * @returns Aggregated reputation summary (count, totalScore, averageScore).
 */
export async function queryReputation(
  params: ReputationQueryParams,
): Promise<ReputationSummary> {
  const { client, reputationContractId, robotAddress, tag } = params;

  const result = await new ContractCallQuery()
    .setContractId(reputationContractId)
    .setGas(200_000)
    .setFunction(
      "getSummary",
      new ContractFunctionParameters()
        .addAddress(robotAddress)
        .addString(tag),
    )
    .execute(client);

  const rawBytes = Buffer.from(result.bytes);

  /** ABI layout: uint64 count (slot 0), int128 summaryValue (slot 1), uint8 avgDecimals (slot 2). */
  const count = Number(rawBytes.readBigUInt64BE(24));
  const summaryValue = Number(rawBytes.readBigInt64BE(48));
  const averageScore = count > 0 ? Math.round(summaryValue / count) : 0;

  return {
    count,
    totalScore: summaryValue,
    averageScore,
  };
}
