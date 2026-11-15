"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { EndOfListIndicator } from '@/components/ui/EndOfListIndicator';
import { ScenarioConfigForm } from '@/features/mission';
import { MissionResearch } from '@/features/mission/components/MissionResearch';
import { useMissionFocusKeys } from '@/features/mission/compareFocus';

/** Reads `?compare=` handed over by the Comparison modal. */
function FocusedMissionResearch() {
  const params = useSearchParams();
  const focusKeys = useMissionFocusKeys(params?.get('compare'));
  return <MissionResearch focusKeys={focusKeys} />;
}

export default function MissionPage() {
  return (
    <motion.div
      data-testid="mission-workbench"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 py-2 pt-0"
    >
      <header className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Rocket className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
          Mission Evidence Workbench
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Explore combustion investigations relevant to prevention, detection and suppression.
          Compare experimental conditions and identify gaps before interpreting the evidence.
          Research relevance does not establish spacecraft safety.
        </p>
      </header>
      <ScenarioConfigForm />
      <div data-testid="evidence-view-container" className="space-y-6">
        <Suspense fallback={<MissionResearch />}>
          <FocusedMissionResearch />
        </Suspense>
      </div>
      <EndOfListIndicator text="You have reached the end of the mission scenario evidence list" />
    </motion.div>
  );
}
