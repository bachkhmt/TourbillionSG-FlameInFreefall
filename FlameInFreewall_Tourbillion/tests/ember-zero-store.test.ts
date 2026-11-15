import { describe, it, expect, beforeEach } from 'vitest';
import { smoothstep, getGravity } from '@/features/ember-zero/lib/gravityCurve';
import { SCENE_RANGES, getSceneByProgress } from '@/features/ember-zero/sceneRanges';
import { useEmberStore } from '@/features/ember-zero/store/useEmberStore';
import type { SceneId } from '@/features/ember-zero/types';

describe('Ember Zero - Gravity Curve (lib/gravityCurve.ts)', () => {
  describe('smoothstep', () => {
    it('clamps values below min to 0 and above max to 1', () => {
      expect(smoothstep(0.1, 0.5, 0.0)).toBe(0);
      expect(smoothstep(0.1, 0.5, 0.1)).toBe(0);
      expect(smoothstep(0.1, 0.5, 0.6)).toBe(1);
      expect(smoothstep(0.1, 0.5, 0.5)).toBe(1);
    });

    it('returns 0.5 at exact midpoint', () => {
      expect(smoothstep(0, 1, 0.5)).toBe(0.5);
      expect(smoothstep(0.2, 0.4, 0.3)).toBeCloseTo(0.5);
    });

    it('is monotonically increasing', () => {
      const v1 = smoothstep(0, 1, 0.25);
      const v2 = smoothstep(0, 1, 0.5);
      const v3 = smoothstep(0, 1, 0.75);
      expect(v1).toBeLessThan(v2);
      expect(v2).toBeLessThan(v3);
    });
  });

  describe('getGravity', () => {
    it('returns 1.00g at progress 0.00 to 0.14 (Scene 0 & 1)', () => {
      expect(getGravity(0.00)).toBe(1.0);
      expect(getGravity(0.04)).toBe(1.0);
      expect(getGravity(0.10)).toBe(1.0);
      expect(getGravity(0.14)).toBe(1.0);
    });

    it('smoothly interpolates from 1.00g down to 0.00g at progress 0.15 to 0.31 (The Drop)', () => {
      expect(getGravity(0.15)).toBe(1.0);
      // Midpoint of drop (0.15 + 0.31) / 2 = 0.23
      expect(getGravity(0.23)).toBe(0.5);
      expect(getGravity(0.31)).toBe(0.0);

      const gAt018 = getGravity(0.18);
      const gAt025 = getGravity(0.25);
      expect(gAt018).toBeGreaterThan(gAt025);
      expect(gAt018).toBeLessThan(1.0);
      expect(gAt025).toBeGreaterThan(0.0);
    });

    it('holds 0.00g at progress 0.31 to 0.60', () => {
      expect(getGravity(0.31)).toBe(0.0);
      expect(getGravity(0.40)).toBe(0.0);
      expect(getGravity(0.50)).toBe(0.0);
      expect(getGravity(0.59)).toBe(0.0);
      expect(getGravity(0.60)).toBe(0.0);
    });

    it('smoothly rises from 0.00g to 0.16g at progress 0.60 to 0.68 (Lunar gravity)', () => {
      expect(getGravity(0.60)).toBe(0.0);
      // Midpoint (0.60 + 0.68) / 2 = 0.64
      expect(getGravity(0.64)).toBe(0.08);
      expect(getGravity(0.68)).toBe(0.16);

      const gAt062 = getGravity(0.62);
      const gAt066 = getGravity(0.66);
      expect(gAt062).toBeLessThan(gAt066);
      expect(gAt062).toBeGreaterThan(0.0);
      expect(gAt066).toBeLessThan(0.16);
    });

    it('holds 0.16g at progress > 0.68', () => {
      expect(getGravity(0.69)).toBe(0.16);
      expect(getGravity(0.75)).toBe(0.16);
      expect(getGravity(1.00)).toBe(0.16);
    });

    it('clamps out of bounds progress properly', () => {
      expect(getGravity(-0.2)).toBe(1.0);
      expect(getGravity(1.5)).toBe(0.16);
    });
  });
});

