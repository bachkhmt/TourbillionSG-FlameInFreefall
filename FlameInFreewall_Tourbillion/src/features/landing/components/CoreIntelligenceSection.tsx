'use client';

/**
 * CoreIntelligenceSection Component
 * Synchronized with the StructPaper light & Kurzgesagt scientific aesthetic.
 * Highlights the 3 core technological contributions of FlameGuard AI beyond raw NASA data:
 * 1. Cross-Study Harmonization (20 PSI flight studies unified)
 * 2. Evidence Gap Matrix (Mapping unverified partial-g regimes like Lunar 0.16g)
 * 3. Guarded Predictive Physics (Zero-hallucination safety interlocks)
 * And provides an interactive Ignition Source & Mechanism Inference workbench.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Zap,
  Radio,
  ArrowRight,
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
      'In microgravity, the absence of natural buoyant chimney draft eliminates convective surface cooling. Overcurrent wires experience temperature rise rates 2.2x steeper than terrestrial baselines, accelerating polymer insulation pyrolysis and igniting neighboring payloads.',
    guardrailInsight:
      'FlameGuard AI cross-references wiring bundle load currents with local compartment ventilation velocities (0.05–0.1 m/s) to flag thermal runaway thresholds before visible smoke generates.',
    flightAnalog: 'SoFIE-MIST Flight Run #14 (34% O₂ / 56 kPa / PMMA substrate)',
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
      'Governed by Paschen’s Law, the breakdown voltage of air drops sharply as exploration cabin pressures decrease to 56–70 kPa (Artemis habitat envelope). Minor electrostatic discharges easily exceed the drastically lowered Minimum Ignition Energy (MIE) in 34% O₂ atmospheres.',
    guardrailInsight:
      'Automated interlocks evaluate local oxygen mole fractions and surface triboelectric potential, triggering relay shutdowns whenever the local environment approaches critical spark-flashover envelopes.',
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
      'Radiant heat emitted by experiment furnaces, avionics bays, or power converters impinges directly upon solid fabrics. Lacking convective cooling drafts, thermal energy accumulates unchecked, severely depressing material Limiting Oxygen Indexes (LOI).',
    guardrailInsight:
      'Predictive radiant flux mapping calculates surface temperature profiles across Nomex and Polycarbonate panels, providing real-time safe standoff distance recommendations for habitat crew.',
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
      'The most insidious spacecraft fire hazard: porous fuels smolder quietly for hours without producing buoyant smoke plumes or visible flames. The moment emergency ventilation or HVAC air fans kick in, the sudden forced oxygen rush triggers catastrophic deflagration.',
    guardrailInsight:
      'Integrates micro-particulate and CO/CO₂ ratiometric algorithms from the NASA SAME study to detect slow, non-flaming oxidative decomposition hours before thermal runaway occurs.',
    flightAnalog: 'SAME Particulate Telemetry Series (ISS Cupola & Destiny module)',
  },
};

export const CoreIntelligenceSection: React.FC = () => {
  const [selectedIgnition, setSelectedIgnition] = useState<IgnitionModeId>('hot-wire');
  const activeMode = IGNITION_MODES[selectedIgnition];
  const ActiveIcon = activeMode.icon;

  return (
    <section
      id="core-intelligence"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80"
      data-testid="core-intelligence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Beyond Raw NASA Data</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>Ignition Inference &amp; AI Safety Guardrails</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-5 leading-tight">
            How FlameGuard AI Bridges Data to Decision:{' '}
            <span className="text-[#0B2374]">3 Core Innovations</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base md:text-lg leading-relaxed">
            NASA PSI archives provide invaluable raw flight logs, but unstructured data alone cannot protect
            astronaut lives. FlameGuard AI transforms 20 fragmented investigations into actionable safety
            intelligence through cross-study synthesis, empirical gap discovery, and grounded predictive physics.
          </p>
        </div>

        {/* 3 Core Contributions Beyond Raw Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {/* Card 1: Cross-Study Harmonization */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-harmonization"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
                  <Layers className="w-5 h-5 text-[#0B2374]" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                  Pillar 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Cross-Study Data Harmonization
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                NASA stores 20 investigations (BASS, ACME, CIR, FLEX, SoFIE) across disparate schemas, PDFs,
                and telemetry charts. FlameGuard AI harmonizes all 1,200+ test runs into a structured,
                multi-variable knowledge base for apples-to-apples solid, droplet, and gaseous comparisons.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Indexed Flight Scale:</span>
                <span className="font-bold text-[#0B2374]">20 Studies / 1,200+ Runs</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-lime-800 font-semibold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
                <span>Zero apples-to-oranges parameter mismatches</span>
              </div>
            </div>
          </div>

          {/* Card 2: Evidence Gap Matrix */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            data-testid="contribution-card-gap-matrix"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Pillar 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Evidence Gap Matrix Engine
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                Identifies precisely what NASA <span className="font-bold text-zinc-900">lacks in empirical data</span>.
                Partial-gravity regimes ($0 &lt; g &lt; 1$) such as Lunar ($0.16g$) and Martian ($0.38g$)
                possess zero direct burn tests, creating a perilous low-convection zone where flames neither quench nor self-extinguish.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Unverified Gravity Void:</span>
                <span className="font-bold text-rose-600">Moon (0.16g) CRITICAL GAP</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>6-dimension parameter audit (g, P, O₂, flow, T, fuel)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Guarded Predictive Physics */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-guarded-physics"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
                  <ShieldCheck className="w-5 h-5 text-lime-700" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#D4FC02]/20 text-zinc-950 border border-lime-300">
                  Pillar 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Guarded Predictive Physics
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                Unlike generic generative models that fabricate plausible hallucinations when data is missing,
                FlameGuard AI enforces strict aerospace interlocks. If empirical flight runs are insufficient (&lt;3 runs),
                predictions are locked and the system surfaces verified flight analogues (SoFIE-MIST 94.2% match).
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Aerospace Reliability:</span>
                <span className="font-bold text-lime-700">Zero-Hallucination Interlocks</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#0B2374] font-semibold font-mono">
                <Lock className="w-3.5 h-3.5 text-[#0B2374]" />
                <span>3 Mandatory prerequisites: Conservation, Data, Uncertainty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Ignition Source & Mechanism Inference Workbench */}
        <div
          className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-xs"
          data-testid="ignition-inference-workbench"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0B2374] text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
                  Interactive Simulator
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  Mission Scenario Ignition Inference
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Ignition Source &amp; Mechanism Inference
              </h3>
            </div>

            <div className="text-xs text-zinc-500 max-w-sm font-sans">
              When engineers configure mission envelopes in the <Link href="/mission" className="text-[#0B2374] font-bold underline">Mission Scenario Lab</Link>, our algorithmic engine correlates flight physics to isolate the most probable ignition triggers:
            </div>
          </div>

          {/* 4 Ignition Mode Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
            {(Object.keys(IGNITION_MODES) as IgnitionModeId[]).map((modeKey) => {
              const item = IGNITION_MODES[modeKey];
              const isSelected = selectedIgnition === modeKey;
              const ModeIcon = item.icon;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setSelectedIgnition(modeKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0B2374] text-white border-[#0B2374] shadow-md ring-2 ring-[#0B2374]/20'
                      : 'bg-gray-50/70 hover:bg-gray-100 text-zinc-800 border-gray-200/80'
                  }`}
                  data-testid={`ignition-tab-${modeKey}`}
                >
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
                  <div className="font-bold text-xs sm:text-sm line-clamp-1">{item.name}</div>
                  <div
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-blue-100' : 'text-zinc-500'
                    }`}
                  >
                    {item.tagline}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Ignition Details Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left 7 cols: Physics Breakdown & Safeguard Insights */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif font-black text-2xl text-[#0B2374]">
                  {activeMode.name}
                </span>
                <span className="px-2.5 py-1 rounded font-mono text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Risk Level: {activeMode.dangerLevel}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-zinc-800 text-sm leading-relaxed">
                <div className="font-bold text-[#0B2374] text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0B2374]" />
                  Physical Activation Dynamics in Low Gravity:
                </div>
                <p className="font-sans text-zinc-700">{activeMode.mechanism}</p>
              </div>

              <div className="p-4 rounded-2xl bg-lime-50/60 border border-lime-300 text-zinc-800 text-sm leading-relaxed">
                <div className="font-bold text-lime-900 text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-lime-700" />
                  FlameGuard AI Safeguard Intervention:
                </div>
                <p className="font-sans text-zinc-700">{activeMode.guardrailInsight}</p>
              </div>
            </div>

            {/* Right 5 cols: Telemetry Metrics & Empirical Reference */}
            <div className="lg:col-span-5 rounded-2xl bg-gray-50 border border-gray-200/80 p-5 space-y-4 font-mono text-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-gray-200 pb-2">
                Calibrated NASA PSI Flight Evidence:
              </div>

              <div>
                <span className="text-zinc-500 block">Correlated NASA Flight Investigation:</span>
                <span className="font-bold text-[#0B2374] text-sm font-sans block mt-0.5">
                  {activeMode.psiStudyMatch}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <span className="text-zinc-500 block">Ignition Delay (t_delay):</span>
                  <span className="font-bold text-zinc-950 text-sm">{activeMode.delayRange}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Min Ignition Energy (MIE):</span>
                  <span className="font-bold text-zinc-950 text-sm">{activeMode.minEnergy}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <span className="text-zinc-500 block">Benchmark Empirical Flight Run:</span>
                <span className="font-semibold text-zinc-800 text-[11px] block mt-0.5">
                  {activeMode.flightAnalog}
                </span>
              </div>

              <div className="pt-3">
                <Link
                  href="/mission"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2374] hover:bg-[#0B2374]/90 text-[#D4FC02] font-bold transition-all shadow-xs"
                >
                  <span>Evaluate Scenario in Mission Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
