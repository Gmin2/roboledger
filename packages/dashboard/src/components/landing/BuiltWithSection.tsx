/**
 * Tech stack / integrations — single dark glass card with grid.
 */

import FadeIn from './FadeIn';

const stack = [
  { name: 'Hedera', desc: 'HCS + HTS + Smart Contracts' },
  { name: 'Solidity', desc: '3 ERC-8004 Registries' },
  { name: 'ROS2', desc: 'Robot Bridge + Simulator' },
  { name: 'TypeScript', desc: 'SDK + CLI + Dashboard' },
];

export default function BuiltWithSection() {
  return (
    <section className="bg-black text-white py-28 px-8 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">Built With</h2>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 md:p-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {stack.map((item, i) => (
                <div key={i} className="text-center md:text-left">
                  <div className="text-lg font-bold mb-1">{item.name}</div>
                  <div className="text-[11px] text-white/30 tracking-wide">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
