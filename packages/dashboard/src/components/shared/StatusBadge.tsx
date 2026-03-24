/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * StatusBadge
 *
 * A compact status pill with a dot indicator and label. Uses subtle color
 * tints over the monochrome palette to communicate state without breaking
 * the HUD aesthetic.
 */

import { cn } from '../../lib/utils';

type Status =
  | 'active'
  | 'idle'
  | 'frozen'
  | 'open'
  | 'assigned'
  | 'completed'
  | 'refunded';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/**
 * Color map for each status. Keeps colors muted to stay monochrome-ish:
 * mostly white opacity with a subtle hue hint via the dot and background.
 */
const statusStyles: Record<Status, { dot: string; bg: string; text: string }> = {
  active: {
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-300/90',
  },
  completed: {
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-300/90',
  },
  idle: {
    dot: 'bg-white/50',
    bg: 'bg-white/5',
    text: 'text-white/60',
  },
  open: {
    dot: 'bg-white/70',
    bg: 'bg-white/5',
    text: 'text-white/80',
  },
  assigned: {
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]',
    bg: 'bg-amber-400/10',
    text: 'text-amber-300/90',
  },
  frozen: {
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]',
    bg: 'bg-red-400/10',
    text: 'text-red-300/90',
  },
  refunded: {
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]',
    bg: 'bg-red-400/10',
    text: 'text-red-300/90',
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = statusStyles[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest',
        styles.bg,
        styles.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {status}
    </span>
  );
}
