'use client';

import React from 'react';
import { CitationBadge } from './CitationBadge';
import type { ChatAnswerState, MappedChatMessage } from '@/types/api';

export interface AiMessageItemProps {
  message: MappedChatMessage;
}

const STATE_NOTICES: Partial<Record<ChatAnswerState, string>> = {
  abstained: 'No matching evidence in the connected corpus — nothing was inferred.',
  timeout: 'Provider timed out — no answer was invented.',
  unavailable: 'Evidence provider unavailable.',
};

function provenance(origin: string, reviewStatus: string): string | null {
  if (reviewStatus !== 'unreviewed') return null;
  if (origin === 'real') return 'Research source excerpts. Scientific review has not been documented.';
  if (origin === 'synthetic') return 'Synthetic test data.';
  return 'Scientific review has not been documented.';
}

/** One stored chat message, rendered like the NASA research chat. */
export const AiMessageItem: React.FC<AiMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { answer } = message;
  const notice = isUser ? undefined : STATE_NOTICES[answer.state];
  // Provenance is only claimed for answers that actually cite a source.
  const note = !isUser && answer.citations.length > 0
    ? provenance(answer.origin, answer.reviewStatus)
    : null;

  return (
    <article
      aria-label={isUser ? 'Your message' : 'Assistant reply'}
      className={
        isUser
          ? 'ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-[#0B2374] p-3 text-sm text-white'
          : 'mr-auto w-fit max-w-[95%] rounded-2xl rounded-tl-sm border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm'
      }
    >
      <p className="whitespace-pre-wrap break-words leading-relaxed">{answer.text}</p>
      {notice && (
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">
          {notice}
        </p>
      )}
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
      {!isUser &&
        answer.citations.map((citation, idx) => (
          <CitationBadge
            key={`${message.id}:${idx}:${answer.corpusVersion ?? 'legacy'}`}
            citation={citation}
            index={idx + 1}
            corpusVersion={answer.corpusVersion}
          />
        ))}
    </article>
  );
};
