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

export const ResourcesShimmer: React.FC = () => {
  return (
    <div
      data-testid="resources-shimmer"
      className="grid gap-5 md:grid-cols-2 select-none"
      aria-label="Loading official resources"
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={`resource-shimmer-${i}`}
          className="flex flex-col justify-between rounded-[36px] bg-gray-200/50 p-5 sm:p-6 shadow-2xs min-h-[220px]"
        >
          <div className="space-y-3">
            {/* Category & Status Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShimmerBar className="h-6 w-32 rounded-full" />
                <ShimmerBar className="h-5 w-24 rounded-full" />
              </div>
              <ShimmerBar className="h-4 w-16 rounded-full" />
            </div>

            {/* Title */}
            <ShimmerBar className="h-6 w-3/4 rounded-xl" />

            {/* Role / Description */}
            <div className="space-y-2">
              <ShimmerBar className="h-4 w-full rounded-lg" />
              <ShimmerBar className="h-4 w-5/6 rounded-lg" />
            </div>
          </div>

          {/* Footer Info & Action */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <ShimmerBar className="h-4 w-28 rounded-md" />
            <ShimmerBar className="h-7 w-28 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResourcesShimmer;
