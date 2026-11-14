import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiClientError } from '@/api/client';
import * as apiServices from '@/api/services';
import { BackendStatusPill } from '@/components/layout/BackendStatusPill';
import { Header } from '@/components/layout/Header';
import { toastStore } from '@/components/toast/toast-store';
import { renderWithQuery } from '../test-utils';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/api/services', async () => {
  const actual = await vi.importActual<typeof import('@/api/services')>('@/api/services');
  return {
    ...actual,
    getReady: vi.fn(),
  };
});

const mockedGetReady = vi.mocked(apiServices.getReady);

describe('Task 9: BackendStatusPill & Header Readiness Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastStore.clear();
  });

  it('returns null safely when BackendStatusPill or Header renders outside QueryClientProvider', () => {
    const { container: pillContainer } = render(<BackendStatusPill />);
    expect(pillContainer.innerHTML).toBe('');
    expect(screen.queryByTestId('backend-status-pill')).toBeNull();

    render(<Header />);
    expect(screen.getByTestId('app-header')).toBeDefined();
    expect(screen.queryByTestId('backend-status-pill')).toBeNull();
    expect(mockedGetReady).not.toHaveBeenCalled();
  });

  it('shows Checking API... while pending and transitions to API Ready when /ready succeeds', async () => {
    let resolveReady!: (value: { status: string; service: string; database: string }) => void;
    mockedGetReady.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveReady = resolve;
        })
    );

    renderWithQuery(<BackendStatusPill />);

    const pill = screen.getByTestId('backend-status-pill');
    expect(pill.textContent).toContain('Checking API...');

    resolveReady({
      status: 'ready',
      service: 'flameguard-ai-backend',
      database: 'ok',
    });

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-pill').textContent).toContain('API Ready');
    });
    expect(mockedGetReady).toHaveBeenCalledTimes(1);
  });

  it('shows DB Unavailable when /ready rejects with 503 DATA_UNAVAILABLE', async () => {
    mockedGetReady.mockRejectedValueOnce(
      new ApiClientError({
        message: 'Database unavailable',
        status: 503,
        code: 'DATA_UNAVAILABLE',
        fields: ['database'],
      })
    );

    renderWithQuery(<BackendStatusPill />);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-pill').textContent).toContain('DB Unavailable');
    });
  });

  it('shows API Offline when /ready rejects with NETWORK_ERROR', async () => {
    mockedGetReady.mockRejectedValueOnce(
      new ApiClientError({
        message: 'Network request failed',
        status: 0,
        code: 'NETWORK_ERROR',
      })
    );

    renderWithQuery(<BackendStatusPill />);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-pill').textContent).toContain('API Offline');
    });
  });

  it('refetches /ready on click and emits a toast reflecting the recheck result', async () => {
    mockedGetReady
      .mockResolvedValueOnce({
        status: 'ready',
        service: 'flameguard-ai-backend',
        database: 'ok',
      })
      .mockResolvedValueOnce({
        status: 'ready',
        service: 'flameguard-ai-backend',
        database: 'ok',
      })
      .mockRejectedValueOnce(
        new ApiClientError({
          message: 'Database unavailable',
          status: 503,
          code: 'DATA_UNAVAILABLE',
        })
      );

    renderWithQuery(<Header />);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status-pill').textContent).toContain('API Ready');
    });

    fireEvent.click(screen.getByTestId('backend-status-pill'));

    await waitFor(() => {
      expect(mockedGetReady).toHaveBeenCalledTimes(2);
      expect(toastStore.getToasts().some((t) => t.type === 'success' && t.title === 'Backend API Ready')).toBe(true);
    });

    fireEvent.click(screen.getByTestId('backend-status-pill'));

    await waitFor(() => {
      expect(mockedGetReady).toHaveBeenCalledTimes(3);
      expect(screen.getByTestId('backend-status-pill').textContent).toContain('DB Unavailable');
      expect(toastStore.getToasts().some((t) => t.type === 'warning' && t.title === 'Database Unavailable')).toBe(true);
    });
  });
});
