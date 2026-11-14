import { beforeEach, expect, vi } from 'vitest';
import { useDatasetStore } from '@/store/useDatasetStore';
import { fixtureFetch, liveWorkspace } from './live-fixtures';

beforeEach(() => {
  window.sessionStorage.clear();
  useDatasetStore.setState({ data: structuredClone(liveWorkspace), status: 'ready', error: null });
  vi.stubGlobal('fetch', vi.fn(fixtureFetch));
  window.history.replaceState(null, '', '/');
});

expect.extend({
  toBeInTheDocument(received: any) {
    const pass = Boolean(received);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in document`,
    };
  },
});
