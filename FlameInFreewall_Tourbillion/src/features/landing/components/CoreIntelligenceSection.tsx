'use client';

/**
 * CoreIntelligenceSection Component
 * Synchronized with StructPaper light & Kurzgesagt aesthetic.
 * Concise, scannable layout communicating the 3 core innovations grounded directly
 * in NASA backend data: Cross-Study Data Harmonization, Evidence Gap Matrix, and Guarded Predictive Physics.
 */

import React from 'react';
import {
  Layers,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export const CoreIntelligenceSection: React.FC = () => {
  return (
    <section
      id="core-intelligence"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80 font-sans"
      data-testid="core-intelligence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Concise & Direct */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mb-3">
            How This App Bridges Data to Decision
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Raw NASA logs cannot prevent spacecraft fires on their own. FlameGuard AI introduces three foundational pillars
            to convert fragmented experiments into verified, zero-hallucination safety guardrails.
          </p>
        </div>

        {/* 3 Core Pillars - Concise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 01 */}
          <div
            className="rounded-[36px] bg-gray-200/50 p-6 sm:p-7 hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-harmonization"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
                  <Layers className="w-5 h-5 text-[#0B2374]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                  Pillar 01
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Cross-Study Data Harmonization
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Unifies 24 NASA PSI flight investigations (BASS, ACME, Saffire, FLEX) into a synchronized schema for solid, droplet, and gaseous fuel comparisons.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-300/60 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-500">Indexed Catalog:</span>
              <span className="font-bold text-[#0B2374]">24 Studies / 1,926 Empirical Runs</span>
            </div>
          </div>

          {/* Pillar 02 */}
          <div
            className="rounded-[36px] bg-gray-200/50 p-6 sm:p-7 hover:border-amber-300 transition-all flex flex-col justify-between"
            data-testid="contribution-card-gap-matrix"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Pillar 02
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Evidence Gap Matrix Engine
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Audits partial-gravity knowledge voids (0 &lt; g &lt; 1). Explicitly flags the Moon (0.16g) and Mars (0.38g) as critical empirical gaps lacking direct burn tests.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-300/60 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-500">Knowledge Void:</span>
              <span className="font-bold text-rose-600">Moon (0.16g) &amp; Mars (0.38g) CRITICAL GAPS</span>
            </div>
          </div>

          {/* Pillar 03 */}
          <div
            className="rounded-[36px] bg-gray-200/50 p-6 sm:p-7 hover:border-lime-400 transition-all flex flex-col justify-between"
            data-testid="contribution-card-guarded-physics"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-lime-50 border border-lime-300 flex items-center justify-center text-lime-700">
                  <ShieldCheck className="w-5 h-5 text-lime-700" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#D4FC02]/20 text-zinc-950 border border-lime-300">
                  Pillar 03
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Guarded Predictive Physics
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Replaces AI hallucinations with deterministic safety interlocks. Evaluates flammability across 6 physical dimensions (Gravity, Material, Oxygen, Pressure, Airflow, Combined).
              </p>
            </div>
            <div className="pt-4 border-t border-gray-300/60 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-500">Reliability:</span>
              <span className="font-bold text-lime-700">6-D Deterministic Gap Matrix</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
