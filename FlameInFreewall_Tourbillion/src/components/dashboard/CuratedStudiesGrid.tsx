'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Plus, Sparkles, Tag } from 'lucide-react';
import { useDashboardSummaryQuery } from '@/hooks/api';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { toast } from '@/components/toast/toast-store';
import type { ApiContextMeta, MappedInvestigation } from '@/types/api';

export interface CuratedStudiesGridProps {
  studies?: MappedInvestigation[];
  totalCount?: number;
  context?: ApiContextMeta;
}

export const CuratedStudiesGrid: React.FC<CuratedStudiesGridProps> = ({
  studies: studiesProp,
  totalCount: totalCountProp,
  context: contextProp,
}) => {
  const compareList = useWorkspaceStore((state) => state.compareList);
  const toggleCompare = useWorkspaceStore((state) => state.toggleCompare);
  const setSelectedInvestigationId = useWorkspaceStore(
    (state) => state.setSelectedInvestigationId
  );

  const summaryQuery = useDashboardSummaryQuery(undefined, {
    enabled: studiesProp === undefined,
  });

  if (studiesProp === undefined && summaryQuery.isLoading) {
    return (
      <div
        data-testid="curated-studies-loading"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`curated-skeleton-${index}`}
            className="rounded-3xl md:rounded-[36px] p-5 bg-gray-200/50 min-h-[220px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (studiesProp === undefined && summaryQuery.isError) {
    return (
      <ApiErrorBanner
        title="Unable to load curated PSI studies"
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        isRetrying={summaryQuery.isFetching}
      />
    );
  }

  const featuredInvestigations =
    studiesProp ?? summaryQuery.data?.featuredInvestigations ?? [];
  const totalCount =
    totalCountProp ??
    summaryQuery.data?.investigationCount ??
    featuredInvestigations.length;
  const activeContext = contextProp ?? summaryQuery.data?.context;

  const handleToggleCompare = (
    e: React.MouseEvent,
    investigationId: string,
    psiId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const isCurrentlyInCompare = compareList.includes(investigationId);
    const toggled = toggleCompare(investigationId);

    if (toggled) {
      if (isCurrentlyInCompare) {
        toast.info(
          'Removed from Comparison',
          `${psiId} has been removed from active comparison workspace.`
        );
      } else {
        toast.success(
          'Added to Comparison',
          `${psiId} is now queued for multi-study comparative analysis.`
        );
      }
    }
  };

  return (
    <section aria-label="Curated PSI Studies" className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#0B2374]" />
            Curated PSI Investigations
          </h2>
          {activeContext && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-gray-200 text-zinc-600 capitalize">
              {activeContext.origin} · {activeContext.reviewState}
            </span>
          )}
        </div>
        <Link
          href="/explorer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2374] hover:text-[#102B82] transition-colors self-start sm:self-auto"
        >
          View all {totalCount} PSI studies <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {featuredInvestigations.length === 0 ? (
        <div
          data-testid="curated-studies-empty"
          className="rounded-3xl bg-white border border-dashed border-gray-200 p-8 text-center text-xs text-zinc-500"
        >
          No featured investigations returned for the current collection scope.
        </div>
      ) : (
        <div
          data-testid="curated-studies-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {featuredInvestigations.map((inv) => {
            const isComparing = compareList.includes(inv.id);
            const visibleTags = inv.tags.slice(0, 3);

            return (
              <motion.article
                key={inv.id}
                data-testid={`study-card-${inv.id}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`rounded-3xl md:rounded-[36px] p-5 bg-gray-200/50 transition-all duration-300 flex flex-col justify-between relative group select-none cursor-pointer hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${
                  isComparing
                    ? 'ring-2 ring-[#D4FC02] shadow-[0_8px_30px_rgba(212,252,2,0.3)] bg-white'
                    : ''
                }`}
              >
                <div>
                  {/* Header Row: PSI ID & Platform Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs bg-blue-50 text-[#0B2374] border border-blue-100">
                      {inv.psiId}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs bg-white text-zinc-700 border border-gray-200/80">
                        {inv.platform ?? 'Platform unmapped'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Purpose Snippet */}
                  <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] tracking-tight group-hover:text-[#0B2374] transition-colors line-clamp-2 leading-snug">
                    {inv.title}
                  </h3>
                  <p className="text-xs text-zinc-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {inv.researchPurpose ?? 'Research purpose not provided in PSI metadata.'}
                  </p>

                  {/* Tags Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-4">
                    {visibleTags.length > 0 ? (
                      visibleTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 text-zinc-700 border border-gray-200/70"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#0B2374]" />
                          {tag.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-zinc-500">No tags mapped</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="pt-3 border-t border-black/5 flex items-center gap-2">
                  <Link
                    href={`/explorer/${inv.routeKey}`}
                    onClick={() => setSelectedInvestigationId(inv.id)}
                    data-testid={`view-investigation-${inv.id}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B2374] hover:bg-[#102B82] text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Investigation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    data-testid={`toggle-compare-${inv.id}`}
                    onClick={(e) => handleToggleCompare(e, inv.id, inv.psiId)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                      isComparing
                        ? 'bg-[#D4FC02] text-zinc-950 border-[#D4FC02] hover:bg-[#c3e802]'
                        : 'bg-gray-50 hover:bg-gray-100 text-[#1A1A1A] border-gray-200'
                    }`}
                    title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
                  >
                    {isComparing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>In Compare</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
};
