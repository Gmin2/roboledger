/**
 * Escrow refund for expired or cancelled tasks.
 *
 * Returns escrowed HBAR to the original customer by calling `refundTask`
 * on the smart contract after the task deadline has elapsed without completion.
 */

import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { RefundParams } from "./types.js";

/**
 * Refund an escrow by reclaiming funds for an incomplete task.
 *
 * Calls the contract's `refundTask(string taskId)` function. The contract
 * enforces that the deadline has passed before permitting the refund.
 *
 * @param params - Refund parameters including client, contract, and task ID.
 * @returns The transaction ID of the executed contract call.
 */
export async function refundPayment(
  params: RefundParams,
): Promise<{ transactionId: string }> {
  const { client, contractId, taskId } = params;

  const functionParams = new ContractFunctionParameters().addString(taskId);

  const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200_000)
    .setFunction("refundTask", functionParams);

  const response = await tx.execute(client);
  await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
  };
}
