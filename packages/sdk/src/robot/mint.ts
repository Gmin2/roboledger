/**
 * Robot NFT minting and onboarding.
 *
 * Orchestrates three Hedera transactions to bring a new robot on-chain:
 * mint the NFT, transfer it to the robot's account, and grant KYC so
 * the robot can participate in the task marketplace.
 */

import {
  TokenMintTransaction,
  TransferTransaction,
  TokenGrantKycTransaction,
  TokenId,
  AccountId,
  NftId,
} from "@hashgraph/sdk";
import { MintRobotParams, MintRobotResult } from "./types.js";

/**
 * Mint a robot identity NFT, transfer it to the robot's account, and grant KYC.
 *
 * @param params - Minting parameters including client, keys, metadata, and target account.
 * @returns The serial number of the minted NFT and the mint transaction ID.
 */
export async function mintRobot(params: MintRobotParams): Promise<MintRobotResult> {
  const { client, tokenId, supplyKey, metadata, robotAccountId, kycKey } = params;

  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));

  const mintTx = new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([metadataBytes])
    .freezeWith(client);

  const signedMintTx = await mintTx.sign(supplyKey);
  const mintResponse = await signedMintTx.execute(client);
  const mintReceipt = await mintResponse.getReceipt(client);

  const serialNumber = mintReceipt.serials[0].toNumber();
  const transactionId = mintResponse.transactionId.toString();

  const operatorId = client.operatorAccountId;
  if (!operatorId) {
    throw new Error("Client must have an operator account set");
  }

  const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);

  const transferTx = new TransferTransaction()
    .addNftTransfer(nftId, operatorId, AccountId.fromString(robotAccountId))
    .freezeWith(client);

  const transferResponse = await transferTx.execute(client);
  await transferResponse.getReceipt(client);

  const kycTx = new TokenGrantKycTransaction()
    .setAccountId(AccountId.fromString(robotAccountId))
    .setTokenId(TokenId.fromString(tokenId))
    .freezeWith(client);

  const signedKycTx = await kycTx.sign(kycKey);
  const kycResponse = await signedKycTx.execute(client);
  await kycResponse.getReceipt(client);

  return { serialNumber, transactionId };
}
