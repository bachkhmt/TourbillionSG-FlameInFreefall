'use client';

import React from 'react';
import { Bot, User, AlertTriangle } from 'lucide-react';
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

function provenanceLabel(origin: string, reviewStatus: string): string {
  const review = reviewStatus === 'unreviewed' ? 'Unreviewed' : 'Review status unknown';
  return origin === 'real' ? `Real NASA source · ${review}` : `Origin ${origin} · ${review}`;
}

export const AiMessageItem: React.FC<AiMessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const { answer } = message;
  const notice = isAssistant ? STATE_NOTICES[answer.state] : undefined;

  return (
    <div className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-[#0B2374]/10 border border-[#0B2374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#0B2374]">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] text-xs leading-relaxed space-y-2.5 ${
          isAssistant
            ? 'bg-white border border-gray-200 text-zinc-900 shadow-xs rounded-2xl rounded-tl-xs p-3.5'
            : 'bg-gray-100 text-zinc-900 rounded-2xl rounded-tr-xs p-3.5'
        }`}
      >
        <div className="whitespace-pre-wrap">{answer.text}</div>

        {notice && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {isAssistant && answer.citations.length > 0 && (
          <p className="text-[10px] font-semibold text-zinc-500 tracking-wide">
            {provenanceLabel(answer.origin, answer.reviewStatus)}
          </p>
        )}

        {isAssistant && answer.citations.length > 0 && (
          <div className="pt-2 border-t border-gray-200 space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 block tracking-wider uppercase">
              Source citations ({answer.citations.length})
            </span>
            {answer.citations.map((citation, idx) => (
              <CitationBadge
                key={`${citation.sourceDocumentId}-${citation.sourceLocator}-${idx}`}
                citation={citation}
                index={idx + 1}
                corpusVersion={answer.corpusVersion}
              />
            ))}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0 mt-0.5 text-zinc-700">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
