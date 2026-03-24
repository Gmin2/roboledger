/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sidebar
 *
 * Left navigation panel for the dashboard shell. Displays the primary
 * section links with lucide icons. Active link gets a white background
 * with black text; inactive links use muted white with a hover brightening
 * effect. The container itself is framed with corner bracket accents.
 */

import { NavLink } from 'react-router-dom';
import {
  Bot,
  ClipboardList,
  Shield,
  Star,
  Play,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/** Navigation item definition. */
interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/fleet', label: 'Fleet', icon: Bot },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/proofs', label: 'Proofs', icon: Shield },
  { to: '/trust', label: 'Trust', icon: Star },
  { to: '/demo', label: 'Demo', icon: Play },
  { to: '/archi', label: 'Architecture', icon: LayoutDashboard },
];

export default function Sidebar() {
  return (
    <aside className="relative w-56 shrink-0 border-r border-white/10 bg-black flex flex-col">
      {/* Corner bracket accents on the sidebar container */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/30" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/30" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/30" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/30" />

      {/* Navigation links */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-6">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium tracking-wide transition-all duration-200',
                isActive
                  ? 'bg-white text-black'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Back to home link */}
      <div className="px-3 pb-6">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </NavLink>
      </div>
    </aside>
  );
}
