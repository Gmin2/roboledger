/**
 * Core protocol features — three-pillar cards with video background.
 *
 * Same UI as before, just RoboLedger content instead of generic text.
 */

import { Fingerprint, Star, ShieldCheck } from 'lucide-react';
import robotsVideo from '../../assets/robots.mp4';
import HudSeparator from './HudSeparator';

export default function FeaturesSection() {
  return (
    <div className="bg-black">
      <HudSeparator />

      <section className="px-4 py-20 md:px-8 lg:px-12 max-w-[1440px] mx-auto">
        <div className="relative rounded-[32px] bg-white/[0.03] border border-white/[0.08] overflow-hidden min-h-[800px] flex flex-col justify-end p-6 md:p-12">
          {/* Background Video */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <video
              src={robotsVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-[80%] h-auto rounded-xl opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
          </div>

          {/* Section heading */}
          <div className="relative z-10 mb-12">
            <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-3">ERC-8004 Protocol</p>
            <h2 className="text-3xl md:text-4xl font-medium text-white">Three Registries, One Trust Layer</h2>
          </div>

          {/* Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white/[0.05] backdrop-blur-md border border-white/[0.1] rounded-2xl p-8 flex flex-col h-full">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-12">
                <Fingerprint className="w-5 h-5 text-white" />
              </div>
              <div className="flex gap-2 mb-8">
                <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                <div className="h-1.5 w-8 bg-white/10 rounded-full" />
              </div>
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white">
                Identity<br />Registry
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mt-auto">
                Each robot holds an HTS NFT with native KYC, freeze, and metadata keys. Manufacturers mint, certifiers approve, safety authorities revoke — all at the token level.
              </p>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-md border border-white/[0.1] rounded-2xl p-8 flex flex-col h-full">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-12">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white mt-[40px]">
                Reputation<br />Registry
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mt-auto">
                On-chain feedback auto-recorded after every task. Clients filter robots by success rate, delivery speed, and proof quality — Sybil-resistant by design.
              </p>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-md border border-white/[0.1] rounded-2xl p-8 flex flex-col h-full">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-12">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white mt-[40px]">
                Validation<br />Registry
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mt-auto">
                Independent validators approve proof-of-completion before payment releases. Multi-party consensus gates settlement on reaching the required threshold.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HudSeparator flip />
    </div>
  );
}
