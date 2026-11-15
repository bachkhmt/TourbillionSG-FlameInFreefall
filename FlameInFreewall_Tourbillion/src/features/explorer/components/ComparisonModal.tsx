'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ArrowRight, Columns3, Flame, Table2, LayoutGrid } from 'lucide-react';
import { useComparisonQuery } from '../hooks/useComparisonQueries';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { buildComparisonCsv, triggerFileDownload } from '@/lib/exportUtils';
import { toast } from '@/components/toast/toast-store';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { ComparisonColumn } from './ComparisonColumn';
import { ComparisonMatrixTable } from './ComparisonMatrixTable';
import { ParameterDeltaSummary } from './ParameterDeltaSummary';
import { ComparisonModalShimmer } from './ComparisonModalShimmer';

export interface ComparisonModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  compareList?: string[];
  onRemove?: (id: string) => void;
}

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

interface ComparisonModalDialogProps {
  onClose: () => void;
  compareList: string[];
  onRemove?: (id: string) => void;
}

const ComparisonModalDialog: React.FC<ComparisonModalDialogProps> = ({
  onClose,
  compareList,
  onRemove,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const prevPathnameRef = React.useRef(pathname);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      onClose();
      useWorkspaceStore.getState().closeComparisonModal();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, onClose]);

  const comparisonQuery = useComparisonQuery(
    compareList,
    { observationLimit: 100 },
    { enabled: compareList.length >= 2 }
  );
  const comparison = comparisonQuery.data;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExportCsv = () => {
    if (!comparison || comparison.studies.length === 0) return;
    try {
      const csvData = buildComparisonCsv(comparison);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const slug = comparison.studies.map((s) => s.investigation.psiId).join('-').toLowerCase();
      triggerFileDownload(blob, `flameguard-comparison-${slug}.csv`);
      toast.success('Comparison CSV Exported', 'Comparative metrics downloaded.');
    } catch {
      toast.error('Export Error', 'Unable to create CSV download.');
    }
  };

  const handleOpenWorkbench = () => {
    if (compareList.length < 2) return;
    onClose();
    router.push(`/mission?compare=${compareList.join(',')}`);
    toast.info('Loading Mission Workbench', 'Transferring selected studies to Gap Matrix.');
  };

  return (
    <div data-testid="comparison-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        data-testid="comparison-modal-backdrop"
        initial={isTest ? false : { opacity: 0 }}
        animate={isTest ? undefined : { opacity: 1 }}
        exit={isTest ? undefined : { opacity: 0 }}
        transition={isTest ? { duration: 0 } : { duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm cursor-pointer z-[100]"
        aria-hidden="true"
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-modal-title"
        initial={isTest ? false : { opacity: 0, scale: 0.96, y: 16 }}
        animate={isTest ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={isTest ? undefined : { opacity: 0, scale: 0.96, y: 16 }}
        transition={isTest ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[110] w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] text-[#1A1A1A] overflow-hidden"
      >
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
              <Columns3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="comparison-modal-title" className="text-lg sm:text-xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
                Multi-Study Comparison
                <span className="text-xs font-bold text-zinc-950 px-2.5 py-0.5 rounded-full bg-[#D4FC02] border border-lime-300">
                  {comparison?.studies.length ?? compareList.length}/3 Studies
                </span>
              </h2>
              <p className="text-xs text-zinc-500">Side-by-side observed materials, gravities &amp; observable summaries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparison && comparison.studies.length >= 2 && (
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs">
                <button
                  type="button"
                  data-testid="comparison-view-table-btn"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5 text-[#0B2374]" />
                  <span>Table Matrix</span>
                </button>
                <button
                  type="button"
                  data-testid="comparison-view-cards-btn"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#0B2374]" />
                  <span>Cards</span>
                </button>
              </div>
            )}
            <button
              type="button"
              data-testid="comparison-modal-close-icon"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close Comparison Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/50">
          {compareList.length < 2 ? (
            <div className="text-center py-16 space-y-3">
              <Flame className="w-10 h-10 text-amber-500 mx-auto opacity-75" />
              <h4 className="text-base font-bold text-zinc-900">Select at least 2 studies</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Multi-study comparative analysis requires 2 or 3 active investigations.
              </p>
            </div>
          ) : comparisonQuery.isLoading ? (
            <ComparisonModalShimmer />
          ) : comparisonQuery.isError ? (
            <ApiErrorBanner
              title="Unable to load study comparison"
              error={comparisonQuery.error}
              onRetry={() => comparisonQuery.refetch()}
              isRetrying={comparisonQuery.isFetching}
            />
          ) : comparison ? (
            <>
              <ParameterDeltaSummary comparison={comparison} />
              {viewMode === 'table' ? (
                <ComparisonMatrixTable studies={comparison.studies} onRemove={onRemove} onInspect={onClose} />
              ) : (
                <div
                  data-testid="comparison-grid"
                  className={`grid gap-4 ${comparison.studies.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}
                >
                  {comparison.studies.map((study) => (
                    <ComparisonColumn key={study.investigation.id} study={study} onRemove={onRemove} onInspect={onClose} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        <footer className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Research provenance · no operational safety inference</span>
            <button
              type="button"
              data-testid="export-comparison-csv-btn"
              onClick={handleExportCsv}
              disabled={!comparison || comparison.studies.length < 2}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-800 font-semibold text-xs border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0B2374]" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="close-comparison-modal-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-zinc-700 font-semibold text-xs border border-gray-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              data-testid="open-mission-workbench-btn"
              onClick={handleOpenWorkbench}
              disabled={compareList.length < 2}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Open in Mission Workbench</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      </motion.section>
    </div>
  );
};

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  compareList: propCompareList,
  onRemove: propOnRemove,
}) => {
  const storeIsOpen = useWorkspaceStore((state) => state.isComparisonModalOpen);
  const storeClose = useWorkspaceStore((state) => state.closeComparisonModal);
  const storeCompareList = useWorkspaceStore((state) => state.compareList);
  const storeRemove = useWorkspaceStore((state) => state.removeFromCompare);

  const isOpen = propIsOpen ?? storeIsOpen;
  const onClose = propOnClose ?? storeClose;
  const compareList = propCompareList ?? storeCompareList;
  const onRemove = propOnRemove ?? storeRemove;

  return (
    <AnimatePresence>
      {isOpen && (
        <ComparisonModalDialog onClose={onClose} compareList={compareList} onRemove={onRemove} />
      )}
    </AnimatePresence>
  );
};
