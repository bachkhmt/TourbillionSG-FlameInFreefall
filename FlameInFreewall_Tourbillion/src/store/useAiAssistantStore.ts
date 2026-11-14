import { create } from "zustand";
import type { ChatMessage } from "../types";
import {
  CHAT_MAX_MESSAGES,
  clearChatSession,
  readChatSession,
  writeChatSession,
} from "@/lib/chat-session";

export interface AiAssistantStoreState {
  isOpen: boolean;
  activeContextStudyId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  historyLoaded: boolean;
  restoreMessages: () => void;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setActiveContextStudyId: (id: string | null) => void;
  addMessage: (
    message: Omit<ChatMessage, "id" | "timestamp"> & {
      id?: string;
      timestamp?: number;
    },
  ) => void;
  clearMessages: () => void;
  setIsStreaming: (isStreaming: boolean) => void;
}

let sequence = 0;
export const useAiAssistantStore = create<AiAssistantStoreState>(
  (set, get) => ({
    isOpen: false,
    activeContextStudyId: null,
    messages: [],
    isStreaming: false,
    historyLoaded: false,
    restoreMessages: () => {
      if (get().historyLoaded) return;
      set({
        messages: get().messages.length ? get().messages : readChatSession(),
        isStreaming: false,
        historyLoaded: true,
      });
    },

    setOpen: (open: boolean) =>
      set({
        isOpen: open,
      }),

    toggleOpen: () =>
      set((state) => ({
        isOpen: !state.isOpen,
      })),

    setActiveContextStudyId: (id: string | null) =>
      set({
        activeContextStudyId: id,
      }),

    addMessage: (message) =>
      set((state) => {
        const fullMessage: ChatMessage = {
          ...message,
          id: message.id || `msg-${Date.now()}-${++sequence}`,
          timestamp: message.timestamp ?? Date.now(),
        };
        const messages = [...state.messages, fullMessage].slice(
          -CHAT_MAX_MESSAGES,
        );
        writeChatSession(messages);
        return { messages, historyLoaded: true };
      }),

    clearMessages: () => {
      clearChatSession();
      set({ messages: [], isStreaming: false, historyLoaded: true });
    },

    setIsStreaming: (isStreaming: boolean) =>
      set({
        isStreaming,
      }),
  }),
);
