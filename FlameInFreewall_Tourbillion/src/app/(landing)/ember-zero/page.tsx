'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const EmberZeroExperience = dynamic(
  () =>
    import('@/features/ember-zero').then((mod) => mod.EmberZeroExperience),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full bg-[#07080B] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-[#D4FC02] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Khởi tạo môi trường vi trọng lực Ember Zero...
        </p>
      </div>
    ),
  }
);

export default function EmberZeroPage() {
  return (
    <main className="w-full min-h-screen bg-[#07080B]">
      <EmberZeroExperience />
    </main>
  );
}
