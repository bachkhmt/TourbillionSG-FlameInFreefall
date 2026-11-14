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
 * StructPaper loading skeleton for the study detail header, 2-column layout, and tab pane.
 */
export const StudyDetailShimmer: React.FC = () => {
  return (
    <div
      data-testid="study-detail-shimmer"
      className="w-full max-w-[1600px] mx-auto space-y-6 py-2 pb-24 select-none"
    >
      {/* Header Shimmer */}
      <div className="w-full bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <ShimmerBar className="h-4 w-36 rounded-full" />
          <div className="flex items-center gap-2">
            <ShimmerBar className="h-8 w-32 rounded-xl" />
            <ShimmerBar className="h-8 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <ShimmerBar className="h-6 w-20 rounded-xl" />
          <ShimmerBar className="h-6 w-32 rounded-xl" />
          <ShimmerBar className="h-6 w-28 rounded-xl" />
        </div>
        <ShimmerBar className="h-8 w-3/4 rounded-xl" />
        <ShimmerBar className="h-4 w-2/3 rounded-md" />
      </div>

      {/* 2-Column Layout Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Left Column Shimmer */}
        <div className="space-y-4">
          {/* 2x2 Grid Shimmer */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <ShimmerBar className="h-3 w-16 rounded-md" />
              <ShimmerBar className="h-5 w-20 rounded-md" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <ShimmerBar className="h-3 w-16 rounded-md" />
              <ShimmerBar className="h-5 w-20 rounded-md" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <ShimmerBar className="h-3 w-16 rounded-md" />
              <ShimmerBar className="h-5 w-20 rounded-md" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <ShimmerBar className="h-3 w-16 rounded-md" />
              <ShimmerBar className="h-5 w-20 rounded-md" />
            </div>
          </div>

          {/* Physical Profile Card Shimmer */}
          <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3">
            <ShimmerBar className="h-4 w-32 rounded-md" />
            <div className="space-y-2">
              <ShimmerBar className="h-8 w-full rounded-xl" />
              <ShimmerBar className="h-8 w-full rounded-xl" />
              <ShimmerBar className="h-8 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column Shimmer */}
        <div className="space-y-4 min-w-0">
          {/* Tabs Nav Shimmer */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            {Array.from({ length: 5 }, (_, index) => (
              <ShimmerBar key={`tab-shimmer-${index}`} className="h-8 w-28 rounded-xl shrink-0" />
            ))}
          </div>

          {/* Overview Pane Shimmer */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3">
              <ShimmerBar className="h-5 w-60 rounded-md" />
              <ShimmerBar className="h-4 w-full rounded-md" />
              <ShimmerBar className="h-4 w-5/6 rounded-md" />
            </div>
            <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-3 min-h-[160px]">
              <ShimmerBar className="h-4 w-44 rounded-md" />
              <ShimmerBar className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyDetailShimmer;
