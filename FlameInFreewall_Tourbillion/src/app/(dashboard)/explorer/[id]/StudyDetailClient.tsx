'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Flame,
  Activity,
  FileText,
  Download,
  Gauge,
} from 'lucide-react';
import { ApiClientError } from '@/api/client';
import type { MappedInvestigationDetail } from '@/types/api';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2374] hover:bg-[#081b59] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Experiment Explorer</span>
          </Link>
        </div>
      </div>
    );
  }

  const runs = runsQuery.data?.items ?? [];
  const observations = measurementsQuery.data?.items ?? [];
  const sources = sourcesQuery.data?.items ?? [];
  const claims = claimsQuery.data?.items ?? [];

  const runsCount = runsQuery.data?.total ?? study.runsMeta.total;
  const claimsCount = claimsQuery.data?.total ?? study.claimsMeta.total;
  const isComparing = compareList.includes(study.id);

  const TABS = [
    { id: 'overview' as const, label: 'Chamber Overview', icon: Gauge },
    { id: 'runs' as const, label: `Test Runs (${runsCount})`, icon: Activity },
    { id: 'telemetry' as const, label: 'Conditions & Observations', icon: Flame },
    { id: 'claims' as const, label: `Claims (${claimsCount})`, icon: FileText },
    { id: 'psi-export' as const, label: 'PSI Raw Export', icon: Download },
  ];

  return (
    <div
      data-testid="study-detail-page"
      className="w-full max-w-7xl mx-auto space-y-6 py-2 pb-24"
    >
      <StudyHeader
        study={study}
        sources={sources}
        isComparing={isComparing}
        onToggleCompare={toggleCompare}
      />

      <div
        data-testid="study-tabs-nav"
        className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-gray-100/80 border border-gray-200/60"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <section aria-label="Tab Content" className="transition-all duration-200">
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
            runs={runs}
            isLoading={runsQuery.isLoading}
            error={runsQuery.error}
            onRetry={() => runsQuery.refetch()}
          />
        )}
        {activeTab === 'telemetry' && (
          <TelemetryPane
            study={study}
            runs={runs}
            observations={observations}
            isLoading={runsQuery.isLoading || measurementsQuery.isLoading}
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
            isLoading={claimsQuery.isLoading}
            error={claimsQuery.error}
            onRetry={() => claimsQuery.refetch()}
          />
        )}
        {activeTab === 'psi-export' && (
          <PsiExportTab
            study={study}
            runs={runs}
            observations={observations}
            sources={sources}
            claims={claims}
          />
        )}
      </section>

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
    </div>
  );
}

export default StudyDetailClient;
