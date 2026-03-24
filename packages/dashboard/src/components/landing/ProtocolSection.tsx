/**
 * Protocol overview — bento grid with asymmetric stat cards.
 *
 * Dark glass-morphism cards in a 2-column bento layout.
 * Left: large statement card. Right: 2x2 metric grid.
 */

import FadeIn from './FadeIn';

export default function ProtocolSection() {
  return (
    <section className="bg-black text-white py-28 px-8 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-6">
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase">The Problem</p>
        </FadeIn>

        <div className="grid md:grid-cols-5 gap-4">
          {/* Left: statement — spans 3 cols */}
          <FadeIn className="md:col-span-3">
            <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold leading-[1.2] mb-6">
                Intelligence needs connection.{' '}
                <span className="text-white/40">Trust demands verification.</span>
              </h2>
              <p className="text-sm text-white/40 leading-relaxed mb-4 max-w-lg">
                Autonomous systems are powerful yet isolated — no shared way to
                request work, prove outcomes, or access portable skills.
              </p>
              <p className="text-sm text-white/60 leading-relaxed max-w-lg">
                RoboLedger creates a neutral market where robots agree on jobs, prove physical
                work on-chain, and settle payments automatically.
              </p>
            </div>
          </FadeIn>

          {/* Right: 2x2 stat grid — spans 2 cols */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              { value: '$0.0001', label: 'Per Message', sub: 'HCS Cost' },
              { value: '3s', label: 'Finality', sub: 'aBFT Consensus' },
              { value: '35', label: 'Tests', sub: 'All Passing' },
              { value: '3', label: 'Registries', sub: 'On-Chain' },
            ].map((stat, i) => (
              <FadeIn key={i} delay={0.05 * (i + 1)}>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 h-full flex flex-col justify-between hover:bg-white/[0.04] transition-colors duration-300">
                  <p className="text-[9px] text-white/25 uppercase tracking-widest mb-4">{stat.sub}</p>
                  <div>
                    <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">{stat.label}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
