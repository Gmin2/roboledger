/**
 * Hedera testnet configuration loaded from Vite environment variables.
 *
 * All values come from `import.meta.env.VITE_*` which Vite injects
 * at build time from the `.env` file in the dashboard package root.
 * This keeps keys out of committed source code.
 */

/** Read a required Vite env var or throw at startup. */
function env(key: string): string {
  const val = import.meta.env[key];
  if (!val) throw new Error(`Missing env var: ${key}. Add it to packages/dashboard/.env`);
  return val as string;
}

export const HEDERA_CONFIG = {
  /** Operator account that pays for transactions. */
  operatorId: env('VITE_OPERATOR_ID'),
  operatorKey: env('VITE_OPERATOR_KEY'),

  /** Robot accounts with Ed25519 keys. */
  robot1Id: env('VITE_ROBOT1_ID'),
  robot1Key: env('VITE_ROBOT1_KEY'),
  robot3Id: env('VITE_ROBOT3_ID'),
  robot3Key: env('VITE_ROBOT3_KEY'),

  /** HCS topic IDs. */
  tasksTopicId: env('VITE_TASKS_TOPIC_ID'),
  bidsTopicId: env('VITE_BIDS_TOPIC_ID'),
  proofsTopicId: env('VITE_PROOFS_TOPIC_ID'),

  /** Smart contract IDs. */
  escrowContractId: env('VITE_ESCROW_CONTRACT_ID'),
  reputationContractId: env('VITE_REPUTATION_CONTRACT_ID'),

  /** NFT token. */
  nftTokenId: env('VITE_NFT_TOKEN_ID'),

  /** Mirror node base URL. */
  mirrorBaseUrl: import.meta.env.VITE_MIRROR_BASE_URL || 'https://testnet.mirrornode.hedera.com/api/v1',
} as const;
