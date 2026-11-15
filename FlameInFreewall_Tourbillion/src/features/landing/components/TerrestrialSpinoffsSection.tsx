'use client';

/**
 * TerrestrialSpinoffsSection Component
 * Synchronized with StructPaper light & Kurzgesagt aesthetic.
 * Highlights the translation of NASA microgravity combustion research into life-saving
 * next-generation safety systems and commercial spinoff technologies on Earth:
 * 1. Zero-Leak High-Pressure Water Mist Extinguishing Valves (EV Battery vaults & Data Centers)
 * 2. Early Optical Smoke Sensors for Low-Convection Regimes (Deep underground mining & nuclear storage)
 * 3. Next-Gen Lightweight SCBA & Flashover-Resistant Textiles (Urban & wildland first responders)
 */

import React from 'react';
import {
  Globe,
  Droplets,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
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
    category: 'EV Batteries & Mission-Critical Data Centers',
    title: 'Zero-Leak High-Pressure Water Mist Valve',
    subtitle: 'Micro-Droplet Heat Sink for Lithium Thermal Runaway',
    heritageSource: 'NASA CIR / FLEX Droplet Extinction Research',
    environment: 'EV Lithium-Ion Battery Vaults, Naval Submarines & Data Centers',
    description:
      'Micro-droplets (<50 µm) derived from ISS droplet tests achieve 7x higher thermal absorption surface area than sprinklers. Instantly suffocates EV battery thermal runaway with zero flooding or dielectric arcing.',
    primaryMetric: { value: '-90%', label: 'Water Volume Required' },
    secondaryMetric: { value: '0.00%', label: 'Dielectric Conductivity Risk' },
    features: [
      'Suppresses battery thermal runaway in under 45 seconds',
      'Zero electrical conductivity hazard for high-voltage racks',
      'Engineered for sealed, high-pressure environments',
    ],
  },
  {
    id: 'smoke-sensor',
    number: '02',
    category: 'Stagnant-Air Early Warning Systems',
    title: 'Early Optical Smoke Sensor for Low-Convection Regimes',
    subtitle: 'Multi-Wavelength Nano-Soot Particulate Discrimination',
    heritageSource: 'NASA SAME (Spacecraft Atmosphere Monitor Experiments)',
    environment: 'Deep Underground Mining Shafts, Nuclear Archives & Cargo Holds',
    description:
      'Traditional smoke detectors fail when hot air cannot rise. Derived from ISS cabin particle monitors, multi-wavelength optical sensors sample sub-micron soot directly in stagnant air, alerting operators over 3 minutes earlier.',
    primaryMetric: { value: '+180s', label: 'Earlier Hazard Alert' },
    secondaryMetric: { value: '99.4%', label: 'False-Alarm Rejection' },
    features: [
      'Detects quiescent smoldering in dead-convection ventilation zones',
      'Distinguishes harmless coal dust and humidity from active soot',
      '10+ year operational sensor life in harsh industrial atmospheres',
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
      'Polymer pyrolysis models from ISS flammability experiments guided 300-bar carbon-composite cylinder designs and thermal fabrics resistant to 1,100°C flashovers, reducing physical fatigue and extending survival margins.',
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
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80 font-sans"
      data-testid="terrestrial-spinoffs-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4 font-mono">
            <Globe className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Earth Spinoff Heritage</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>NASA Technology Transfer</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-4 leading-tight">
            From Orbit to Earth:{' '}
            <span className="text-[#0B2374]">Next-Gen Terrestrial Safety</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            When combustion is stripped of buoyant Archimedes forces in microgravity, physicists observe
            its purest chemical mechanisms. Here is how spaceflight fire science directly protects human lives on Earth.
          </p>
        </div>

        {/* 3 Spinoff Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {SPINOFFS.map((spinoff, index) => {
            const Icon =
              index === 0 ? Droplets : index === 1 ? Eye : ShieldCheck;

            return (
              <div
                key={spinoff.id}
                data-testid={`spinoff-card-${spinoff.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#0B2374]/30 transition-all duration-300"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B2374]/5 text-[#0B2374]">
                      {spinoff.category}
                    </span>
                    <span className="font-mono text-xl font-bold text-gray-300 group-hover:text-[#0B2374] transition-colors">
                      {spinoff.number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 group-hover:bg-[#D4FC02]/20 group-hover:border-lime-300 transition-all">
                    <Icon className="w-5 h-5 text-[#0B2374]" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#0B2374] mb-1.5 leading-snug">
                    {spinoff.title}
                  </h3>
                  <div className="text-xs font-mono text-zinc-500 mb-3.5 line-clamp-1">
                    {spinoff.subtitle}
                  </div>

                  {/* Heritage Source Tag */}
                  <div className="mb-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-zinc-700 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                    <span className="font-semibold text-zinc-900">NASA Flight Heritage:</span>
                    <span>{spinoff.heritageSource}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 font-sans leading-relaxed mb-5">
                    {spinoff.description}
                  </p>
                </div>

                <div>
                  {/* Two Key Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-gray-100 mb-4">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
                      <div className="text-lg sm:text-xl font-black text-[#0B2374]">
                        {spinoff.primaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.primaryMetric.label}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
                      <div className="text-lg sm:text-xl font-black text-[#0B2374]">
                        {spinoff.secondaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.secondaryMetric.label}
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1.5">
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

        {/* Technology Transfer Impact Banner - Clean Quote & Summary without Midway Exits */}
        <div
          className="rounded-3xl border border-[#0B2374]/20 bg-gradient-to-r from-[#0B2374] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-5"
          data-testid="spinoff-impact-banner"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA Technology Transfer Initiative</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              &quot;The safest fire on Earth is the one understood in the stillness of space.&quot;
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
              FlameGuard AI bridges raw microgravity combustion data into calibrated fire protection models, empowering industrial safety engineers and municipal first responders worldwide.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-[#D4FC02] uppercase tracking-wider bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span>3 Verified Spinoff Paths</span>
          </div>
        </div>
      </div>
    </section>
  );
};
