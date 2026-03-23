/**
 * Escrow settlement for completed tasks.
 *
 * Releases escrowed HBAR to the robot by calling `completeTask` on the
 * smart contract, co-signed by the robot's key to prove mutual agreement.
 */

import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { SettleParams } from "./types.js";

/**
 * Settle an escrow by marking a task as complete in the smart contract.
 *
 * Calls the contract's `completeTask(string taskId, bytes32 proofHash)` function,
 * co-signed with the robot's private key to authorize payment release.
 *
 * @param params - Settlement parameters including client, contract, proof hash, and robot key.
 * @returns The transaction ID of the executed contract call.
 */
export async function settlePayment(
  params: SettleParams,
): Promise<{ transactionId: string }> {
  const { client, contractId, taskId, proofHash, robotKey } = params;

  const proofBytes = Buffer.from(proofHash, "hex");

  const functionParams = new ContractFunctionParameters()
    .addString(taskId)
    .addBytes32(proofBytes);

  const tx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(200_000)
    .setFunction("completeTask", functionParams)
    .freezeWith(client);

  const signedTx = await tx.sign(robotKey);
  const response = await signedTx.execute(client);
  await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
  };
}
