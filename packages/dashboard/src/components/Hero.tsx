/**
 * Full landing page for RoboLedger.
 *
 * First viewport: dark HUD hero with robot image and ERC-8004 headline.
 * Below: dark scrollable sections — protocol overview,
 * three-pillar feature cards, use cases, integrations, and footer.
 */

import React from 'react';
import { Bot, ClipboardList, Shield, Star, Play, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import hero from '../assets/hero.png';

import FeaturesSection from './landing/FeaturesSection';
import IntegrationsSection from './landing/IntegrationsSection';
import WhyNowSection from './landing/WhyNowSection';
import UseCasesSection from './landing/UseCasesSection';
import FooterSection from './landing/FooterSection';

/** Corner-bracket button for the dark hero section. */
const CornerBracketButton = ({ children }: { children: React.ReactNode }) => (
  <button className="relative px-8 py-3 group text-white font-medium tracking-widest text-sm uppercase transition-all duration-200 hover:bg-white/5 active:scale-[0.97]">
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 group-hover:border-white transition-colors" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50 group-hover:border-white transition-colors" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50 group-hover:border-white transition-colors" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 group-hover:border-white transition-colors" />
    {children}
  </button>
);

const CornerBracketBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative p-2", className)}>
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40" />
    {children}
  </div>
);

const CircularProgress = ({ value, label }: { value: number; label: string }) => {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="72" cy="72" r={r + 8} stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" strokeDasharray="1 6" />
        <circle cx="72" cy="72" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
        <circle cx="72" cy="72" r={r} stroke="white" strokeWidth="2" fill="none"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-bold tracking-wider">{value}%</div>
        <div className="text-[9px] text-white/50 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  );
};

const DotMap = () => (
  <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
    {Array.from({ length: 60 }).map((_, i) => {
      const dense = (i % 10 > 2 && i % 10 < 8) && (Math.floor(i / 10) > 1 && Math.floor(i / 10) < 5);
      const op = dense ? (Math.random() > 0.2 ? 'opacity-80' : 'opacity-40') : (Math.random() > 0.7 ? 'opacity-30' : 'opacity-10');
      return <div key={i} className={`w-[3px] h-[3px] bg-white rounded-full ${op}`} />;
    })}
  </div>
);

const BarChart = () => (
  <div className="flex items-end gap-[3px] h-8">
    {[30, 60, 40, 80, 50, 90, 30, 70].map((h, i) => (
      <div key={i} className="w-[3px] bg-white/60 rounded-t-sm" style={{ height: `${h}%` }} />
    ))}
  </div>
);

