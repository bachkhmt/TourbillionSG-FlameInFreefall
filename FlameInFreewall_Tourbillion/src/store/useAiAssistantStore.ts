import { create } from 'zustand';
import type { MappedChatMessage } from '../types/api';
import { clearChatSessionId } from '../lib/chatSession';

/**
 * UI state for the grounded assistant. Messages mirror what the backend stored for the
 * current session; the server remains the source of truth for history.
 */
export interface AiAssistantStoreState {
  isOpen: boolean;
  activeContextStudyId: string | null;
  sessionId: string | null;
  messages: MappedChatMessage[];
  /** Bumped by every reset so late results from an abandoned conversation are ignored. */
  epoch: number;
  /** True when a send ended without a known outcome (client timeout/network): resync history. */
  historyStale: boolean;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveContextStudyId: (id: string | null) => void;
  /** Adopts a server session; keeps messages only if it is the current session. */
  setSession: (sessionId: string) => void;
  setConversation: (sessionId: string, messages: MappedChatMessage[]) => void;
  appendMessages: (sessionId: string, messages: MappedChatMessage[]) => void;
  markHistoryStale: () => void;
  /** Forgets the tab token and local messages; server rows are not deleted. */
  resetConversation: () => void;
}

export const useAiAssistantStore = create<AiAssistantStoreState>((set) => ({
  isOpen: false,
  activeContextStudyId: null,
  sessionId: null,
  messages: [],
  epoch: 0,
  historyStale: false,

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setActiveContextStudyId: (id) => set({ activeContextStudyId: id }),

  setSession: (sessionId) =>
    set((state) =>
      state.sessionId === sessionId ? {} : { sessionId, messages: [], historyStale: false }
    ),

  setConversation: (sessionId, messages) => set({ sessionId, messages, historyStale: false }),

  appendMessages: (sessionId, messages) =>
    set((state) => ({
      sessionId,
      messages:
        state.sessionId === sessionId ? [...state.messages, ...messages] : [...messages],
    })),

  markHistoryStale: () => set({ historyStale: true }),

  resetConversation: () => {
    clearChatSessionId();
    set((state) => ({
      sessionId: null,
      messages: [],
      historyStale: false,
      epoch: state.epoch + 1,
    }));
  },
}));
