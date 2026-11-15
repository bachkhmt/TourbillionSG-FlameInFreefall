"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveFallbackBanner } from "@/components/ui/DataContextNotice";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Creates the application-wide TanStack QueryClient with StructPaper/FlameGuard defaults.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Client-side TanStack Query provider mounted at the root layout.
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(() => createAppQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveFallbackBanner />
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
