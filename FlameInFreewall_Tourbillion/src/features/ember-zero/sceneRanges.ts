import type { SceneId, SceneRange } from './types';

export const SCENE_RANGES: SceneRange[] = [
  {
    id: 'scene0-dark',
    start: 0.00,
    end: 0.04,
    title: 'Pre-Drop Silence',
    subtitle: 'Ignition chamber sealed at 1.00g normal gravity.',
  },
  {
    id: 'scene1-weight',
    start: 0.04,
    end: 0.15,
    title: 'The Buoyant Flame',
    subtitle: 'Convective chimney effect: teardrop yellow flame fed by rising hot gases.',
  },
  {
    id: 'scene2-drop',
    start: 0.15,
    end: 0.31,
    title: 'The Drop',
    subtitle: 'Release into 2.2s freefall: buoyant chimney collapses into microgravity.',
  },
  {
    id: 'scene3-quiet',
    start: 0.31,
    end: 0.42,
    title: 'The Spherical Quiet',
    subtitle: 'Pure diffusion regime: radiant blue spherical flame, zero soot.',
  },
  {
    id: 'scene4-oxygen',
    start: 0.42,
    end: 0.52,
    title: 'Oxygen Depletion Limit',
    subtitle: 'Diffusion starvation and radiative cooling drive flame toward extinction.',
  },
  {
    id: 'scene5-lights',
    start: 0.52,
    end: 0.60,
    title: 'Extinction & Ghost Radiance',
    subtitle: 'Visual flame vanishes, leaving infrared signature and dormant gas cloud.',
  },
  {
    id: 'scene6-value',
    start: 0.60,
    end: 0.73,
    title: 'Microgravity Intelligence Matrix',
    subtitle: 'FlameGuard AI transforms drop tower physics into orbital life-safety systems.',
  },
  {
    id: 'scene7-call',
    start: 0.73,
    end: 1.00,
    title: 'Launch Telemetry',
    subtitle: 'Initialize mission control workspace and simulate combustion regimes.',
  },
];

export function getSceneByProgress(progress: number): SceneId {
  const p = Math.max(0, Math.min(1, progress));

  if (p <= 0.04) {
    return 'scene0-dark';
  } else if (p < 0.15) {
    return 'scene1-weight';
  } else if (p < 0.31) {
    return 'scene2-drop';
  } else if (p < 0.42) {
    return 'scene3-quiet';
  } else if (p < 0.52) {
    return 'scene4-oxygen';
  } else if (p < 0.60) {
    return 'scene5-lights';
  } else if (p < 0.73) {
    return 'scene6-value';
  } else {
    return 'scene7-call';
  }
}
