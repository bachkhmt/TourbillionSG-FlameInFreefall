'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Check,
  Building2,
  ChevronRight,
  Tag,
  Info,
  Activity,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { MappedInvestigationDetail, MappedSource } from '@/types/api';

export interface StudyHeaderProps {
  study: MappedInvestigationDetail;
  sources?: MappedSource[];
  isComparing: boolean;
  onToggleCompare: (id: string) => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = ({
  study,
  sources,
  isComparing,
  onToggleCompare,
}) => {
  const primarySourceUrl = sources?.[0]?.sourceUrl ?? null;
  const unavailableCount = Object.keys(study.unavailableFields).length;

  return (
    <div
      data-testid="study-header"
      className="w-full bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden"
    >
      {/* Top Breadcrumb & External Source Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-500 font-medium">
          <Link
            href="/explorer"
            data-testid="back-to-explorer-link"
            className="inline-flex items-center gap-1 text-[#0B2374] hover:text-[#081b59] font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explorer</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-400" />
          <span className="text-zinc-900 font-bold">{study.psiId}</span>
        </div>

        <a
          href={primarySourceUrl ?? 'https://psi.nasa.gov/'}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="study-nasa-psi-link"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-zinc-700 hover:text-zinc-950 text-xs font-semibold transition-colors"
        >
          <span>{primarySourceUrl ? 'Primary PSI Source' : 'NASA PSI Repository'}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#0B2374]" />
        </a>
      </div>

      {/* Main Title & Mapped Badges */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase bg-[#D4FC02] text-zinc-950 shadow-2xs">
            {study.psiId}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-[#0B2374] border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>{study.platform ?? 'Platform unmapped'}</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase bg-gray-100 text-zinc-800 border border-gray-200">
            {study.context.origin} · {study.context.reviewState}
          </span>
          {unavailableCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {unavailableCount} unmapped field{unavailableCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
          {study.title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-4xl font-normal">
          {study.researchPurpose ?? 'Research purpose not provided in the PSI catalog.'}
        </p>

        {/* Mapped Tags */}
        {study.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {study.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200/80 text-[11px] font-semibold text-zinc-700"
              >
                <Tag className="w-3 h-3 text-[#0B2374]" />
                <span>{tag.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Context Caveats Notice */}
      {study.context.caveats.length > 0 && (
        <div
          data-testid="study-caveats-notice"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900"
        >
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Provenance &amp; Context Caveats</span>
            <p className="leading-relaxed">{study.context.caveats.join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Collection Totals & Compare Button */}
      <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
            <Activity className="w-4 h-4 text-[#0B2374]" />
            <span>{study.runsMeta.total} Test Runs</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
            <BookOpen className="w-4 h-4 text-[#0B2374]" />
            <span>{study.sourcesMeta.total} Sources</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
            <FileText className="w-4 h-4 text-[#0B2374]" />
            <span>{study.claimsMeta.total} Claims</span>
          </div>
        </div>

        <button
          type="button"
          data-testid="header-compare-btn"
          onClick={() => onToggleCompare(study.id)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            isComparing
              ? 'bg-[#D4FC02] text-zinc-950 shadow-xs hover:bg-[#c4eb02]'
              : 'bg-gray-100 hover:bg-gray-200 text-zinc-800 border border-gray-200'
          }`}
        >
          {isComparing ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Comparing Study</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Compare Study</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
