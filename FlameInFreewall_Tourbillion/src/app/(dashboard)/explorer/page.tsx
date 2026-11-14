'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, AlertCircle, RotateCcw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { InvestigationListParamsDto } from '@/api/dto';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { EndOfListIndicator } from '@/components/ui/EndOfListIndicator';
import {
  useCatalogCapabilitiesQuery,
  useInvestigationsQuery,
  ExplorerFiltersBar,
  type PlatformFilterValue,
  type GravityFilterValue,
  type ExplorerSortOption,
  type ViewMode,
  InvestigationCard,
  InvestigationTable,
  ComparisonBar,
  type ComparisonStudySummary,
  ComparisonModal,
  InvestigationCardShimmer,
} from '@/features/explorer';

const PAGE_LIMIT = 20;

export default function ExplorerPage() {
  const compareList = useWorkspaceStore((state) => state.compareList);
  const toggleCompare = useWorkspaceStore((state) => state.toggleCompare);
  const removeFromCompare = useWorkspaceStore((state) => state.removeFromCompare);
  const clearCompare = useWorkspaceStore((state) => state.clearCompare);
  const isComparisonModalOpen = useWorkspaceStore((state) => state.isComparisonModalOpen);
  const setComparisonModalOpen = useWorkspaceStore((state) => state.setComparisonModalOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilterValue>('all');
  const [materialFilter, setMaterialFilter] = useState('');
  const [gravityFilter, setGravityFilter] = useState<GravityFilterValue>('all');
  const [sortBy, setSortBy] = useState<ExplorerSortOption>('title-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [offset, setOffset] = useState(0);

  const queryParams = useMemo<InvestigationListParamsDto>(() => {
    const params: InvestigationListParamsDto = { sort: sortBy, offset, limit: PAGE_LIMIT };
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (platformFilter !== 'all') params.platform = platformFilter;
    if (materialFilter.trim()) params.material = materialFilter.trim();
    if (gravityFilter !== 'all') params.gravityRaw = gravityFilter;
    return params;
  }, [searchQuery, platformFilter, materialFilter, gravityFilter, sortBy, offset]);

  const capabilitiesQuery = useCatalogCapabilitiesQuery();
  const investigationsQuery = useInvestigationsQuery(queryParams);
  const pageData = investigationsQuery.data;
  const items = useMemo(() => pageData?.items ?? [], [pageData]);
  const totalCount = pageData?.total ?? 0;
  const hasMore = pageData?.hasMore ?? false;

  const comparisonStudies = useMemo<ComparisonStudySummary[]>(
    () => items.map((inv) => ({ id: inv.id, label: inv.psiId })),
    [items]
  );

  const withOffsetReset = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (val: T) => {
    setter(val);
    setOffset(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlatformFilter('all');
    setMaterialFilter('');
    setGravityFilter('all');
    setSortBy('title-asc');
    setOffset(0);
  };

  return (
    <motion.div
      data-testid="explorer-catalog-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 py-2 pb-24"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 pb-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#0B2374]" strokeWidth={2.5} />
          <span>Experiment Explorer</span>
        </h1>
      </div>

      <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-6 sm:px-6 py-3 pb-5 transition-all duration-300">
        <div className="absolute inset-0 bg-[#F8F9FA]/50 backdrop-blur-sm pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]" />
        <ExplorerFiltersBar
          searchQuery={searchQuery}
          onSearchChange={withOffsetReset(setSearchQuery)}
          platformFilter={platformFilter}
          onPlatformFilterChange={withOffsetReset(setPlatformFilter)}
          materialFilter={materialFilter}
          onMaterialFilterChange={withOffsetReset(setMaterialFilter)}
          gravityFilter={gravityFilter}
          onGravityFilterChange={withOffsetReset(setGravityFilter)}
          sortBy={sortBy}
          onSortChange={withOffsetReset(setSortBy)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={totalCount}
          filteredCount={items.length}
          onResetFilters={handleResetFilters}
          capabilities={capabilitiesQuery.data}
        />
      </div>

      {pageData && pageData.context.caveats.length > 0 && (
        <div
          data-testid="explorer-caveats-banner"
          className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-3xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900"
        >
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="px-2 py-0.5 rounded-full bg-white border border-amber-200 font-bold text-[11px] uppercase">
            {pageData.context.origin} · {pageData.context.reviewState}
          </span>
          <span className="font-medium">{pageData.context.caveats.join(' · ')}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 px-1">
        <span data-testid="explorer-summary-count">
          Showing <span className="font-bold text-zinc-950">{items.length}</span> of {totalCount} NASA PSI Studies
        </span>
        <span className="text-zinc-400 hidden sm:inline">
          Click any study to inspect test runs, observations &amp; evidence claims
        </span>
      </div>

      {investigationsQuery.isLoading ? (
        <div data-testid="explorer-shimmer-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <InvestigationCardShimmer cardCount={6} />
        </div>
      ) : investigationsQuery.isError ? (
        <ApiErrorBanner
          title="Unable to load PSI catalog"
          error={investigationsQuery.error}
          onRetry={() => investigationsQuery.refetch()}
          isRetrying={investigationsQuery.isFetching}
        />
      ) : items.length === 0 ? (
        <div
          data-testid="explorer-empty-state"
          className="w-full p-12 text-center rounded-3xl bg-white border border-dashed border-gray-200 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">No investigations match your filters</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              We couldn&apos;t find any NASA PSI studies matching your active search keywords or filter criteria.
            </p>
          </div>
          <button
            type="button"
            data-testid="empty-reset-btn"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B2374] hover:bg-[#081b59] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div data-testid="explorer-grid-view" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((study) => (
            <InvestigationCard
              key={study.id}
              investigation={study}
              isComparing={compareList.includes(study.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      ) : (
        <InvestigationTable investigations={items} compareList={compareList} onToggleCompare={toggleCompare} />
      )}

      {totalCount > PAGE_LIMIT && !investigationsQuery.isLoading && !investigationsQuery.isError && (
        <div
          data-testid="explorer-pagination"
          className="flex items-center justify-between gap-4 px-4 py-3 rounded-3xl bg-white border border-gray-200/70 text-xs"
        >
          <span className="text-zinc-600 font-semibold">
            Offset {offset + 1}–{offset + items.length} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="pagination-prev-btn"
              disabled={offset === 0}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_LIMIT))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-zinc-800 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              data-testid="pagination-next-btn"
              disabled={!hasMore}
              onClick={() => setOffset((prev) => prev + PAGE_LIMIT)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B2374] text-white font-bold hover:bg-[#102B82] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && !hasMore && <EndOfListIndicator />}

      <ComparisonBar
        compareList={compareList}
        studies={comparisonStudies}
        onRemove={removeFromCompare}
        onClear={clearCompare}
        onOpenModal={() => setComparisonModalOpen(true)}
      />

      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        compareList={compareList}
        onRemove={removeFromCompare}
      />
    </motion.div>
  );
}
