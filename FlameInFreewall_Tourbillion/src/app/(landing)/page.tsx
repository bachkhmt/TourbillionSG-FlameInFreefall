/**
 * Landing Page - FlameGuard AI
 * Kurzgesagt cosmic vector art style landing page synchronized with StructPaper light theme.
 */

import React from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { EarthFlameSvg, IssFlameSvg } from '@/components/landing/FlameVectorGraphics';
import { MissionControlCTA } from '@/components/landing/MissionControlCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'FlameGuard AI — Flame in Freefall | NASA Space Apps Challenge 2026',
  description:
    'Visual storytelling and evidence-first intelligence platform exploring microgravity combustion investigations from NASA Physical Sciences Informatics (PSI).',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1A1A1A] overflow-x-hidden">
      <LandingHero />
      <section id="flame-physics" className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-14 md:grid-cols-2">
        <div className="grid grid-cols-2 rounded-3xl bg-[#0B2374] p-8" aria-label="Illustrative flame shapes"><EarthFlameSvg /><IssFlameSvg /></div>
        <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Educational illustrations</p><h2 className="text-3xl font-extrabold">Explore flame shapes in 3D</h2><p className="my-5 text-sm leading-7 text-slate-500">Change shape, color and motion in the Playbook flame studio. These controls illustrate appearance; they do not represent measured gravity, temperature or a combustion solver.</p><a href="/studio" className="inline-flex rounded-2xl bg-[#D4FC02] px-5 py-3 text-sm font-bold">Open flame studio →</a></div>
      </section>
      <section id="lunar-paradox" className="mx-auto w-full max-w-7xl px-6 py-8"><div className="rounded-3xl border border-slate-200 bg-white p-8"><h2 className="text-2xl font-bold">Inspect the gaps before extrapolating</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">Explore versioned source records, contextual documents and metadata across prevention, detection and suppression research. Mission analysis distinguishes related studies from measured condition coverage and keeps numerical prediction offline until a validated model is available.</p><a href="/mission" className="mt-4 inline-block text-sm font-bold text-[#0B2374]">View condition matching and evidence map →</a></div></section>
      <MissionControlCTA />
      <LandingFooter />
    </main>
  );
}
