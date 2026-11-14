'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Database,
  Flame,
  FileCheck2,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useDashboardSummaryQuery } from '../hooks/useDashboardQueries';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import type { MappedDashboardSummary } from '@/types/api';

export interface KpiStatCardsProps {
  summary?: MappedDashboardSummary;
}

export const KpiStatCards: React.FC<KpiStatCardsProps> = ({ summary: summaryProp }) => {
  const summaryQuery = useDashboardSummaryQuery(undefined, {
    enabled: summaryProp === undefined,
  });

  const summary = summaryProp ?? summaryQuery.data;

  if (!summaryProp && summaryQuery.isLoading) {
    return (
      <div
        data-testid="kpi-stat-cards-loading"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 min-h-[170px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!summaryProp && summaryQuery.isError) {
    return (
      <ApiErrorBanner
        title="Unable to load telemetry KPIs"
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        isRetrying={summaryQuery.isFetching}
      />
    );
  }

  if (!summary) return null;

  const {
    investigationCount,
    runCount,
    verifiedRunCount,
    sourceCoverage,
    claimCount,
    sourceCount,
    unavailableFields,
  } = summary;

  const coveragePctLabel =
    sourceCoverage.percentage !== null
      ? `${Math.round(sourceCoverage.percentage)}%`
      : 'No denominator';

  const verificationNote =
    verifiedRunCount === null
      ? `Verification not established (${unavailableFields.verifiedRunCount ?? 'UNVERIFIED'})`
      : `${verifiedRunCount} verified test runs established.`;

  return (
    <section aria-label="Research Telemetry KPIs" className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4FC02]" />
          NASA PSI Physical Science Telemetry
        </h2>
      </div>

      <div
        data-testid="kpi-stat-cards"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
      >
        {/* KPI 1: NASA PSI Studies */}
        <motion.div
          data-testid="kpi-studies"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative group bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 transition-all flex flex-col justify-between min-h-[170px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-blue-50 text-[#0B2374] border border-blue-200/60">
                PSI Catalog
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0B2374] border border-blue-100 group-hover:scale-110 transition-transform">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {investigationCount}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1A1A1A] mt-1">
              NASA PSI Studies
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
            Indexed investigations in collection {summary.context.collectionId}.
          </p>
        </motion.div>

        {/* KPI 2: Experimental Test Runs */}
        <motion.div
          data-testid="kpi-runs"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative group bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 transition-all flex flex-col justify-between min-h-[170px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-orange-50 text-orange-700 border border-orange-200/60">
                Ground &amp; Orbital
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {runCount}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1A1A1A] mt-1">
              Experimental Test Runs
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
            {verificationNote}
          </p>
        </motion.div>

        {/* KPI 3: Source Coverage */}
        <motion.div
          data-testid="kpi-datapoints"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative group bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 transition-all flex flex-col justify-between min-h-[170px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3 gap-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-purple-50 text-purple-700 border border-purple-200/60 truncate">
                {coveragePctLabel}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {sourceCoverage.numerator} / {sourceCoverage.denominator}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1A1A1A] mt-1">
              Source Coverage
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
            Studies backed by mapped primary PSI source records.
          </p>
        </motion.div>

        {/* KPI 4: Evidence Claims */}
        <motion.div
          data-testid="kpi-claims"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative group bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 transition-all flex flex-col justify-between min-h-[170px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-[#D4FC02]/20 text-zinc-950 border border-[#D4FC02]">
                {sourceCount} Sources
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#D4FC02]/25 flex items-center justify-center text-zinc-950 border border-[#D4FC02]/60 group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              {claimCount}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1A1A1A] mt-1">
              Evidence Claims
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 leading-relaxed">
            Extracted provenance claims linked across {sourceCount} indexed documents.
          </p>
        </motion.div>

        {/* KPI 5: Partial Gravity Gap Alert */}
        <motion.div
          data-testid="kpi-gap-alert"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative group bg-amber-100/60 rounded-[36px] p-5 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all flex flex-col justify-between min-h-[170px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                NASA Safety Void
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight">
              0 &lt; g &lt; 1
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-900 mt-1">
              Partial-g Knowledge Void
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] text-amber-800 leading-tight">
              <strong>NASA Disclaimer:</strong> Moon (0.16g) &amp; Mars (0.38g) lack direct microgravity combustion data in PSI. Extrapolations are illustrative.
            </p>
            <Link
              href="/mission"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B2374] hover:text-[#102B82] hover:underline"
            >
              Simulate in Mission Lab <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
