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
      className="w-full max-w-[1600px] mx-auto py-2 pb-24 select-none"
    >
      {/* 2-Column Responsive Split Layout Shimmer (Left Header Card, Right Tab Bar & Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-[38%_62%] xl:grid-cols-[420px_1fr] 2xl:grid-cols-[450px_1fr] gap-6 items-start">
        {/* Left Column Header Shimmer */}
        <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <ShimmerBar className="h-4 w-32 rounded-full" />
            <ShimmerBar className="h-7 w-28 rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <ShimmerBar className="h-6 w-16 rounded-xl" />
            <ShimmerBar className="h-6 w-32 rounded-xl" />
            <ShimmerBar className="h-6 w-24 rounded-xl" />
          </div>
          <ShimmerBar className="h-8 w-5/6 rounded-xl" />
          <ShimmerBar className="h-4 w-full rounded-md" />
          <ShimmerBar className="h-4 w-3/4 rounded-md" />
          <div className="flex flex-wrap gap-2 pt-2">
            <ShimmerBar className="h-6 w-20 rounded-full" />
            <ShimmerBar className="h-6 w-24 rounded-full" />
            <ShimmerBar className="h-6 w-16 rounded-full" />
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-4">
              <ShimmerBar className="h-4 w-20 rounded-md" />
              <ShimmerBar className="h-4 w-20 rounded-md" />
              <ShimmerBar className="h-4 w-20 rounded-md" />
            </div>
            <ShimmerBar className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Column Tabs & Pane Shimmer */}
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