describe('Ember Zero - Scene Ranges (sceneRanges.ts)', () => {
  it('defines 8 contiguous scenes covering 0.00 to 1.00', () => {
    expect(SCENE_RANGES).toHaveLength(8);
    const expectedIds: SceneId[] = [
      'scene0-dark',
      'scene1-weight',
      'scene2-drop',
      'scene3-quiet',
      'scene4-oxygen',
      'scene5-lights',
      'scene6-value',
      'scene7-call',
    ];

    expect(SCENE_RANGES.map((s) => s.id)).toEqual(expectedIds);
    expect(SCENE_RANGES[0].start).toBe(0.00);
    expect(SCENE_RANGES[0].end).toBe(0.04);
    expect(SCENE_RANGES[1].start).toBe(0.04);
    expect(SCENE_RANGES[1].end).toBe(0.15);
    expect(SCENE_RANGES[2].start).toBe(0.15);
    expect(SCENE_RANGES[2].end).toBe(0.31);
    expect(SCENE_RANGES[3].start).toBe(0.31);
    expect(SCENE_RANGES[3].end).toBe(0.42);
    expect(SCENE_RANGES[4].start).toBe(0.42);
    expect(SCENE_RANGES[4].end).toBe(0.52);
    expect(SCENE_RANGES[5].start).toBe(0.52);
    expect(SCENE_RANGES[5].end).toBe(0.60);
    expect(SCENE_RANGES[6].start).toBe(0.60);
    expect(SCENE_RANGES[6].end).toBe(0.73);
    expect(SCENE_RANGES[7].start).toBe(0.73);
    expect(SCENE_RANGES[7].end).toBe(1.00);
  });

  it('correctly maps progress to scene with getSceneByProgress', () => {
    expect(getSceneByProgress(0.00)).toBe('scene0-dark');
    expect(getSceneByProgress(0.02)).toBe('scene0-dark');
    expect(getSceneByProgress(0.04)).toBe('scene0-dark');
    expect(getSceneByProgress(0.05)).toBe('scene1-weight');
    expect(getSceneByProgress(0.14)).toBe('scene1-weight');
    expect(getSceneByProgress(0.15)).toBe('scene2-drop');
    expect(getSceneByProgress(0.25)).toBe('scene2-drop');
    expect(getSceneByProgress(0.31)).toBe('scene3-quiet');
    expect(getSceneByProgress(0.35)).toBe('scene3-quiet');
    expect(getSceneByProgress(0.42)).toBe('scene4-oxygen');
    expect(getSceneByProgress(0.48)).toBe('scene4-oxygen');
    expect(getSceneByProgress(0.52)).toBe('scene5-lights');
    expect(getSceneByProgress(0.58)).toBe('scene5-lights');
    expect(getSceneByProgress(0.60)).toBe('scene6-value');
    expect(getSceneByProgress(0.70)).toBe('scene6-value');
    expect(getSceneByProgress(0.73)).toBe('scene7-call');
    expect(getSceneByProgress(0.90)).toBe('scene7-call');
    expect(getSceneByProgress(1.00)).toBe('scene7-call');
  });

  it('clamps out of bounds progress in getSceneByProgress', () => {
    expect(getSceneByProgress(-0.1)).toBe('scene0-dark');
    expect(getSceneByProgress(1.2)).toBe('scene7-call');
  });
});

