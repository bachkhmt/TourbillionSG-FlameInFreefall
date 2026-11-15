/** Starter questions that exercise retrieval, conflict display and evidence-gap refusals. */
export interface ChatQuickPrompt {
  id: string;
  label: string;
  query: string;
}

export const CHAT_QUICK_PROMPTS: ChatQuickPrompt[] = [
  {
    id: "flex-d0",
    label: "FLEX-007 source conflict",
    query: "FLEX-007 initial diameter D0 source conflict?",
  },
  {
    id: "bass-ii-caveats",
    label: "BASS-II instrument caveats",
    query: "What are the BASS-II fan display and air display limitations?",
  },
  {
    id: "same-smoke",
    label: "Smoke detection research",
    query:
      "What does SAME measure about smoke aerosol particles and fire detection?",
  },
  {
    id: "mars-gap",
    label: "Mars data coverage",
    query: "What combustion data is available at Mars gravity 0.38g?",
  },
];
