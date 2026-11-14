'use client';

import React, { useState } from 'react';
import { ApiClientError } from '@/api/client';
import { useChatSourceQuery } from '@/hooks/api';
import type { MappedChatCitation } from '@/types/api';
import { chatButton } from './chatStyles';

export interface CitationBadgeProps {
  citation: MappedChatCitation;
  /** 1-based number matching `[n]` markers in the answer text. */
  index: number;
  /** Corpus revision the answer was produced from; pins the source lookup. */
  corpusVersion: string | null;
  /** Show the excerpt only when the answer text does not already quote it. */
  showExcerpt: boolean;
}

function sourceError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) {
    return 'This citation belongs to an older corpus revision. The original excerpt is retained above.';
  }
  if (error instanceof ApiClientError && error.status === 404) {
    return 'Source unavailable in the current corpus.';
  }
  return 'Source unavailable right now. Try again later.';
}

/** One cited source passage: verbatim excerpt plus revision-pinned file metadata on demand. */
export const CitationBadge: React.FC<CitationBadgeProps> = ({
  citation,
  index,
  corpusVersion,
  showExcerpt,
}) => {
  const [requested, setRequested] = useState(false);
  const source = useChatSourceQuery(
    requested && corpusVersion
      ? { sourceId: citation.sourceDocumentId, locator: citation.sourceLocator, corpusVersion }
      : null
  );

  const handleView = () => {
    if (requested) void source.refetch();
    else setRequested(true);
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <p className="font-semibold break-all">{`[${index}] ${citation.sourceLocator}`}</p>
      {showExcerpt && citation.sourceExcerpt && (
        <details className="mt-2">
          <summary className="cursor-pointer">Read source excerpt</summary>
          <blockquote className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words border-l-2 border-slate-300 pl-2">
            {citation.sourceExcerpt}
          </blockquote>
        </details>
      )}
      <button
        type="button"
        className={`${chatButton} mt-2 px-3 py-1.5 text-xs`}
        disabled={!corpusVersion || source.isFetching}
        onClick={handleView}
      >
        {source.isFetching ? 'Loading source…' : `View source ${index}`}
      </button>
      {source.data && (
        <div className="mt-2 space-y-1 break-words">
          {source.data.sourceUrl ? (
            <a
              className="font-semibold text-[#0B2374] underline"
              href={source.data.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {source.data.filename} ↗
            </a>
          ) : (
            <span className="font-semibold">{source.data.filename}</span>
          )}
          <p>{`${source.data.license} · Original source`}</p>
          <details>
            <summary className="cursor-pointer">File fingerprint</summary>
            <code className="block break-all text-[10px]">SHA-256 {source.data.sha256}</code>
          </details>
        </div>
      )}
      {source.error && (
        <p role="alert" className="mt-2 text-red-800">
          {sourceError(source.error)}
        </p>
      )}
    </div>
  );
};
