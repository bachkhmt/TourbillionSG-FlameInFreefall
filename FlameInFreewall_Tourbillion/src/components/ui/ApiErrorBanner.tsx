'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApiErrorBannerProps {
  title?: string;
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  testId?: string;
}

interface ParsedApiError {
  message: string;
  code?: string;
  status?: number;
  fields: string[];
  supportedValues: string[];
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function parseErrorRecord(record: Record<string, unknown>, fallbackMessage?: string): ParsedApiError {
  const nested =
    typeof record.error === 'object' && record.error !== null
      ? (record.error as Record<string, unknown>)
      : null;

  const source = nested && typeof nested.message === 'string' ? nested : record;

  const message =
    typeof source.message === 'string' && source.message.trim().length > 0
      ? source.message
      : fallbackMessage || 'An unexpected API error occurred.';

  const code =
    typeof source.code === 'string' && source.code.trim().length > 0 ? source.code : undefined;

  const rawStatus = source.status ?? record.status;
  const status = typeof rawStatus === 'number' && Number.isFinite(rawStatus) ? rawStatus : undefined;

  return {
    message,
    code,
    status,
    fields: toStringList(source.fields),
    supportedValues: toStringList(source.supportedValues),
  };
}

function extractApiError(error: unknown): ParsedApiError {
  if (typeof error === 'string' && error.trim().length > 0) {
    return { message: error, fields: [], supportedValues: [] };
  }

  if (error instanceof Error) {
    return parseErrorRecord(error as unknown as Record<string, unknown>, error.message);
  }

  if (typeof error === 'object' && error !== null) {
    return parseErrorRecord(error as Record<string, unknown>);
  }

  return {
    message: 'An unexpected API error occurred.',
    fields: [],
    supportedValues: [],
  };
}

/**
 * StructPaper error banner surfacing structured API errors, affected fields,
 * supported values, and an optional retry trigger.
 */
export const ApiErrorBanner: React.FC<ApiErrorBannerProps> = ({
  title = 'Unable to load telemetry data',
  error,
  onRetry,
  isRetrying = false,
  className,
  testId = 'api-error-banner',
}) => {
  const parsed = extractApiError(error);

  return (
    <div
      role="alert"
      data-testid={testId}
      className={cn(
        'rounded-[28px] border border-rose-200/90 bg-white p-5 shadow-sm',
        'ring-1 ring-rose-100/80 text-[#1A1A1A]',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">{title}</h3>
              {parsed.code && (
                <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                  {parsed.code}
                </span>
              )}
              {parsed.status !== undefined && (
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  HTTP {parsed.status}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-slate-600">{parsed.message}</p>

            {parsed.fields.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs font-semibold text-amber-800 mr-1">Fields:</span>
                {parsed.fields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}

            {parsed.supportedValues.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs font-semibold text-[#0B2374] mr-1">Supported:</span>
                {parsed.supportedValues.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center rounded-full bg-[#F8F9FA] border border-[#EAECEF] px-2.5 py-0.5 text-xs font-medium text-[#0B2374]"
                  >
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer',
              'bg-[#0B2374] text-white hover:bg-[#0B2374]/90',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')}
              aria-hidden="true"
            />
            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiErrorBanner;
