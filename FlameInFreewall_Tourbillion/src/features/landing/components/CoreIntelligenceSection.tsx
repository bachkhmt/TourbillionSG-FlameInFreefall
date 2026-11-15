'use client';

/**
 * CoreIntelligenceSection Component
 * Synchronized with StructPaper light & Kurzgesagt aesthetic.
 * Concise, scannable layout communicating the 3 core innovations beyond raw NASA data
 * and direct 4-mechanism ignition inference with zero midway exit distractions.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export type IgnitionModeId = 'hot-wire' | 'spark' | 'radiant' | 'smolder';

export interface IgnitionMode {
  id: IgnitionModeId;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  psiStudyMatch: string;
  delayRange: string;
  minEnergy: string;
  dangerLevel: 'Elevated' | 'High' | 'Critical Flashover Risk';
  mechanism: string;
  guardrailInsight: string;
}

const IGNITION_MODES: Record<IgnitionModeId, IgnitionMode> = {
  'hot-wire': {
    id: 'hot-wire',
    name: 'Hot-Wire Overload',
    tagline: 'Conductor Overheating & Pyrolysis',
    icon: Flame,
    psiStudyMatch: 'NASA SoFIE-MIST',
    delayRange: '1.8s – 4.5s',
    minEnergy: '12 – 18 Joules',
    dangerLevel: 'High',
    mechanism:
      'Lacking buoyant air cooling, overcurrent conductors spike 2.2x faster in temperature, triggering rapid polymer insulation pyrolysis.',
    guardrailInsight:
      'Cross-checks bundle amperage with cabin airflow (0.05 m/s) to flag thermal runaway before smoke appears.',
  },
  'spark': {
    id: 'spark',
    name: 'Electrical Arc & Spark',
    tagline: 'Low-Pressure Breakdown',
    icon: Zap,
    psiStudyMatch: 'NASA ACME',
    delayRange: '< 0.05s (Instantaneous)',
    minEnergy: '0.2 – 0.8 mJ',
    dangerLevel: 'Critical Flashover Risk',
    mechanism:
      'Governed by Paschen’s Law, breakdown voltage plunges in reduced pressures (56–70 kPa). Low-energy static sparks trigger instant flashovers in 34% O₂.',
    guardrailInsight:
      'Automated interlocks evaluate oxygen fractions and static charge, flagging hazard zones before relays switch.',
  },
  'radiant': {
    id: 'radiant',
    name: 'Radiant Heat Flashover',
    tagline: 'Surface Thermal Flux Buildup',
    icon: Radio,
    psiStudyMatch: 'NASA BASS-II',
    delayRange: '12s – 25s',
    minEnergy: '25 – 40 kW/m²',
    dangerLevel: 'Elevated',
    mechanism:
      'Thermal radiation from avionics impinges on fabrics. Without chimney draft dispersal, temperatures accumulate unchecked.',
    guardrailInsight:
      'Radiant flux models calculate temperature curves across Nomex panels, predicting safe equipment spacing.',
  },
  'smolder': {
    id: 'smolder',
    name: 'Quiescent Smoldering',
    tagline: 'Silent Incubation & Fan Rush',
    icon: Sliders,
    psiStudyMatch: 'NASA SAME / CIR',
    delayRange: '15 min – 2 hours',
    minEnergy: 'Ultra-Low (Cumulative Heat)',
    dangerLevel: 'Critical Flashover Risk',
    mechanism:
      'The most insidious spacecraft fire hazard: porous fuels smolder quietly for hours with zero buoyant smoke plumes. When HVAC fans engage, the oxygen rush triggers explosive deflagration.',
    guardrailInsight:
      'Sub-micron soot and CO/CO₂ ratiometrics from NASA SAME detect non-flaming oxidation hours in advance.',
  },
};

export const CoreIntelligenceSection: React.FC = () => {
  const [selectedIgnition, setSelectedIgnition] = useState<IgnitionModeId>('hot-wire');

  return (
    <section
      id="core-intelligence"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80 font-sans"
      data-testid="core-intelligence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - Concise & Direct */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Beyond Raw NASA Data</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>AI Safety Guardrails &amp; Ignition Inference</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mb-3">
            How FlameGuard AI Bridges Data to Decision
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Raw NASA logs cannot prevent spacecraft fires on their own. FlameGuard AI introduces three foundational pillars
            to convert fragmented experiments into verified, zero-hallucination safety guardrails.
          </p>
        </div>

        {/* 3 Core Pillars - Concise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Pillar 01 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-2xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-harmonization"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
                  <Layers className="w-4 h-4 text-[#0B2374]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B2374]/5 text-[#0B2374]">
                  Pillar 01
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1.5">
                Cross-Study Data Harmonization
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Unifies 20 disparate NASA flight studies (BASS, ACME, SoFIE) into a synchronized schema for solid, droplet, and gaseous fuel comparisons.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Indexed Catalog:</span>
              <span className="font-bold text-[#0B2374]">20 Studies / 148+ Runs</span>
            </div>
          </div>

          {/* Pillar 02 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between"
            data-testid="contribution-card-gap-matrix"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Pillar 02
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1.5">
                Evidence Gap Matrix Engine
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Audits partial-gravity knowledge voids ($0 &lt; g &lt; 1$). Flags the Moon ($0.16g$) and Mars ($0.38g$) as critical empirical gaps lacking direct burn tests.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Knowledge Void:</span>
              <span className="font-bold text-rose-600">Moon (0.16g) CRITICAL GAP</span>
            </div>
          </div>

          {/* Pillar 03 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-2xs hover:border-lime-400 transition-all flex flex-col justify-between"
            data-testid="contribution-card-guarded-physics"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-lime-50 border border-lime-300 flex items-center justify-center text-lime-700">
                  <ShieldCheck className="w-4 h-4 text-lime-700" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4FC02]/20 text-zinc-950 border border-lime-300">
                  Pillar 03
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1.5">
                Guarded Predictive Physics
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                Replaces AI hallucinations with deterministic safety interlocks. When empirical flight runs are &lt;3, predictions lock and route to verified NASA analogues.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Reliability:</span>
              <span className="font-bold text-lime-700">Zero-Hallucination Interlocks</span>
            </div>
          </div>
        </div>

        {/* 4 Direct Ignition Mechanism Cards - All in Plain Sight */}
        <div
          className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs"
          data-testid="ignition-inference-workbench"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200/80 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2374] block mb-0.5">
                Scenario Physics Inference
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                4 Primary Microgravity Ignition Triggers
              </h3>
            </div>
            <div className="text-xs text-zinc-500 font-semibold">
              Direct Multi-Mechanism Comparison
            </div>
          </div>

          {/* 4 Cards Grid - Fully Visible Directly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(IGNITION_MODES) as IgnitionModeId[]).map((modeKey) => {
              const item = IGNITION_MODES[modeKey];
              const isSelected = selectedIgnition === modeKey;
              const ModeIcon = item.icon;
              return (
                <div
                  key={modeKey}
                  onClick={() => setSelectedIgnition(modeKey)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0B2374] bg-blue-50/40 ring-2 ring-[#0B2374]/20 shadow-xs'
                      : 'border-gray-200/80 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  data-testid={`ignition-tab-${modeKey}`}
                >
                  <div>
                    {/* Top Tag & Delay */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#0B2374] shadow-2xs">
                        <ModeIcon className="w-4 h-4 text-[#0B2374]" />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0B2374] text-[#D4FC02]">
                        {item.delayRange}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-950 mb-0.5">{item.name}</h4>
                    <p className="text-[11px] text-zinc-500 mb-2 font-medium">{item.tagline}</p>

                    <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                      {item.mechanism}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200/80 space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>MIE:</span>
                      <span className="font-bold text-zinc-900">{item.minEnergy}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>Study:</span>
                      <span className="font-bold text-[#0B2374]">{item.psiStudyMatch}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
