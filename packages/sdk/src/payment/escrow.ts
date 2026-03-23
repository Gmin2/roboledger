/**
 * Escrow creation for task payments.
 *
 * Locks HBAR in the on-chain escrow contract by calling `createTask`,
 * ensuring funds are held in trust until proof-of-completion is validated
 * by the required number of independent validators, or the deadline lapses.
 */

import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} from "@hashgraph/sdk";
import { EscrowParams } from "./types.js";

/**
 * Create an escrow by funding a task in the smart contract.
 *
 * Calls `createTask(string taskId, uint256 deadline, uint8 requiredValidations)`
 * with the reward amount attached as a payable HBAR transfer.
 *
 * @param params - Escrow creation parameters.
 * @returns The transaction ID of the executed contract call.
 */
export async function createEscrow(
  params: EscrowParams,
): Promise<{ transactionId: string }> {
  const { client, contractId, taskId, rewardHbar, deadlineTimestamp, requiredValidations } = params;

  const functionParams = new ContractFunctionParameters()
    .addString(taskId)
    .addUint256(deadlineTimestamp)
    .addUint8(requiredValidations);

  const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(400_000)
    .setFunction("createTask", functionParams)
    .setPayableAmount(new Hbar(rewardHbar));

  const response = await tx.execute(client);
  await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
  };
}
