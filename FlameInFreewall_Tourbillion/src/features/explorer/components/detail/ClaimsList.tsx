'use client';

import React from 'react';
import {
  FileText,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import type { MappedClaim, MappedInvestigationDetail } from '@/types/api';
import { ApiErrorBanner } from '@/components/ui/ApiErrorBanner';

export interface ClaimsListProps {
  study: MappedInvestigationDetail;
  claims: MappedClaim[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

function formatClaimDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toISOString().slice(0, 10);
}

export const ClaimsList: React.FC<ClaimsListProps> = ({
  study,
  claims,
  isLoading = false,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div data-testid="claims-loading-shimmer" className="space-y-3">
        <div className="h-32 rounded-3xl bg-gray-200/60" />
        <div className="h-32 rounded-3xl bg-gray-200/60" />
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorBanner title="Unable to load evidence claims" error={error} onRetry={onRetry} />
    );
  }

  return (
    <div data-testid="claims-list-container" className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Traceable Evidence Claims ({study.psiId})</span>
          </h3>
          <p className="text-xs text-zinc-500">
            Backend-verified provenance propositions with explicit source locators, review status, and mismatch alerts.
          </p>
        </div>
        <div className="text-xs font-bold text-zinc-500">
          {claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}
        </div>
      </div>

      {/* Claims Cards */}
      {claims.length === 0 ? (
        <div
          data-testid="no-claims-notice"
          className="p-8 text-center rounded-3xl bg-white border border-gray-100 space-y-3 shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-[#0B2374] mx-auto flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-950">No Evidence Claims Linked</h4>
            <p className="text-xs text-zinc-500 max-w-lg mx-auto">
              No extracted claims are currently attached to this investigation in the backend catalog.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4" data-testid="claims-items-list">
          {claims.map((claim) => (
            <article
              key={claim.id}
              data-testid={`claim-card-${claim.id}`}
              className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3.5"
            >
              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0B2374] text-[11px] font-extrabold">
                    {claim.evidenceStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-zinc-800 text-[11px] font-bold">
                    {claim.reviewStatus}
                  </span>
                  {claim.hasContextMismatch && (
                    <span
                      data-testid={`claim-mismatch-badge-${claim.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-extrabold"
                    >
                      <ShieldAlert className="w-3 h-3 text-amber-700" />
                      <span>Context Mismatch</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {formatClaimDate(claim.createdAt)}
                </span>
              </div>

              {/* Claim Text */}
              <p className="text-sm text-[#1A1A1A] font-semibold leading-relaxed">
                &ldquo;{claim.claimText}&rdquo;
              </p>

              {/* Limitation */}
              {claim.limitation && (
                <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span className="text-[11px] leading-relaxed">
                    <strong>Limitation:</strong> {claim.limitation}
                  </span>
                </div>
              )}

              {/* Linked Claim Sources */}
              {claim.sources.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="text-[11px] font-bold uppercase text-zinc-500">
                    Provenance Sources ({claim.sources.length} / {claim.sourcesTotal})
                  </div>
                  {claim.sources.map((src) => (
                    <div
                      key={src.id}
                      data-testid={`claim-source-${src.id}`}
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-zinc-900">{src.sourceLocator}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-zinc-600">
                            {src.source.documentType}
                          </span>
                          {src.contextMismatch && (
                            <span
                              data-testid={`claim-source-mismatch-${src.id}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-extrabold"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                              <span>Source Context Mismatch</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {src.source.doi && (
                            <a
                              href={`https://doi.org/${src.source.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`doi-link-${claim.id}`}
                              className="inline-flex items-center gap-1 text-[#0B2374] hover:underline text-[11px] font-bold"
                            >
                              <span>doi:{src.source.doi}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <a
                            href={src.source.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0B2374] hover:underline text-[11px] font-semibold"
                          >
                            <span>Source URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      {src.sourceExcerpt && (
                        <p className="text-[11px] text-zinc-600 italic leading-relaxed">
                          &ldquo;{src.sourceExcerpt}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
