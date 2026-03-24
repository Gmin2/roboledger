/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tasks.tsx — Task Marketplace page for the RoboLedger dashboard.
 *
 * Displays a "Post Task" form on the left and an "Active Tasks" feed on the
 * right.  Task and bid data is fetched live from the Hedera testnet mirror
 * node via the lib/hedera-mirror helpers, with a 10-second auto-refresh.
 * The layout follows the HUD / military-tech aesthetic established in Hero.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Truck,
  TreePine,
  Home,
  ScanSearch,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { fetchTasks, fetchBids, fetchProofs, type HcsMessage } from '../lib/hedera-mirror';

/** Auto-refresh interval in milliseconds. */
const REFRESH_INTERVAL_MS = 10_000;

/** Corner-bracket button with active press scale. */
const CornerBracketButton = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'relative px-8 py-3 group text-white font-medium tracking-widest text-sm uppercase transition-all duration-[160ms] ease-out hover:bg-white/5 active:scale-[0.97]',
      className,
    )}
  >
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 transition-colors group-hover:border-white" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50 transition-colors group-hover:border-white" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50 transition-colors group-hover:border-white" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 transition-colors group-hover:border-white" />
    {children}
  </button>
);

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

/** Requirement tag config for the post-task form. */
const REQUIREMENT_OPTIONS = [
  { key: 'delivery', label: 'Delivery', Icon: Truck },
  { key: 'outdoor', label: 'Outdoor', Icon: TreePine },
  { key: 'indoor', label: 'Indoor', Icon: Home },
  { key: 'inspection', label: 'Inspection', Icon: ScanSearch },
] as const;

type RequirementKey = (typeof REQUIREMENT_OPTIONS)[number]['key'];

/** Normalised task assembled from HCS messages. */
interface LiveTask {
  id: string;
  requirements: string[];
  reward: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  bids: LiveBid[];
  assignedRobot?: string;
  validations: { current: number; required: number };
  consensusTimestamp: string;
}

/** A single bid matched to a task. */
interface LiveBid {
  robotId: string;
  hcsSequence: number;
  timestamp: string;
  amount: number;
}

/**
 * Derive task status from HCS message content.
 *
 * The `type` field in the task message body determines the lifecycle stage.
 * Additional assignment and completion signals come from bid/proof messages.
 */
function deriveStatus(
  taskContent: Record<string, unknown>,
  bidCount: number,
  assignedRobot: string | undefined,
  validationsCurrent: number,
  validationsRequired: number,
): LiveTask['status'] {
  const msgType = String(taskContent.type ?? '').toLowerCase();

  if (msgType === 'task_completed' || msgType === 'completed') return 'COMPLETED';
  if (validationsRequired > 0 && validationsCurrent >= validationsRequired) return 'COMPLETED';
  if (msgType === 'task_assigned' || msgType === 'in_progress' || assignedRobot) return 'IN_PROGRESS';
  if (bidCount > 0) return 'IN_PROGRESS';

  return 'OPEN';
}

/**
 * Assemble LiveTask objects from raw HCS task, bid, and proof messages.
 *
 * Tasks are keyed by their `taskId` field in the message content.
 * Bids and proofs are matched to their parent task by the same field.
 */
function assembleTasks(
  taskMsgs: HcsMessage[],
  bidMsgs: HcsMessage[],
  proofMsgs: HcsMessage[],
): LiveTask[] {
  /** Map taskId -> latest task HCS message content. */
  const taskMap = new Map<
    string,
    { content: Record<string, unknown>; timestamp: string }
  >();

  for (const msg of taskMsgs) {
    const c = msg.content;
    const taskId = String(c.taskId ?? c.task_id ?? c.id ?? '');
    if (!taskId) continue;
    /** Keep the latest message per taskId (higher sequence = newer). */
    const existing = taskMap.get(taskId);
    if (!existing || msg.consensusTimestamp > existing.timestamp) {
      taskMap.set(taskId, { content: c, timestamp: msg.consensusTimestamp });
    }
  }

  /** Map taskId -> bids. */
  const bidsByTask = new Map<string, LiveBid[]>();
  for (const msg of bidMsgs) {
    const c = msg.content;
    const taskId = String(c.taskId ?? c.task_id ?? '');
    if (!taskId) continue;
    const bid: LiveBid = {
      robotId: String(c.robotId ?? c.robot_id ?? c.bidder ?? msg.payerAccountId),
      hcsSequence: msg.sequenceNumber,
      timestamp: msg.consensusTimestamp,
      amount: Number(c.amount ?? c.bid ?? c.price ?? 0),
    };
    const arr = bidsByTask.get(taskId) ?? [];
    arr.push(bid);
    bidsByTask.set(taskId, arr);
  }

  /** Map taskId -> proof/validation count. */
  const proofsByTask = new Map<string, number>();
  for (const msg of proofMsgs) {
    const c = msg.content;
    const taskId = String(c.taskId ?? c.task_id ?? '');
    if (!taskId) continue;
    proofsByTask.set(taskId, (proofsByTask.get(taskId) ?? 0) + 1);
  }

  /** Build the final task array. */
  const tasks: LiveTask[] = [];
  for (const [taskId, { content, timestamp }] of taskMap) {
    const bids = bidsByTask.get(taskId) ?? [];
    const requirements = Array.isArray(content.requirements)
      ? (content.requirements as string[])
      : typeof content.requirements === 'string'
        ? [content.requirements as string]
        : [];
    const reward = Number(content.reward ?? content.amount ?? content.bounty ?? 0);
    const validationsRequired = Number(content.validationsRequired ?? content.validations ?? 2);
    const validationsCurrent = proofsByTask.get(taskId) ?? 0;
    const assignedRobot = content.assignedRobot
      ? String(content.assignedRobot)
      : content.assigned_robot
        ? String(content.assigned_robot)
        : undefined;

    const status = deriveStatus(content, bids.length, assignedRobot, validationsCurrent, validationsRequired);

    tasks.push({
      id: taskId,
      requirements,
      reward,
      status,
      bids,
      assignedRobot,
      validations: { current: validationsCurrent, required: validationsRequired },
      consensusTimestamp: timestamp,
    });
  }

  /** Most recent tasks first. */
  tasks.sort((a, b) => b.consensusTimestamp.localeCompare(a.consensusTimestamp));
  return tasks;
}

