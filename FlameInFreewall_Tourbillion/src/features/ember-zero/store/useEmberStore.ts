import { create } from 'zustand';
import type { EmberState } from '../types';
import { getGravity } from '../lib/gravityCurve';
import { getSceneByProgress } from '../sceneRanges';

const INITIAL_STATE = {
  progress: 0,
  gravity: 1.0,
  oxygenPct: 21.0,
  isIgnited: false,
  isMuted: true,
  isDebugOpen: false,
  activeScene: 'scene0-dark' as const,
};

export const useEmberStore = create<EmberState>((set) => ({
  ...INITIAL_STATE,

  setProgress: (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const gravity = getGravity(clamped);
    const activeScene = getSceneByProgress(clamped);
    set({ progress: clamped, gravity, activeScene });
  },

  setOxygenPct: (oxygenPct: number) => {
    set({ oxygenPct });
  },

  ignite: () => {
    set({ isIgnited: true });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleDebug: () => {
    set((state) => ({ isDebugOpen: !state.isDebugOpen }));
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
