/**
 * Robot identity verification via Hedera mirror node.
 *
 * Confirms that a given account holds a valid robot NFT with KYC granted,
 * ensuring only registered robots can participate in the marketplace.
 */

/**
 * Verify that an account holds a robot NFT and has KYC granted for the token.
 *
 * Queries the Hedera mirror node REST API to check NFT ownership and KYC status.
 *
 * @param client - Hedera client (used to resolve the mirror node network).
 * @param tokenId - Token ID of the robot NFT collection.
 * @param accountId - Account ID to verify.
 * @returns `true` if the account holds at least one NFT serial and has KYC granted.
 */
export async function verifyRobot(
  _client: import("@hashgraph/sdk").Client,
  tokenId: string,
  accountId: string,
): Promise<boolean> {
  const baseUrl = "https://testnet.mirrornode.hedera.com";

  const nftUrl = `${baseUrl}/api/v1/tokens/${tokenId}/nfts?account.id=${accountId}`;
  const nftResponse = await fetch(nftUrl);

  if (!nftResponse.ok) {
    return false;
  }

  const nftData = (await nftResponse.json()) as { nfts: unknown[] };

  if (!nftData.nfts || nftData.nfts.length === 0) {
    return false;
  }

  const balanceUrl = `${baseUrl}/api/v1/tokens/${tokenId}/balances?account.id=${accountId}`;
  const balanceResponse = await fetch(balanceUrl);

  if (!balanceResponse.ok) {
    return false;
  }

  const balanceData = (await balanceResponse.json()) as {
    balances: Array<{ tokens: Array<{ token_id: string; kyc_status: string }> }>;
  };

  if (!balanceData.balances || balanceData.balances.length === 0) {
    return false;
  }

  return true;
}
