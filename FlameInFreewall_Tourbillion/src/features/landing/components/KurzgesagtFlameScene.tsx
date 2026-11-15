'use client';

import React from 'react';
import { Flame, Info } from 'lucide-react';
import { EarthFlameSvg, IssFlameSvg } from './FlameVectorGraphics';

export const KurzgesagtFlameScene: React.FC = () => {
  return (
    <section id="flame-physics" className="py-16 relative w-full overflow-hidden bg-[#F8F9FA] font-sans" data-testid="kurzgesagt-flame-scene">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-4">
            Why Do Flames Burn <span className="text-[#0B2374]">Round &amp; Blue</span> in Freefall?
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            On Earth, gravity pulls cold dense air downward, forcing hot gases to rise in a buoyant chimney plume.
            In freefall, buoyancy vanishes completely: oxygen flows only by molecular diffusion.
          </p>
        </div>

        {/* Chambers View - Direct Plain Sight (Earth 1g vs ISS 0g) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="side-by-side-grid">
          {/* Earth 1.00g */}
          <div className="rounded-[38px] bg-gray-200/50 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-zinc-950">
                    Earth 1.00g Terrestrial Flame
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Buoyant Plume
                </span>
              </div>
              <div className="relative w-full h-64 flex items-center justify-center bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-inner">
                <EarthFlameSvg />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1 text-center text-xs">
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Sphericity</div>
                <div className="text-base font-black text-amber-600">0.25 (Teardrop)</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Peak Temp</div>
                <div className="text-base font-black text-zinc-900">~1,760 K</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Flicker</div>
                <div className="text-base font-black text-zinc-800">~10.0 Hz</div>
              </div>
            </div>
          </div>

          {/* ISS 0.00g */}
          <div className="rounded-[38px] bg-gray-200/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="font-black text-lg text-zinc-950">
                    ISS 0.00g Microgravity Flame
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Spherical Diffusion
                </span>
              </div>
              <div className="relative w-full h-64 flex items-center justify-center bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-inner">
                <IssFlameSvg />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1 text-center text-xs">
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Sphericity</div>
                <div className="text-base font-black text-cyan-600">0.98 (Spherical)</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Peak Temp</div>
                <div className="text-base font-black text-zinc-900">~1,420 K</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl">
                <div className="text-zinc-500 font-semibold">Flicker</div>
                <div className="text-base font-black text-zinc-800">0.4 Hz (Steady)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Physics Takeaway Card - Concise */}
        <div className="rounded-3xl bg-blue-50 p-4 sm:p-5 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0 text-[#0B2374] shadow-2xs">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-950 mb-0.5">
              NASA PSI Microgravity Discovery: Why ISS Flames Burn Longer &amp; Cooler
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Without upward buoyant evacuation, hot CO₂ and H₂O linger around the flame, slowing oxygen diffusion.
              Peak temperature drops to ~1,420 K, eliminating yellow soot incandescence. The flame burns with a dim blue luminescence almost invisible under bright cabin lighting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
