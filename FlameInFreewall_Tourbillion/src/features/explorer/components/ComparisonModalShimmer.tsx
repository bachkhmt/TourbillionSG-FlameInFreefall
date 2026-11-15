'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

const shimmerVariants: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: isTest ? 0 : Infinity,
    },
  },
};

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #e5e7eb 25%, rgba(255,255,255,0.85) 50%, #e5e7eb 75%)',
  backgroundSize: '200% 100%',
};

function ShimmerBar({ className }: { className: string }) {
  return (
    <motion.div
      variants={isTest ? undefined : shimmerVariants}
      initial={isTest ? undefined : 'initial'}
      animate={isTest ? undefined : 'animate'}
      style={shimmerStyle}
      className={className}
    />
  );
}

export const ComparisonModalShimmer: React.FC = () => {
  return (
    <div
      data-testid="comparison-loading-shimmer"
      className="space-y-4 select-none"
      aria-label="Loading comparison data"
    >
      {/* 1. Parameter Delta Summary Skeleton Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShimmerBar className="w-4 h-4 rounded-md" />
            <ShimmerBar className="h-4 w-48 rounded-md" />
          </div>
          <ShimmerBar className="h-6 w-36 rounded-full" />
        </div>

        {/* 4-Column Metric Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { labelW: 'w-24', valW: 'w-28' },
            { labelW: 'w-28', valW: 'w-32' },
            { labelW: 'w-24', valW: 'w-20' },
            { labelW: 'w-20', valW: 'w-24' },
          ].map((col, idx) => (
            <div
              key={`metric-tile-${idx}`}
              className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <ShimmerBar className="w-3 h-3 rounded-sm" />
                <ShimmerBar className={`h-2.5 ${col.labelW} rounded-sm`} />
              </div>
              <ShimmerBar className={`h-4 ${col.valW} rounded-md`} />
            </div>
          ))}
        </div>

        {/* Comparability Disclaimer Notice */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex items-start gap-2.5">
          <ShimmerBar className="w-4 h-4 rounded-full shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <ShimmerBar className="h-3.5 w-3/4 rounded-md" />
            <ShimmerBar className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. Comparison Matrix Table Skeleton */}
      <div className="w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200">
                <th className="px-4 py-3.5 w-44">
                  <ShimmerBar className="h-3.5 w-24 rounded-md" />
                </th>
                <th className="px-4 py-3.5 border-l border-gray-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShimmerBar className="h-5 w-20 rounded-full" />
                      <ShimmerBar className="h-4 w-14 rounded-md" />
                    </div>
                    <ShimmerBar className="h-3.5 w-48 rounded-md" />
                  </div>
                </th>
                <th className="px-4 py-3.5 border-l border-gray-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShimmerBar className="h-5 w-20 rounded-full" />
                      <ShimmerBar className="h-4 w-14 rounded-md" />
                    </div>
                    <ShimmerBar className="h-3.5 w-44 rounded-md" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-gray-100">
              {/* Row 1: Platform */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold">
                  <ShimmerBar className="h-3 w-16 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-5 w-40 rounded-xl" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-5 w-36 rounded-xl" />
                </td>
              </tr>

              {/* Row 2: Tags */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold">
                  <ShimmerBar className="h-3 w-12 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <div className="flex gap-1.5">
                    <ShimmerBar className="h-5 w-16 rounded-full" />
                    <ShimmerBar className="h-5 w-20 rounded-full" />
                    <ShimmerBar className="h-5 w-14 rounded-full" />
                  </div>
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <div className="flex gap-1.5">
                    <ShimmerBar className="h-5 w-18 rounded-full" />
                    <ShimmerBar className="h-5 w-14 rounded-full" />
                    <ShimmerBar className="h-5 w-22 rounded-full" />
                  </div>
                </td>
              </tr>

              {/* Row 3: Observed Materials */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold">
                  <ShimmerBar className="h-3 w-28 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-3.5 w-52 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-3.5 w-48 rounded-md" />
                </td>
              </tr>

              {/* Row 4: Observed Gravities & Total */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold">
                  <ShimmerBar className="h-3 w-24 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShimmerBar className="h-4 w-12 rounded-md" />
                    <ShimmerBar className="h-3 w-20 rounded-md" />
                  </div>
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShimmerBar className="h-4 w-12 rounded-md" />
                    <ShimmerBar className="h-3 w-20 rounded-md" />
                  </div>
                </td>
              </tr>

              {/* Row 5: Observable Summaries */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold align-top">
                  <ShimmerBar className="h-3 w-32 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100 space-y-2">
                  <ShimmerBar className="h-3 w-3/4 rounded-md" />
                  <ShimmerBar className="h-3 w-2/3 rounded-md" />
                  <ShimmerBar className="h-3 w-4/5 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100 space-y-2">
                  <ShimmerBar className="h-3 w-3/4 rounded-md" />
                  <ShimmerBar className="h-3 w-2/3 rounded-md" />
                  <ShimmerBar className="h-3 w-4/5 rounded-md" />
                </td>
              </tr>

              {/* Row 6: Actions */}
              <tr className="bg-gray-50/40">
                <td className="px-4 py-3 font-semibold">
                  <ShimmerBar className="h-3 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-8 w-28 rounded-xl" />
                </td>
                <td className="px-4 py-3 border-l border-gray-100">
                  <ShimmerBar className="h-8 w-28 rounded-xl" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
