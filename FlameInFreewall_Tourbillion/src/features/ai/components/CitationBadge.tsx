'use client';

import React, { useState } from 'react';
import { ApiClientError } from '@/api/client';
import { useChatSourceQuery } from '../hooks';
import type { MappedChatCitation } from '@/types/api';
import { chatButton } from './chatStyles';

export interface CitationBadgeProps {
  citation: MappedChatCitation;
  /** 1-based number matching `[n]` markers in the answer text. */
  index: number;
  /** Corpus revision the answer was produced from; pins the source lookup. */
  corpusVersion: string | null;
}

function sourceError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) {
    return 'This citation belongs to an older corpus revision.';
  }
  if (error instanceof ApiClientError && error.status === 404) {
    return 'Source unavailable in the current corpus.';
  }
  return 'Source unavailable right now. Try again later.';
}

function psiInvestigationUrl(sourceUrl: string | null): string | null {
  const study = sourceUrl?.match(/^https:\/\/psi\.nasa\.gov\/geode-py\/ws\/studies\/(PSI-\d+)\/download(?:\?|$)/i);
  return study ? `https://psi.nasa.gov/physci/repo/data/investigations/${study[1]}` : null;
}

/** One cited source passage: verbatim excerpt plus revision-pinned file metadata on demand. */
export const CitationBadge: React.FC<CitationBadgeProps> = ({
  citation,
  index,
  corpusVersion,
}) => {
  const [expanded, setExpanded] = useState(false);
  const source = useChatSourceQuery(
    expanded && corpusVersion
      ? { sourceId: citation.sourceDocumentId, locator: citation.sourceLocator, corpusVersion }
      : null
  );
  const sourceData = source.data;
  const studyUrl = psiInvestigationUrl(sourceData?.sourceUrl ?? null);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
      <p className="font-semibold break-all">{`[${index}] ${citation.sourceLocator}`}</p>
      <button
        type="button"
        className={`${chatButton} mt-2 px-3 py-1.5 text-xs`}
        aria-expanded={expanded}
        disabled={!citation.sourceExcerpt && !corpusVersion}
        onClick={() => setExpanded(!expanded)}
      >
        {`${expanded ? 'Hide' : 'View'} source ${index}`}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 break-words">
          {citation.sourceExcerpt && (
            <blockquote className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-white p-2.5 leading-relaxed">
              {citation.sourceExcerpt}
            </blockquote>
          )}
          {source.isFetching && !sourceData && <p role="status">Loading source details…</p>}
          {sourceData && (
            <>
              <p className="font-semibold">{sourceData.filename}</p>
              <p>{sourceData.license}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {studyUrl && (
                  <a className="font-semibold text-[#0B2374] underline" href={studyUrl} target="_blank" rel="noreferrer">
                    View NASA study ↗
                  </a>
                )}
                {sourceData.sourceUrl && (
                  <a className="text-[#0B2374] underline" href={sourceData.sourceUrl} target="_blank" rel="noreferrer">
                    {studyUrl ? 'Open raw file' : 'Open original source'} ↗
                  </a>
                )}
              </div>
              <details>
                <summary className="cursor-pointer">File fingerprint</summary>
                <code className="block break-all text-[10px]">SHA-256 {sourceData.sha256}</code>
              </details>
            </>
          )}
          {source.error && <p role="alert" className="text-red-800">{sourceError(source.error)}</p>}
        </div>
      )}
    </div>
  );
};
