'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Box, AlertTriangle, ArrowRight, Orbit, Layers, Info } from 'lucide-react';
import { useDashboardSummaryQuery } from '@/hooks/api';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import type { MappedDashboardSummary } from '@/types/api';

export interface DomainBreakdownProps {
  summary?: MappedDashboardSummary;
}

export const DomainBreakdown: React.FC<DomainBreakdownProps> = ({
  summary: summaryProp,
}) => {
  const summaryQuery = useDashboardSummaryQuery(undefined, {
    enabled: summaryProp === undefined,
  });

  const summary = summaryProp ?? summaryQuery.data;

  if (!summaryProp && summaryQuery.isLoading) {
    return (
      <div
        data-testid="domain-breakdown-loading"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`domain-skeleton-${index}`}
            className="bg-gray-200/50 rounded-[36px] p-5 min-h-[210px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!summaryProp && summaryQuery.isError) {
    return (
      <ApiErrorBanner
        title="Unable to load domain breakdown"
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        isRetrying={summaryQuery.isFetching}
      />
    );
  }

  if (!summary) return null;

  const fuelReason = summary.unavailableFields.fuelDistribution ?? 'UNSUPPORTED_MAPPING';
  const facilityReason = summary.unavailableFields.facilityDistribution ?? 'UNSUPPORTED_MAPPING';
  const gravityReason = summary.unavailableFields.gravityDistribution ?? 'UNSUPPORTED_MAPPING';

  return (
    <section aria-label="Physical Science Domain Breakdown" className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[#0B2374]" />
          Combustion Physics Domain Breakdown
        </h2>
        <Link
          href="/explorer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2374] hover:text-[#102B82] transition-colors self-start sm:self-auto"
        >
          Explore in matrix view <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div data-testid="domain-breakdown" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Fuel Phase & Material */}
        <motion.div
          data-testid="fuel-distribution"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-gray-200/50 rounded-[36px] p-5 hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B] flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#0B2374]" /> Fuel Phase &amp; Material
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {fuelReason}
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white/80 border border-gray-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <Info className="w-4 h-4 text-[#0B2374] shrink-0" />
                <span>Unavailable in current PSI scope</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Aggregate fuel-phase counts are not published for collection{' '}
                <strong className="text-[#1A1A1A]">{summary.context.collectionId}</strong>{' '}
                across {summary.investigationCount} indexed studies.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200/70 flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">
              Origin: <strong className="text-[#1A1A1A]">{summary.context.origin}</strong>
            </span>
            <Link
              href="/explorer"
              className="font-bold text-[#0B2374] hover:underline flex items-center gap-1"
            >
              Filter by material <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Flight Hardware Platform */}
        <motion.div
          data-testid="facility-distribution"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-gray-200/50 rounded-[36px] p-5 hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B] flex items-center gap-2">
                <Box className="w-4 h-4 text-[#0B2374]" /> Flight Hardware Platform
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {facilityReason}
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white/80 border border-gray-200/70 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                <Info className="w-4 h-4 text-[#0B2374] shrink-0" />
                <span>Unavailable in current PSI scope</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Platform-level distribution rollups are gated until facility taxonomy mapping is
                verified for {summary.runCount} runs.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200/70 flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">
              Review: <strong className="text-[#1A1A1A]">{summary.context.reviewState}</strong>
            </span>
            <Link
              href="/explorer"
              className="font-bold text-[#0B2374] hover:underline flex items-center gap-1"
            >
              Browse platforms <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Gravity Regimes Telemetry */}
        <motion.div
          data-testid="gravity-distribution"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-gray-200/50 rounded-[36px] p-5 hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B] flex items-center gap-2">
                <Orbit className="w-4 h-4 text-[#0B2374]" /> Gravity Regimes (g-Level)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {gravityReason}
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-3xl bg-white/80 border border-gray-200/70 space-y-1">
                <div className="text-xs font-bold text-[#1A1A1A]">
                  Unavailable in current PSI scope
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Per-regime run counts are unmapped at the dashboard aggregate level.
                </p>
              </div>

              {/* Partial Gravity Void (0 < g < 1) */}
              <div className="p-3 rounded-3xl bg-amber-50/90 border border-amber-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Partial Gravity Void (0 &lt; g &lt; 1)
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-tight">
                  Moon (0.16g) &amp; Mars (0.38g) lack validated physical test coverage in NASA PSI.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200/70 flex items-center justify-between">
            <span className="text-[10px] text-[#64748B]">Extrapolations require caution.</span>
            <Link
              href="/mission"
              className="text-xs font-bold text-[#0B2374] hover:text-[#102B82] hover:underline flex items-center gap-1"
            >
              Analyze Gap Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
