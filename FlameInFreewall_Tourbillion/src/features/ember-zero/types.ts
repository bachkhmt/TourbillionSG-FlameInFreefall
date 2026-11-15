export type SceneId =
  | 'scene0-dark'
  | 'scene1-weight'
  | 'scene2-drop'
  | 'scene3-quiet'
  | 'scene4-oxygen'
  | 'scene5-lights'
  | 'scene6-value'
  | 'scene7-call';

export interface SceneRange {
  id: SceneId;
  start: number;
  end: number;
  title: string;
  subtitle?: string;
}

export interface EmberState {
  progress: number;
  gravity: number;
  oxygenPct: number;
  isIgnited: boolean;
  isMuted: boolean;
  isDebugOpen: boolean;
  activeScene: SceneId;
  setProgress: (p: number) => void;
  setOxygenPct: (o2: number) => void;
  ignite: () => void;
  toggleMute: () => void;
  toggleDebug: () => void;
  reset: () => void;
}

export interface ValueBeat {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  verifiedBenefit: string;
  tag: string;
}
