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
    category: 'EV Batteries & Data Centers',
    title: 'Zero-Leak High-Pressure Water Mist Valve',
    subtitle: 'Micro-Droplet Heat Sink for Lithium Runaway',
    heritageSource: 'NASA CIR / FLEX Droplet Extinction',
    environment: 'EV Battery Vaults & Server Rooms',
    description:
      'Micro-droplets (<50 µm) from ISS tests provide 7x higher surface cooling, extinguishing battery thermal runaway with zero flooding or dielectric arcing.',
    primaryMetric: { value: '-90%', label: 'Water Volume' },
    secondaryMetric: { value: '0.00%', label: 'Dielectric Risk' },
    features: [
      'Suppresses runaway in under 45 seconds',
      'Zero electrical conductivity hazard',
    ],
  },
  {
    id: 'smoke-sensor',
    number: '02',
    category: 'Stagnant-Air Early Warning',
    title: 'Early Optical Smoke Sensor for Low-Convection Regimes',
    subtitle: 'Multi-Wavelength Nano-Soot Particulate Discrimination',
    heritageSource: 'NASA SAME Atmosphere Monitor',
    environment: 'Underground Mines & Nuclear Archives',
    description:
      'Multi-wavelength optical detection samples sub-micron soot directly in stagnant, non-buoyant air, triggering alarms over 3 minutes earlier.',
    primaryMetric: { value: '+180s', label: 'Earlier Warning' },
    secondaryMetric: { value: '99.4%', label: 'False-Alarm Rejection' },
    features: [
      'Detects smoldering in zero-convection zones',
      'Filters harmless dust and humidity',
    ],
  },
  {
    id: 'firefighter-gear',
    number: '03',
    category: 'First Responder Life Support',
    title: 'Lightweight SCBA & Flashover-Resistant Protective Gear',
    subtitle: 'Spaceflight Composite Pressure Vessels & Fabrics',
    heritageSource: 'NASA SoFIE-GEL Standards',
    environment: 'Urban Firefighting & Hazmat Rescue',
    description:
      'Spaceflight 300-bar carbon composites and 1,100°C flashover weaves reduce cylinder weight by 40% while extending safe working duration.',
    primaryMetric: { value: '-40%', label: 'Cylinder Weight' },
    secondaryMetric: { value: '+35%', label: 'Safe Work Window' },
    features: [
      'Ultra-light 300-bar carbon-fiber apparatus',
      'Withstands direct 1,100°C flashover heat',
    ],
  },
];

export const TerrestrialSpinoffsSection: React.FC = () => {
  return (
    <section
      id="terrestrial-spinoffs"
      className="py-16 md:py-20 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80 font-sans"
      data-testid="terrestrial-spinoffs-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-3">
            <Globe className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Earth Spinoff Heritage</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>NASA Technology Transfer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mb-3 leading-tight">
            From Orbit to Earth:{' '}
            <span className="text-[#0B2374]">Next-Gen Terrestrial Safety</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            When buoyant forces vanish in freefall, combustion reveals its fundamental chemical kinetics.
            Here is how spaceflight fire research directly protects human lives on Earth.
          </p>
        </div>

        {/* 3 Spinoff Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {SPINOFFS.map((spinoff, index) => {
            const Icon =
              index === 0 ? Droplets : index === 1 ? Eye : ShieldCheck;

            return (
              <div
                key={spinoff.id}
                data-testid={`spinoff-card-${spinoff.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#0B2374]/30 transition-all duration-300"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B2374]/5 text-[#0B2374]">
                      {spinoff.category}
                    </span>
                    <span className="text-lg font-bold text-gray-300 group-hover:text-[#0B2374] transition-colors">
                      {spinoff.number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3 group-hover:bg-[#D4FC02]/20 group-hover:border-lime-300 transition-all">
                    <Icon className="w-5 h-5 text-[#0B2374]" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#0B2374] mb-1 leading-snug">
                    {spinoff.title}
                  </h3>
                  <div className="text-xs text-zinc-500 mb-3">
                    {spinoff.subtitle}
                  </div>

                  {/* Heritage Source Tag */}
                  <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-zinc-700 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                    <span className="font-semibold text-zinc-900">NASA Flight Heritage:</span>
                    <span>{spinoff.heritageSource}</span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                    {spinoff.description}
                  </p>
                </div>

                <div>
                  {/* Two Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 mb-3">
                    <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80">
                      <div className="text-lg font-black text-[#0B2374]">
                        {spinoff.primaryMetric.value}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-semibold">
                        {spinoff.primaryMetric.label}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200/80">
                      <div className="text-lg font-black text-[#0B2374]">
                        {spinoff.secondaryMetric.value}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase mt-0.5 font-semibold">
                        {spinoff.secondaryMetric.label}
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-1">
                    {spinoff.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-xs text-zinc-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technology Transfer Impact Banner - Concise */}
        <div
          className="rounded-3xl border border-[#0B2374]/20 bg-gradient-to-r from-[#0B2374] to-[#1E3A8A] text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4"
          data-testid="spinoff-impact-banner"
        >
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#D4FC02] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA Technology Transfer Initiative</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              &quot;The safest fire on Earth is the one understood in the stillness of space.&quot;
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
              FlameGuard AI converts microgravity combustion discoveries into verified safety models for critical industries and first responders worldwide.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs text-[#D4FC02] uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-bold">
            <span>3 Verified Spinoff Paths</span>
          </div>
        </div>
      </div>
    </section>
  );
};
