'use client';

import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { ApiClientError } from '@/api/client';
import { useChatSourceQuery } from '@/hooks/api';
import type { MappedChatCitation } from '@/types/api';

export interface CitationBadgeProps {
  citation: MappedChatCitation;
  /** 1-based number matching `[n]` markers in the answer text. */
  index: number;
  /** Corpus revision the answer was produced from; pins the source lookup. */
  corpusVersion: string | null;
}

function sourceError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) {
    return 'This citation belongs to an older corpus revision. The original excerpt above is unchanged.';
  }
  if (error instanceof ApiClientError && error.status === 404) {
    return 'Source unavailable in the current corpus.';
  }
  return 'Source unavailable right now. Try again later.';
}

/**
 * One cited source passage: verbatim excerpt plus revision-pinned file metadata on demand.
 */
export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation, index, corpusVersion }) => {
  const [requested, setRequested] = useState(false);
  const source = useChatSourceQuery(
    requested && corpusVersion
      ? {
          sourceId: citation.sourceDocumentId,
          locator: citation.sourceLocator,
          corpusVersion,
        }
      : null
  );

  const handleView = () => {
    if (requested) void source.refetch();
    else setRequested(true);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 space-y-1.5">
      <p className="text-[11px] font-bold text-[#0B2374] flex items-center gap-1.5 break-all">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span>{`[${index}] ${citation.sourceLocator}`}</span>
      </p>

      {citation.sourceExcerpt && (
        <details className="text-[11px] text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-600 hover:text-zinc-900">
            Read source excerpt
          </summary>
          <blockquote className="mt-1.5 whitespace-pre-wrap border-l-2 border-[#0B2374]/30 pl-2 text-zinc-800">
            {citation.sourceExcerpt}
          </blockquote>
        </details>
      )}

      <button
        type="button"
        onClick={handleView}
        disabled={!corpusVersion || source.isFetching}
        className="text-[11px] font-semibold text-[#0B2374] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
      >
        {source.isFetching ? 'Loading source…' : `View source ${index}`}
      </button>

      {source.data && (
        <div className="text-[11px] text-zinc-700 space-y-1 pt-1 border-t border-gray-200">
          {source.data.sourceUrl ? (
            <a
              href={source.data.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#0B2374] hover:underline inline-flex items-center gap-1 break-all"
            >
              {source.data.filename}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="font-semibold break-all">{source.data.filename}</span>
          )}
          <p>{`${source.data.license} · original source file`}</p>
          <details>
            <summary className="cursor-pointer">File fingerprint</summary>
            <code className="block break-all text-[10px] text-zinc-600">SHA-256 {source.data.sha256}</code>
          </details>
        </div>
      )}

      {source.error && (
        <p role="alert" className="text-[11px] text-amber-800">
          {sourceError(source.error)}
        </p>
      )}
    </div>
  );
};