const HudOverlay = () => (
  <div className="absolute inset-x-0 top-0 pointer-events-none z-10">
    <div className="absolute top-0 left-0 h-[3px] w-36 bg-white" style={{ clipPath: 'polygon(0 0,100% 0,90% 100%,0 100%)' }} />
    <div className="absolute top-0 right-0 h-[3px] w-36 bg-white" style={{ clipPath: 'polygon(10% 0,100% 0,100% 100%,0 100%)' }} />
    <div className="absolute inset-x-0 top-0 bg-white/20" style={{
      height: '68px',
      clipPath: 'polygon(0% 0px,9% 0px,12% 28px,24% 28px,27% 67px,73% 67px,76% 28px,88% 28px,91% 0px,100% 0px,100% 1px,91% 1px,88% 29px,76% 29px,73% 68px,27% 68px,24% 29px,12% 29px,9% 1px,0% 1px)',
    }} />
    <div className="absolute top-0 left-0 bg-white/30" style={{ height: '34px', width: '24%', clipPath: 'polygon(0% 8px,25% 8px,37% 30px,100% 30px,100% 31px,36% 31px,24% 9px,0% 9px)' }} />
    <div className="absolute top-0 right-0 bg-white/30" style={{ height: '34px', width: '24%', clipPath: 'polygon(0% 30px,64% 30px,76% 8px,100% 8px,100% 9px,76% 9px,64% 31px,0% 31px)' }} />
    <div className="absolute bg-white" style={{ top: '27px', left: '5.6%', width: '10px', height: '5px', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
    <div className="absolute bg-white" style={{ top: '27px', right: '5.6%', width: '10px', height: '5px', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border border-white/25 bg-black" style={{ top: '63px' }} />
  </div>
);

const RightSidebar = () => (
  <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20">
    <div className="rounded-full border border-white/20 p-2 flex flex-col gap-4 bg-black/40 backdrop-blur-md">
      {[
        { Icon: Bot, label: 'Fleet', href: '/fleet' },
        { Icon: ClipboardList, label: 'Tasks', href: '/tasks' },
        { Icon: Shield, label: 'Proofs', href: '/proofs' },
        { Icon: Star, label: 'Trust', href: '/trust' },
        { Icon: Play, label: 'Demo', href: '/demo' },
        { Icon: LayoutDashboard, label: 'Architecture', href: '/archi' },
      ].map(({ Icon, label, href }, i) => (
        <Link key={i} to={href} title={label}
          className="p-3 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 active:scale-[0.97]">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </Link>
      ))}
    </div>
  </div>
);

export default function Hero() {
  return (
    <div className="w-full font-sans selection:bg-white/20 bg-black text-white">
      {/* Dark HUD hero — full viewport */}
      <section className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
        <HudOverlay />

        <header className="relative z-20 flex justify-between items-center px-12" style={{ height: '68px' }}>
          <Link to="/" className="text-white/70 hover:text-white transition-colors">
            <Bot className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-[0.5em]">ROBOLEDGER</h1>
          <Link to="/fleet" className="text-white/70 hover:text-white transition-colors text-xs tracking-widest uppercase">
            Dashboard
          </Link>
        </header>

        <div className="absolute top-[110px] left-0 right-0 bottom-0 flex items-end justify-center pointer-events-none z-0">
          <div className="relative w-full h-full flex items-end justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,black_80%)] z-10" />
            <img src={hero} alt="RoboLedger" className="h-full w-auto object-cover object-top opacity-90 mix-blend-lighten brightness-90" />
          </div>
        </div>

        <main className="flex-1 relative z-10 flex flex-col justify-between px-16 pb-12 pt-32">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }} className="max-w-md">
            <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase mb-4">Built on Hedera</p>
            <h2 className="text-5xl md:text-6xl font-bold tracking-wide leading-[1.1] mb-6">
              ERC-8004<br /><span className="text-white/90">for physical robots</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-10 max-w-sm">
              The trust standard that gives robots on-chain identity, verifiable reputation,
              and multi-party proof validation — so machines can work, prove, and get paid without middlemen.
            </p>
            <Link to="/fleet"><CornerBracketButton>Enter Dashboard</CornerBracketButton></Link>
          </motion.div>

          <div className="flex justify-between items-end w-full mt-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }} className="flex items-center gap-12">
              <CircularProgress value={100} label="Trust Score" />
              <CornerBracketBox className="flex items-center gap-6 p-4">
                <DotMap /><div className="w-[1px] h-8 bg-white/20 mx-2" /><BarChart />
              </CornerBracketBox>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }} className="flex items-end gap-6 mr-24">
              <div className="relative h-28 w-[2px] bg-white/10 flex flex-col justify-between py-1">
                <div className="w-3 h-1 bg-white -ml-1" />
                {[1, 2, 3, 4, 5].map(k => <div key={k} className="w-2 h-[2px] bg-white/40 -ml-0.5" />)}
                <div className="w-3 h-1 bg-white -ml-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/80 tracking-[0.4em] uppercase mb-4 ml-1 font-medium">ERC-8004</span>
                <Link to="/trust">
                  <CornerBracketBox className="p-1">
                    <div className="w-56 h-28 bg-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all duration-500 cursor-pointer">
                      <span className="text-white/70 text-xs tracking-widest uppercase">Identity</span>
                      <span className="text-white/70 text-xs tracking-widest uppercase">Reputation</span>
                      <span className="text-white/70 text-xs tracking-widest uppercase">Validation</span>
                    </div>
                  </CornerBracketBox>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>

        <RightSidebar />
      </section>

      {/* Light sections below the hero */}
      <FeaturesSection />
      <IntegrationsSection />
      <WhyNowSection />
      <UseCasesSection />
      <FooterSection />
    </div>
  );
}
