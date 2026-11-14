'use client';

import React, { useContext } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { Activity, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { ApiClientError } from '@/api/client';
import { useReadyQuery } from '@/hooks/api';
import { toast } from '@/components/toast/toast-store';

type PillStatusKey = 'checking' | 'ready' | 'db-unavailable' | 'offline';

interface PillVisualState {
  label: string;
  pillClass: string;
  dotClass: string;
  pingDot: boolean;
  icon: 'activity' | 'alert' | 'offline' | 'spin';
}

const PILL_STYLES: Record<PillStatusKey, PillVisualState> = {
  checking: {
    label: 'Checking API...',
    pillClass: 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70',
    dotClass: 'bg-slate-400',
    pingDot: false,
    icon: 'spin',
  },
  ready: {
    label: 'API Ready',
    pillClass: 'bg-white border-[#D4FC02] text-[#0B2374] hover:bg-[#D4FC02]/20',
    dotClass: 'bg-[#84CC16]',
    pingDot: true,
    icon: 'activity',
  },
  'db-unavailable': {
    label: 'DB Unavailable',
    pillClass: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/80',
    dotClass: 'bg-amber-500',
    pingDot: false,
    icon: 'alert',
  },
  offline: {
    label: 'API Offline',
    pillClass: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/80',
    dotClass: 'bg-rose-500',
    pingDot: false,
    icon: 'offline',
  },
};

function isDbUnavailableError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof ApiClientError) {
    return error.status === 503 || error.code === 'DATA_UNAVAILABLE';
  }
  const record = error as { status?: number; code?: string };
  return record.status === 503 || record.code === 'DATA_UNAVAILABLE';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

const BackendStatusPillInner: React.FC = () => {
  const { data, error, isLoading, isFetching, isSuccess, isError, refetch } = useReadyQuery({
    retry: false,
  });

  const isHealthy = isSuccess && data?.status === 'ready' && data?.database === 'ok';
  let statusKey: PillStatusKey = 'checking';
  if (isLoading) {
    statusKey = 'checking';
  } else if (isHealthy) {
    statusKey = 'ready';
  } else if (isError && isDbUnavailableError(error)) {
    statusKey = 'db-unavailable';
  } else if (isSuccess && (data?.database !== 'ok' || data?.status !== 'ready')) {
    statusKey = 'db-unavailable';
  } else if (isError) {
    statusKey = 'offline';
  }

  const visual = PILL_STYLES[statusKey];

  const handleRecheck = async () => {
    if (isFetching) return;
    const result = await refetch();
    if (result.isSuccess && result.data?.status === 'ready' && result.data?.database === 'ok') {
      toast.success('Backend API Ready', 'Database connectivity and readiness probe passed.');
      return;
    }
    if (
      isDbUnavailableError(result.error) ||
      (result.isSuccess && (result.data?.database !== 'ok' || result.data?.status !== 'ready'))
    ) {
      toast.warning(
        'Database Unavailable',
        getErrorMessage(result.error, 'Backend API is reachable, but database readiness failed.')
      );
      return;
    }
    toast.error(
      'Backend API Offline',
      getErrorMessage(result.error, 'Unable to reach the FlameGuard backend API.')
    );
  };

  return (
    <button
      type="button"
      data-testid="backend-status-pill"
      onClick={handleRecheck}
      disabled={isFetching}
      title="Click to recheck backend API readiness"
      aria-label={`Backend status: ${visual.label}. Click to recheck.`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer disabled:cursor-wait ${visual.pillClass}`}
    >
      <span className="relative flex h-2 w-2">
        {visual.pingDot && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${visual.dotClass}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${visual.dotClass}`} />
      </span>
      {isFetching || visual.icon === 'spin' ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : visual.icon === 'alert' ? (
        <AlertTriangle className="w-3 h-3" />
      ) : visual.icon === 'offline' ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <Activity className="w-3 h-3 text-[#0B2374]" />
      )}
      <span>{visual.label}</span>
    </button>
  );
};

/**
 * Displays live backend `/ready` probe status and allows manual recheck when inside QueryClientProvider.
 */
export const BackendStatusPill: React.FC = () => {
  const queryClient = useContext(QueryClientContext);
  if (!queryClient) {
    return null;
  }
  return <BackendStatusPillInner />;
};
