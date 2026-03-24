/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fleet Registry page — robot fleet dashboard.
 *
 * Renders a grid of robot cards showing serial numbers, account IDs,
 * capabilities, KYC status, HBAR balance, reputation score, and task
 * statistics.  All data is fetched live from the Hedera testnet
 * mirror node and on-chain contracts via the lib/ modules.
 */

import React, { useEffect, useState } from 'react';
import { Bot, Cpu, CheckCircle2, Wallet, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  fetchRobotNfts,
  fetchAccountBalance,
  fetchKycGranted,
  type RobotNft,
} from '../lib/hedera-mirror';
import { queryReputation } from '../lib/hedera-contracts';
import { HEDERA_CONFIG } from '../lib/hedera-config';

/** Corner-bracket decorative box used throughout the HUD aesthetic. */
const CornerBracketBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('relative p-4', className)}>
    <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40" />
    <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />
    <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/40" />
    <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40" />
    {children}
  </div>
);

/** Small circular progress ring reused from the Hero component. */
const CircularProgress = ({
  value,
  size = 64,
}: {
  value: number;
  size?: number;
}) => {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="text-xs font-bold tracking-wider z-10">
        {value}%
      </span>
    </div>
  );
};

/** Enriched robot data assembled from multiple API sources. */
interface RobotData {
  serial: number;
  accountId: string;
  capabilities: string[];
  kycVerified: boolean;
  balanceHbar: number;
  reputationPct: number;
  tasksCompleted: number;
  tasksFailed: number;
  status: 'active' | 'idle';
}

/** Individual fleet card for a single robot. */
const RobotCard = ({
  robot,
  index,
}: {
  robot: RobotData;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.5,
      delay: index * 0.05,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    <CornerBracketBox className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300 flex flex-col gap-5">
      {/* Header row: serial + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-white/10 rounded">
            <Bot className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest">
              UNIT&ndash;{String(robot.serial).padStart(3, '0')}
            </p>
            <p className="text-[10px] font-mono text-white/40 tracking-wider mt-0.5">
              {robot.accountId}
            </p>
          </div>
        </div>

        {/* Status dot */}
        <span
          className={cn(
            'flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium',
            robot.status === 'active' ? 'text-white/80' : 'text-white/30',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              robot.status === 'active'
                ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                : 'bg-white/20',
            )}
          />
          {robot.status}
        </span>
      </div>

      {/* Capability tags */}
      <div className="flex flex-wrap gap-2">
        {robot.capabilities.map((cap) => (
          <span
            key={cap}
            className="px-2.5 py-0.5 text-[10px] uppercase tracking-widest border border-white/10 text-white/50 bg-white/[0.03]"
          >
            {cap}
          </span>
        ))}
      </div>

      {/* KYC badge */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        <span className="text-[10px] uppercase tracking-widest text-green-400/80 font-medium">
          {robot.kycVerified ? 'VERIFIED' : 'UNVERIFIED'}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/5" />

      {/* Balance + Reputation row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-white/30" />
          <span className="text-sm font-mono tracking-wider">
            {robot.balanceHbar.toFixed(2)}{' '}
            <span className="text-white/30 text-[10px]">HBAR</span>
          </span>
        </div>

        <CircularProgress value={robot.reputationPct} size={56} />
      </div>

      {/* Task stats */}
      <div className="flex items-center gap-2 text-[10px] text-white/40 tracking-wider">
        <Activity className="w-3 h-3" />
        <span>
          <span className="text-white/70">{robot.tasksCompleted}</span> completed,{' '}
          <span className="text-white/70">{robot.tasksFailed}</span> failed
        </span>
      </div>
    </CornerBracketBox>
  </motion.div>
);

/**
 * Enrich a raw NFT record with balance, KYC, and reputation data.
 *
 * Fetches from multiple sources in parallel and assembles a complete
 * RobotData object for the card grid.
 */
async function enrichRobot(nft: RobotNft): Promise<RobotData> {
  const meta = nft.metadata as { robot?: number; capabilities?: string[] };

  const [balance, kyc, reputation] = await Promise.all([
    fetchAccountBalance(nft.accountId).catch(() => ({ balanceHbar: 0 })),
    fetchKycGranted(HEDERA_CONFIG.nftTokenId, nft.accountId),
    queryReputation(nft.accountId).catch(() => ({
      count: 0,
      totalScore: 0,
      averageScore: 0,
    })),
  ]);

  /** Derive a 0-100 reputation percentage from the contract summary. */
  const reputationPct = reputation.count > 0
    ? Math.min(100, Math.max(0, reputation.averageScore))
    : 0;

  return {
    serial: nft.serialNumber,
    accountId: nft.accountId,
    capabilities: meta.capabilities ?? [],
    kycVerified: kyc,
    balanceHbar: balance.balanceHbar,
    reputationPct,
    tasksCompleted: reputation.count,
    tasksFailed: 0,
    status: reputation.count > 0 ? 'active' : 'idle',
  };
}

/** Fleet Registry page — lists all registered robots in the fleet. */
export default function Fleet() {
  const [fleet, setFleet] = useState<RobotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFleet() {
      try {
        setLoading(true);
        setError(null);

        const nfts = await fetchRobotNfts();
        const enriched = await Promise.all(nfts.map(enrichRobot));

        if (!cancelled) {
          setFleet(enriched);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load fleet data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFleet();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full text-white font-sans selection:bg-white/20">
      {/* Page header */}
      <header className="px-12 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4"
        >
          <Cpu className="w-6 h-6 text-white/50" />
          <div>
            <h1 className="text-2xl font-bold tracking-[0.35em] uppercase">
              Fleet Registry
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="w-8 h-px bg-white/20" />
              <span className="text-[10px] text-white/30 tracking-widest uppercase">
                {loading ? 'loading\u2026' : `${fleet.length} units registered`}
              </span>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Content area */}
      <main className="px-12 pb-16">
        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-white/40 py-20 justify-center"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm tracking-widest uppercase">
              Loading fleet...
            </span>
          </motion.div>
        )}

        {/* Error state */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CornerBracketBox className="bg-red-500/[0.05] border border-red-500/10 max-w-lg mx-auto">
              <p className="text-sm text-red-400/80 tracking-wider text-center">
                {error}
              </p>
            </CornerBracketBox>
          </motion.div>
        )}

        {/* Robot card grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleet.map((robot, i) => (
              <RobotCard key={robot.serial} robot={robot} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
