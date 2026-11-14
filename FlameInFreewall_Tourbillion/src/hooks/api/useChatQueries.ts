import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApiClientError } from '@/api/client';
import {
  mapChatMessageDto,
  mapChatReadinessDto,
  mapChatSessionDto,
  mapChatSourceDto,
} from '@/api/mappers';
import {
  createChatSession,
  getChatReadiness,
  getChatSession,
  getChatSource,
  listChatMessages,
  sendChatMessage,
} from '@/api/services';
import type {
  MappedChatMessage,
  MappedChatReadiness,
  MappedChatSession,
  MappedChatSource,
} from '@/types/api';
import type { ApiQueryOptions } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

/** The backend caps a history page at 100 messages. */
export const CHAT_HISTORY_LIMIT = 100;

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404;
}

/** Corpus + runtime writer readiness. Never cached: a stale "ready" would unlock Send. */
export function useChatReadinessQuery(
  options?: ApiQueryOptions<MappedChatReadiness>
): UseQueryResult<MappedChatReadiness, Error> {
  return useQuery<MappedChatReadiness, Error>({
    staleTime: 0,
    gcTime: 0,
    retry: false,
    ...options,
    queryKey: apiQueryKeys.chatReadiness,
    queryFn: async ({ signal }) => mapChatReadinessDto(await getChatReadiness(signal)),
  });
}

export interface ChatHistory {
  session: MappedChatSession;
  messages: MappedChatMessage[];
}

/** Restores a stored session and its server history (latest page up to the API cap). */
export function useChatHistoryQuery(
  sessionId: string | null,
  options?: ApiQueryOptions<ChatHistory>
): UseQueryResult<ChatHistory, Error> {
  return useQuery<ChatHistory, Error>({
    retry: false,
    staleTime: 0,
    gcTime: 0,
    ...options,
    queryKey: apiQueryKeys.chatHistory(sessionId ?? ''),
    queryFn: async ({ signal }) => {
      const id = sessionId as string;
      const [session, page] = await Promise.all([
        getChatSession(id, signal),
        listChatMessages(id, { offset: 0, limit: CHAT_HISTORY_LIMIT }, signal),
      ]);
      return { session: mapChatSessionDto(session), messages: page.items.map(mapChatMessageDto) };
    },
    enabled: Boolean(sessionId) && (options?.enabled ?? true),
  });
}

export interface ChatSourceParams {
  sourceId: string;
  locator: string;
  corpusVersion: string;
}

/** Revision-pinned source metadata for one citation; 409 means an older corpus. */
export function useChatSourceQuery(
  params: ChatSourceParams | null,
  options?: ApiQueryOptions<MappedChatSource>
): UseQueryResult<MappedChatSource, Error> {
  return useQuery<MappedChatSource, Error>({
    retry: false,
    ...options,
    queryKey: apiQueryKeys.chatSource(
      params?.sourceId ?? '',
      params?.locator ?? '',
      params?.corpusVersion ?? ''
    ),
    queryFn: async ({ signal }) => {
      const value = params as ChatSourceParams;
      const source = mapChatSourceDto(
        await getChatSource(value.sourceId, value.locator, value.corpusVersion, signal)
      );
      if (source.corpusVersion !== value.corpusVersion) {
        throw new ApiClientError({
          message: 'Citation belongs to another corpus revision',
          status: 409,
          code: 'HTTP_ERROR',
        });
      }
      return source;
    },
    enabled: Boolean(params) && (options?.enabled ?? true),
  });
}

export interface SendChatVariables {
  question: string;
  /** Existing server session, or `null` to create one. */
  sessionId: string | null;
  /** Canonical investigation UUID scoping a new session, if any. */
  investigationId?: string | null;
  /**
   * Lifecycle hooks run inside the mutation itself, so they still fire when the calling
   * component unmounts mid-request (unlike `mutate(..., { onSuccess })`).
   */
  onSessionCreated?: (sessionId: string) => void;
  onExchange?: (result: SendChatResult) => void;
  /** The request may or may not have been stored (client timeout / network loss). */
  onOutcomeUnknown?: (sessionId: string) => void;
}

/** A client-side timeout or transport failure: the server may already have committed. */
export function isOutcomeUnknown(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.code === 'REQUEST_TIMEOUT' || error.code === 'NETWORK_ERROR')
  );
}

export interface SendChatResult {
  sessionId: string;
  messages: [MappedChatMessage, MappedChatMessage];
}

async function newSession(investigationId?: string | null): Promise<string> {
  const session = await createChatSession(
    investigationId ? { investigation_id: investigationId } : {}
  );
  return session.id;
}

/**
 * Sends a question, creating a session when needed. If a previously stored session has
 * expired (404) nothing was stored server-side, so one retry in a fresh session is safe.
 */
export function useSendChatMessageMutation(): UseMutationResult<
  SendChatResult,
  Error,
  SendChatVariables
> {
  return useMutation<SendChatResult, Error, SendChatVariables>({
    retry: 0,
    mutationFn: async (variables) => {
      const { question, sessionId, investigationId } = variables;
      const create = async () => {
        const created = await newSession(investigationId);
        // Record the id before sending so a lost response never orphans the session.
        variables.onSessionCreated?.(created);
        return created;
      };
      let id = sessionId ?? (await create());
      let exchange;
      try {
        try {
          exchange = await sendChatMessage(id, question);
        } catch (error) {
          if (!sessionId || !isNotFound(error)) throw error;
          id = await create();
          exchange = await sendChatMessage(id, question);
        }
      } catch (error) {
        if (isOutcomeUnknown(error)) variables.onOutcomeUnknown?.(id);
        throw error;
      }
      const result: SendChatResult = {
        sessionId: id,
        messages: [mapChatMessageDto(exchange.user), mapChatMessageDto(exchange.assistant)],
      };
      variables.onExchange?.(result);
      return result;
    },
  });
}
