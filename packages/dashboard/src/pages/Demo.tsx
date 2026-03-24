/**
 * Live Demo page — UI layer for the ERC-8004 demo runner.
 *
 * All Hedera SDK interactions live in `lib/hedera-demo.ts`.
 * This component handles step visualization, log rendering,
 * and HashScan link display.
 */

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Check, Loader2, AlertCircle, ExternalLink,
  Bot, ClipboardList, Shield, Lock, MapPin, ShieldCheck, Banknote, Search,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HEDERA_CONFIG as C } from '../lib/hedera-config';
import { runDemoSequence } from '../lib/hedera-demo';
import type { LogType } from '../lib/hedera-demo';

interface StepDef {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepDef[] = [
  { title: 'Verify Fleet Identity', icon: Bot },
  { title: 'Post Delivery Task', icon: ClipboardList },
  { title: 'Robot Bidding (Fair-Ordered)', icon: Shield },
  { title: 'Lock HBAR in Escrow', icon: Lock },
  { title: 'Stream Proof-of-Completion', icon: MapPin },
  { title: 'Validator Approvals', icon: ShieldCheck },
  { title: 'Settlement + Reputation', icon: Banknote },
  { title: 'On-Chain Verification', icon: Search },
];

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface LogEntry {
  timestamp: string;
  message: string;
  type: LogType;
}

export default function Demo() {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(STEPS.map(() => 'pending'));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const log = useCallback((message: string, type: LogType = 'info') => {
    const ts = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, { timestamp: ts, message, type }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const setStep = useCallback((idx: number, status: StepStatus) => {
    setStepStatuses(prev => { const n = [...prev]; n[idx] = status; return n; });
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setFinished(false);
    setLogs([]);
    setStepStatuses(STEPS.map(() => 'pending'));

    try {
      await runDemoSequence(log, setStep);
      setFinished(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Error: ${msg}`, 'error');
    } finally {
      setRunning(false);
    }
  }, [log, setStep]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto">

      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-2">Live Testnet</p>
          <h2 className="text-2xl font-bold tracking-wide">ERC-8004 Demo</h2>
        </div>
        <button onClick={handleRun} disabled={running}
          className={cn(
            "flex items-center gap-3 px-8 py-3 rounded-full border text-sm font-medium tracking-wide transition-all duration-200 active:scale-[0.97]",
            running
              ? "border-white/10 text-white/30 cursor-not-allowed"
              : "border-white/20 text-white hover:bg-white hover:text-black"
          )}>
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Running...' : 'Run Demo'}
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Step tracker */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="space-y-1">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const status = stepStatuses[i];
                return (
                  <div key={i} className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-200",
                    status === 'active' && "bg-white/[0.05]",
                    status === 'complete' && "bg-white/[0.02]",
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200",
                      status === 'pending' && "bg-white/[0.05] text-white/20",
                      status === 'active' && "bg-white/10 text-white",
                      status === 'complete' && "bg-white text-black",
                      status === 'error' && "bg-red-500/20 text-red-400",
                    )}>
                      {status === 'complete' ? <Check className="w-4 h-4" strokeWidth={2.5} /> :
                       status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn(
                      "text-sm transition-colors duration-200",
                      status === 'pending' && "text-white/25",
                      status === 'active' && "text-white font-medium",
                      status === 'complete' && "text-white/60",
                      status === 'error' && "text-red-400",
                    )}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live console */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 h-[520px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-2 h-2 rounded-full",
                running ? "bg-green-400 animate-pulse" : logs.length > 0 ? "bg-white/30" : "bg-white/10")} />
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                {running ? 'Executing' : finished ? 'Complete' : 'Console'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
              {logs.length === 0 && (
                <p className="text-white/15 text-center mt-20">
                  Click "Run Demo" to execute live transactions on Hedera testnet
                </p>
              )}
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-white/20 shrink-0">{entry.timestamp}</span>
                  <span className={cn(
                    entry.type === 'success' && 'text-green-400/80',
                    entry.type === 'error' && 'text-red-400/80',
                    entry.type === 'detail' && 'text-white/40',
                    entry.type === 'info' && 'text-white/60',
                  )}>
                    {entry.type === 'success' && '+ '}
                    {entry.type === 'error' && 'x '}
                    {entry.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {finished && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Verify on HashScan</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Escrow', path: `contract/${C.escrowContractId}` },
                  { label: 'Reputation', path: `contract/${C.reputationContractId}` },
                  { label: 'Tasks HCS', path: `topic/${C.tasksTopicId}` },
                  { label: 'Proofs HCS', path: `topic/${C.proofsTopicId}` },
                  { label: 'Robot 1', path: `account/${C.robot1Id}` },
                  { label: 'NFT', path: `token/${C.nftTokenId}` },
                ].map(link => (
                  <a key={link.label}
                    href={`https://hashscan.io/testnet/${link.path}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-200">
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
