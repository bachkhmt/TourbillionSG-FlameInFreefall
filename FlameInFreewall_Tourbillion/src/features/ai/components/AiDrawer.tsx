'use client';

import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import { ApiClientError } from '@/api/client';
import {
  isNotFound,
  isOutcomeUnknown,
  useChatHistoryQuery,
  useChatReadinessQuery,
  useSendChatMessageMutation,
} from '../hooks';
import { CHAT_HISTORY_LIMIT } from '../hooks/useChatQueries';
import { CHAT_QUICK_PROMPTS } from '@/lib/chatPrompts';
import { isUuidLike, readChatSessionId, writeChatSessionId } from '@/lib/chatSession';
import { useAiAssistantStore } from '@/store/useAiAssistantStore';
import { AiMessageItem } from './AiMessageItem';
import { chatButton, chatField } from './chatStyles';

const DEFAULT_PRIVACY = 'Anyone with the session ID can view the chat for 24 hours.';

interface HistoryRequest {
  sessionId: string;
  offset: number;
  /** Conversation epoch when requested; results for an abandoned conversation are dropped. */
  epoch: number;
  /** Restoring the tab's stored session (no live session yet). */
  restore: boolean;
}

function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 409) {
      return 'The evidence changed while answering. Nothing was saved — please send the question again.';
    }
    if (error.status === 502) {
      return 'The evidence provider returned an answer that failed citation checks. Nothing was saved.';
    }
    if (error.status === 503) {
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
  const sessionId = useAiAssistantStore((s) => s.sessionId);
  const privacy = useAiAssistantStore((s) => s.privacy);
  const messages = useAiAssistantStore((s) => s.messages);
  const recent = useAiAssistantStore((s) => s.recent);
  const historyOffset = useAiAssistantStore((s) => s.historyOffset);
  const historyHasMore = useAiAssistantStore((s) => s.historyHasMore);
  const historyStale = useAiAssistantStore((s) => s.historyStale);
  const activeContextStudyId = useAiAssistantStore((s) => s.activeContextStudyId);
  const setActiveContextStudyId = useAiAssistantStore((s) => s.setActiveContextStudyId);
  const setSession = useAiAssistantStore((s) => s.setSession);
  const setHistoryPage = useAiAssistantStore((s) => s.setHistoryPage);
  const appendRecent = useAiAssistantStore((s) => s.appendRecent);
  const markHistoryStale = useAiAssistantStore((s) => s.markHistoryStale);
  const resetConversation = useAiAssistantStore((s) => s.resetConversation);

  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Restore the tab's stored session only when this page has no live conversation yet.
  const [historyRequest, setHistoryRequest] = useState<HistoryRequest | null>(() => {
    const state = useAiAssistantStore.getState();
    const stored = state.sessionId ? null : readChatSessionId();
    return stored ? { sessionId: stored, offset: 0, epoch: state.epoch, restore: true } : null;
  });
  const conversationEnd = useRef<HTMLDivElement>(null);

  const readiness = useChatReadinessQuery();
  const ready = readiness.data?.state === 'ready';
  const send = useSendChatMessageMutation();
  const history = useChatHistoryQuery(historyRequest?.sessionId ?? null, historyRequest?.offset ?? 0, {
    enabled: ready && !send.isPending && historyRequest !== null,
  });
  const busy = send.isPending || history.isFetching;

  // A send with unknown outcome (client timeout/network) is resolved by reloading history.
  useEffect(() => {
    if (historyStale && sessionId && !historyRequest) {
      setHistoryRequest({
        sessionId,
        offset: historyOffset,
        epoch: useAiAssistantStore.getState().epoch,
        restore: false,
      });
    }
  }, [historyStale, sessionId, historyOffset, historyRequest]);

  useEffect(() => {
    if (!history.data || !historyRequest) return;
    const state = useAiAssistantStore.getState();
    const current =
      state.epoch === historyRequest.epoch &&
      (historyRequest.restore ? !state.sessionId : state.sessionId === history.data.session.id);
    if (current) {
      const { session, offset, messages: items, hasMore } = history.data;
      setHistoryPage(session.id, { offset, messages: items, hasMore }, session.privacy);
      setError(null);
    }
    setHistoryRequest(null);
  }, [history.data, historyRequest, setHistoryPage]);

  useEffect(() => {
    if (!history.error || !historyRequest) return;
    if (isNotFound(history.error)) {
      resetConversation();
      setError('Session expired or unavailable. Send a message to start a new session.');
    } else {
      // A transient failure does not revoke the existing server session.
      if (historyRequest.restore && !useAiAssistantStore.getState().sessionId) {
        setSession(historyRequest.sessionId);
      }
      setError('Chat history unavailable right now.');
    }
    setHistoryRequest(null);
  }, [history.error, historyRequest, resetConversation, setSession]);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView?.({ block: 'nearest' });
  }, [recent, send.isPending]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  const handleSend = (text: string) => {
    const query = text.trim();
    if (!query || busy || !ready) return;
    setError(null);
    setQuestion('');
    // Results from a conversation the user abandoned (New session / Clear Context) are dropped.
    const epoch = useAiAssistantStore.getState().epoch;
    const isCurrent = () => useAiAssistantStore.getState().epoch === epoch;
    send.mutate(
      {
        question: query,
        sessionId,
        investigationId: isUuidLike(activeContextStudyId) ? activeContextStudyId : null,
        // These run inside the mutation, so they still apply if the drawer is closed meanwhile.
        onSessionCreated: (session) => {
          if (!isCurrent()) return;
          writeChatSessionId(session.id);
          setSession(session.id, session.privacy);
        },
        onExchange: (result) => {
          if (!isCurrent()) return;
          writeChatSessionId(result.sessionId);
          appendRecent(result.sessionId, result.messages);
        },
        onOutcomeUnknown: (id) => {
          if (!isCurrent()) return;
          writeChatSessionId(id);
          setSession(id);
          markHistoryStale();
        },
      },
      {
        onError: (failure) => {
          if (!isCurrent()) return;
          if (isOutcomeUnknown(failure)) {
            // The server may have stored it; history is reloaded instead of inviting a resend.
            setError('The request did not finish in time. Reloading history to check whether it was saved…');
            return;
          }
          setQuestion(query);
          setError(sendErrorMessage(failure));
        },
      }
    );
  };

  const loadPage = (offset: number) => {
    if (!sessionId || busy) return;
    setError(null);
    setHistoryRequest({
      sessionId,
      offset: Math.max(0, offset),
      epoch: useAiAssistantStore.getState().epoch,
      restore: false,
    });
  };

  const startNewSession = () => {
    resetConversation();
    setHistoryRequest(null);
    setError(null);
  };

  const clearContext = () => {
    // A scoped session only searches that study, so a new context needs a new session.
    setActiveContextStudyId(null);
    startNewSession();
  };

  const connection = readiness.isPending ? 'checking' : ready ? 'ready' : 'not_ready';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="FlameGuard Grounded AI Assistant"
    >
      {/* Blurred backdrop of this app; clicking it closes the assistant. */}
      <div
        data-testid="ai-drawer-backdrop"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside className="absolute inset-y-4 right-4 flex w-[calc(100%_-_2rem)] max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 bg-[#0B2374] px-5 py-4 text-white">
          <h2 className="font-bold text-[#D4FC02]">FlameGuard AI</h2>
          <button
            type="button"
            className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10 cursor-pointer"
            onClick={() => setOpen(false)}
            aria-label="Close assistant drawer"
          >
            Close
          </button>
        </header>

        <details className="mx-5 my-2 text-xs text-slate-600">
          <summary className="cursor-pointer">Chat privacy · Do not share private information</summary>
          <p className="mt-1">{privacy ?? DEFAULT_PRIVACY}</p>
          <p className="mt-1">
            Starting a new session clears the chat from this tab. Saved messages stay on the server
            until cleanup.
          </p>
        </details>

        {activeContextStudyId && (
          <div className="mx-5 mb-2 flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-[#0B2374]">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Active Study Context: {activeContextStudyId.toUpperCase()}</span>
            </span>
            <button
              type="button"
              onClick={clearContext}
              disabled={busy}
              className="shrink-0 text-blue-700 hover:underline disabled:opacity-40 cursor-pointer"
            >
              Clear Context
            </button>
          </div>
        )}

        <div
          className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-2 text-xs text-slate-600"
          role="status"
        >
          <span>
            {connection === 'ready'
              ? readiness.data?.passages != null
                ? `Ready to search the NASA collection · ${readiness.data.passages} source passages`
                : 'Ready to search the NASA collection'
              : connection === 'checking'
                ? 'Checking research chat connection…'
                : 'Chat is not ready in this preview. Check the connection before sending.'}
          </span>
          {connection === 'not_ready' && (
            <button
              type="button"
              className={`${chatButton} px-3 py-1.5 text-xs`}
              disabled={readiness.isFetching}
              onClick={() => void readiness.refetch()}
            >
              Retry connection
            </button>
          )}
        </div>

        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4"
          aria-live="polite"
        >
          {messages.map((message) => (
            <AiMessageItem key={message.id} message={message} />
          ))}
          {historyHasMore && recent.length > 0 && (
            <p className="text-center text-xs text-slate-500">
              More messages are available in Conversation history.
            </p>
          )}
          {recent.map((message) => (
            <Fragment key={message.id}>
              <AiMessageItem message={message} />
            </Fragment>
          ))}
          {!messages.length && !recent.length && connection === 'ready' && (
            <div className="space-y-2">
              <p className="mb-3 text-sm text-slate-600">
                Ask about a NASA experiment or try one of these questions. Answers quote stored
                source passages; this is a research aid, not a fire-safety certification.
              </p>
              {CHAT_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleSend(prompt.query)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-[#0B2374] hover:border-[#0B2374] disabled:opacity-50 cursor-pointer"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          )}
          {send.isPending && (
            <p className="text-xs text-slate-500">Searching NASA source passages…</p>
          )}
          <div ref={conversationEnd} />
        </div>

        {error && (
          <p role="alert" className="mx-5 my-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {sessionId && (
          <details className="mx-5 my-2 text-xs text-slate-600">
            <summary className="cursor-pointer">Conversation history</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={chatButton}
                disabled={busy}
                onClick={() => loadPage(historyOffset)}
              >
                Refresh history
              </button>
              <button
                type="button"
                className={chatButton}
                disabled={busy || historyOffset === 0}
                onClick={() => loadPage(historyOffset - CHAT_HISTORY_LIMIT)}
              >
                Previous
              </button>
              <button
                type="button"
                className={chatButton}
                disabled={busy || !historyHasMore}
                onClick={() => loadPage(historyOffset + CHAT_HISTORY_LIMIT)}
              >
                Next
              </button>
              <button type="button" className={chatButton} disabled={busy} onClick={startNewSession}>
                Start new session
              </button>
            </div>
          </details>
        )}

        <form
          className="flex shrink-0 gap-2 px-5 pb-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(question);
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Research question</span>
            <textarea
              className={chatField}
              rows={2}
              maxLength={4000}
              placeholder="Ask about a NASA experiment"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend(question);
                }
              }}
            />
          </label>
          <button
            type="submit"
            className={chatButton}
            aria-label="Send message"
            disabled={busy || !question.trim() || connection !== 'ready'}
          >
            {send.isPending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </aside>
    </div>
  );
};
