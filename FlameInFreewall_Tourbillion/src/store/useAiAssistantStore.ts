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

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveContextStudyId: (id: string | null) => void;
  setConversation: (sessionId: string, messages: MappedChatMessage[]) => void;
  appendMessages: (sessionId: string, messages: MappedChatMessage[]) => void;
  /** Forgets the tab token and local messages; server rows are not deleted. */
  resetConversation: () => void;
}

export const useAiAssistantStore = create<AiAssistantStoreState>((set) => ({
  isOpen: false,
  activeContextStudyId: null,
  sessionId: null,
  messages: [],

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setActiveContextStudyId: (id) => set({ activeContextStudyId: id }),

  setConversation: (sessionId, messages) => set({ sessionId, messages }),

  appendMessages: (sessionId, messages) =>
    set((state) => ({
      sessionId,
      messages:
        state.sessionId === sessionId ? [...state.messages, ...messages] : [...messages],
    })),

  resetConversation: () => {
    clearChatSessionId();
    set({ sessionId: null, messages: [] });
  },
}));
