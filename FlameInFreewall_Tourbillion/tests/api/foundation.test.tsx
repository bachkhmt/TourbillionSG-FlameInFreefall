import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl, getApiTimeoutMs, getBackendInternalUrl } from '@/api/config';
import { ApiClientError } from '@/api/client';
import { toastStore } from '@/components/toast/toast-store';
import {
  isTimeoutError,
  handleTimeoutFallback,
  resetTimeoutToastThrottle,
} from '@/hooks/api/queryHelpers';
import { QueryProvider, createAppQueryClient } from '@/providers/QueryProvider';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';
import { createTestQueryClient, renderWithQuery } from '../test-utils';

function QueryConsumerProbe() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['foundation-probe'],
    queryFn: async () => 'ready',
    initialData: 'ready',
  });

  return (
    <div data-testid="query-probe">
      <span>{data}</span>
      <span>{queryClient ? 'client-ok' : 'no-client'}</span>
    </div>
  );
}

describe('Task 1: TanStack Query Foundation, Config, Error Banner & Test Harness', () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalTimeout = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
  const originalBackendInternalUrl = process.env.BACKEND_INTERNAL_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
    delete process.env.BACKEND_INTERNAL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
    }

    if (originalTimeout === undefined) {
      delete process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
    } else {
      process.env.NEXT_PUBLIC_API_TIMEOUT_MS = originalTimeout;
    }

    if (originalBackendInternalUrl === undefined) {
      delete process.env.BACKEND_INTERNAL_URL;
    } else {
      process.env.BACKEND_INTERNAL_URL = originalBackendInternalUrl;
    }
  });

  describe('API config helpers', () => {
    it('returns default base URL when NEXT_PUBLIC_API_BASE_URL is unset or blank', () => {
      expect(getApiBaseUrl()).toBe('http://127.0.0.1:8000/api/v1');
      process.env.NEXT_PUBLIC_API_BASE_URL = '   ';
      expect(getApiBaseUrl()).toBe('http://127.0.0.1:8000/api/v1');
    });

    it('trims whitespace and strips trailing slashes from custom base URL', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = ' https://api.flameguard.dev/api/v1/// ';
      expect(getApiBaseUrl()).toBe('https://api.flameguard.dev/api/v1');
    });

    it('returns default timeout when NEXT_PUBLIC_API_TIMEOUT_MS is missing or invalid', () => {
      delete process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
      expect(getApiTimeoutMs()).toBe(40000);
      process.env.NEXT_PUBLIC_API_TIMEOUT_MS = 'not-a-number';
      expect(getApiTimeoutMs()).toBe(40000);
      process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '0';
      expect(getApiTimeoutMs()).toBe(40000);
      process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '-250';
      expect(getApiTimeoutMs()).toBe(40000);
    });

    it('parses valid positive NEXT_PUBLIC_API_TIMEOUT_MS', () => {
      process.env.NEXT_PUBLIC_API_TIMEOUT_MS = '15000';
      expect(getApiTimeoutMs()).toBe(15000);
    });

    it('supports relative /api/proxy/api/v1 via env and non-test browser default', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = ' /api/proxy/api/v1/ ';
      expect(getApiBaseUrl()).toBe('/api/proxy/api/v1');

      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      vi.stubEnv('NODE_ENV', 'development');
      expect(getApiBaseUrl()).toBe('/api/proxy/api/v1');
    });

    it('resolves getBackendInternalUrl() with default and trailing slash stripping', () => {
      expect(getBackendInternalUrl()).toBe('http://127.0.0.1:8000');
      process.env.BACKEND_INTERNAL_URL = '   ';
      expect(getBackendInternalUrl()).toBe('http://127.0.0.1:8000');
      process.env.BACKEND_INTERNAL_URL = ' http://backend.internal:9000/// ';
      expect(getBackendInternalUrl()).toBe('http://backend.internal:9000');
    });
  });

  describe('QueryProvider & test-utils', () => {
    it('configures createAppQueryClient with expected defaults', () => {
      const client = createAppQueryClient();
      const defaults = client.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(60_000);
      expect(defaults.queries?.gcTime).toBe(300_000);
      expect(defaults.queries?.retry).toBe(1);
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaults.mutations?.retry).toBe(0);
    });

    it('provides a working QueryClient to child hooks via QueryProvider', () => {
      render(
        <QueryProvider>
          <QueryConsumerProbe />
        </QueryProvider>
      );

      expect(screen.getByTestId('query-probe').textContent).toContain('ready');
      expect(screen.getByTestId('query-probe').textContent).toContain('client-ok');
    });

    it('configures createTestQueryClient and renderWithQuery in test-utils', () => {
      const testClient = createTestQueryClient();
      const defaults = testClient.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(false);
      expect(defaults.queries?.gcTime).toBe(Infinity);

      renderWithQuery(<QueryConsumerProbe />, testClient);
      expect(screen.getByTestId('query-probe').textContent).toContain('ready');
    });
  });

  describe('ApiErrorBanner', () => {
    it('renders message from an Error instance', () => {
      render(
        <ApiErrorBanner
          title="Telemetry Unavailable"
          error={new Error('Network request timed out')}
          testId="api-error-banner"
        />
      );

      const banner = screen.getByTestId('api-error-banner');
      expect(banner.textContent).toContain('Telemetry Unavailable');
      expect(banner.textContent).toContain('Network request timed out');
      expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();
    });

    it('renders structured code, status, fields, and supportedValues chips', () => {
      render(
        <ApiErrorBanner
          error={{
            code: 'INVALID_REQUEST',
            status: 422,
            message: 'Unsupported sort parameter provided.',
            fields: ['sort', 'gravityRaw'],
            supportedValues: ['updated_desc', 'title_asc'],
          }}
        />
      );

      expect(screen.getByText('Unsupported sort parameter provided.')).toBeDefined();
      expect(screen.getByText(/INVALID_REQUEST/)).toBeDefined();
      expect(screen.getByText(/422/)).toBeDefined();
      expect(screen.getByText('sort')).toBeDefined();
      expect(screen.getByText('gravityRaw')).toBeDefined();
      expect(screen.getByText('updated_desc')).toBeDefined();
      expect(screen.getByText('title_asc')).toBeDefined();
    });

    it('fires onRetry when Retry button is clicked and disables while retrying', () => {
      const onRetry = vi.fn();
      const { rerender } = render(
        <ApiErrorBanner error={new Error('Backend offline')} onRetry={onRetry} />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i }) as HTMLButtonElement;
      expect(retryButton.disabled).toBe(false);
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);

      rerender(
        <ApiErrorBanner
          error={new Error('Backend offline')}
          onRetry={onRetry}
          isRetrying={true}
        />
      );
      expect((screen.getByRole('button', { name: /retrying/i }) as HTMLButtonElement).disabled).toBe(
        true
      );
    });
  });

  describe('Server Timeout Fallback & Toast Notification', () => {
    it('detects timeout errors accurately across ApiClientError and transport errors', () => {
      const apiTimeout = new ApiClientError({ message: 'Request timed out', status: 0, code: 'REQUEST_TIMEOUT' });
      expect(isTimeoutError(apiTimeout)).toBe(true);

      const gatewayTimeout = new ApiClientError({ message: 'Gateway Timeout', status: 504, code: 'HTTP_ERROR' });
      expect(isTimeoutError(gatewayTimeout)).toBe(true);

      const server500 = new ApiClientError({ message: 'Internal Server Error', status: 500, code: 'HTTP_ERROR' });
      expect(isTimeoutError(server500)).toBe(false);

      const reqTimeout408 = new ApiClientError({ message: 'Request Timeout', status: 408, code: 'HTTP_ERROR' });
      expect(isTimeoutError(reqTimeout408)).toBe(true);

      const transportTimeout = new Error('Connection timed out');
      expect(isTimeoutError(transportTimeout)).toBe(true);

      const regularError = new Error('Validation failed');
      expect(isTimeoutError(regularError)).toBe(false);
    });

    it('emits a toast warning and throttles concurrent duplicate toasts', () => {
      resetTimeoutToastThrottle();
      toastStore.clear();

      const timeoutErr = new ApiClientError({ message: 'Request timed out', status: 0, code: 'REQUEST_TIMEOUT' });
      handleTimeoutFallback(timeoutErr);

      const toasts = toastStore.getToasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('warning');
      expect(toasts[0].title).toBe('Quá thời gian phản hồi server');

      // Second immediate call within throttle window should not emit another toast
      handleTimeoutFallback(timeoutErr);
      expect(toastStore.getToasts().length).toBe(1);
    });
  });
});
