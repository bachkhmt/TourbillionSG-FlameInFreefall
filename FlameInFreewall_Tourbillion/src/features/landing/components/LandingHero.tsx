'use client';

/**
 * LandingHero Component
 * StructPaper light aesthetic with Space Apps Electric Lime (#D4FC02) accents
 * and clean typography directing users into the research modules.
 * Features a sticky navigation bar with scroll-reactive translucency and backdrop-blur-sm.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Compass,
  ShieldAlert,
  Activity,
  Layers,
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative w-full bg-[#F8F9FA] font-sans" data-testid="landing-hero">


      {/* Space Apps Navigation Bar - Sticks to screen across all sections with backdrop-blur-sm */}
      <nav
        data-testid="landing-navbar"
        className={`${
          isScrolled
            ? 'fixed top-0 left-0 right-0 z-50 bg-[#0B2374]/70 backdrop-blur-sm border-b border-white/10 shadow-md h-14'
            : 'relative z-40 bg-[#0B2374] border-b border-white/10 shadow-xs h-16'
        } w-full transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo & Space Apps Identity */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#D4FC02] to-[#4CC9F0] p-0.5 flex items-center justify-center shadow-md shadow-[#D4FC02]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B2374] rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4FC02]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Tourbillion</span><span className="text-[#D4FC02]">SG</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                NASA Space Apps 2026
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-100">
            <a href="#flame-physics" className="hover:text-[#D4FC02] transition-colors">
              Flame Physics
            </a>
            <a href="#lunar-paradox" className="hover:text-[#D4FC02] transition-colors">
              Lunar Flammability Paradox
            </a>
            <a href="#core-intelligence" className="hover:text-[#D4FC02] transition-colors">
              Core Architecture
            </a>
            <a href="#mission-modules" className="hover:text-[#D4FC02] transition-colors">
              Research Workspace
            </a>
            <a href="#mission-modules" className="hover:text-[#D4FC02] transition-colors">
              PSI Studies
            </a>
          </div>

          {/* Quick CTA - Smoothly anchors down to research modules without leaving page */}
          <div className="flex items-center gap-3">
            <a
              href="#mission-modules"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 text-xs sm:text-sm font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content jump when navbar becomes fixed on scroll */}
      {isScrolled && <div className="h-16 w-full" aria-hidden="true" />}

      {/* Hero Visual Area with StructPaper Light Backdrop */}
      <div className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Soft Ambient Light Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-tr from-[#D4FC02]/15 via-blue-50/60 to-purple-50/30 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-zinc-950 mb-6">
            Microgravity Combustion &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B2374] via-[#1E40AF] to-indigo-700">
              Spacecraft Fire Safety
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Evidence-first intelligence platform synthesizing 24 NASA Physical Sciences Informatics
            (PSI) investigations. Discover why flames burn spherical and blue in freefall,
            and resolve the lethal flammability paradox of exploration habitats.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 font-bold text-sm sm:text-base shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Compass className="w-5 h-5 text-zinc-950" />
              <span>Enter Research Workspace</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </Link>

            <Link
              href="/explorer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-200/70 hover:bg-gray-50 hover:border hover:border-gray-100 text-zinc-900 font-bold text-sm sm:text-base hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Layers className="w-5 h-5 text-[#0B2374]" />
              <span>Explore 24 PSI Studies</span>
            </Link>

            <Link
              href="/mission"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-200/70 hover:bg-gray-50 hover:border hover:border-gray-100 text-zinc-900 font-bold text-sm sm:text-base hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Flame className="w-5 h-5 text-amber-500" />
              <span>Run Scenario Simulation</span>
            </Link>
          </div>

          {/* Telemetry Highlight Badges in StructPaper Light Cards */}
          <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-2 text-left">
            <div className="rounded-3xl bg-gray-200/50 p-4 hover:shadow-xs hover:border-gray-300 transition-all">
              <div className="flex items-center gap-1.5 text-[#0B2374] text-xs font-bold uppercase mb-1">
                <Activity className="w-3.5 h-3.5 text-[#0B2374]" />
                <span>PSI Archive</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-950">
                24 Studies
              </div>
              <p className="text-xs text-zinc-500 mt-1">BASS, ACME, SoFIE, Saffire flight logs</p>
            </div>

            <div className="rounded-3xl bg-gray-200/50 p-4 hover:shadow-xs hover:border-gray-300 transition-all">
              <div className="flex items-center gap-1.5 text-[#0B2374] text-xs font-bold uppercase mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Runs</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-950">
                1,926 Runs
              </div>
              <p className="text-xs text-zinc-500 mt-1">Empirical NASA flight test runs</p>
            </div>

            <div className="rounded-3xl bg-gray-200/50 p-4 hover:shadow-xs hover:border-gray-300 transition-all">
              <div className="flex items-center gap-1.5 text-[#0B2374] text-xs font-bold uppercase mb-1">
                <Compass className="w-3.5 h-3.5 text-purple-600" />
                <span>Physics Model</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-950">
                0g vs 1g
              </div>
              <p className="text-xs text-zinc-500 mt-1">Pure diffusion vs buoyant plume</p>
            </div>

            <div className="rounded-3xl bg-gray-200/50 p-4 hover:shadow-xs hover:border-gray-300 transition-all">
              <div className="flex items-center gap-1.5 text-[#0B2374] text-xs font-bold uppercase mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Exploration Gap</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-950">
                0 &lt; g &lt; 1
              </div>
              <p className="text-xs text-zinc-500 mt-1">Lunar &amp; Mars low-g flammability void</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
