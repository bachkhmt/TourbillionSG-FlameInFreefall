'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Rocket, ArrowRight, RotateCcw, Info } from 'lucide-react';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import {
  useDashboardSummaryQuery,
  DashboardShimmer,
  KpiStatCards,
  QuickScenarioTrigger,
  CuratedStudiesGrid,
  DomainBreakdown,
} from '@/features/dashboard';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export default function DashboardPage() {
  const compareList = useWorkspaceStore((state) => state.compareList);
  const clearCompare = useWorkspaceStore((state) => state.clearCompare);

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardSummaryQuery();

  const exploreLabel = summary
    ? `Explore ${summary.investigationCount} Studies`
    : 'Explore Studies';

  return (
    <motion.div
      data-testid="research-dashboard"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10 py-2 pt-0"
    >
      {/* Top Header Sticky with Backdrop Blur matching Explorer / StructPaper */}
      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 pb-4 transition-all duration-300">
        <div className="absolute inset-0 bg-[#F8F9FA]/50 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Rocket className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
              <span>Microgravity Combustion Science &amp; Fire Safety Intelligence</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/explorer"
              data-testid="dashboard-explore-link"
              className="px-4 py-2 rounded-2xl bg-white hover:bg-gray-50 text-slate-900 text-xs font-bold border border-gray-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#0B2374]" />
              <span>{exploreLabel}</span>
            </Link>

            <Link
              href="/mission"
              className="px-4 py-2 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5 text-zinc-950" />
              <span>Simulate Mission</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Collection Context & Caveats Pill Banner */}
      {summary && summary.context.caveats.length > 0 && (
        <div
          data-testid="dashboard-caveats-banner"
          className="flex flex-wrap items-center gap-2.5 px-4 py-3 rounded-3xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 -mt-4"
        >
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="px-2 py-0.5 rounded-full bg-white border border-amber-200 font-bold text-[11px] uppercase text-amber-900">
            {summary.context.origin} · {summary.context.reviewState}
          </span>
          <span className="font-medium leading-relaxed">
            {summary.context.caveats.join(' · ')}
          </span>
        </div>
      )}

      {/* Comparison floating quick-action pill if items are selected */}
      {compareList.length > 0 && (
        <div
          data-testid="dashboard-compare-banner"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs bg-white p-3 px-4 rounded-[36px] border-4 border-gray-200 shadow-xs -mt-4"
        >
          <div className="flex items-center gap-2.5 text-[#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-[#0B2374]" />
            <span className="font-semibold">Active Study Comparison:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#D4FC02]/30 text-zinc-950 font-bold border border-[#D4FC02]">
              {compareList.length} of 3 selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCompare}
              className="text-[#64748B] hover:text-[#1A1A1A] text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
            <Link
              href="/explorer"
              className="px-3 py-1.5 rounded-2xl bg-[#0B2374] hover:bg-[#102B82] text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Open in Explorer Comparison</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {isLoading ? (
        <DashboardShimmer />
      ) : isError ? (
        <ApiErrorBanner
          title="Unable to load dashboard telemetry"
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : summary ? (
        <>
          <KpiStatCards summary={summary} />
          <QuickScenarioTrigger />
          <CuratedStudiesGrid
            studies={summary.featuredInvestigations}
            totalCount={summary.investigationCount}
            context={summary.context}
          />
          <DomainBreakdown summary={summary} />
        </>
      ) : null}
    </motion.div>
  );
}
