import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

describe('next.config production output', () => {
  it('emits a standalone server for the container image (node server.js)', () => {
    expect(nextConfig.output).toBe('standalone');
  });

  it('keeps the backend proxy and studio rewrites', async () => {
    const rewrites = await nextConfig.rewrites!();
    const list = (Array.isArray(rewrites) ? rewrites : rewrites.afterFiles) ?? [];
    expect(list.map((r) => r.source)).toEqual(['/api/proxy/:path*', '/studio']);
  });
});
