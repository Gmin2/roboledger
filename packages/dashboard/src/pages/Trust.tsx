/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Trust Protocol page — ERC-8004 Reputation & Validation view.
 *
 * Displays the three on-chain registries (Identity, Reputation, Validation)
 * in a three-column layout.  Data is fetched live from the Hedera testnet
 * mirror node and smart contracts via the lib/ modules.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Fingerprint,
  Star,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { HEDERA_CONFIG } from '../lib/hedera-config';
import { fetchRobotNfts, fetchProofs } from '../lib/hedera-mirror';
import type { RobotNft, HcsMessage } from '../lib/hedera-mirror';
import { queryReputation } from '../lib/hedera-contracts';
import type { ReputationSummary } from '../lib/hedera-contracts';

/** Corner-bracket decorative box used throughout the HUD aesthetic. */
const CornerBracketBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('relative p-5', className)}>
    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40" />
    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />
    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/40" />
    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40" />
    {children}
  </div>
);

/** Inline loading spinner with optional label. */
const LoadingState = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex items-center gap-3 py-6 justify-center">
    <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
    <span className="text-[10px] text-white/30 tracking-widest uppercase">
      {label}
    </span>
  </div>
);

/** Inline error state. */
const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center gap-3 py-6 justify-center">
    <AlertTriangle className="w-4 h-4 text-red-400/60" />
    <span className="text-[10px] text-red-400/60 tracking-wider">
      {message}
    </span>
  </div>
);

