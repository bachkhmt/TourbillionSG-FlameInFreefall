'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ApiClientError } from '@/api/client';
import {
  isNotFound,
  useChatHistoryQuery,
  useChatReadinessQuery,
  useSendChatMessageMutation,
} from '@/hooks/api';
import { CHAT_QUICK_PROMPTS } from '@/lib/chatPrompts';
import {
  clearChatSessionId,
  isUuidLike,
  readChatSessionId,
  writeChatSessionId,
} from '@/lib/chatSession';
import { useAiAssistantStore } from '@/store/useAiAssistantStore';
import { AiMessageItem } from './AiMessageItem';

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) {
      return 'The evidence changed while answering. Nothing was saved — please send the question again.';
    }
    if (error.status === 502) {
      return 'The evidence provider returned an answer that failed citation checks. Nothing was saved.';
    }
    if (error.code === 'REQUEST_TIMEOUT') {
      return 'The request timed out. Reopen the assistant to reload history before resending.';
    }
    if (error.status === 503 || error.status === 0) {
      return 'Chat service unavailable. Check the backend connection and try again.';
    }
  }
  return 'The question could not be answered right now.';
}

/** Shell stays hook-free while closed so pages render without the chat API. */
export const AiDrawer: React.FC = () => {
  const isOpen = useAiAssistantStore((s) => s.isOpen);
  return isOpen ? <AiDrawerPanel /> : null;
};

