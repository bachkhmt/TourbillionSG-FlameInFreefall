/**
 * Language of the assistant's own framing text (source excerpts are never translated).
 * English by default; the viewer's choice is a per-browser convenience in localStorage.
 */
export type ChatAnswerLanguage = 'en' | 'vi';

export const DEFAULT_CHAT_LANGUAGE: ChatAnswerLanguage = 'en';
export const CHAT_LANGUAGE_KEY = 'flameguard.chat.language.v1';

export function isChatAnswerLanguage(value: unknown): value is ChatAnswerLanguage {
  return value === 'en' || value === 'vi';
}

/** Stored choice, or English when absent, invalid or storage is unavailable. */
export function readChatLanguage(): ChatAnswerLanguage {
  try {
    if (typeof window === 'undefined') return DEFAULT_CHAT_LANGUAGE;
    const stored = window.localStorage.getItem(CHAT_LANGUAGE_KEY);
    return isChatAnswerLanguage(stored) ? stored : DEFAULT_CHAT_LANGUAGE;
  } catch {
    return DEFAULT_CHAT_LANGUAGE;
  }
}

export function writeChatLanguage(language: ChatAnswerLanguage): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(CHAT_LANGUAGE_KEY, language);
  } catch {
    // Private mode / blocked storage: the choice still applies for this page.
  }
}
