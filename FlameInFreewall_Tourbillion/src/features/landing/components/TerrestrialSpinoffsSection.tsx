'use client';

/**
 * TerrestrialSpinoffsSection Component
 * Synchronized with StructPaper light & Kurzgesagt scientific aesthetic.
 * Highlights the translation of NASA microgravity combustion research into life-saving
 * next-generation safety systems and commercial spinoff technologies on Earth:
 * 1. Zero-Leak High-Pressure Water Mist Extinguishing Valves (EV Battery vaults & Data Centers)
 * 2. Early Optical Smoke Sensors for Low-Convection Regimes (Deep underground mining & nuclear storage)
 * 3. Next-Gen Lightweight SCBA & Flashover-Resistant Textiles (Urban & wildland first responders)
 */

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Droplets,
  Eye,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react';

interface TerrestrialSpinoff {
  id: string;
  number: string;
  category: string;
  title: string;
  subtitle: string;
  heritageSource: string;
  environment: string;
  description: string;
  primaryMetric: { value: string; label: string };
  secondaryMetric: { value: string; label: string };
  features: string[];
}

const SPINOFFS: TerrestrialSpinoff[] = [
  {
    id: 'water-mist',
    number: '01',
    category: 'EV Batteries & Mission-Critical Infrastructure',
    title: 'Zero-Leak High-Pressure Water Mist Valve',
    subtitle: 'Micro-Droplet Heat Sink for Lithium Thermal Runaway',
    heritageSource: 'NASA CIR / FLEX Droplet Extinction Research',
    environment: 'EV Lithium-Ion Battery Storage, Naval Submarines & Hyperscale Data Centers',
    description:
      'Microgravity liquid droplet investigations demonstrated that micro-droplets under 50 microns achieve 7x higher thermal absorption surface area than conventional deluge systems. High-pressure rapid-flash nozzles vaporize instantly upon touching the flame front, suppressing thermal runaway in high-voltage lithium battery packs without water logging or causing dielectric short-circuit arcing.',
    primaryMetric: { value: '-90%', label: 'Water Volume Required' },
    secondaryMetric: { value: '0.00%', label: 'Dielectric Conductivity Risk' },
    features: [
      'Suppresses thermal runaway in battery racks within 45 seconds',
      'Zero electrical conductivity hazard for high-voltage server racks',
      'Certified for hermetically sealed, high-pressure environments',
    ],
  },
  {
    id: 'smoke-sensor',
    number: '02',
    category: 'Stagnant-Air Early Warning Systems',
    title: 'Early Optical Smoke Sensor for Low-Convection Regimes',
    subtitle: 'Multi-Wavelength Nano-Soot Particulate Discrimination',
    heritageSource: 'NASA SAME (Spacecraft Atmosphere Monitor Experiments)',
    environment: 'Deep Underground Mining Shafts, Nuclear Material Archives & Cargo Aircraft',
    description:
      'Standard terrestrial smoke alarms rely on hot buoyant plumes to carry soot up to ceiling sensors. In stagnant deep-shaft mines, submarine compartments, or dead-air storage silos, smoldering smoke hovers near the floor. Derived from ISS cabin particle monitors, multi-wavelength optical sensors sample sub-micron soot particulates directly from stagnant air, alerting operators over 3 minutes earlier.',
    primaryMetric: { value: '+180s', label: 'Earlier Hazard Alert' },
    secondaryMetric: { value: '99.4%', label: 'False-Alarm Rejection' },
    features: [
      'Detects quiescent smoldering in dead-convection ventilation zones',
      'Distinguishes harmless coal dust / humidity from combustion soot',
      '10+ year operational sensor life in corrosive industrial air',
    ],
  },
  {
    id: 'firefighter-gear',
    number: '03',
    category: 'Next-Gen First Responder Life Support',
    title: 'Lightweight SCBA & Flashover-Resistant Protective Gear',
    subtitle: 'Spaceflight Composite Pressure Vessels & Thermal Fabrics',
    heritageSource: 'NASA SoFIE-GEL & Material Flammability Standards',
    environment: 'Urban Firefighting, Wildland Fire Suppression & Confined Rescue',
    description:
      'Polymer pyrolysis models and extinction boundary tests conducted inside the ISS Combustion Integrated Rack guided next-generation 300-bar carbon-composite breathing cylinders and multi-layer thermal protective suits. The resulting system drastically reduces back fatigue while shielding first responders against sudden 1,100°C flashover temperature spikes.',
    primaryMetric: { value: '-40%', label: 'Breathing Cylinder Weight' },
    secondaryMetric: { value: '+35%', label: 'First-Responder Safe Working Window' },
    features: [
      'Ultra-lightweight 300-bar carbon-fiber breathing apparatus',
      'Spaceflight thermal weave withstands direct 1,100°C flashover',
      'Integrated real-time cylinder pressure telemetry HUD',
    ],
  },
];

