/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shell
 *
 * Top-level dashboard layout wrapping every page except the landing Hero.
 * Provides the HUD top navigation bar (adapted from the Hero page pattern),
 * a left sidebar with section links, and a scrollable content area that
 * fills the remaining viewport.
 */

import { Outlet, Link } from 'react-router-dom';
import { Globe, Search, Bell, Maximize } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * DashboardHudOverlay
 *
 * A simplified version of the Hero page HUD frame, adapted for the
 * dashboard top bar. Retains the angular clip-path lines and accent
 * elements but scaled for a narrower nav height.
 */
function DashboardHudOverlay() {
  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-10">
      {/* White corner accent bars */}
      <div
        className="absolute top-0 left-0 h-[3px] w-28 bg-white"
        style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}
      />
      <div
        className="absolute top-0 right-0 h-[3px] w-28 bg-white"
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
      />

      {/* Primary angular frame outline */}
      <div
        className="absolute inset-x-0 top-0 bg-white/20"
        style={{
          height: '56px',
          clipPath: `polygon(
            0% 0px, 15% 0px, 18% 24px, 30% 24px, 32% 55px, 68% 55px, 70% 24px, 82% 24px, 85% 0px, 100% 0px,
            100% 1px, 85% 1px, 82% 25px, 70% 25px, 68% 56px, 32% 56px, 30% 25px, 18% 25px, 15% 1px, 0% 1px
          )`,
        }}
      />

      {/* Center glow on top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Center diamond at frame bottom */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 border border-white/25 bg-black"
        style={{ top: '51px' }}
      />

      {/* Soft glow below the frame */}
      <div
        className="absolute left-[32%] right-[32%] bg-gradient-to-b from-white/[0.03] to-transparent"
        style={{ top: '56px', height: '20px' }}
      />
    </div>
  );
}

/**
 * DashboardTopNav
 *
 * The top navigation bar for the dashboard. Displays utility icons on each
 * side with centered "ROBOLEDGER" branding.
 */
function DashboardTopNav() {
  return (
    <header className="relative z-20 flex justify-between items-center px-8" style={{ height: '56px' }}>
      <div className="flex items-center gap-5 text-white/70">
        <Link to="/" className="hover:text-white transition-colors"><Globe className="w-4 h-4" /></Link>
        <Search className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
      </div>

      <h1 className="text-lg font-bold tracking-[0.5em] text-white">ROBOLEDGER</h1>

      <div className="flex items-center gap-5 text-white/70">
        <Bell className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
        <Maximize className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
      </div>
    </header>
  );
}

export default function Shell() {
  return (
    <div className="bg-black min-h-screen w-full text-white flex flex-col font-sans selection:bg-white/20">
      {/* Top HUD bar */}
      <div className="relative shrink-0">
        <DashboardHudOverlay />
        <DashboardTopNav />
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
