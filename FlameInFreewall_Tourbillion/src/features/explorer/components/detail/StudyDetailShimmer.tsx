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
 * StructPaper loading skeleton for the study detail header, tab bar, and overview pane.
 */
export const StudyDetailShimmer: React.FC = () => {
  return (
    <div
      data-testid="study-detail-shimmer"
      className="w-full max-w-7xl mx-auto space-y-6 py-2 pb-24 select-none"
    >
      {/* Header Shimmer */}
      <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <ShimmerBar className="h-4 w-36 rounded-full" />
          <ShimmerBar className="h-8 w-36 rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ShimmerBar className="h-6 w-24 rounded-xl" />
          <ShimmerBar className="h-6 w-28 rounded-xl" />
          <ShimmerBar className="h-6 w-32 rounded-xl" />
        </div>
        <ShimmerBar className="h-9 w-3/4 rounded-xl" />
        <ShimmerBar className="h-4 w-2/3 rounded-md" />
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <ShimmerBar className="h-4 w-56 rounded-md" />
          <ShimmerBar className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Tabs Nav Shimmer */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 border border-gray-200/60">
        {Array.from({ length: 5 }, (_, index) => (
          <ShimmerBar key={`tab-shimmer-${index}`} className="h-9 w-32 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Overview Pane Shimmer */}
      <div className="space-y-5">
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3">
          <ShimmerBar className="h-5 w-60 rounded-md" />
          <ShimmerBar className="h-4 w-full rounded-md" />
          <ShimmerBar className="h-4 w-5/6 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3 min-h-[160px]">
            <ShimmerBar className="h-4 w-44 rounded-md" />
            <ShimmerBar className="h-16 w-full rounded-2xl" />
          </div>
          <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3 min-h-[160px]">
            <ShimmerBar className="h-4 w-44 rounded-md" />
            <ShimmerBar className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyDetailShimmer;
