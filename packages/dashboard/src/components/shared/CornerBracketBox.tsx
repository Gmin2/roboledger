/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CornerBracketBox
 *
 * A container with corner bracket accents at each corner, matching the
 * HUD/military-tech aesthetic. Used throughout the dashboard for framing
 * content panels, cards, and data sections.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface CornerBracketBoxProps {
  children: React.ReactNode;
  className?: string;
  /** Border opacity variant. Default uses white/40 borders. */
  variant?: 'default' | 'bright' | 'subtle';
}

const borderMap = {
  default: 'border-white/40',
  bright: 'border-white/60',
  subtle: 'border-white/20',
} as const;

export default function CornerBracketBox({
  children,
  className,
  variant = 'default',
}: CornerBracketBoxProps) {
  const border = borderMap[variant];

  return (
    <div className={cn('relative p-2', className)}>
      <span className={cn('absolute top-0 left-0 w-2 h-2 border-t border-l', border)} />
      <span className={cn('absolute top-0 right-0 w-2 h-2 border-t border-r', border)} />
      <span className={cn('absolute bottom-0 left-0 w-2 h-2 border-b border-l', border)} />
      <span className={cn('absolute bottom-0 right-0 w-2 h-2 border-b border-r', border)} />
      {children}
    </div>
  );
}
