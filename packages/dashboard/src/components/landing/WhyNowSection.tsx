/**
 * "Why Now" section — massive heading at top, content below.
 *
 * The giant "Why Now" text is the hero of this section, fully visible.
 * Below it: a two-column layout with tech details on the left and
 * the main argument on the right.
 */

import { Check } from 'lucide-react';
import HudSeparator from './HudSeparator';

export default function WhyNowSection() {
  return (
    <div className="bg-black">
      <section className="py-28 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto">
        {/* Giant heading — fully visible, not background */}
        <h2 className="text-[4rem] md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.85] mb-16">
          <span className="text-white">Why</span>{' '}
          <span className="text-white/20">Now</span>
        </h2>

        {/* Gradient divider */}
        <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-16" />

        {/* Two-column content below the heading */}
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left — tech details */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.08] border border-white/[0.15] flex items-center justify-center shrink-0">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
              <p className="text-sm text-white/50">Economically viable robot coordination — for the first time</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-sm text-white/70 font-mono bg-white/[0.05] px-4 py-2.5 rounded-lg border border-white/[0.08]">
                $0.0001 per consensus message
              </div>
              <div className="text-sm text-white/70 font-mono bg-white/[0.05] px-4 py-2.5 rounded-lg border border-white/[0.08]">
                3-second aBFT finality
              </div>
              <div className="text-sm text-white/70 font-mono bg-white/[0.05] px-4 py-2.5 rounded-lg border border-white/[0.08]">
                10,000+ TPS throughput
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <div className="w-10 h-1.5 bg-white/25 rounded-sm" />
              <div className="w-10 h-1.5 bg-white/25 rounded-sm" />
              <div className="w-10 h-1.5 bg-white/25 rounded-sm" />
              <div className="w-10 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>

          {/* Right — main argument */}
          <div>
            <p className="text-xs text-white/60 tracking-[0.4em] uppercase mb-6">The Timing</p>
            <p className="text-xl text-white/80 leading-relaxed mb-6">
              Cheap sensors, mass-market compute, and abundant AI are here. Hedera's $0.0001 consensus messages and instant finality make on-chain robot coordination economically viable for the first time.
            </p>
            <p className="text-xl text-white font-medium leading-relaxed">
              The missing piece is a neutral market and court for physical work. RoboLedger is that market — so coordination and intelligence finally compound.
            </p>
          </div>
        </div>
      </section>

      <HudSeparator flip />
    </div>
  );
}
