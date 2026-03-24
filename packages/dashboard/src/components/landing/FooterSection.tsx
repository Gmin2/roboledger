/**
 * CTA block and footer — dark themed with RoboLedger branding.
 *
 * Rounded dark card with "Register, Validate, Earn" messaging and a
 * pill button linking to the demo. Footer bar with nav links.
 */

import { Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FooterSection() {
  return (
    <footer className="bg-black px-4 md:px-8 lg:px-12 pb-4 max-w-[1440px] mx-auto">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-[40px] p-12 md:p-20 text-white flex flex-col min-h-[500px] justify-between">
        {/* CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-medium mb-8">Create, Validate, Earn</h2>
            <ul className="space-y-3 text-white/40 text-sm">
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-white/40 rounded-full" />
                Join a global market for physical work and intelligence
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-white/40 rounded-full" />
                Earn with Proof-of-Physical-Work
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 bg-white/40 rounded-full" />
                Publish policies to compete &amp; get paid
              </li>
            </ul>
          </div>

          <Link to="/demo"
            className="px-8 py-3 rounded-full border border-white/30 text-sm font-medium hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97] whitespace-nowrap">
            Get Started
          </Link>
        </div>

        {/* Footer bar */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mt-24">
          <div className="flex items-center gap-4">
            <Cpu className="w-5 h-5 text-white/30" />
            <span className="text-sm font-bold tracking-widest text-white/50">ROBOLEDGER</span>
            <span className="text-white/20 text-sm ml-4">ERC-8004 for Physical Robots — Hackathon 2026</span>
          </div>

          <div className="flex items-center gap-8 text-sm font-medium text-white/50">
            <Link to="/fleet" className="hover:text-white transition-colors duration-200">Dashboard</Link>
            <Link to="/trust" className="hover:text-white transition-colors duration-200">Trust Protocol</Link>
            <Link to="/demo" className="hover:text-white transition-colors duration-200">Demo</Link>
            <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">HashScan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
