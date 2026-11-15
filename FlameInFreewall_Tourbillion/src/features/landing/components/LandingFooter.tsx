'use client';

/**
 * LandingFooter Component
 * StructPaper light theme footer referencing only valid workspace routes (/dashboard, /explorer, /mission)
 * with official NASA Space Apps Challenge 2026 resource links, historical fire investigation archives,
 * and mandatory NASA Physical Sciences Fire Safety Protocol & Disclaimer.
 */

import React from 'react';
import Link from 'next/link';
import { Flame, ShieldAlert, ExternalLink, Globe } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-zinc-600 text-xs" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4FC02] flex items-center justify-center text-zinc-950 shadow-2xs">
                <Flame className="w-5 h-5 text-zinc-950" />
              </div>
              <span className="font-black text-base text-zinc-950 tracking-tight">
                Tourbillion<span className="text-[#0B2374]">SG</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              NASA Space Apps Challenge 2026: Flame in Freefall. Microgravity combustion &amp; spacecraft
              fire safety intelligence platform.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#0B2374] font-bold text-[11px] border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                NASA PSI • 24 Studies / 1,926 Runs
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="font-black text-sm text-zinc-950 mb-3">Core Modules</h4>
            <ul className="space-y-2 font-semibold">
              <li>
                <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-950 transition-colors">
                  Research Dashboard
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="text-zinc-600 hover:text-zinc-950 transition-colors">
                  Experiment Explorer
                </Link>
              </li>
              <li>
                <Link href="/mission" className="text-zinc-600 hover:text-zinc-950 transition-colors">
                  Mission Scenario &amp; Gap Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* NASA PSI Resources */}
          <div>
            <h4 className="font-black text-sm text-zinc-950 mb-3">NASA PSI Science Data</h4>
            <ul className="space-y-2 font-semibold">
              <li>
                <a
                  href="https://psi.nasa.gov/physci/repo/search?q=combustion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>NASA PSI Repository</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>NASA Combustion Science</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>ISS Combustion Science Guide</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.spaceappschallenge.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>Space Apps Challenge 2026</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Historical Precedents & Spinoffs */}
          <div>
            <h4 className="font-black text-sm text-zinc-950 mb-3">Case Studies &amp; Spinoffs</h4>
            <ul className="space-y-2 font-semibold">
              <li>
                <a
                  href="https://sma.nasa.gov/sma-disciplines/accllp/apollo-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>Apollo 1 &amp; 13 Investigations</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>Mir Space Station Fire (1997)</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://spinoff.nasa.gov/node/9582"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>Firefighter Air Tanks Spinoff</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://spinoff.nasa.gov/node/9918"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>Protective Fire Attire Spinoff</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Research scope disclaimer */}
        <div
          data-testid="safety-disclaimer"
          className="p-4 mb-8 flex items-start gap-3 bg-amber-50/60 rounded-2xl border border-amber-200/80"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed">
            <span className="font-bold text-amber-900 block mb-0.5">
              Research scope &amp; limitations
            </span>
            FlameGuard AI helps users explore, compare and interpret NASA Physical Sciences Informatics (PSI) combustion research.
            Research relevance is not a fire-risk probability or operational safety certification.
            Partial-gravity conditions (0 &lt; g &lt; 1) remain an evidence gap where direct measurements are unavailable.
            NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites.
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-zinc-500">
          <div>
            © 2026 TourbillionSG Team • Built for NASA Space Apps Challenge 2026 (Flame in Freefall)
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-600">
              <Globe className="w-3.5 h-3.5 text-[#0B2374]" />
              <span>Open Science / Public Domain Data</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
