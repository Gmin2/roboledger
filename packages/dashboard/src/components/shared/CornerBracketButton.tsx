/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CornerBracketButton
 *
 * A button with corner bracket accents that glow on hover, matching the
 * HUD/military-tech design language. Supports both button and anchor
 * behavior via the onClick and href props.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface CornerBracketButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function CornerBracketButton({
  children,
  className,
  onClick,
  type = 'button',
  disabled = false,
}: CornerBracketButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative px-8 py-3 group text-white font-medium tracking-widest text-sm uppercase transition-colors hover:bg-white/5',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
    >
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 transition-colors group-hover:border-white" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50 transition-colors group-hover:border-white" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50 transition-colors group-hover:border-white" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 transition-colors group-hover:border-white" />
      {children}
    </button>
  );
}
