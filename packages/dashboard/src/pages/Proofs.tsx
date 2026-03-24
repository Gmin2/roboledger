/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Proofs.tsx — Real-time Proof Stream page for the RoboLedger dashboard.
 *
 * Renders a scrolling timeline of HCS proof entries (newest at top).
 * Each entry displays a consensus timestamp, robot/task IDs, waypoint
 * label, GPS coordinates, evidence hashes and the HCS sequence number.
 * Data is fetched live from the Hedera mirror node via lib/hedera-mirror
 * and auto-refreshed every 10 seconds.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Radio, MapPin, Hash, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { fetchProofs, type HcsMessage } from '../lib/hedera-mirror';

/** Polling interval for new proofs (ms). */
const POLL_INTERVAL_MS = 10_000;

/** Corner-bracket wrapper box. */
const CornerBracketBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('relative p-4', className)}>
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40" />
    {children}
  </div>
);

/** Shape of a parsed proof entry for the UI. */
interface ProofEntry {
  /** HCS consensus timestamp (seconds.nanoseconds). */
  consensusTimestamp: string;
  /** HCS sequence number. */
  hcsSequence: number;
  robotId: string;
  taskId: string;
  /** Human-readable waypoint label. */
  waypoint: string;
  /** Waypoint index, e.g. "2/3". */
  waypointIndex: string;
  gps: { lat: number; lng: number };
  hashes: {
    gps_hash: string;
    sensor_hash: string;
    photo_hash: string;
  };
}

/**
 * Parse an HcsMessage into a ProofEntry for rendering.
 *
 * The HCS message content JSON is expected to carry fields produced by
 * the robot proof publisher: robot_id, task_id, waypoint, waypoint_index,
 * gps ({lat, lng}), and hashes ({gps_hash, sensor_hash, photo_hash}).
 * Missing fields are given safe defaults so the UI never crashes.
 */
function parseProof(msg: HcsMessage): ProofEntry {
  const c = msg.content as Record<string, unknown>;
  const gpsRaw = (c.gps ?? {}) as Record<string, unknown>;
  const hashesRaw = (c.hashes ?? {}) as Record<string, unknown>;

  return {
    consensusTimestamp: msg.consensusTimestamp,
    hcsSequence: msg.sequenceNumber,
    robotId: String(c.robot_id ?? c.robotId ?? 'unknown'),
    taskId: String(c.task_id ?? c.taskId ?? 'unknown'),
    waypoint: String(c.waypoint ?? 'Unknown'),
    waypointIndex: String(c.waypoint_index ?? c.waypointIndex ?? '?/?'),
    gps: {
      lat: Number(gpsRaw.lat ?? 0),
      lng: Number(gpsRaw.lng ?? gpsRaw.lon ?? 0),
    },
    hashes: {
      gps_hash: String(hashesRaw.gps_hash ?? '—'),
      sensor_hash: String(hashesRaw.sensor_hash ?? '—'),
      photo_hash: String(hashesRaw.photo_hash ?? '—'),
    },
  };
}

/** Blinking LIVE indicator shown when polling is active. */
const LiveIndicator = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-2">
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full h-2.5 w-2.5',
          active ? 'bg-emerald-500' : 'bg-white/20',
        )}
      />
    </span>
    <span
      className={cn(
        'text-[10px] tracking-[0.3em] uppercase font-medium',
        active ? 'text-emerald-400/80 animate-pulse' : 'text-white/30',
      )}
    >
      {active ? 'Live' : 'Paused'}
    </span>
  </div>
);

/** Single proof entry in the timeline. */
const ProofCard = ({
  proof,
  index,
}: {
  proof: ProofEntry;
  index: number;
}) => {
  /** Determine waypoint color accent based on label. */
  const waypointColor =
    proof.waypoint === 'Delivered'
      ? 'text-emerald-400'
      : proof.waypoint === 'En route'
        ? 'text-amber-400'
        : 'text-sky-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      className="relative pl-8 pb-8 group"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-3 h-3 rounded-full border border-white/30 bg-black flex items-center justify-center z-10">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            proof.waypoint === 'Delivered' ? 'bg-emerald-400' : 'bg-white/40',
          )}
        />
      </div>

      <CornerBracketBox className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
        {/* Top row: timestamp + HCS sequence badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-white/30 tracking-wider">
            {proof.consensusTimestamp}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 rounded-sm text-white/50">
            <Hash className="w-3 h-3" />
            {proof.hcsSequence}
          </span>
        </div>

        {/* Robot + Task IDs */}
        <div className="flex items-center gap-3 mb-2 text-[11px]">
          <span className="text-white/70 font-medium">{proof.robotId}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/40 font-mono truncate max-w-[200px]">
            {proof.taskId}
          </span>
        </div>

        {/* Waypoint label */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className={cn('w-3.5 h-3.5', waypointColor)} />
          <span
            className={cn(
              'text-sm font-semibold tracking-wider uppercase',
              waypointColor,
            )}
          >
            {proof.waypoint}
          </span>
          <span className="text-[10px] text-white/25 font-mono ml-1">
            WP {proof.waypointIndex}
          </span>
        </div>

        {/* GPS coordinates */}
        <div className="flex items-center gap-2 mb-3 text-[11px] font-mono text-white/40">
          <Radio className="w-3 h-3 text-white/25" />
          <span>
            {proof.gps.lat.toFixed(4)}, {proof.gps.lng.toFixed(4)}
          </span>
        </div>

        {/* Evidence hashes */}
        <div className="space-y-1">
          {Object.entries(proof.hashes).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-2 text-[10px] font-mono"
            >
              <ShieldCheck className="w-3 h-3 text-white/15 flex-shrink-0" />
              <span className="text-white/25 w-20 truncate">{key}</span>
              <span className="text-white/40 truncate">{val}</span>
            </div>
          ))}
        </div>
      </CornerBracketBox>
    </motion.div>
  );
};

