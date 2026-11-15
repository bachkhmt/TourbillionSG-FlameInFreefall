'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

export interface InvestigationCardShimmerProps {
  cardCount?: number;
}

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

const cardVariants: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
};

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #e5e7eb 25%, rgba(255,255,255,0.85) 50%, #e5e7eb 75%)',
  backgroundSize: '200% 100%',
};

export const InvestigationCardShimmer: React.FC<InvestigationCardShimmerProps> = ({
  cardCount = 6,
}) => {
  return (
    <>
      {Array.from({ length: cardCount }, (_, index) => (
        <motion.div
          key={`investigation-card-shimmer-${index}`}
          data-testid="investigation-card-shimmer"
          variants={isTest ? undefined : cardVariants}
          initial={isTest ? undefined : 'initial'}
          animate={isTest ? undefined : 'animate'}
          transition={
            isTest
              ? { duration: 0 }
              : {
                  delay: index * 0.04,
                  duration: 0.35,
                }
          }
          className="w-full bg-gray-200/50 p-5 rounded-3xl md:rounded-[36px] flex flex-col justify-between relative overflow-hidden select-none min-h-[250px]"
        >
          <div>
            {/* Top row: Badges */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <motion.div
                  variants={isTest ? undefined : shimmerVariants}
                  initial={isTest ? undefined : 'initial'}
                  animate={isTest ? undefined : 'animate'}
                  style={shimmerStyle}
                  className="h-5 w-16 rounded-full"
                />
                <motion.div
                  variants={isTest ? undefined : shimmerVariants}
                  initial={isTest ? undefined : 'initial'}
                  animate={isTest ? undefined : 'animate'}
                  style={shimmerStyle}
                  className="h-5 w-14 rounded-full"
                />
              </div>
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-7 w-20 rounded-full"
              />
            </div>

            {/* Title & subtitle shimmer */}
            <div className="space-y-2 mb-3">
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-5 w-3/4 rounded-md"
              />
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-3.5 w-full rounded-md"
              />
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-3.5 w-2/3 rounded-md"
              />
            </div>

            {/* Minimalist Tags Strip Shimmer matching real InvestigationCard */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 py-2 px-3 rounded-2xl bg-white/70 border border-gray-100/60 mb-4">
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-4 w-16 rounded-full"
              />
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-4 w-20 rounded-full"
              />
              <motion.div
                variants={isTest ? undefined : shimmerVariants}
                initial={isTest ? undefined : 'initial'}
                animate={isTest ? undefined : 'animate'}
                style={shimmerStyle}
                className="h-4 w-14 rounded-full"
              />
            </div>
          </div>

          {/* Footer Metrics Row Shimmer matching real InvestigationCard */}
          <div className="pt-3 mt-4 border-t border-black/5 flex items-center justify-between">
            <motion.div
              variants={isTest ? undefined : shimmerVariants}
              initial={isTest ? undefined : 'initial'}
              animate={isTest ? undefined : 'animate'}
              style={shimmerStyle}
              className="h-4 w-28 rounded-md"
            />
            <motion.div
              variants={isTest ? undefined : shimmerVariants}
              initial={isTest ? undefined : 'initial'}
              animate={isTest ? undefined : 'animate'}
              style={shimmerStyle}
              className="h-4 w-16 rounded-md"
            />
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default InvestigationCardShimmer;
