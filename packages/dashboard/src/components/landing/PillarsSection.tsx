/**
 * Three-pillar ERC-8004 registries — dark bento cards.
 *
 * Three glass cards with icon, decorative bar, title, description.
 * Staggered scroll entrance. Hover lifts with subtle border brightening.
 */

import { Fingerprint, Star, ShieldCheck } from 'lucide-react';
import FadeIn from './FadeIn';

const pillars = [
  {
    icon: Fingerprint,
    title: 'Identity\nRegistry',
    description: 'Each robot holds an HTS NFT with native KYC, freeze, and metadata keys. Manufacturers mint, certifiers approve, authorities revoke — all at the token level.',
    accent: 'from-white/20 to-white/5',
  },
  {
    icon: Star,
    title: 'Reputation\nRegistry',
    description: 'On-chain feedback recorded automatically after every task. Filter robots by success rate, delivery speed, and proof quality — Sybil-resistant by design.',
    accent: 'from-white/15 to-white/5',
  },
  {
    icon: ShieldCheck,
    title: 'Validation\nRegistry',
    description: 'Independent validators approve proof-of-completion before payment releases. Multi-party consensus gates settlement on reaching the required threshold.',
    accent: 'from-white/10 to-white/5',
  },
];

export default function PillarsSection() {
  return (
    <section className="bg-black text-white py-28 px-8 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-14">
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-3">ERC-8004 Protocol</p>
          <h2 className="text-3xl md:text-4xl font-bold">Three Registries, One Trust Layer</h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 h-full hover:border-white/[0.15] transition-colors duration-300">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-8 group-hover:bg-white/[0.1] transition-colors duration-300">
                    <Icon className="w-5 h-5 text-white/70" strokeWidth={1.5} />
                  </div>

                  {/* Decorative gradient bar */}
                  <div className={`h-[2px] w-16 bg-gradient-to-r ${pillar.accent} rounded-full mb-8`} />

                  <h3 className="text-xl font-bold leading-tight whitespace-pre-line mb-4">{pillar.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{pillar.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
