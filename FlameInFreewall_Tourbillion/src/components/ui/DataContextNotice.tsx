"use client";
import React, { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiContextMeta } from "@/types/api";

export function DataContextNotice({
  context,
  testId,
}: {
  context: ApiContextMeta;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      title={context.caveats.join(" · ")}
      className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900"
    >
      {context.isFallback
        ? "Demo fallback · Synthetic · Unreviewed"
        : `${context.origin === "real" ? "Real" : context.origin === "synthetic" ? "Synthetic" : "Unknown"} · ${context.reviewState === "unreviewed" ? "Unreviewed" : context.reviewState}`}
    </span>
  );
}

export function ActiveFallbackBanner() {
  const cache = useQueryClient().getQueryCache();
  const active = useSyncExternalStore(
    (callback) => cache.subscribe(callback),
    () =>
      cache.getAll().some((query) => {
        const data = query.state.data as
          | { context?: { isFallback?: boolean }; isFallback?: boolean }
          | undefined;
        return (
          query.getObserversCount() > 0 &&
          (data?.context?.isFallback === true || data?.isFallback === true)
        );
      }),
    () => false,
  );
  return active ? (
    <div
      role="alert"
      data-testid="demo-fallback-banner"
      className="sticky top-0 z-[100] bg-amber-200 p-3 text-center text-sm font-bold text-amber-950"
    >
      Demo data — backend unreachable. Values shown are illustrative, not NASA
      records.
    </div>
  ) : null;
}
