'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Plus, Tag, Layers } from 'lucide-react';
import type { MappedInvestigation } from '@/types/api';

export interface InvestigationCardProps {
  investigation: MappedInvestigation;
  isComparing: boolean;
  onToggleCompare: (id: string) => void;
}

export const InvestigationCard: React.FC<InvestigationCardProps> = ({
  investigation,
  isComparing,
  onToggleCompare,
}) => {
  const router = useRouter();
  const visibleTags = investigation.tags.slice(0, 3);
  const extraTagCount = Math.max(0, investigation.tagsTotal - visibleTags.length);
  const unavailableCount = Object.keys(investigation.unavailableFields).length;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is inside a button or anchor link, let that element handle it natively
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    router.push(`/explorer/${investigation.routeKey}`);
  };

  return (
    <motion.div
      data-testid={`investigation-card-${investigation.id}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={handleCardClick}
      className={`group relative rounded-3xl md:rounded-[36px] p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer bg-gray-200/50 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] select-none ${
        isComparing
          ? 'ring-2 ring-[#D4FC02] shadow-[0_8px_30px_rgba(212,252,2,0.3)] bg-white'
          : ''
      }`}
    >
      <div>
        {/* Top Header: PSI ID, Platform & Compare Toggle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-blue-50 text-[#0B2374] border border-blue-100 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs">
              {investigation.psiId}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs border bg-white text-zinc-700 border-gray-200/80">
              <Layers className="w-3 h-3 text-[#0B2374]" />
              <span>{investigation.platform ?? 'Platform unmapped'}</span>
            </span>
          </div>

          <button
            type="button"
            data-testid={`compare-btn-${investigation.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare(investigation.id);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
              isComparing
                ? 'bg-[#D4FC02] text-zinc-950 shadow-xs'
                : 'bg-white hover:bg-gray-100 text-zinc-700 shadow-2xs'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isComparing ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Comparing</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>Compare</span>
              </>
            )}
          </button>
        </div>

        {/* Title Link */}
        <Link href={`/explorer/${investigation.routeKey}`} className="block group/link">
          <h3 className="text-base font-bold text-zinc-900 group-hover/link:text-[#0B2374] transition-colors line-clamp-2 leading-snug">
            {investigation.title}
          </h3>
        </Link>

        {/* Research Purpose Snippet */}
        <p className="mt-2 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
          {investigation.researchPurpose ?? 'Research purpose not provided in PSI catalog.'}
        </p>

        {/* Minimalist Tags Strip */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 py-2 px-3 rounded-2xl bg-white/70 border border-gray-100/60">
          {visibleTags.length > 0 ? (
            <>
              {visibleTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-semibold text-zinc-700"
                >
                  <Tag className="w-2.5 h-2.5 text-[#0B2374]" />
                  <span>{tag.label}</span>
                </span>
              ))}
              {extraTagCount > 0 && (
                <span className="text-[11px] font-semibold text-zinc-500">
                  +{extraTagCount} more
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-zinc-500">No catalog tags mapped</span>
          )}
        </div>
      </div>

      {/* Minimalist Provenance Footer */}
      <div className="mt-4 pt-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-bold shadow-2xs text-zinc-700 capitalize">
            {investigation.context.origin}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs uppercase bg-[#D4FC02]/30 text-zinc-950">
            {investigation.context.reviewState}
          </span>
          {unavailableCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800">
              {unavailableCount} unmapped
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
