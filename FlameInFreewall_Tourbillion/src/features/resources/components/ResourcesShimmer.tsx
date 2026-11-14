'use client';

import React from 'react';

export const ResourcesShimmer: React.FC = () => {
  return (
    <div
      data-testid="resources-shimmer"
      className="grid gap-5 md:grid-cols-2 animate-pulse"
      aria-label="Loading official resources"
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border-2 border-gray-200/60 bg-white p-6 space-y-4 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-6 w-28 bg-slate-200 rounded-full" />
            <div className="h-4 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-lg" />
            <div className="h-4 w-5/6 bg-slate-100 rounded-lg" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-32 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
};
