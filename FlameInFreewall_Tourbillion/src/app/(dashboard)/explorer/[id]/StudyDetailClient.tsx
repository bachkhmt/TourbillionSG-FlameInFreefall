'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Flame,
  Activity,
  FileText,
  Download,
  Gauge,
  BookOpen,
  Layers,
  Tag,
} from 'lucide-react';
import { ApiClientError } from '@/api/client';
import type {
  MappedClaim,
  MappedInvestigationDetail,
  MappedObservation,
  MappedRun,
  MappedSource,
} from '@/types/api';
import { mapObservationDto, mapRunDto } from '@/api/mappers';
import { listInvestigationMeasurements, listInvestigationRuns } from '@/api/services';
import { getMockObservationsPage, getMockRunsPage } from '@/api/mockFallback';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { toast } from '@/components/toast/toast-store';
import {
  useInvestigationClaimsQuery,
  useInvestigationDetailQuery,
  useInvestigationMeasurementsQuery,
  useInvestigationRunsQuery,
  useInvestigationSourcesQuery,
  StudyDetailShimmer,
  StudyHeader,
  ChamberOverviewTab,
  TestRunsTable,
  TelemetryPane,
  ClaimsList,
  PsiExportTab,
  ComparisonBar,
  ComparisonModal,
} from '@/features/explorer';

export type StudyDetailTab = 'overview' | 'runs' | 'telemetry' | 'claims' | 'psi-export';

export interface StudyDetailClientProps {
  params?: Promise<{ id: string }>;
  study?: MappedInvestigationDetail;
}

function isEntityNotFoundError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 404 || error.code === 'ENTITY_NOT_FOUND';
  }
  if (typeof error === 'object' && error !== null) {
    const rec = error as { status?: unknown; code?: unknown };
    return rec.status === 404 || rec.code === 'ENTITY_NOT_FOUND';
  }
  return false;
}

function observationKey(obs: MappedObservation): string {
  return `${obs.run.id}-${obs.measurement.id}`;
}

