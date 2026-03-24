/**
 * Hedera Mirror Node API client.
 *
 * All read-only queries to the Hedera testnet mirror node live here.
 * Dashboard pages import these functions instead of calling fetch directly,
 * keeping the UI layer free of API details.
 */

import { HEDERA_CONFIG as C } from './hedera-config';

/** Generic JSON fetch with error handling. */
async function mirrorGet<T>(path: string): Promise<T> {
  const res = await fetch(`${C.mirrorBaseUrl}${path}`);
  if (!res.ok) throw new Error(`Mirror node error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Robot NFT data from the mirror node. */
export interface RobotNft {
  serialNumber: number;
  accountId: string;
  metadata: Record<string, unknown>;
}

/** Fetch all robot NFTs for the configured token. */
export async function fetchRobotNfts(): Promise<RobotNft[]> {
  const data = await mirrorGet<{
    nfts: Array<{ serial_number: number; account_id: string; metadata: string }>;
  }>(`/tokens/${C.nftTokenId}/nfts`);

  return data.nfts.map(nft => ({
    serialNumber: nft.serial_number,
    accountId: nft.account_id,
    metadata: JSON.parse(atob(nft.metadata)),
  }));
}

/** Account balance info. */
export interface AccountBalance {
  accountId: string;
  balanceHbar: number;
}

/** Fetch account balance in HBAR. */
export async function fetchAccountBalance(accountId: string): Promise<AccountBalance> {
  const data = await mirrorGet<{ balance: { balance: number } }>(`/accounts/${accountId}`);
  return {
    accountId,
    balanceHbar: data.balance.balance / 1e8,
  };
}

/** HCS message from mirror node. */
export interface HcsMessage {
  sequenceNumber: number;
  consensusTimestamp: string;
  payerAccountId: string;
  content: Record<string, unknown>;
}

/** Fetch messages from an HCS topic, optionally after a given sequence number. */
export async function fetchTopicMessages(
  topicId: string,
  afterSequence?: number,
): Promise<HcsMessage[]> {
  const filter = afterSequence ? `?sequencenumber=gte:${afterSequence}` : '';
  const data = await mirrorGet<{
    messages: Array<{
      sequence_number: number;
      consensus_timestamp: string;
      payer_account_id: string;
      message: string;
    }>;
  }>(`/topics/${topicId}/messages${filter}`);

  return data.messages.map(msg => ({
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    payerAccountId: msg.payer_account_id,
    content: JSON.parse(atob(msg.message)),
  }));
}

/** Fetch task messages from the tasks HCS topic. */
export async function fetchTasks(afterSequence?: number): Promise<HcsMessage[]> {
  return fetchTopicMessages(C.tasksTopicId, afterSequence);
}

/** Fetch bid messages from the bids HCS topic. */
export async function fetchBids(afterSequence?: number): Promise<HcsMessage[]> {
  return fetchTopicMessages(C.bidsTopicId, afterSequence);
}

/** Fetch proof messages from the proofs HCS topic. */
export async function fetchProofs(afterSequence?: number): Promise<HcsMessage[]> {
  return fetchTopicMessages(C.proofsTopicId, afterSequence);
}

/** Check whether KYC has been granted for an account on a given token. */
export async function fetchKycGranted(
  tokenId: string,
  accountId: string,
): Promise<boolean> {
  try {
    const data = await mirrorGet<{
      balances: Array<{ account: string }>;
    }>(`/tokens/${tokenId}/balances?account.id=${accountId}`);
    return data.balances.length > 0;
  } catch {
    return false;
  }
}

/** Contract call result from mirror node. */
export interface ContractResult {
  timestamp: string;
  from: string;
  amount: number;
  result: string;
}

/** Fetch recent contract call results. */
export async function fetchContractResults(contractId: string): Promise<ContractResult[]> {
  const data = await mirrorGet<{
    results: Array<{
      timestamp: string;
      from: string;
      amount: number;
      result: string;
    }>;
  }>(`/contracts/${contractId}/results`);

  return data.results;
}
