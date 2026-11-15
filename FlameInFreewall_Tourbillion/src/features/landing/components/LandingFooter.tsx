'use client';

/**
 * LandingFooter Component
 * StructPaper light theme footer referencing only valid workspace routes (/dashboard, /explorer, /mission)
 * with mandatory NASA Physical Sciences Fire Safety Protocol & Disclaimer.
 */

import React from 'react';
import Link from 'next/link';
import { Flame, ShieldAlert, ExternalLink, Globe } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-zinc-600 text-xs" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
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
            <h4 className="font-black text-sm text-zinc-950 mb-3">NASA PSI Data</h4>
            <ul className="space-y-2 font-semibold">
              <li>
                <a
                  href="https://psi.nasa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#0B2374] transition-colors inline-flex items-center gap-1"
                >
                  <span>NASA PSI Repository</span>
                  <ExternalLink className="w-3 h-3" />
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
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory NASA Fire Safety Disclaimer Box - Concise */}
        <div
          data-testid="safety-disclaimer"
          className="p-3.5 mb-8 flex items-start gap-3"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed">
            <span className="font-bold text-amber-900 block mb-0.5">
              NASA Physical Sciences Fire Safety Protocol &amp; Disclaimer
            </span>
            Project synthesizes empirical datasets from NASA Physical Sciences Informatics (PSI).
            Spaceflight certification requires certified chamber qualification under NASA-STD-6001 standards.
            Partial-gravity regimes ($0 &lt; g &lt; 1$) represent open empirical knowledge voids.
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