describe('Ember Zero - Zustand Store (store/useEmberStore.ts)', () => {
  beforeEach(() => {
    useEmberStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useEmberStore.getState();
    expect(state.progress).toBe(0);
    expect(state.gravity).toBe(1.0);
    expect(state.oxygenPct).toBe(21.0);
    expect(state.isIgnited).toBe(false);
    expect(state.isMuted).toBe(true);
    expect(state.isDebugOpen).toBe(false);
    expect(state.activeScene).toBe('scene0-dark');
  });

  it('updates progress, recalculates gravity, and updates activeScene via setProgress', () => {
    useEmberStore.getState().setProgress(0.23);
    let state = useEmberStore.getState();
    expect(state.progress).toBe(0.23);
    expect(state.gravity).toBe(0.5);
    expect(state.activeScene).toBe('scene2-drop');

    useEmberStore.getState().setProgress(0.40);
    state = useEmberStore.getState();
    expect(state.progress).toBe(0.40);
    expect(state.gravity).toBe(0.0);
    expect(state.activeScene).toBe('scene3-quiet');

    useEmberStore.getState().setProgress(0.64);
    state = useEmberStore.getState();
    expect(state.progress).toBe(0.64);
    expect(state.gravity).toBe(0.08);
    expect(state.activeScene).toBe('scene6-value');

    useEmberStore.getState().setProgress(0.85);
    state = useEmberStore.getState();
    expect(state.progress).toBe(0.85);
    expect(state.gravity).toBe(0.16);
    expect(state.activeScene).toBe('scene7-call');
  });

  it('clamps progress to [0, 1] in setProgress', () => {
    useEmberStore.getState().setProgress(-0.5);
    expect(useEmberStore.getState().progress).toBe(0);
    expect(useEmberStore.getState().gravity).toBe(1.0);

    useEmberStore.getState().setProgress(1.5);
    expect(useEmberStore.getState().progress).toBe(1.0);
    expect(useEmberStore.getState().gravity).toBe(0.16);
  });

  it('updates oxygenPct via setOxygenPct', () => {
    useEmberStore.getState().setOxygenPct(14.5);
    expect(useEmberStore.getState().oxygenPct).toBe(14.5);
  });

  it('sets isIgnited to true via ignite', () => {
    expect(useEmberStore.getState().isIgnited).toBe(false);
    useEmberStore.getState().ignite();
    expect(useEmberStore.getState().isIgnited).toBe(true);
  });

  it('toggles isMuted via toggleMute', () => {
    expect(useEmberStore.getState().isMuted).toBe(true);
    useEmberStore.getState().toggleMute();
    expect(useEmberStore.getState().isMuted).toBe(false);
    useEmberStore.getState().toggleMute();
    expect(useEmberStore.getState().isMuted).toBe(true);
  });

  it('toggles isDebugOpen via toggleDebug', () => {
    expect(useEmberStore.getState().isDebugOpen).toBe(false);
    useEmberStore.getState().toggleDebug();
    expect(useEmberStore.getState().isDebugOpen).toBe(true);
    useEmberStore.getState().toggleDebug();
    expect(useEmberStore.getState().isDebugOpen).toBe(false);
  });

  it('resets back to initial state via reset', () => {
    useEmberStore.getState().setProgress(0.75);
    useEmberStore.getState().setOxygenPct(5.0);
    useEmberStore.getState().ignite();
    useEmberStore.getState().toggleMute();
    useEmberStore.getState().toggleDebug();

    expect(useEmberStore.getState().progress).toBe(0.75);
    expect(useEmberStore.getState().isIgnited).toBe(true);
    expect(useEmberStore.getState().isMuted).toBe(false);
    expect(useEmberStore.getState().isDebugOpen).toBe(true);

    useEmberStore.getState().reset();

    const state = useEmberStore.getState();
    expect(state.progress).toBe(0);
    expect(state.gravity).toBe(1.0);
    expect(state.oxygenPct).toBe(21.0);
    expect(state.isIgnited).toBe(false);
    expect(state.isMuted).toBe(true);
    expect(state.isDebugOpen).toBe(false);
    expect(state.activeScene).toBe('scene0-dark');
  });
});
