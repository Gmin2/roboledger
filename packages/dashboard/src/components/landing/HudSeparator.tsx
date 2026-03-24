/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Angled section divider — stacked diagonal slices creating depth.
 * `flip` mirrors the angle direction.
 */
export default function HudSeparator({ flip = false }: { flip?: boolean }) {
  const skew = flip ? 'skewY(2deg)' : 'skewY(-2deg)';
  const skewInner = flip ? 'skewY(1.5deg)' : 'skewY(-1.5deg)';

  return (
    <div className="relative bg-black w-full overflow-hidden" style={{ height: '120px' }}>
      {/* Back layer — wide dark slab */}
      <div
        className="absolute inset-x-[-4%] bg-white/[0.02]"
        style={{ top: '20%', height: '80%', transform: skew }}
      />

      {/* Mid layer — slightly offset, brighter */}
      <div
        className="absolute inset-x-[-2%] bg-white/[0.04] border-t border-white/[0.08]"
        style={{ top: '40%', height: '60%', transform: skewInner }}
      />

      {/* Thin accent line */}
      <div
        className="absolute inset-x-0"
        style={{ top: '38%', height: '1px', transform: skew }}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      {/* Small detail marks along the line */}
      <div className="absolute left-[15%] w-6 h-px bg-white/20" style={{ top: '36%', transform: skew }} />
      <div className="absolute left-[30%] w-3 h-px bg-white/15" style={{ top: '37%', transform: skew }} />
      <div className="absolute right-[15%] w-6 h-px bg-white/20" style={{ top: '36%', transform: skew }} />
      <div className="absolute right-[30%] w-3 h-px bg-white/15" style={{ top: '37%', transform: skew }} />

      {/* Center notch detail */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-8 h-[3px] bg-white/10 rounded-full"
        style={{ top: '36%', transform: skew }}
      />
    </div>
  );
}
