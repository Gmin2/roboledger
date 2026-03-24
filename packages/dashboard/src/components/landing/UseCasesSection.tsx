/**
 * Real-world use cases — dark themed cards with custom SVG animations.
 *
 * Each card has a unique animated SVG in its bottom area:
 *   - Logistics: delivery bot tracing a route between waypoints
 *   - Inspection: robotic arm scanning infrastructure with sensor beams
 *   - Monitoring: radar dish emitting detection rings across a field
 */

import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import HudSeparator from './HudSeparator';

/** Delivery bot following a dashed route between two points. */
const LogisticsGraphic = () => (
  <svg viewBox="0 0 300 200" className="w-full h-full" fill="none">
    {Array.from({ length: 6 }).map((_, i) => (
      <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    ))}
    {Array.from({ length: 8 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 43} y1="0" x2={i * 43} y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    ))}

    {/* Route path */}
    <path d="M 40,160 Q 90,60 150,100 T 260,50" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 4" fill="none" />
    <path d="M 40,160 Q 90,60 150,100 T 260,50" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="200" strokeDashoffset="200">
      <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite" />
    </path>

    {/* Delivery bot */}
    <g>
      <animateMotion dur="3s" repeatCount="indefinite" path="M 40,160 Q 90,60 150,100 T 260,50" />
      <rect x="-10" y="-6" width="20" height="12" rx="3" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <circle cx="-6" cy="8" r="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
      <circle cx="6" cy="8" r="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
    </g>

    {/* Waypoints */}
    <circle cx="40" cy="160" r="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <circle cx="260" cy="50" r="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1">
      <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
    </circle>

    <text x="28" y="178" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">PICKUP</text>
    <text x="242" y="42" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">DELIVER</text>

    {/* HCS proof indicator */}
    <text x="200" y="170" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">HCS #672</text>
    <text x="200" y="180" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">PROOF LOGGED</text>
  </svg>
);

/** Inspection robot scanning a structure with sensor beams. */
const InspectionGraphic = () => (
  <svg viewBox="0 0 300 200" className="w-full h-full" fill="none">
    {/* Structure being inspected */}
    <rect x="160" y="30" width="100" height="140" rx="4" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    <rect x="175" y="50" width="30" height="20" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
    <rect x="215" y="50" width="30" height="20" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
    <rect x="175" y="90" width="30" height="20" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
    <rect x="215" y="90" width="30" height="20" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
    <rect x="195" y="130" width="30" height="40" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

    {/* Robot base */}
    <rect x="40" y="140" width="30" height="20" rx="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <circle cx="48" cy="165" r="5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    <circle cx="62" cy="165" r="5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

    {/* Scanning beam — sweeps up and down */}
    <g>
      <line x1="70" y1="145" x2="165" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="70" y1="145" x2="165" y2="60" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="8 4">
        <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1s" repeatCount="indefinite" />
      </line>
      <animateTransform attributeName="transform" type="rotate" values="-5,70,145;15,70,145;-5,70,145" dur="4s" repeatCount="indefinite" />
    </g>

    {/* Scan target highlight */}
    <circle cx="165" cy="60" r="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
      <animate attributeName="r" values="6;12;6" dur="4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
    </circle>

    {/* Data readout */}
    <text x="20" y="25" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">SENSOR ACTIVE</text>
    <rect x="20" y="30" width="60" height="5" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
    <rect x="21" y="31" width="35" height="3" rx="1.5" fill="rgba(255,255,255,0.15)">
      <animate attributeName="width" values="35;50;25;40;35" dur="4s" repeatCount="indefinite" />
    </rect>

    <text x="20" y="55" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">DEFECTS: 0</text>
    <text x="20" y="65" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="monospace">VALIDATOR: PENDING</text>
  </svg>
);