/** Requirement tag pill — renders for known keys, falls back to plain text. */
const RequirementTag = ({ reqKey }: { reqKey: string }) => {
  const opt = REQUIREMENT_OPTIONS.find((r) => r.key === reqKey);
  const Icon = opt?.Icon;
  const label = opt?.label ?? reqKey;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-wider uppercase border border-white/20 text-white/70 rounded-sm">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

/** Coloured status badge. */
const StatusBadge = ({ status }: { status: LiveTask['status'] }) => {
  const map: Record<LiveTask['status'], { bg: string; text: string }> = {
    OPEN: { bg: 'bg-white/10', text: 'text-white/80' },
    IN_PROGRESS: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    COMPLETED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] tracking-widest font-semibold uppercase rounded-sm',
        s.bg,
        s.text,
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

/** Thin validation progress bar with fraction label. */
const ValidationBar = ({
  current,
  required,
}: {
  current: number;
  required: number;
}) => {
  const pct = required === 0 ? 100 : (current / required) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400/80 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-white/50 tracking-wider font-mono">
        {current}/{required}
      </span>
    </div>
  );
};

/** Expandable task card with bid details. */
const TaskCard = ({ task, index }: { task: LiveTask; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
    >
      <CornerBracketBox className="mb-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
        {/* Header row */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full text-left flex items-start justify-between gap-4 transition-all duration-[160ms] ease-out active:scale-[0.97]"
        >
          <div className="flex-1 min-w-0">
            {/* ID + status */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-white/60 truncate max-w-[180px]">
                {task.id}
              </span>
              <StatusBadge status={task.status} />
            </div>

            {/* Requirement tags */}
            {task.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.requirements.map((r) => (
                  <RequirementTag key={r} reqKey={r} />
                ))}
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {task.reward} HBAR
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.bids.length} bid{task.bids.length !== 1 ? 's' : ''}
              </span>
              {task.assignedRobot && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/70" />
                  {task.assignedRobot}
                </span>
              )}
            </div>

            {/* Validation bar */}
            <div className="mt-2 max-w-xs">
              <ValidationBar
                current={task.validations.current}
                required={task.validations.required}
              />
            </div>
          </div>

          {/* Expand chevron */}
          <div className="text-white/30 mt-1">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {/* Expanded bid details */}
        <AnimatePresence>
          {expanded && task.bids.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="text-[10px] text-white/40 tracking-widest uppercase mb-2 block">
                  Bids
                </span>
                {task.bids.map((bid, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-1.5 text-[11px] font-mono text-white/60"
                  >
                    <span className="text-white/30 w-8 text-right">
                      #{bid.hcsSequence}
                    </span>
                    <span className="text-white/70">{bid.robotId}</span>
                    <span className="text-white/40">
                      {bid.amount} HBAR
                    </span>
                    <span className="text-white/25 ml-auto text-[10px]">
                      {new Date(bid.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CornerBracketBox>
    </motion.div>
  );
};

/** Visual-only Post Task form (no actual HCS submission). */
const PostTaskForm = () => {
  const [requirements, setRequirements] = useState<Set<RequirementKey>>(
    new Set(),
  );
  const [reward, setReward] = useState<number>(5);
  const [validations, setValidations] = useState<number>(2);
  const [deadline, setDeadline] = useState<string>('30');
  const taskId = `task-${Date.now()}`;

  const toggle = (key: RequirementKey) => {
    setRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <CornerBracketBox className="bg-white/[0.02]">
        <h3 className="text-[11px] tracking-[0.3em] uppercase text-white/40 mb-6">
          Post Task
        </h3>

        {/* Task ID */}
        <div className="mb-5">
          <label className="block text-[10px] tracking-widest uppercase text-white/30 mb-1.5">
            Task ID
          </label>
          <input
            readOnly
            value={taskId}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white/50 outline-none cursor-default"
          />
        </div>

        {/* Requirements */}
        <div className="mb-5">
          <label className="block text-[10px] tracking-widest uppercase text-white/30 mb-2">
            Requirements
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REQUIREMENT_OPTIONS.map(({ key, label, Icon }) => {
              const active = requirements.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-[11px] tracking-wider uppercase border rounded-sm transition-all duration-[160ms] ease-out active:scale-[0.97]',
                    active
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 bg-transparent text-white/40 hover:border-white/20 hover:text-white/60',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reward */}
        <div className="mb-5">
          <label className="block text-[10px] tracking-widest uppercase text-white/30 mb-1.5">
            Reward (HBAR)
          </label>
          <input
            type="number"
            min={0}
            value={reward}
            onChange={(e) => setReward(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white/80 outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Required validations */}
        <div className="mb-5">
          <label className="block text-[10px] tracking-widest uppercase text-white/30 mb-2">
            Required Validations
          </label>
          <div className="flex gap-2">
            {[0, 1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setValidations(n)}
                className={cn(
                  'w-10 h-10 flex items-center justify-center text-xs font-mono border rounded-sm transition-all duration-[160ms] ease-out active:scale-[0.97]',
                  validations === n
                    ? 'border-white/40 bg-white/10 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div className="mb-8">
          <label className="block text-[10px] tracking-widest uppercase text-white/30 mb-1.5">
            Deadline
          </label>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white/80 outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
          >
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>

        {/* Submit */}
        <CornerBracketButton className="w-full text-center">
          Create Task
        </CornerBracketButton>
      </CornerBracketBox>
    </motion.div>
  );
};

/**
 * Task Marketplace page — post tasks and browse the live HCS feed.
 *
 * Renders inside Shell, so no bg-black/min-h-screen wrapper is needed.
 * Fetches tasks, bids, and proofs from the Hedera mirror node on mount
 * and every 10 seconds thereafter.
 */
export default function Tasks() {
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  /** Fetch all HCS data and assemble the task list. */
  const refresh = useCallback(async () => {
    try {
      const [taskMsgs, bidMsgs, proofMsgs] = await Promise.all([
        fetchTasks(),
        fetchBids(),
        fetchProofs(),
      ]);
      setTasks(assembleTasks(taskMsgs, bidMsgs, proofMsgs));
      setError(null);
    } catch (err) {
      console.error('[Tasks] mirror node fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      if (initialLoad.current) {
        setLoading(false);
        initialLoad.current = false;
      }
    }
  }, []);

  /** Initial fetch + 10-second polling interval. */
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="w-full text-white font-sans selection:bg-white/20">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-10 pt-10 pb-6"
      >
        <h1 className="text-2xl font-bold tracking-[0.4em] uppercase">
          Task Marketplace
        </h1>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-white/40 to-transparent" />
      </motion.div>

      {/* Two-column layout */}
      <div className="px-10 pb-16 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left: Post Task form */}
        <PostTaskForm />

        {/* Right: Active Tasks feed */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-3 mb-4"
          >
            <Clock className="w-4 h-4 text-white/40" />
            <h3 className="text-[11px] tracking-[0.3em] uppercase text-white/40">
              Active Tasks
            </h3>
            <span className="text-[10px] font-mono text-white/25 ml-auto">
              {loading ? '...' : `${tasks.length} total`}
            </span>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-6 h-6 text-white/30 animate-spin mb-3" />
              <span className="text-[11px] tracking-widest uppercase text-white/30">
                Fetching HCS messages...
              </span>
            </motion.div>
          )}

          {/* Error state */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CornerBracketBox className="bg-red-500/5 mb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400/70 shrink-0" />
                  <div>
                    <span className="text-[11px] tracking-wider uppercase text-red-400/80 block mb-0.5">
                      Mirror Node Error
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {error}
                    </span>
                  </div>
                </div>
              </CornerBracketBox>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !error && tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Clock className="w-6 h-6 text-white/15 mb-3" />
              <span className="text-[11px] tracking-widest uppercase text-white/25">
                No tasks on the ledger yet
              </span>
              <span className="text-[10px] text-white/15 mt-1">
                Post a task to get started
              </span>
            </motion.div>
          )}

          {/* Task cards */}
          {!loading &&
            tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
        </div>
      </div>
    </div>
  );
}
