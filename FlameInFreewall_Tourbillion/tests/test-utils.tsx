import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Creates a deterministic QueryClient configured for unit/component tests.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface RenderWithQueryResult extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Renders a React element wrapped in a TanStack QueryClientProvider for tests.
 */
export function renderWithQuery(
  ui: React.ReactElement,
  queryClient: QueryClient = createTestQueryClient()
): RenderWithQueryResult {
  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );

  return {
    ...result,
    queryClient,
  };
}
