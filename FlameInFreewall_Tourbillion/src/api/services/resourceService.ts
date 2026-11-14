import { apiGet } from '../client';
import type { ChallengeResourcePageDto } from '../dto/resources';

/**
 * Fetches the official challenge resources registry (`GET /chat/resources`).
 */
export async function getOfficialResources(signal?: AbortSignal): Promise<ChallengeResourcePageDto> {
  return apiGet<ChallengeResourcePageDto>('/chat/resources', undefined, signal);
}
