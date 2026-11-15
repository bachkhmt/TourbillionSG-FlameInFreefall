'use client';

/**
 * CoreIntelligenceSection Component
 * Synchronized with StructPaper light & Kurzgesagt aesthetic.
 * Highlights the 3 core technological contributions of FlameGuard AI beyond raw NASA data:
 * 1. Cross-Study Data Harmonization (20 PSI flight studies unified)
 * 2. Evidence Gap Matrix (Mapping unverified partial-g regimes like Lunar 0.16g)
 * 3. Guarded Predictive Physics (Zero-hallucination safety interlocks)
 * And provides a directly visible, concise 4-part Ignition Source & Mechanism layout.
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
  Info,
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
  flightAnalog: string;
}

const IGNITION_MODES: Record<IgnitionModeId, IgnitionMode> = {
  'hot-wire': {
    id: 'hot-wire',
    name: 'Hot-Wire Overload',
    tagline: 'Conductor Overheating & Contact Ignition',
    icon: Flame,
    psiStudyMatch: 'NASA SoFIE-MIST (Material Ignition and Suppression Test)',
    delayRange: '1.8s – 4.5s',
    minEnergy: '12 – 18 Joules',
    dangerLevel: 'High',
    mechanism:
      'Without buoyant airflow cooling, overcurrent conductors experience a 2.2x faster temperature spike, triggering rapid polymer insulation pyrolysis.',
    guardrailInsight:
      'Correlates wiring bundle amperage with cabin ventilation velocities (0.05–0.1 m/s) to flag thermal runaway before smoke develops.',
    flightAnalog: 'SoFIE-MIST Flight Run #14 (34% O₂ / 56 kPa / PMMA)',
  },
  'spark': {
    id: 'spark',
    name: 'Electrical Arc & Spark',
    tagline: 'Low-Pressure Dielectric Breakdown',
    icon: Zap,
    psiStudyMatch: 'NASA ACME (Advanced Combustion via Microgravity Experiments)',
    delayRange: '< 0.05s (Instantaneous)',
    minEnergy: '0.2 – 0.8 mJ',
    dangerLevel: 'Critical Flashover Risk',
    mechanism:
      'Governed by Paschen’s Law, dielectric breakdown voltage drops sharply in reduced pressure (56–70 kPa). Low-energy static sparks trigger instant flashovers in 34% O₂.',
    guardrailInsight:
      'Automated interlocks evaluate oxygen mole fractions and surface static charge, flagging hazard zones before relay switching occurs.',
    flightAnalog: 'ACME Spark Ignition Calibration Matrix (0.00g chamber)',
  },
  'radiant': {
    id: 'radiant',
    name: 'Radiant Heat Flashover',
    tagline: 'Surface Thermal Flux & Flashover',
    icon: Radio,
    psiStudyMatch: 'NASA BASS-II (Burning and Suppression of Solids - II)',
    delayRange: '12s – 25s',
    minEnergy: '25 – 40 kW/m²',
    dangerLevel: 'Elevated',
    mechanism:
      'Thermal radiation from heaters or avionics impinges on fabrics. Without convective chimney heat dispersal, fuel temperatures accumulate unchecked.',
    guardrailInsight:
      'Radiant flux models calculate temperature curves across Nomex/polycarbonate, predicting flashover thresholds and safe equipment spacing.',
    flightAnalog: 'BASS-II Radiant Heating Curve #09 (Flat fabric in quiescent air)',
  },
  'smolder': {
    id: 'smolder',
    name: 'Quiescent Smoldering',
    tagline: 'Non-Convective Incubation & Fan Rush',
    icon: Sliders,
    psiStudyMatch: 'NASA SAME / CIR (Sensors & Droplet Extinction Investigations)',
    delayRange: '15 min – 2 hours',
    minEnergy: 'Ultra-Low (Cumulative Heat)',
    dangerLevel: 'Critical Flashover Risk',
    mechanism:
      'The most insidious spacecraft fire hazard: porous fuels smolder quietly for hours with zero buoyant plumes. When HVAC fans kick in, the sudden oxygen rush causes explosive flaming.',
    guardrailInsight:
      'Employs sub-micron particulate and CO/CO₂ ratiometric algorithms from NASA SAME to identify non-flaming oxidation hours in advance.',
    flightAnalog: 'SAME Particulate Telemetry Series (ISS Cupola & Destiny module)',
  },
};

export const CoreIntelligenceSection: React.FC = () => {
  const [selectedIgnition, setSelectedIgnition] = useState<IgnitionModeId>('hot-wire');
  const activeMode = IGNITION_MODES[selectedIgnition];

  return (
    <section
      id="core-intelligence"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80 font-sans"
      data-testid="core-intelligence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Beyond Raw NASA Data</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>Ignition Inference &amp; AI Safety Guardrails</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-4 leading-tight">
            How FlameGuard AI Bridges Data to Decision:{' '}
            <span className="text-[#0B2374]">3 Core Innovations</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            NASA PSI archives provide raw flight logs, but unstructured data alone cannot protect crew lives.
            FlameGuard AI introduces three foundational pillars to convert raw tests into predictive safety guardrails.
          </p>
        </div>

        {/* 3 Core Contributions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Pillar 01 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-2xs hover:shadow-xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-harmonization"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
                  <Layers className="w-5 h-5 text-[#0B2374]" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                  Pillar 01
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Cross-Study Data Harmonization
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Normalizes 20 independent NASA investigations (BASS, ACME, CIR, FLEX, SoFIE) into a unified multi-variable schema for rigorous apples-to-apples solid, droplet, and gas flame comparisons.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Indexed Flight Scale:</span>
              <span className="font-bold text-[#0B2374]">20 Studies / 1,200+ Runs</span>
            </div>
          </div>

          {/* Pillar 02 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            data-testid="contribution-card-gap-matrix"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Pillar 02
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Evidence Gap Matrix Engine
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Audits partial-gravity knowledge voids ($0 &lt; g &lt; 1$). Highlights the Moon ($0.16g$) and Mars ($0.38g$) as critical gaps where zero direct burn runs exist, preventing blind extrapolation.
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Unverified Gravity Void:</span>
              <span className="font-bold text-rose-600">Moon (0.16g) CRITICAL GAP</span>
            </div>
          </div>

          {/* Pillar 03 */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-2xs hover:shadow-xs hover:border-lime-400 transition-all flex flex-col justify-between"
            data-testid="contribution-card-guarded-physics"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-lime-50 border border-lime-300 flex items-center justify-center text-lime-700">
                  <ShieldCheck className="w-5 h-5 text-lime-700" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#D4FC02]/20 text-zinc-950 border border-lime-300">
                  Pillar 03
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">
                Guarded Predictive Physics
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-4">
                Replaces AI hallucinations with deterministic guardrails. When empirical flight runs are insufficient (&lt;3 runs), predictions are locked and the system routes to verified analogues (SoFIE-MIST 94.2% match).
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Aerospace Reliability:</span>
              <span className="font-bold text-lime-700">Zero-Hallucination Interlocks</span>
            </div>
          </div>
        </div>

        {/* Directly Visible Ignition Source Inference Workbench */}
        <div
          className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs"
          data-testid="ignition-inference-workbench"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-gray-200/80 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#0B2374] text-[#D4FC02] font-mono text-[11px] font-bold uppercase tracking-wider">
                  Physics Inference Engine
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  Direct Multi-Mechanism Comparison
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                Ignition Source &amp; Mechanism Inference
              </h3>
            </div>
            <p className="text-xs text-zinc-500 max-w-md font-sans">
              Click any mechanism card below to highlight its physical activation dynamics and calibrated NASA PSI flight benchmark:
            </p>
          </div>

          {/* 4 Cards Grid - Directly Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {(Object.keys(IGNITION_MODES) as IgnitionModeId[]).map((modeKey) => {
              const item = IGNITION_MODES[modeKey];
              const isSelected = selectedIgnition === modeKey;
              const ModeIcon = item.icon;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setSelectedIgnition(modeKey)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0B2374] text-white border-[#0B2374] shadow-md ring-2 ring-[#0B2374]/20'
                      : 'bg-gray-50/70 hover:bg-gray-100 text-zinc-800 border-gray-200/80'
                  }`}
                  data-testid={`ignition-tab-${modeKey}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <ModeIcon
                        className={`w-5 h-5 ${
                          isSelected ? 'text-[#D4FC02]' : 'text-[#0B2374]'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-[#D4FC02]'
                            : 'bg-zinc-200/80 text-zinc-700'
                        }`}
                      >
                        {item.delayRange}
                      </span>
                    </div>
                    <div className="font-bold text-sm line-clamp-1">{item.name}</div>
                    <div
                      className={`text-[11px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {item.tagline}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-blue-200' : 'text-zinc-500'}>MIE:</span>
                    <span className="font-bold">{item.minEnergy}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Detail Breakdown Banner */}
          <div className="rounded-2xl bg-gray-50/80 border border-gray-200/80 p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-[#0B2374]">
                  {activeMode.name}
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Risk: {activeMode.dangerLevel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
                <span className="font-bold text-zinc-900">Dynamics: </span>
                {activeMode.mechanism}
              </p>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
                <span className="font-bold text-lime-900">Guardrail: </span>
                {activeMode.guardrailInsight}
              </p>
            </div>

            <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-200/80 font-mono text-xs space-y-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                NASA PSI Flight Anchor:
              </div>
              <div className="font-bold text-[#0B2374] text-xs font-sans line-clamp-2">
                {activeMode.psiStudyMatch}
              </div>
              <div className="text-[11px] text-zinc-600 border-t border-gray-100 pt-1.5">
                Benchmark: <span className="font-semibold text-zinc-900">{activeMode.flightAnalog}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
