import type { AiCitation, ChatMessage } from "@/types";
import type { Answer, AnswerChunk } from "./workspace-api";

export const CHAT_STORAGE_KEY = "flameguard.chat.v1";
export const CHAT_MAX_MESSAGES = 50;
export const CHAT_MAX_BYTES = 256 * 1024;
type SessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type RecordValue = Record<string, unknown>;

function object(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid object");
  return value as RecordValue;
}
function string(value: unknown, max: number, empty = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!empty && !value.length)
  )
    throw new Error("Invalid text");
  return value;
}
function identifier(value: unknown): string {
  const result = string(value, 200);
  if (!/^[a-zA-Z0-9._:-]+$/.test(result)) throw new Error("Invalid identifier");
  return result;
}
function number(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  )
    throw new Error("Invalid number");
  return value;
}
function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid list");
  return value;
}
function url(value: unknown): string {
  const result = string(value, 2048);
  if (!["https:", "http:"].includes(new URL(result).protocol))
    throw new Error("Invalid URL");
  return result;
}
function chunk(value: unknown): AnswerChunk {
  const item = object(value);
  const sha256 = string(item.sha256, 64);
  if (!/^[a-fA-F0-9]{64}$/.test(sha256)) throw new Error("Invalid hash");
  const fileVersion = number(item.fileVersion, 1e9),
    studyVersion = number(item.studyVersion, 1e9);
  if (!Number.isInteger(fileVersion) || !Number.isInteger(studyVersion))
    throw new Error("Invalid version");
  return {
    id: identifier(item.id),
    sourceId: identifier(item.sourceId),
    investigationId: identifier(item.investigationId),
    text: string(item.text, 20000, true),
    heading: string(item.heading, 1024, true),
    locator: string(item.locator, 2048),
    filename: string(item.filename, 1024),
    sha256,
    sourceUrl: url(item.sourceUrl),
    fileVersion,
    studyVersion,
    status: string(item.status, 100),
  };
}
function answer(value: unknown): Answer {
  const item = object(value),
    body = object(item.answer),
    meta = object(item.meta);
  const chunks = array(item.chunks, 32).map(chunk);
  const allowedIds = new Set(chunks.map((entry) => entry.id));
  if (allowedIds.size !== chunks.length) throw new Error("Duplicate chunk");
  const coverage = string(body.coverage, 20);
  if (!["none", "partial", "full"].includes(coverage))
    throw new Error("Invalid coverage");
  return {
    answer: {
      coverage,
      missing: array(body.missing, 32).map((entry) => string(entry, 1024)),
      segments: array(body.segments, 16).map((entry) => {
        const segment = object(entry);
        if (segment.system !== undefined && typeof segment.system !== "boolean")
          throw new Error("Invalid segment");
        const citations = array(segment.citations, 16).map(identifier);
        if (
          citations.some((id) => !allowedIds.has(id)) ||
          (!segment.system && !citations.length)
        )
          throw new Error("Unresolved citation");
        return {
          text: string(segment.text, 20000),
          citations,
          ...(segment.system === undefined ? {} : { system: segment.system }),
        };
      }),
    },
    chunks,
    meta: {
      mode: string(meta.mode, 100),
      reason: meta.reason === null ? null : string(meta.reason, 1024),
      corpusRevision: identifier(meta.corpusRevision),
      latencyMs: number(meta.latencyMs, 1e9),
    },
  };
}
function citation(value: unknown): AiCitation {
  const item = object(value),
    badge = string(item.badge, 20);
  if (!["Measured", "Modeled", "Illustrative"].includes(badge))
    throw new Error("Invalid badge");
  return {
    investigationId: identifier(item.investigationId),
    code: string(item.code, 200),
    title: string(item.title, 1024),
    claimText: string(item.claimText, 10000),
    badge: badge as AiCitation["badge"],
    ...(item.claimId === undefined
      ? {}
      : { claimId: identifier(item.claimId) }),
    ...(item.doi === undefined ? {} : { doi: string(item.doi, 512) }),
    ...(item.facility === undefined
      ? {}
      : { facility: string(item.facility, 1024) }),
  };
}

/** Pick only renderable message fields; source payloads remain revision-pinned. */
export function validateChatMessage(value: unknown): ChatMessage | null {
  try {
    const item = object(value);
    if (item.role !== "user" && item.role !== "assistant")
      throw new Error("Invalid role");
    if (
      item.role === "user" &&
      (item.groundedAnswer !== undefined || item.citations !== undefined)
    )
      throw new Error("Invalid user payload");
    return {
      id: identifier(item.id),
      role: item.role,
      content: string(item.content, 60000, true),
      timestamp: number(item.timestamp),
      ...(item.groundedAnswer === undefined
        ? {}
        : { groundedAnswer: answer(item.groundedAnswer) }),
      ...(item.citations === undefined
        ? {}
        : { citations: array(item.citations, 16).map(citation) }),
      ...(item.evidenceGapWarning === undefined
        ? {}
        : { evidenceGapWarning: string(item.evidenceGapWarning, 4096) }),
    };
  } catch {
    return null;
  }
}

function storage(): SessionStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}
function bytes(value: string) {
  return new TextEncoder().encode(value).byteLength;
}
export function clearChatSession(target = storage()): void {
  try {
    target?.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}
export function readChatSession(target = storage()): ChatMessage[] {
  try {
    const raw = target?.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    if (bytes(raw) > CHAT_MAX_BYTES) throw new Error("Oversize session");
    const payload = object(JSON.parse(raw));
    if (payload.schemaVersion !== 1) throw new Error("Unknown session version");
    const messages = array(payload.messages, CHAT_MAX_MESSAGES).map(
      validateChatMessage,
    );
    if (messages.some((message) => !message))
      throw new Error("Invalid stored message");
    const valid = messages as ChatMessage[];
    if (new Set(valid.map((message) => message.id)).size !== valid.length)
      throw new Error("Duplicate message");
    return valid;
  } catch {
    clearChatSession(target);
    return [];
  }
}
export function writeChatSession(
  messages: ChatMessage[],
  target = storage(),
): void {
  try {
    const safe = messages
      .slice(-CHAT_MAX_MESSAGES)
      .map(validateChatMessage)
      .filter((message): message is ChatMessage => !!message);
    let serialized = JSON.stringify({ schemaVersion: 1, messages: safe });
    while (safe.length && bytes(serialized) > CHAT_MAX_BYTES) {
      safe.shift();
      serialized = JSON.stringify({ schemaVersion: 1, messages: safe });
    }
    if (safe.length) target?.setItem(CHAT_STORAGE_KEY, serialized);
    else clearChatSession(target);
  } catch {
    clearChatSession(target);
  }
}