/** Radar dish with expanding detection rings over a monitored area. */
const MonitoringGraphic = () => (
  <svg viewBox="0 0 300 200" className="w-full h-full" fill="none">
    {/* Ground plane dots */}
    {Array.from({ length: 8 }).map((_, row) =>
      Array.from({ length: 12 }).map((_, col) => (
        <circle key={`${row}-${col}`} cx={20 + col * 24} cy={100 + row * 13} r="1.5"
          fill={`rgba(255,255,255,${Math.random() > 0.5 ? 0.08 : 0.04})`} />
      ))
    )}

    {/* Radar dish */}
    <g>
      <rect x="135" y="65" width="30" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
      <line x1="150" y1="69" x2="150" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <rect x="140" y="88" width="20" height="8" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <ellipse cx="150" cy="60" rx="20" ry="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </g>

    {/* Expanding detection rings */}
    {[0, 1, 2].map((i) => (
      <circle key={i} cx="150" cy="75" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8">
        <animate attributeName="r" from="20" to="120" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.2" to="0" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
      </circle>
    ))}

    {/* Rotating sweep line */}
    <line x1="150" y1="75" x2="150" y2="15" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
      <animateTransform attributeName="transform" type="rotate" from="0 150 75" to="360 150 75" dur="4s" repeatCount="indefinite" />
    </line>

    {/* Detection blips */}
    <circle cx="100" cy="130" r="3" fill="rgba(255,255,255,0.15)">
      <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="220" cy="120" r="3" fill="rgba(255,255,255,0.15)">
      <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="180" cy="160" r="3" fill="rgba(255,255,255,0.15)">
      <animate attributeName="opacity" values="0.1;0.4;0.1" dur="1.8s" begin="1s" repeatCount="indefinite" />
    </circle>

    {/* Status */}
    <text x="20" y="20" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">ZONE ALPHA</text>
    <text x="20" y="30" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">3 TARGETS TRACKED</text>
    <text x="220" y="20" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">REP: 100/100</text>
  </svg>
);

export default function UseCasesSection() {
  return (
    <div className="bg-black">
      <section className="px-4 py-24 md:px-8 lg:px-12 max-w-[1440px] mx-auto flex flex-col items-center">
        <div className="mb-16 text-center">
          <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-3">Applications</p>
          <h2 className="text-3xl md:text-4xl font-medium text-white">Real World Use Cases</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          {/* Logistics — delivery bot tracing route */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden flex flex-col h-[520px] group cursor-pointer hover:border-white/[0.15] transition-colors duration-300">
            <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-white/15 group-hover:text-white/40 transition-colors z-10" />
            <div className="relative z-10 mb-6">
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white">
                Decentralised<br />Logistics
              </h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-[85%]">
                Drones and rovers coordinate deliveries; proof confirms completion and payment settles in HBAR automatically.
              </p>
            </div>
            <div className="mt-auto relative h-[55%] rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
              <LogisticsGraphic />
            </div>
          </div>

          {/* Inspection — robot scanning structure */}
          <div className="bg-white/[0.04] border border-white/[0.1] rounded-3xl p-8 relative overflow-hidden flex flex-col h-[520px] group cursor-pointer hover:border-white/[0.18] transition-colors duration-300">
            <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-white/15 group-hover:text-white/40 transition-colors z-10" />
            <div className="relative z-10 mb-6">
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white">
                Industrial<br />Inspection
              </h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-[85%]">
                Inspection robots bid on maintenance jobs; verified sensor evidence unlocks escrow automatically.
              </p>
            </div>
            <div className="mt-auto relative h-[55%] rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
              <InspectionGraphic />
            </div>
          </div>

          {/* Monitoring — radar with detection rings */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden flex flex-col h-[520px] group cursor-pointer hover:border-white/[0.15] transition-colors duration-300">
            <ArrowUpRight className="absolute top-6 right-6 w-5 h-5 text-white/15 group-hover:text-white/40 transition-colors z-10" />
            <div className="relative z-10 mb-6">
              <h3 className="text-2xl font-medium leading-tight mb-4 text-white">
                Autonomous<br />Monitoring
              </h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-[85%]">
                Security robots earn reputation by delivering verified field data; high-trust robots access higher-value contracts.
              </p>
            </div>
            <div className="mt-auto relative h-[55%] rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06]">
              <MonitoringGraphic />
            </div>
          </div>
        </div>

        <Link to="/trust"
          className="px-8 py-3 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97]">
          Explore Protocol
        </Link>
      </section>

      <HudSeparator flip />
    </div>
  );
}
