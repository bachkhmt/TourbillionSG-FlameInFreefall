'use client';

import React from 'react';
import { ExternalLink, Database, BookOpen, Film, Flame, ShieldAlert, FileText } from 'lucide-react';
import type { ChallengeResourceDto } from '@/api/dto';

export interface ResourceCardProps {
  resource: ChallengeResourceDto;
}

function getCategoryConfig(kind?: string) {
  switch (kind) {
    case 'data_repository':
      return {
        label: 'Data Repository',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Database,
      };
    case 'case_study':
      return {
        label: 'Mission Case Study',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: ShieldAlert,
      };
    case 'earth_application':
      return {
        label: 'Earth Application',
        badgeClass: 'bg-[#D4FC02]/30 text-zinc-950 border-lime-300 font-extrabold',
        icon: Flame,
      };
    case 'video':
      return {
        label: 'Video Briefing',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Film,
      };
    case 'background':
    default:
      return {
        label: 'Science Context',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: FileText,
      };
  }
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const cat = getCategoryConfig(resource.kind);
  const Icon = cat.icon;

  return (
    <article
      data-testid={`resource-card-${resource.resource_id}`}
      className="flex flex-col justify-between rounded-3xl border-2 border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="space-y-3">
        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide ${cat.badgeClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </span>

            {resource.indexed && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-lime-900 border border-lime-300">
                Indexed in RAG
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {resource.status?.replace('_', ' ') || 'Official'}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-[#0B2374] transition-colors leading-snug">
          {resource.title}
        </h2>

        {/* Role / Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {resource.role || 'Official NASA Physical Sciences Informatics and challenge documentation.'}
        </p>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 font-medium">
          Rights:{' '}
          <span className="font-semibold text-slate-700">
            {resource.license && resource.license !== 'unknown' ? resource.license : 'Public NASA Record'}
          </span>
        </div>

        {resource.source_url && (
          <a
            href={resource.source_url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`open-resource-link-${resource.resource_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-[#0B2374] border-2 border-gray-200/90 text-xs font-bold transition-all shadow-2xs hover:border-[#0B2374]/40 cursor-pointer"
          >
            <span>Open NASA Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};
