/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * HashScanLink
 *
 * Renders a subtle external link to the Hedera HashScan explorer. Accepts
 * an entity type and ID, constructing the appropriate URL. Opens in a new
 * tab with a small ExternalLink icon to signal outbound navigation.
 */

import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

type HashScanType = 'account' | 'contract' | 'topic' | 'token' | 'transaction';

interface HashScanLinkProps {
  type: HashScanType;
  id: string;
  className?: string;
  /** Which network to link to. Defaults to testnet. */
  network?: 'mainnet' | 'testnet';
}

/** URL path segment for each entity type on HashScan. */
const pathMap: Record<HashScanType, string> = {
  account: 'account',
  contract: 'contract',
  topic: 'topic',
  token: 'token',
  transaction: 'transaction',
};

export default function HashScanLink({
  type,
  id,
  className,
  network = 'testnet',
}: HashScanLinkProps) {
  const url = `https://hashscan.io/${network}/${pathMap[type]}/${id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors text-xs font-mono tracking-wide',
        className
      )}
    >
      <span className="truncate max-w-[140px]">{id}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
}