export const TerrestrialSpinoffsSection: React.FC = () => {
  return (
    <section
      id="terrestrial-spinoffs"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80"
      data-testid="terrestrial-spinoffs-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4">
            <Globe className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Earth Spinoff Heritage</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>NASA Technology Transfer</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-5 leading-tight">
            From Orbit to Earth:{' '}
            <span className="text-[#0B2374]">Next-Gen Terrestrial Safety</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base md:text-lg leading-relaxed">
            When combustion is stripped of buoyant Archimedes forces in microgravity, physicists observe
            its purest chemical and thermodynamic mechanisms. The fundamental insights gained in orbit
            do not remain in space; they directly protect human lives, critical facilities, and first responders on Earth.
          </p>
        </div>

        {/* 3 Spinoff Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {SPINOFFS.map((spinoff, index) => {
            const Icon =
              index === 0 ? Droplets : index === 1 ? Eye : ShieldCheck;

            return (
              <div
                key={spinoff.id}
                data-testid={`spinoff-card-${spinoff.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-3xl p-7 sm:p-8 border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#0B2374]/30 transition-all duration-300"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                      {spinoff.category}
                    </span>
                    <span className="font-serif text-2xl font-bold text-gray-300 group-hover:text-[#0B2374] transition-colors">
                      {spinoff.number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-5 group-hover:bg-[#D4FC02]/20 group-hover:border-lime-300 transition-all">
                    <Icon className="w-6 h-6 text-[#0B2374]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374] mb-2 leading-snug">
                    {spinoff.title}
                  </h3>
                  <div className="text-xs font-mono text-zinc-500 mb-4 line-clamp-1">
                    {spinoff.subtitle}
                  </div>

                  {/* Heritage Source Tag */}
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-zinc-700 font-mono text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                    <span className="font-semibold text-zinc-900">NASA Flight Heritage:</span>
                    <span>{spinoff.heritageSource}</span>
                  </div>

                  {/* Target Environment */}
                  <div className="text-xs font-sans text-[#0B2374] font-medium mb-4 bg-blue-50/60 p-3 rounded-xl border border-blue-200/70">
                    <span className="font-bold">Deployment Scope:</span> {spinoff.environment}
                  </div>

                  <p className="text-sm text-zinc-600 font-sans leading-relaxed mb-6">
                    {spinoff.description}
                  </p>
                </div>

                <div>
                  {/* Two Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-100 mb-6">
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-black text-[#0B2374]">
                        {spinoff.primaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.primaryMetric.label}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-black text-[#0B2374]">
                        {spinoff.secondaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.secondaryMetric.label}
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2">
                    {spinoff.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-zinc-700 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technology Transfer Impact Banner */}
        <div
          className="rounded-3xl border border-[#0B2374]/20 bg-gradient-to-r from-[#0B2374] to-[#1E3A8A] text-white p-8 sm:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-6"
          data-testid="spinoff-impact-banner"
        >
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA Technology Transfer Initiative</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              &quot;The safest fire on Earth is the one understood in the stillness of space.&quot;
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              FlameGuard AI provides simulation tools and empirical correlation indexes so terrestrial fire safety
              institutes and engineering teams can directly harness thermodynamic data from 20 spaceflight experiments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 font-bold text-sm shadow-xs transition-all"
            >
              <Activity className="w-4 h-4 text-zinc-950" />
              <span>Explore Telemetry Data</span>
            </Link>
            <Link
              href="/explorer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
            >
              <span>Review 20 PSI Studies</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