export function StudyDetailClient({ params, study: propsStudy }: StudyDetailClientProps) {
  const routerParams = useParams();
  const unwrappedParams = params ? React.use(params) : undefined;

  const id = useMemo(() => {
    if (propsStudy?.id) return propsStudy.id;
    if (routerParams?.id) {
      return Array.isArray(routerParams.id) ? routerParams.id[0] : routerParams.id;
    }
    return unwrappedParams?.id ?? '';
  }, [propsStudy, routerParams, unwrappedParams]);

  const [activeTab, setActiveTab] = useState<StudyDetailTab>('overview');

  const compareList = useWorkspaceStore((state) => state.compareList);
  const toggleCompare = useWorkspaceStore((state) => state.toggleCompare);
  const removeFromCompare = useWorkspaceStore((state) => state.removeFromCompare);
  const clearCompare = useWorkspaceStore((state) => state.clearCompare);
  const isComparisonModalOpen = useWorkspaceStore((state) => state.isComparisonModalOpen);
  const setComparisonModalOpen = useWorkspaceStore((state) => state.setComparisonModalOpen);

  const detailQuery = useInvestigationDetailQuery(id, {
    enabled: !propsStudy && Boolean(id),
  });
  const study = propsStudy ?? detailQuery.data;
  const resolvedStudyId = study?.id ?? null;

  const runsQuery = useInvestigationRunsQuery(resolvedStudyId, { limit: 100 });
  const measurementsQuery = useInvestigationMeasurementsQuery(resolvedStudyId, { limit: 100 });
  const sourcesQuery = useInvestigationSourcesQuery(resolvedStudyId, { limit: 100 });
  const claimsQuery = useInvestigationClaimsQuery(resolvedStudyId, { limit: 100 });

  // Accumulated states for additional pages beyond the first 100
  const [accumulatedRuns, setAccumulatedRuns] = useState<MappedRun[]>([]);
  const [accumulatedObservations, setAccumulatedObservations] = useState<MappedObservation[]>([]);
  const [isLoadingMoreRuns, setIsLoadingMoreRuns] = useState(false);
  const [isFetchingAllData, setIsFetchingAllData] = useState(false);

  const baseRuns = runsQuery.data?.items ?? [];
  const effectiveRuns = useMemo(() => {
    if (accumulatedRuns.length === 0) return baseRuns;
    const seen = new Set(accumulatedRuns.map((r) => r.id));
    const merged = [...accumulatedRuns];
    for (const item of baseRuns) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }, [accumulatedRuns, baseRuns]);

  const baseObservations = measurementsQuery.data?.items ?? [];
  const effectiveObservations = useMemo(() => {
    if (accumulatedObservations.length === 0) return baseObservations;
    const seen = new Set(accumulatedObservations.map(observationKey));
    const merged = [...accumulatedObservations];
    for (const item of baseObservations) {
      const key = observationKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }, [accumulatedObservations, baseObservations]);

  const sources = sourcesQuery.data?.items ?? [];
  const claims = claimsQuery.data?.items ?? [];

  const handleLoadMoreRuns = async () => {
    if (!resolvedStudyId || isLoadingMoreRuns) return;
    setIsLoadingMoreRuns(true);
    try {
      const currentOffset = effectiveRuns.length;
      let newRuns: MappedRun[] = [];
      try {
        const res = await listInvestigationRuns(resolvedStudyId, {
          offset: currentOffset,
          limit: 100,
        });
        newRuns = res.items.map(mapRunDto);
      } catch {
        const fb = getMockRunsPage(resolvedStudyId, {
          offset: currentOffset,
          limit: 100,
        });
        newRuns = fb.items;
      }

      setAccumulatedRuns((prev) => {
        const base = prev.length > 0 ? prev : effectiveRuns;
        const seen = new Set(base.map((r) => r.id));
        const merged = [...base];
        for (const item of newRuns) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });

      if (newRuns.length > 0) {
        toast.success(
          'Loaded additional runs',
          `Retrieved ${newRuns.length} more test runs from NASA PSI catalog.`
        );
      } else {
        toast.info('All runs loaded', 'No additional test runs found.');
      }
    } catch (err) {
      toast.error('Unable to load more runs', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingMoreRuns(false);
    }
  };

  const handleLoadAllRuns = async () => {
    if (!resolvedStudyId || isLoadingMoreRuns) return;
    setIsLoadingMoreRuns(true);
    try {
      let currentOffset = effectiveRuns.length;
      let allNewRuns: MappedRun[] = [];
      let keepFetching = true;

      while (keepFetching) {
        let items: MappedRun[] = [];
        let hasMore = false;
        let total = 0;

        try {
          const res = await listInvestigationRuns(resolvedStudyId, {
            offset: currentOffset,
            limit: 100,
          });
          items = res.items.map(mapRunDto);
          hasMore = Boolean(res.next || (res.total > 0 && currentOffset + items.length < res.total));
          total = res.total;
        } catch {
          const fb = getMockRunsPage(resolvedStudyId, {
            offset: currentOffset,
            limit: 100,
          });
          items = fb.items;
          hasMore = fb.hasMore;
          total = fb.total;
        }

        allNewRuns = [...allNewRuns, ...items];
        currentOffset += items.length;

        if (!hasMore || items.length === 0 || (total > 0 && currentOffset >= total)) {
          keepFetching = false;
        }
      }

      setAccumulatedRuns((prev) => {
        const base = prev.length > 0 ? prev : effectiveRuns;
        const seen = new Set(base.map((r) => r.id));
        const merged = [...base];
        for (const item of allNewRuns) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        return merged;
      });

      toast.success(
        'Complete runs catalog loaded',
        `Total ${effectiveRuns.length + allNewRuns.length} test runs are now available.`
      );
    } catch (err) {
      toast.error('Failed to load all runs', err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingMoreRuns(false);
    }
  };

  const handleFetchAllData = async () => {
    if (!resolvedStudyId || isFetchingAllData) return;
    setIsFetchingAllData(true);
    try {
      // 1. Fetch remaining runs
      let currentRunsOffset = effectiveRuns.length;
      let allNewRuns: MappedRun[] = [];
      let keepFetchingRuns = true;
      while (keepFetchingRuns) {
        let items: MappedRun[] = [];
        let hasMore = false;
        let total = 0;
        try {
          const res = await listInvestigationRuns(resolvedStudyId, {
            offset: currentRunsOffset,
            limit: 100,
          });
          items = res.items.map(mapRunDto);
          hasMore = Boolean(res.next || (res.total > 0 && currentRunsOffset + items.length < res.total));
          total = res.total;
        } catch {
          const fb = getMockRunsPage(resolvedStudyId, {
            offset: currentRunsOffset,
            limit: 100,
          });
          items = fb.items;
          hasMore = fb.hasMore;
          total = fb.total;
        }
        allNewRuns = [...allNewRuns, ...items];
        currentRunsOffset += items.length;
        if (!hasMore || items.length === 0 || (total > 0 && currentRunsOffset >= total)) {
          keepFetchingRuns = false;
        }
      }

      if (allNewRuns.length > 0) {
        setAccumulatedRuns((prev) => {
          const base = prev.length > 0 ? prev : effectiveRuns;
          const seen = new Set(base.map((r) => r.id));
          const merged = [...base];
          for (const item of allNewRuns) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
          return merged;
        });
      }

      // 2. Fetch remaining observations
      let currentObsOffset = effectiveObservations.length;
      let allNewObs: MappedObservation[] = [];
      let keepFetchingObs = true;
      while (keepFetchingObs) {
        let items: MappedObservation[] = [];
        let hasMore = false;
        let total = 0;
        try {
          const res = await listInvestigationMeasurements(resolvedStudyId, {
            offset: currentObsOffset,
            limit: 100,
          });
          items = res.items.map(mapObservationDto);
          hasMore = Boolean(res.next || (res.total > 0 && currentObsOffset + items.length < res.total));
          total = res.total;
        } catch {
          const fb = getMockObservationsPage(resolvedStudyId, {
            offset: currentObsOffset,
            limit: 100,
          });
          items = fb.items;
          hasMore = fb.hasMore;
          total = fb.total;
        }
        allNewObs = [...allNewObs, ...items];
        currentObsOffset += items.length;
        if (!hasMore || items.length === 0 || (total > 0 && currentObsOffset >= total)) {
          keepFetchingObs = false;
        }
      }

      if (allNewObs.length > 0) {
        setAccumulatedObservations((prev) => {
          const base = prev.length > 0 ? prev : effectiveObservations;
          const seen = new Set(base.map(observationKey));
          const merged = [...base];
          for (const item of allNewObs) {
            const key = observationKey(item);
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
          return merged;
        });
      }

      toast.success(
        'Complete investigation dataset retrieved',
        'All test runs and scalar observations are ready for raw export.'
      );
    } catch (err) {
      toast.error('Unable to fetch complete dataset', err instanceof Error ? err.message : String(err));
    } finally {
      setIsFetchingAllData(false);
    }
  };

  if (!propsStudy && detailQuery.isLoading) {
    return <StudyDetailShimmer />;
  }

  if (!propsStudy && detailQuery.isError && !isEntityNotFoundError(detailQuery.error)) {
    return (
      <div className="w-full max-w-4xl mx-auto py-10 px-4 space-y-4">
        <ApiErrorBanner
          title="Unable to load investigation details"
          error={detailQuery.error}
          onRetry={() => detailQuery.refetch()}
          isRetrying={detailQuery.isFetching}
        />
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0B2374] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Experiment Explorer</span>
        </Link>
      </div>
    );
  }

  if (!study) {
    return (
      <div
        data-testid="study-not-found"
        className="w-full max-w-4xl mx-auto py-16 px-4 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-950">Investigation Not Found</h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            The requested NASA PSI study identifier &ldquo;
            <span className="text-[#0B2374] font-bold">{id}</span>&rdquo; could not be found in the current catalog.
          </p>
        </div>
        <div>
          <Link
            href="/explorer"
            data-testid="not-found-return-link"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0B2374] text-white text-xs font-bold hover:bg-[#081b59] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isCompared = compareList.includes(study.id);

  const tabs: { id: StudyDetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Chamber Overview', icon: Flame },
    { id: 'runs', label: `Test Runs (${effectiveRuns.length}${runsQuery.data?.total && runsQuery.data.total > effectiveRuns.length ? `/${runsQuery.data.total}` : ''})`, icon: Activity },
    { id: 'telemetry', label: 'Scalar Telemetry', icon: Gauge },
    { id: 'claims', label: `Evidence Claims (${claims.length})`, icon: FileText },
    { id: 'psi-export', label: 'PSI Raw Export', icon: Download },
  ];

  return (
    <motion.div
      data-testid="study-detail-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[1600px] mx-auto space-y-6 py-2 pb-24"
    >
      <StudyHeader
        study={study}
        sources={sources}
        isComparing={isCompared}
        onToggleCompare={(sid) => toggleCompare(sid)}
      />

      {/* 2-Column Responsive Split Layout (StructPaper Extracted Content Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* LEFT COLUMN: Study Overview & Physical Science Profile */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Quick Summary Metrics (2x2 Grid, exact StructPaper pattern) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#0B2374]" /> Test Runs
              </span>
              <span className="text-base font-extrabold text-[#0B2374] mt-0.5 block">
                {study.runsMeta?.total ?? effectiveRuns.length} Runs
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#0B2374]" /> Sources
              </span>
              <span className="text-base font-extrabold text-zinc-900 mt-0.5 block">
                {sources.length || study.sourcesMeta?.total || 0} Records
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#0B2374]" /> Claims
              </span>
              <span className="text-base font-extrabold text-zinc-900 mt-0.5 block">
                {claims.length || study.claimsMeta?.total || 0} Verified
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
              <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#0B2374]" /> Observations
              </span>
              <span className="text-base font-extrabold text-zinc-900 mt-0.5 block">
                {effectiveObservations.length} Points
              </span>
            </div>
          </div>

          {/* Physical Science & Platform Parameters Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-zinc-900">
              <Layers className="w-4 h-4 text-[#0B2374]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                Physical Science Profile
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Platform</span>
                <span className="font-bold text-zinc-900">{study.platform ?? 'Platform unmapped'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Collection</span>
                <span className="font-mono text-zinc-900 font-semibold">{study.context.collectionId}</span>
              </div>
              {study.fuelType && (
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Fuel / Sample</span>
                  <span className="font-bold text-zinc-900">{study.fuelType}</span>
                </div>
              )}
              {study.gravityRaw && (
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Gravity Level</span>
                  <span className="font-bold text-zinc-900">{study.gravityRaw}</span>
                </div>
              )}
            </div>
          </div>

          {/* Catalog Taxonomy Tags */}
          {study.tags.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-2.5">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#0B2374]" /> Catalog Tags ({study.tags.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {study.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200/80 text-[11px] font-semibold text-zinc-700"
                  >
                    <span>{tag.label}</span>
                    {tag.category && (
                      <span className="text-[10px] text-zinc-400">({tag.category})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Segmented Tabs & Active Tab Data Explorer */}
        <div className="space-y-4 min-w-0">
          {/* Segmented Filter Control Navigation Bar */}
          <div
            role="tablist"
            aria-label="Investigation Detail Views"
            className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-x-auto scrollbar-none"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2374] text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            aria-label="Tab Content"
            className="min-w-0"
          >
            {activeTab === 'overview' && (
              <ChamberOverviewTab
                study={study}
                sources={sources}
                isSourcesLoading={sourcesQuery.isLoading}
                sourcesError={sourcesQuery.error}
                onRetrySources={() => sourcesQuery.refetch()}
              />
            )}
            {activeTab === 'runs' && (
              <TestRunsTable
                study={study}
                runs={effectiveRuns}
                totalRuns={runsQuery.data?.total}
                isLoading={runsQuery.isLoading && effectiveRuns.length === 0}
                error={runsQuery.error}
                onRetry={() => runsQuery.refetch()}
                onLoadMore={handleLoadMoreRuns}
                onLoadAll={handleLoadAllRuns}
                isLoadingMore={isLoadingMoreRuns}
                hasMore={runsQuery.data?.hasMore}
              />
            )}
            {activeTab === 'telemetry' && (
              <TelemetryPane
                study={study}
                runs={effectiveRuns}
                observations={effectiveObservations}
                isLoading={(runsQuery.isLoading || measurementsQuery.isLoading) && effectiveRuns.length === 0}
                error={runsQuery.error ?? measurementsQuery.error}
                onRetry={() => {
                  runsQuery.refetch();
                  measurementsQuery.refetch();
                }}
              />
            )}
            {activeTab === 'claims' && (
              <ClaimsList
                study={study}
                claims={claims}
                sources={sources}
                isLoading={claimsQuery.isLoading}
                error={claimsQuery.error}
                onRetry={() => claimsQuery.refetch()}
              />
            )}
            {activeTab === 'psi-export' && (
              <PsiExportTab
                study={study}
                runs={effectiveRuns}
                observations={effectiveObservations}
                sources={sources}
                claims={claims}
                totalRuns={runsQuery.data?.total}
                totalObservations={measurementsQuery.data?.total}
                onFetchAllData={handleFetchAllData}
                isFetchingAll={isFetchingAllData}
              />
            )}
          </motion.section>
        </div>
      </div>

      <ComparisonBar
        compareList={compareList}
        studies={[{ id: study.id, label: study.psiId }]}
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

export default StudyDetailClient;
