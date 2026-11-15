/** Starter questions that exercise retrieval, conflict display and evidence-gap refusals. */
export interface ChatQuickPrompt {
  id: string;
  label: string;
  query: string;
}

export const CHAT_QUICK_PROMPTS: ChatQuickPrompt[] = [
  {
    id: 'flex-d0',
    label: 'FLEX-007 source conflict',
    query: 'FLEX-007 đường kính D0 có mâu thuẫn không?',
  },
  {
    id: 'bass-ii-caveats',
    label: 'BASS-II instrument caveats',
    query: 'BASS-II fan display và air display có giới hạn gì?',
  },
  {
    id: 'same-smoke',
    label: 'Smoke detection research',
    query: 'What does SAME measure about smoke aerosol particles and fire detection?',
  },
  {
    id: 'mars-gap',
    label: 'Mars data coverage',
    query: 'Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?',
  },
];
