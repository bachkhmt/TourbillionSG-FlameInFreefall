'use client';

import React from 'react';
import Link from 'next/link';
import { usePredictionReadinessQuery } from '@/features/mission/hooks/usePredictionQueries';
import { reasonText } from '../reasons';

/** Live backend readiness. This page never executes predictions, even when ready. */
export function ReadinessCard() {
  const readiness = usePredictionReadinessQuery();

  return (
    <section
      data-testid="prediction-readiness"
      aria-label="Prediction readiness"
      className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3"
    >
      <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Live model readiness</h2>
      {readiness.isPending && <p role="status">Checking model readiness…</p>}
      {readiness.isError && (
        <div role="alert" className="space-y-2 text-sm text-red-800">
          <p>Readiness could not be loaded from the backend. No status is assumed.</p>
          <button
            type="button"
            onClick={() => readiness.refetch()}
            className="rounded-xl border border-red-200 px-3 py-1.5 font-bold hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      {readiness.data && !readiness.isError && (
        <>
          <p className="text-lg font-black text-slate-900">
            {readiness.data.state === 'ready' ? 'Ready (predictions are not served on this page)' : 'Not ready'}
          </p>
          <ul className="space-y-1 text-sm text-slate-700">
            {readiness.data.reasons.map((code) => (
              <li key={code}>
                {reasonText(code)} <code className="text-xs text-slate-500">{code}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-sm">
        <Link href="/mission" className="font-bold text-[#0B2374] underline">
          Back to Mission Evidence
        </Link>
      </p>
    </section>
  );
}
