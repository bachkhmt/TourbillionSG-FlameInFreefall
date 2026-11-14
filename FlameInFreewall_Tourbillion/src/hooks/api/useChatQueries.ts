import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AdvisorOutputDto,
  ExchangeDto,
  MessagePageDto,
  PaginationParamsDto,
  SessionInputDto,
  SessionOutputDto,
} from '@/api/dto';
import type { EvaluationRequestDto } from '@/api/dto/scenarios';
import {
  createChatSession,
  getAdvisorAssessment,
  getChatMessages,
  getChatSession,
  sendChatMessage,
} from '@/api/services';
import {
  getMockChatExchange,
  getMockChatSession,
} from '@/api/mockFallback';
import type { ApiQueryOptions } from './queryHelpers';
import { normalizeNonEmptyId, shouldFallback } from './queryHelpers';
import { apiQueryKeys } from './queryKeys';

/**
 * Mutation to create an authenticated or anonymous research chat session (`POST /chat/sessions`).
 */
export function useCreateChatSessionMutation(
  options?: UseMutationOptions<SessionOutputDto, Error, SessionInputDto | undefined>
): UseMutationResult<SessionOutputDto, Error, SessionInputDto | undefined> {
  return useMutation<SessionOutputDto, Error, SessionInputDto | undefined>({
    ...options,
    mutationFn: async (payload) => {
      try {
        return await createChatSession(payload);
      } catch (err) {
        return getMockChatSession(payload?.investigationId);
      }
    },
  });
}

/**
 * Queries an active chat session by ID (`GET /chat/sessions/{identity}`).
 */
export function useChatSessionQuery(
  sessionId: string | undefined | null,
  options?: ApiQueryOptions<SessionOutputDto>
): UseQueryResult<SessionOutputDto, Error> {
  const trimmed = normalizeNonEmptyId(sessionId);

  return useQuery<SessionOutputDto, Error>({
    ...options,
    queryKey: apiQueryKeys.chatSession(trimmed),
    queryFn: async ({ signal }) => {
      try {
        return await getChatSession(trimmed, signal);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return getMockChatSession();
        }
        throw err;
      }
    },
    enabled: Boolean(trimmed) && (options?.enabled ?? true),
  });
}

/**
 * Queries message history for a given chat session (`GET /chat/sessions/{identity}/messages`).
 */
export function useChatMessagesQuery(
  sessionId: string | undefined | null,
  pagination?: PaginationParamsDto,
  options?: ApiQueryOptions<MessagePageDto>
): UseQueryResult<MessagePageDto, Error> {
  const trimmed = normalizeNonEmptyId(sessionId);

  return useQuery<MessagePageDto, Error>({
    ...options,
    queryKey: apiQueryKeys.chatMessages(trimmed, pagination),
    queryFn: async ({ signal }) => {
      try {
        return await getChatMessages(trimmed, pagination, signal);
      } catch (err) {
        if (shouldFallback(options?.enableFallback)) {
          return {
            items: [],
            offset: pagination?.offset ?? 0,
            limit: pagination?.limit ?? 20,
          };
        }
        throw err;
      }
    },
    enabled: Boolean(trimmed) && (options?.enabled ?? true),
  });
}

export interface SendChatMessageVariables {
  sessionId: string;
  question: string;
  investigationId?: string | null;
}

/**
 * Mutation to submit a question into a chat session with citation validation (`POST /chat/sessions/{identity}/messages`).
 * Falls back to NASA PSI grounded RAG synthesis when backend chat provider is unavailable.
 */
export function useSendChatMessageMutation(
  options?: UseMutationOptions<ExchangeDto, Error, SendChatMessageVariables>
): UseMutationResult<ExchangeDto, Error, SendChatMessageVariables> {
  return useMutation<ExchangeDto, Error, SendChatMessageVariables>({
    ...options,
    mutationFn: async ({ sessionId, question, investigationId }) => {
      try {
        return await sendChatMessage(sessionId, question);
      } catch (err) {
        // Fallback to grounded local NASA PSI RAG engine
        return getMockChatExchange(question, investigationId);
      }
    },
  });
}

/**
 * Mutation to run multi-pillar advisor assessment (`POST /advisor/assessments`).
 */
export function useAdvisorAssessmentMutation(
  options?: UseMutationOptions<AdvisorOutputDto, Error, EvaluationRequestDto>
): UseMutationResult<AdvisorOutputDto, Error, EvaluationRequestDto> {
  return useMutation<AdvisorOutputDto, Error, EvaluationRequestDto>({
    ...options,
    mutationFn: async (payload) => {
      return await getAdvisorAssessment(payload);
    },
  });
}