const AiDrawerPanel: React.FC = () => {
  const setOpen = useAiAssistantStore((s) => s.setOpen);
  const messages = useAiAssistantStore((s) => s.messages);
  const sessionId = useAiAssistantStore((s) => s.sessionId);
  const activeContextStudyId = useAiAssistantStore((s) => s.activeContextStudyId);
  const setActiveContextStudyId = useAiAssistantStore((s) => s.setActiveContextStudyId);
  const setConversation = useAiAssistantStore((s) => s.setConversation);
  const appendMessages = useAiAssistantStore((s) => s.appendMessages);
  const resetConversation = useAiAssistantStore((s) => s.resetConversation);

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Restore only when this page has no live conversation yet.
  const [storedSessionId, setStoredSessionId] = useState<string | null>(() =>
    useAiAssistantStore.getState().sessionId ? null : readChatSessionId()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readiness = useChatReadinessQuery();
  const ready = readiness.data?.state === 'ready';
  const history = useChatHistoryQuery(storedSessionId, { enabled: ready && !sessionId });
  const send = useSendChatMessageMutation();
  const busy = send.isPending || history.isFetching;

  useEffect(() => {
    if (history.data && !useAiAssistantStore.getState().sessionId) {
      setConversation(history.data.session.id, history.data.messages);
      setStoredSessionId(null);
    }
  }, [history.data, setConversation]);

  useEffect(() => {
    if (!history.error || !storedSessionId) return;
    if (isNotFound(history.error)) {
      clearChatSessionId();
      setError('Your previous session expired. Send a question to start a new one.');
    } else {
      // A transient failure does not revoke the existing server session.
      setConversation(storedSessionId, []);
      setError('Earlier messages could not be loaded right now.');
    }
    setStoredSessionId(null);
  }, [history.error, storedSessionId, setConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, send.isPending]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  const handleSend = (textToSend?: string) => {
    const question = (textToSend ?? input).trim();
    if (!question || busy || !ready) return;
    setError(null);
    setInput('');
    send.mutate(
      {
        question,
        sessionId,
        investigationId: isUuidLike(activeContextStudyId) ? activeContextStudyId : null,
      },
      {
        onSuccess: (result) => {
          writeChatSessionId(result.sessionId);
          appendMessages(result.sessionId, result.messages);
        },
        onError: (failure) => {
          setInput(question);
          setError(sendErrorMessage(failure));
        },
      }
    );
  };

  const handleNewSession = () => {
    resetConversation();
    setError(null);
  };

  const handleClearContext = () => {
    // A scoped session only searches that study, so a new context needs a new session.
    setActiveContextStudyId(null);
    handleNewSession();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="FlameGuard Grounded AI Assistant"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-[420px] max-w-full bg-white/95 backdrop-blur-xl border-l border-gray-200 shadow-2xl flex flex-col justify-between text-[#1A1A1A] relative h-full">
          <div className="p-4 bg-[#0B2374] flex items-center justify-between gap-3 shrink-0 shadow-sm text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#D4FC02]/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#D4FC02]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-[#D4FC02] tracking-wide truncate">
                    FlameGuard Grounded AI
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#D4FC02] text-[#0B2374]">
                    RAG
                  </span>
                </div>
                <p className="text-[11px] text-gray-200/90 truncate font-medium">
                  NASA PSI source passages • Cited excerpts only
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {(sessionId || messages.length > 0) && (
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-[#D4FC02] hover:bg-white/10 transition-colors"
                  title="Start a new session (server history is kept)"
                  aria-label="Start new session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-[#D4FC02] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close assistant drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeContextStudyId && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between text-xs text-[#0B2374] shrink-0 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 shrink-0 text-[#0B2374]" />
                <span className="truncate font-semibold">
                  Active Study Context: {activeContextStudyId.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearContext}
                className="hover:underline text-[11px] text-blue-700 ml-2 shrink-0 font-medium cursor-pointer"
              >
                Clear Context
              </button>
            </div>
          )}

          <div className="px-4 py-2 border-b border-gray-200 text-[11px] shrink-0 bg-white">
            {readiness.isPending ? (
              <span className="text-zinc-500">Checking evidence corpus…</span>
            ) : ready ? (
              <span className="text-zinc-600 font-medium">
                {readiness.data?.passages != null
                  ? `${readiness.data.passages} source passages · extractive retrieval`
                  : 'Evidence corpus ready · extractive retrieval'}
              </span>
            ) : (
              <div role="alert" className="flex items-center justify-between gap-2 text-amber-900">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Evidence corpus unavailable. Sending is disabled.
                </span>
                <button
                  type="button"
                  onClick={() => void readiness.refetch()}
                  className="font-semibold text-[#0B2374] hover:underline shrink-0 cursor-pointer"
                >
                  Retry connection
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FBFBFC]">
            {messages.length === 0 ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#0B2374]">
                    <ShieldCheck className="w-4 h-4 text-lime-600" />
                    <span className="font-bold text-xs tracking-wider uppercase text-[#0B2374]">
                      Source-backed answers
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Answers quote stored NASA PSI source passages verbatim, with a citation for every
                    excerpt. When the corpus has no matching evidence the assistant says so. This is
                    a research aid, not a fire-safety certification.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
                    <span>Quick Scientific Prompts</span>
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {CHAT_QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        disabled={busy || !ready}
                        onClick={() => handleSend(prompt.query)}
                        className="w-full text-left p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:pointer-events-none text-xs text-zinc-800 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                      >
                        <span className="line-clamp-1 font-medium">{prompt.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#0B2374] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => <AiMessageItem key={message.id} message={message} />)
            )}

            {send.isPending && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-600 py-1 font-medium">
                <div className="w-7 h-7 rounded-lg bg-[#0B2374]/10 border border-[#0B2374]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#0B2374] animate-pulse" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-xs">
                  <span>Searching NASA source passages</span>
                  <span className="inline-flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B2374] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B2374] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B2374] animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px]">
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 bg-white/90 backdrop-blur-md space-y-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={4000}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about NASA combustion runs, e.g. FLEX-007 D0…"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:border-[#0B2374] focus:ring-1 focus:ring-[#0B2374] px-3.5 py-2.5 text-xs outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy || !ready}
                aria-label="Send message"
                className="w-9 h-9 rounded-2xl bg-[#0B2374] hover:bg-[#152E85] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-[#D4FC02] flex items-center justify-center font-bold transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-zinc-500 text-center font-medium tracking-tight">
              Public demo session • Only ask about public research content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
