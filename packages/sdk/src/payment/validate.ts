/**
 * Task validation for the ERC-8004 Validation Registry.
 *
 * Validators call `validateTask` on the escrow contract to approve a
 * robot's proof-of-completion. The escrow tracks approvals internally
 * and gates settlement on reaching the required threshold.
 */

import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { ValidateParams } from "./types.js";

/**
 * Submit a validation approval for a task.
 *
 * The caller (validator) signs the transaction. Each address may only
 * validate a given task once. The escrow contract increments its
 * `receivedValidations` counter.
 *
 * @param params - Validation parameters including client (signer) and task ID.
 * @returns The transaction ID of the executed validation call.
 */
export async function validateTask(
  params: ValidateParams,
): Promise<{ transactionId: string }> {
  const { client, contractId, taskId } = params;

  const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200_000)
    .setFunction("validateTask", new ContractFunctionParameters().addString(taskId));

  const response = await tx.execute(client);
  await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
  };
}
