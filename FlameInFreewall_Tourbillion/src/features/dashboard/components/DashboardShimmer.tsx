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

/**
 * StructPaper loading skeleton matching Dashboard KPI cards, curated studies grid,
 * and physical science domain breakdown cards.
 */
export const DashboardShimmer: React.FC = () => {
  return (
    <div data-testid="dashboard-shimmer" className="w-full space-y-8 sm:space-y-10 select-none">
      {/* KPI Stat Cards Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={`kpi-shimmer-${index}`}
            className="bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 min-h-[170px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <ShimmerBar className="h-5 w-20 rounded-full" />
                <ShimmerBar className="h-8 w-8 rounded-xl" />
              </div>
              <ShimmerBar className="h-9 w-20 rounded-xl" />
              <ShimmerBar className="h-4 w-32 rounded-md" />
            </div>
            <ShimmerBar className="h-3 w-full rounded-md mt-3" />
          </div>
        ))}
      </div>

      {/* Curated Studies Grid Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`study-shimmer-${index}`}
            className="bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 min-h-[230px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <ShimmerBar className="h-5 w-24 rounded-full" />
                <ShimmerBar className="h-5 w-20 rounded-full" />
              </div>
              <ShimmerBar className="h-5 w-3/4 rounded-md" />
              <ShimmerBar className="h-3.5 w-full rounded-md" />
              <ShimmerBar className="h-3.5 w-2/3 rounded-md" />
            </div>
            <div className="pt-3 border-t border-black/5 flex items-center gap-2">
              <ShimmerBar className="h-8 flex-1 rounded-xl" />
              <ShimmerBar className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Domain Breakdown Cards Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={`domain-shimmer-${index}`}
            className="bg-gray-200/50 rounded-[36px] p-5 border border-gray-100 min-h-[210px] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <ShimmerBar className="h-4 w-36 rounded-md" />
                <ShimmerBar className="h-4 w-16 rounded-full" />
              </div>
              <ShimmerBar className="h-16 w-full rounded-3xl" />
              <ShimmerBar className="h-14 w-full rounded-3xl" />
            </div>
            <ShimmerBar className="h-3 w-2/3 rounded-md mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardShimmer;
