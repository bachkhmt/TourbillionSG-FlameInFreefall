import { create } from 'zustand';
import type { MappedChatMessage } from '../types/api';
import { clearChatSessionId } from '../lib/chatSession';

/** Exchanges kept in `recent` before older ones are only reachable through history pages. */
export const RECENT_LIMIT = 50;

export interface ChatHistoryPage {
  offset: number;
  messages: MappedChatMessage[];
  hasMore: boolean;
}

/**
 * UI state for the grounded assistant. The server is the source of truth: `messages` is one
 * stored history page, `recent` holds exchanges sent in this view. New exchanges are never
 * spliced into an older page; refreshing history folds them into the page.
 */
export interface AiAssistantStoreState {
  isOpen: boolean;
  activeContextStudyId: string | null;
  sessionId: string | null;
  privacy: string | null;
  messages: MappedChatMessage[];
  historyOffset: number;
  historyHasMore: boolean;
  recent: MappedChatMessage[];
  /** Bumped by every reset so late results from an abandoned conversation are ignored. */
  epoch: number;
  /** True when a send ended without a known outcome (client timeout/network): resync history. */
  historyStale: boolean;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveContextStudyId: (id: string | null) => void;
  /** Adopts a server session; keeps local messages only if it is the current session. */
  setSession: (sessionId: string, privacy?: string | null) => void;
  setHistoryPage: (sessionId: string, page: ChatHistoryPage, privacy?: string | null) => void;
  appendRecent: (sessionId: string, messages: MappedChatMessage[]) => void;
  markHistoryStale: () => void;
  /** Forgets the tab token and local messages; server rows are not deleted. */
  resetConversation: () => void;
}

const EMPTY_CONVERSATION = {
  sessionId: null,
  privacy: null,
  messages: [],
  historyOffset: 0,
  historyHasMore: false,
  recent: [],
  historyStale: false,
};

export const useAiAssistantStore = create<AiAssistantStoreState>((set) => ({
  isOpen: false,
  activeContextStudyId: null,
  ...EMPTY_CONVERSATION,
  epoch: 0,

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setActiveContextStudyId: (id) => set({ activeContextStudyId: id }),

  setSession: (sessionId, privacy) =>
    set((state) =>
      state.sessionId === sessionId
        ? { privacy: privacy ?? state.privacy }
        : { ...EMPTY_CONVERSATION, sessionId, privacy: privacy ?? null }
    ),

  setHistoryPage: (sessionId, page, privacy) =>
    set((state) => ({
      sessionId,
      privacy: privacy ?? (state.sessionId === sessionId ? state.privacy : null),
      messages: page.messages,
      historyOffset: page.offset,
      historyHasMore: page.hasMore,
      recent: [],
      historyStale: false,
    })),

  appendRecent: (sessionId, messages) =>
    set((state) =>
      state.sessionId === sessionId
        ? { recent: [...state.recent, ...messages].slice(-RECENT_LIMIT) }
        : { ...EMPTY_CONVERSATION, sessionId, recent: [...messages] }
    ),

  markHistoryStale: () => set({ historyStale: true }),

  resetConversation: () => {
    clearChatSessionId();
    set((state) => ({ ...EMPTY_CONVERSATION, epoch: state.epoch + 1 }));
  },
}));
