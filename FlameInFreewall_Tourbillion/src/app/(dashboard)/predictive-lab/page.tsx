'use client';

import React from 'react';
import { FlaskConical } from 'lucide-react';
import { ReadinessCard } from '@/features/predictive-lab/components/ReadinessCard';
import { ExperimentCard } from '@/features/predictive-lab/components/ExperimentCard';
import { PREDICTIVE_LAB_REPORT } from '@/features/predictive-lab/report';

export default function PredictiveLabPage() {
  return (
    <div data-testid="predictive-lab" className="w-full max-w-7xl mx-auto space-y-6 py-2 pt-0">
      <header className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
          Predictive Lab
        </h1>
        <p className="inline-block rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
          Exploratory · Unreviewed · No predictions are served
        </p>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          What the AI team&apos;s first models learned from admitted NASA PSI records, and why none is
          ready for public prediction yet. Errors are measured on held-out experiment groups. MAE is
          a model error in the original unit; it is not a safety or risk measure.
        </p>
      </header>
      <ReadinessCard />
      <section aria-label="Exploratory model evaluations" className="grid gap-4 lg:grid-cols-2">
        {PREDICTIVE_LAB_REPORT.experiments.map((report) => (
          <ExperimentCard key={report.experiment} report={report} />
        ))}
      </section>
      <p className="text-xs text-slate-500">{PREDICTIVE_LAB_REPORT.sourceNote}</p>
    </div>
  );
}