/** HashScan link button used at the bottom of each column. */
const HashScanLink = ({ path, label }: { path: string; label: string }) => (
  <a
    href={`https://hashscan.io/testnet/${path}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 tracking-wider uppercase transition-colors duration-200 mt-1 group"
    style={{ transition: 'transform 160ms ease-out' }}
    onMouseDown={(e) => ((e.currentTarget.style.transform = 'scale(0.97)'))}
    onMouseUp={(e) => ((e.currentTarget.style.transform = 'scale(1)'))}
    onMouseLeave={(e) => ((e.currentTarget.style.transform = 'scale(1)'))}
  >
    <ExternalLink className="w-3 h-3" />
    {label}
  </a>
);

/** Identity data enriched with KYC status. */
interface IdentityEntry {
  serial: number;
  accountId: string;
  kycVerified: boolean;
}

/** Reputation data for a single robot. */
interface ReputationEntry {
  serial: number;
  accountId: string;
  count: number;
  totalScore: number;
  averageScore: number;
}

/** Column 1 — Identity Registry (fetches robot NFTs). */
const IdentityColumn = ({
  identities,
  loading,
  error,
}: {
  identities: IdentityEntry[];
  loading: boolean;
  error: string | null;
}) => (
  <CornerBracketBox className="bg-white/[0.02] flex flex-col gap-5">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="p-2 border border-white/10 rounded">
        <Fingerprint className="w-5 h-5 text-white/70" />
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-[0.25em] uppercase">
          Identity Registry
        </h3>
        <p className="text-[10px] text-white/30 tracking-wider mt-0.5">
          NFT-backed robot identities
        </p>
      </div>
    </div>

    {/* Summary */}
    {!loading && !error && (
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50 tracking-wider uppercase">
          {identities.length} robots registered
        </span>
        <span className="text-[10px] font-mono text-white/30 tracking-wider">
          Token {HEDERA_CONFIG.nftTokenId}
        </span>
      </div>
    )}

    <div className="w-full h-px bg-white/5" />

    {/* Loading / error / data */}
    {loading && <LoadingState label="Fetching robot NFTs..." />}
    {error && <ErrorState message={error} />}

    {!loading && !error && (
      <ul className="flex flex-col gap-3">
        {identities.map((id) => (
          <li
            key={id.serial}
            className="flex items-center justify-between py-2 px-3 bg-white/[0.02] border border-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <User className="w-3.5 h-3.5 text-white/30" />
              <div>
                <p className="text-xs font-mono tracking-wider">
                  Serial #{id.serial}
                </p>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">
                  {id.accountId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={cn(
                  'w-3 h-3',
                  id.kycVerified ? 'text-green-400' : 'text-white/20',
                )}
              />
              <span
                className={cn(
                  'text-[9px] uppercase tracking-widest font-medium',
                  id.kycVerified ? 'text-green-400/80' : 'text-white/20',
                )}
              >
                {id.kycVerified ? 'KYC' : 'PENDING'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    )}

    {/* HashScan link */}
    <HashScanLink
      path={`token/${HEDERA_CONFIG.nftTokenId}`}
      label="View on HashScan"
    />
  </CornerBracketBox>
);

/** Column 2 — Reputation Registry (queries smart contract per robot). */
const ReputationColumn = ({
  reputations,
  loading,
  error,
}: {
  reputations: ReputationEntry[];
  loading: boolean;
  error: string | null;
}) => (
  <CornerBracketBox className="bg-white/[0.02] flex flex-col gap-5">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="p-2 border border-white/10 rounded">
        <Star className="w-5 h-5 text-white/70" />
      </div>
      <div>
        <h3 className="text-sm font-bold tracking-[0.25em] uppercase">
          Reputation Registry
        </h3>
        <p className="text-[10px] text-white/30 tracking-wider mt-0.5">
          On-chain feedback scores
        </p>
      </div>
    </div>

    <div className="w-full h-px bg-white/5" />

    {/* Loading / error / data */}
    {loading && <LoadingState label="Querying reputation contract..." />}
    {error && <ErrorState message={error} />}

    {!loading && !error && (
      <ul className="flex flex-col gap-4">
        {reputations.map((rep) => (
          <li
            key={rep.serial}
            className="p-3 bg-white/[0.02] border border-white/[0.04] flex flex-col gap-3"
          >
            {/* Robot header + score */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono tracking-wider">
                  Unit-{String(rep.serial).padStart(3, '0')}
                </p>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">
                  {rep.accountId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tracking-wider">
                  {rep.averageScore}
                </p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  score
                </p>
              </div>
            </div>

            {/* Feedback summary or empty state */}
            {rep.count > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  {rep.count} feedback{rep.count !== 1 ? ' entries' : ' entry'}
                </p>
                <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest border border-white/10 text-white/50 bg-white/[0.03]">
                    taskSuccess
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    {rep.averageScore}/100
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-white/20 tracking-wider italic">
                No feedback yet
              </p>
            )}
          </li>
        ))}
      </ul>
    )}

    {/* HashScan link */}
    <HashScanLink
      path={`contract/${HEDERA_CONFIG.reputationContractId}`}
      label="View contract on HashScan"
    />
  </CornerBracketBox>
);

/** Column 3 — Validation Registry (fetches HCS proof stream). */
const ValidationColumn = ({
  proofs,
  loading,
  error,
}: {
  proofs: HcsMessage[];
  loading: boolean;
  error: string | null;
}) => {
  /** Count how many proofs have a truthy validation/approval field. */
  const approvedCount = proofs.filter(
    (p) => p.content?.type === 'proof_submit' || p.content?.proofCid,
  ).length;

  return (
    <CornerBracketBox className="bg-white/[0.02] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 border border-white/10 rounded">
          <ShieldCheck className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-[0.25em] uppercase">
            Validation Registry
          </h3>
          <p className="text-[10px] text-white/30 tracking-wider mt-0.5">
            HCS proof stream evidence
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* Loading / error / data */}
      {loading && <LoadingState label="Fetching proof stream..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && proofs.length === 0 && (
        <p className="text-[10px] text-white/20 tracking-wider italic py-4 text-center">
          No validation proofs recorded yet
        </p>
      )}

      {!loading && !error && proofs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {proofs.map((proof) => {
            const content = proof.content as Record<string, unknown>;
            const taskId = (content.taskId as string) ?? 'unknown';
            const proofType = (content.type as string) ?? 'proof';
            const robotId = (content.robotId as string) ?? proof.payerAccountId;

            return (
              <li
                key={proof.sequenceNumber}
                className="p-3 bg-white/[0.02] border border-white/[0.04] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs tracking-wider">
                      HCS #{proof.sequenceNumber}{' '}
                      <span className="font-mono text-white/30">
                        {proof.payerAccountId}
                      </span>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest border border-white/10 text-white/50 bg-white/[0.03]">
                    {proofType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-white/30 tracking-wider">
                  <Clock className="w-3 h-3" />
                  <span>
                    task{' '}
                    <span className="font-mono text-white/50">{taskId}</span>
                    {robotId !== proof.payerAccountId && (
                      <>
                        {' '}by{' '}
                        <span className="font-mono text-white/50">{robotId}</span>
                      </>
                    )}
                  </span>
                </div>

                {content.proofCid != null && (
                  <div className="text-[9px] font-mono text-white/20 truncate pl-5">
                    CID: {String(content.proofCid as string)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Threshold indicator */}
      {!loading && !error && proofs.length > 0 && (
        <>
          <div className="w-full h-px bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">
              Proof Evidence
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {proofs.map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]"
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-green-400/80 tracking-wider">
                {approvedCount}/{proofs.length} proofs
              </span>
            </div>
          </div>
        </>
      )}

      {/* HashScan link */}
      <HashScanLink
        path={`topic/${HEDERA_CONFIG.proofsTopicId}`}
        label="View proof topic on HashScan"
      />
    </CornerBracketBox>
  );
};

/** Trust Protocol page — ERC-8004 reputation & validation overview. */
export default function Trust() {
  /** Stagger delay between columns. */
  const columnDelay = 0.08;

  /** Identity state. */
  const [identities, setIdentities] = useState<IdentityEntry[]>([]);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);

  /** Reputation state. */
  const [reputations, setReputations] = useState<ReputationEntry[]>([]);
  const [repLoading, setRepLoading] = useState(true);
  const [repError, setRepError] = useState<string | null>(null);

  /** Validation state. */
  const [proofs, setProofs] = useState<HcsMessage[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [proofsError, setProofsError] = useState<string | null>(null);

  /** Fetch identity NFTs from the mirror node. */
  const loadIdentities = useCallback(async () => {
    setIdentityLoading(true);
    setIdentityError(null);
    try {
      const nfts: RobotNft[] = await fetchRobotNfts();
      setIdentities(
        nfts.map((nft) => ({
          serial: nft.serialNumber,
          accountId: nft.accountId,
          /** Holding the NFT implies KYC was granted on the HTS token. */
          kycVerified: true,
        })),
      );
    } catch (err) {
      setIdentityError(err instanceof Error ? err.message : 'Failed to fetch robot NFTs');
    } finally {
      setIdentityLoading(false);
    }
  }, []);

  /**
   * Fetch reputation data by querying the ReputationRegistry contract
   * for each known robot identity.
   */
  const loadReputations = useCallback(async (robots: IdentityEntry[]) => {
    setRepLoading(true);
    setRepError(null);
    try {
      const results: ReputationEntry[] = await Promise.all(
        robots.map(async (robot) => {
          try {
            const summary: ReputationSummary = await queryReputation(robot.accountId);
            return {
              serial: robot.serial,
              accountId: robot.accountId,
              count: summary.count,
              totalScore: summary.totalScore,
              averageScore: summary.averageScore,
            };
          } catch {
            /** If a single query fails, show zeroes rather than failing everything. */
            return {
              serial: robot.serial,
              accountId: robot.accountId,
              count: 0,
              totalScore: 0,
              averageScore: 0,
            };
          }
        }),
      );
      setReputations(results);
    } catch (err) {
      setRepError(err instanceof Error ? err.message : 'Failed to query reputation contract');
    } finally {
      setRepLoading(false);
    }
  }, []);

  /** Fetch HCS proof messages as validation evidence. */
  const loadProofs = useCallback(async () => {
    setProofsLoading(true);
    setProofsError(null);
    try {
      const messages = await fetchProofs();
      setProofs(messages);
    } catch (err) {
      setProofsError(err instanceof Error ? err.message : 'Failed to fetch proof stream');
    } finally {
      setProofsLoading(false);
    }
  }, []);

  /** Bootstrap all three data streams on mount. */
  useEffect(() => {
    loadIdentities();
    loadProofs();
  }, [loadIdentities, loadProofs]);

  /**
   * Once identities are loaded, fire off reputation queries.
   * This depends on identities so it runs as a separate effect.
   */
  useEffect(() => {
    if (identities.length > 0) {
      loadReputations(identities);
    } else if (!identityLoading) {
      setRepLoading(false);
    }
  }, [identities, identityLoading, loadReputations]);

  return (
    <div className="w-full text-white font-sans selection:bg-white/20">
      {/* Page header */}
      <header className="px-12 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-6 h-6 text-white/50" />
            <h1 className="text-2xl font-bold tracking-[0.35em] uppercase">
              Trust Protocol
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2 ml-10">
            <span className="w-8 h-px bg-white/20" />
            <span className="text-[10px] text-white/30 tracking-widest uppercase">
              ERC-8004 for Physical Robots
            </span>
          </div>
        </motion.div>
      </header>

      {/* Three-column registry layout */}
      <main className="px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0 * columnDelay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <IdentityColumn
              identities={identities}
              loading={identityLoading}
              error={identityError}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 1 * columnDelay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <ReputationColumn
              reputations={reputations}
              loading={repLoading}
              error={repError}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 2 * columnDelay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <ValidationColumn
              proofs={proofs}
              loading={proofsLoading}
              error={proofsError}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
