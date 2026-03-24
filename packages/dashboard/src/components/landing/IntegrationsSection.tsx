/**
 * Integrations section — same split-card layout, ROS2 content.
 */

import HudSeparator from './HudSeparator';

export default function IntegrationsSection() {
  return (
    <div className="bg-black">
      <section className="px-4 py-16 md:px-8 lg:px-12 max-w-[1440px] mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[32px] p-8 md:p-16 lg:p-24 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-medium text-center mb-12 text-white">Integrations</h2>

          <div className="bg-white/[0.04] border border-white/[0.1] rounded-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
            {/* Logo Side */}
            <div className="w-full md:w-1/3 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/[0.08] flex items-center justify-center p-12">
              <div className="w-32 h-32 relative">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <circle cx="50" cy="50" r="40" stroke="white" strokeOpacity="0.15" strokeWidth="2" />
                  <circle cx="50" cy="50" r="25" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="8" fill="white" fillOpacity="0.2" />
                  <circle cx="50" cy="10" r="5" fill="white" fillOpacity="0.3" />
                  <circle cx="85" cy="65" r="5" fill="white" fillOpacity="0.3" />
                  <circle cx="15" cy="65" r="5" fill="white" fillOpacity="0.3" />
                  <line x1="50" y1="15" x2="50" y2="42" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="80" y1="63" x2="58" y2="52" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
                  <line x1="20" y1="63" x2="42" y2="52" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
                  <text x="50" y="55" fill="white" fillOpacity="0.6" fontSize="12" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ROS2</text>
                </svg>
              </div>
            </div>

            {/* Text Side */}
            <div className="w-full md:w-2/3 p-10 md:p-16 flex flex-col justify-center">
              <h3 className="text-xl font-medium mb-4 text-white">ROS2 Jazzy Bridge</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                RoboLedger ships a native ROS2 integration that bridges robot sensor data directly to Hedera. The bridge node subscribes to standard ROS2 topics (/odom, /gps, /camera), hashes evidence with SHA-256, and submits proof-of-completion to HCS via a lightweight CLI subprocess. A fleet simulator runs 3 mock robots with different capabilities for demo and testing. Any ROS2 Jazzy robot can connect to the Hedera task marketplace out of the box.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HudSeparator />
    </div>
  );
}