/** Proof Stream page — immutable evidence recorded on Hedera Consensus Service. */
export default function Proofs() {
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling] = useState(true);

  /**
   * Track the highest sequence number we have seen so far.
   * On subsequent polls we request only messages after this sequence,
   * avoiding re-fetching the entire history each time.
   */
  const lastSequenceRef = useRef<number | undefined>(undefined);

  /** Fetch proofs from the mirror node and merge into state. */
  const loadProofs = useCallback(async (isInitial: boolean) => {
    try {
      const messages = await fetchProofs(
        lastSequenceRef.current != null
          ? lastSequenceRef.current + 1
          : undefined,
      );

      if (messages.length > 0) {
        const parsed = messages.map(parseProof);

        /** Update the high-water mark. */
        const maxSeq = Math.max(...parsed.map(p => p.hcsSequence));
        if (lastSequenceRef.current == null || maxSeq > lastSequenceRef.current) {
          lastSequenceRef.current = maxSeq;
        }

        setProofs(prev => {
          /** Merge new entries, deduplicate by sequence, sort newest first. */
          const existing = new Map(prev.map(p => [p.hcsSequence, p]));
          for (const p of parsed) {
            existing.set(p.hcsSequence, p);
          }
          return Array.from(existing.values()).sort(
            (a, b) => b.hcsSequence - a.hcsSequence,
          );
        });
      }

      if (isInitial) setError(null);
    } catch (err) {
      console.error('[Proofs] fetch error:', err);
      if (isInitial) {
        setError(err instanceof Error ? err.message : 'Failed to load proofs');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  /** Initial fetch on mount. */
  useEffect(() => {
    loadProofs(true);
  }, [loadProofs]);

  /** Auto-refresh polling every POLL_INTERVAL_MS. */
  useEffect(() => {
    if (!polling) return;

    const id = setInterval(() => {
      loadProofs(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [polling, loadProofs]);

  return (
    <div className="w-full text-white font-sans selection:bg-white/20">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-10 pt-10 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.4em] uppercase">
              Proof Stream
            </h1>
            <p className="text-[11px] tracking-[0.2em] text-white/40 mt-1 uppercase">
              Immutable Evidence on Hedera Consensus Service
            </p>
          </div>
          <LiveIndicator active={polling} />
        </div>
        <div className="mt-3 h-px w-32 bg-gradient-to-r from-white/40 to-transparent" />
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
          <span className="ml-3 text-sm text-white/30 tracking-wider uppercase">
            Loading proofs...
          </span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="px-10 py-12">
          <CornerBracketBox className="bg-red-500/5 max-w-lg">
            <p className="text-sm text-red-400 font-mono">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                lastSequenceRef.current = undefined;
                loadProofs(true);
              }}
              className="mt-3 text-[11px] tracking-wider uppercase text-white/50 hover:text-white/80 transition-colors"
            >
              Retry
            </button>
          </CornerBracketBox>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && proofs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <ShieldCheck className="w-8 h-8 mb-3 text-white/15" />
          <p className="text-sm tracking-wider uppercase">
            No proofs recorded yet
          </p>
          <p className="text-[11px] text-white/20 mt-1">
            Waiting for HCS messages...
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && proofs.length > 0 && (
        <div className="px-10 pt-6 pb-16 max-w-3xl">
          <div className="relative">
            {/* The continuous timeline connector */}
            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/[0.08]" />

            <AnimatePresence initial={false}>
              {proofs.map((proof, i) => (
                <ProofCard key={proof.hcsSequence} proof={proof} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
