import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHAT_MAX_BYTES,
  CHAT_STORAGE_KEY,
  readChatSession,
  validateChatMessage,
  writeChatSession,
} from "@/lib/chat-session";
import { useAiAssistantStore } from "@/store/useAiAssistantStore";
import { useDatasetStore } from "@/store/useDatasetStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { ChatMessage } from "@/types";
import { liveAnswer } from "./live-fixtures";

const message = (id = "message-1"): ChatMessage => ({
  id,
  role: "assistant",
  content: "Source-backed answer",
  timestamp: 1,
  groundedAnswer: structuredClone(liveAnswer),
});
const saved = (messages: unknown[], schemaVersion = 1) =>
  sessionStorage.setItem(
    CHAT_STORAGE_KEY,
    JSON.stringify({ schemaVersion, messages }),
  );
beforeEach(() => {
  sessionStorage.clear();
  useAiAssistantStore.setState({
    messages: [],
    historyLoaded: false,
    isStreaming: false,
  });
});

describe("Bounded browser chat continuity", () => {
  it("restores original citation revisions without modifying the dataset or scenario", () => {
    const old = message();
    old.groundedAnswer!.meta.corpusRevision = "historical-release";
    writeChatSession([old]);
    const revision = useDatasetStore.getState().data?.revision;
    const scenario = structuredClone(
      useWorkspaceStore.getState().activeScenario,
    );
    useAiAssistantStore.setState({ isStreaming: true });
    useAiAssistantStore.getState().restoreMessages();
    expect(
      useAiAssistantStore.getState().messages[0].groundedAnswer?.meta
        .corpusRevision,
    ).toBe("historical-release");
    expect(useAiAssistantStore.getState().isStreaming).toBe(false);
    expect(useDatasetStore.getState().data?.revision).toBe(revision);
    expect(useWorkspaceStore.getState().activeScenario).toEqual(scenario);
    expect(localStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
  });

  it("persists only allowed render fields and keeps UI/provider state out of storage", () => {
    const extra = {
      ...message(),
      apiKey: "not-persistable",
      isStreaming: true,
      scenario: { gravityG: 0.16 },
    };
    writeChatSession([extra]);
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY)!;
    expect(raw).not.toContain("apiKey");
    expect(raw).not.toContain("isStreaming");
    expect(raw).not.toContain("scenario");
    expect(readChatSession()).toHaveLength(1);
  });

  it.each([
    "{broken",
    JSON.stringify({ schemaVersion: 2, messages: [] }),
    JSON.stringify({ schemaVersion: 1, messages: { role: "assistant" } }),
  ])("discards corrupt or unsupported session payloads", (raw) => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, raw);
    expect(readChatSession()).toEqual([]);
    expect(sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
  });

  it("rejects invalid nested citations, locators and source revisions", () => {
    const invalid: ChatMessage[] = [
      message("one"),
      message("two"),
      message("three"),
      message("four"),
    ];
    invalid[0].groundedAnswer!.answer.segments[0].citations = [
      "unresolved-chunk",
    ];
    invalid[1].groundedAnswer!.chunks[0].locator = 42 as unknown as string;
    invalid[2].groundedAnswer!.meta.corpusRevision = "../other-release";
    invalid[3].groundedAnswer!.chunks[0].sha256 = "not-a-hash";
    for (const entry of invalid) {
      saved([entry]);
      expect(readChatSession()).toEqual([]);
    }
  });

  it("rejects user messages carrying fabricated assistant payloads and invalid roles", () => {
    expect(validateChatMessage({ ...message(), role: "user" })).toBeNull();
    expect(validateChatMessage({ ...message(), role: "system" })).toBeNull();
    expect(validateChatMessage({ ...message(), timestamp: -1 })).toBeNull();
  });

  it("retains at most the latest 50 messages", () => {
    writeChatSession(
      Array.from({ length: 70 }, (_, index) => ({
        id: `m-${index}`,
        role: "user",
        content: "Question",
        timestamp: index,
      })),
    );
    const restored = readChatSession();
    expect(restored).toHaveLength(50);
    expect(restored[0].id).toBe("m-20");
    expect(restored.at(-1)?.id).toBe("m-69");
  });

  it("bounds serialized UTF-8 bytes and rejects oversized stored input", () => {
    writeChatSession(
      Array.from({ length: 8 }, (_, index) => ({
        id: `large-${index}`,
        role: "user",
        content: "á".repeat(50000),
        timestamp: index,
      })),
    );
    expect(
      new TextEncoder().encode(sessionStorage.getItem(CHAT_STORAGE_KEY)!)
        .length,
    ).toBeLessThanOrEqual(CHAT_MAX_BYTES);
    expect(readChatSession().at(-1)?.id).toBe("large-7");
    sessionStorage.setItem(CHAT_STORAGE_KEY, " ".repeat(CHAT_MAX_BYTES + 1));
    expect(readChatSession()).toEqual([]);
  });

  it("handles unavailable and quota-limited storage without losing in-memory chat", () => {
    const removeItem = vi.fn();
    const target = {
      getItem: () => {
        throw new Error("disabled");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem,
    };
    expect(() => writeChatSession([message()], target)).not.toThrow();
    expect(readChatSession(target)).toEqual([]);
    expect(removeItem).toHaveBeenCalled();
    useAiAssistantStore
      .getState()
      .addMessage({ role: "user", content: "A question" });
    expect(useAiAssistantStore.getState().messages).toHaveLength(1);
  });

  it("clear removes saved content and hydration cannot resurrect the conversation", () => {
    writeChatSession([message()]);
    useAiAssistantStore.getState().clearMessages();
    expect(sessionStorage.getItem(CHAT_STORAGE_KEY)).toBeNull();
    useAiAssistantStore.getState().restoreMessages();
    expect(useAiAssistantStore.getState().messages).toEqual([]);
  });
});
