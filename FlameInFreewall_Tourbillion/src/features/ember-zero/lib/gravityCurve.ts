/**
 * Gravity Curve and Interpolation Math for Ember Zero
 */

export function smoothstep(min: number, max: number, value: number): number {
  if (value <= min) return 0;
  if (value >= max) return 1;
  const x = (value - min) / (max - min);
  return x * x * (3 - 2 * x);
}

export function getGravity(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));

  let gravity: number;
  if (p < 0.15) {
    gravity = 1.0;
  } else if (p < 0.31) {
    gravity = 1.0 - smoothstep(0.15, 0.31, p) * 1.0;
  } else if (p < 0.60) {
    gravity = 0.0;
  } else if (p < 0.68) {
    gravity = smoothstep(0.60, 0.68, p) * 0.16;
  } else {
    gravity = 0.16;
  }

  return Number(gravity.toFixed(3));
}
