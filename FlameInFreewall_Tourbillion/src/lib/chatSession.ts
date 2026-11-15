/**
 * Tab-scoped storage of the opaque chat session id. It is a public-demo continuity
 * token, not authentication: anyone holding it can read that session for 24 hours.
 */
export const CHAT_SESSION_KEY = 'flameguard.chat.session.v1';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function clearChatSessionId(): void {
  try {
    storage()?.removeItem(CHAT_SESSION_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

export function readChatSessionId(): string | null {
  try {
    const value = storage()?.getItem(CHAT_SESSION_KEY) ?? null;
    if (value && UUID.test(value)) return value;
    if (value) clearChatSessionId();
    return null;
  } catch {
    return null;
  }
}

export function writeChatSessionId(sessionId: string): void {
  if (!UUID.test(sessionId)) return;
  try {
    storage()?.setItem(CHAT_SESSION_KEY, sessionId);
  } catch {
    /* Storage may be disabled; the session then lasts for this page only. */
  }
}

export function isUuidLike(value: string | null | undefined): value is string {
  return Boolean(value && UUID.test(value));
}
