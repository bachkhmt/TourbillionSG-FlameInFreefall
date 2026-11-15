import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, RotateCcw, Play, Pause, Shield, Sparkles } from 'lucide-react';
import { useEmberStore } from '../../store/useEmberStore';

export interface MissionBriefCTAProps {
  className?: string;
  onToggleTour?: () => void;
  isAutoTourActive?: boolean;
  onReset?: () => void;
}

export const MissionBriefCTA: React.FC<MissionBriefCTAProps> = ({
  className = '',
  onToggleTour,
  isAutoTourActive = false,
  onReset,
}) => {
  const resetStore = useEmberStore((state) => state.reset);

  const handleReset = () => {
    resetStore();
    if (onReset) {
      onReset();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="mission-brief-cta"
      data-testid="mission-brief-cta"
      className={`relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-white text-[#0B2374] border-t border-[#0B2374]/15 overflow-hidden ${className}`}
    >
      {/* Background Accent Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0B2374_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B2374]/5 border border-[#0B2374]/15 text-[#0B2374] font-mono text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
          <span>Sẵn sàng cho Nhiệm Vụ 2026 • FlameGuard AI Mission Brief</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#0B2374] tracking-tight mb-6">
          Khởi Động Trung Tâm <br className="hidden sm:inline" />
          Điều Khiển Hỏa Hoạn Vũ Trụ
        </h2>

        {/* Narrative Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 font-sans leading-relaxed mb-10">
          Từ ngọn lửa hình cầu tĩnh lặng trong tháp rơi đến hệ điều hành an toàn đa hành tinh.
          Truy cập bảng điều khiển nhiệm vụ thực nghiệm hoặc bắt đầu chuyến bay giả lập 60 giây.
        </p>

        {/* Main CTA Buttons Grid */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12">
          {/* 1. Enter Mission Control -> /dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-[#0B2374] text-white hover:bg-[#0B2374]/90 font-mono text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer"
          >
            <span>Vào Trung Tâm Điều Khiển</span>
            <ArrowRight className="w-4 h-4 text-[#D4FC02] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 2. Explore 20 Studies -> /explorer */}
          <Link
            href="/explorer"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-[#F8F9FA] text-[#0B2374] border border-[#0B2374]/20 hover:bg-[#0B2374]/5 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#0B2374]" />
            <span>Khám phá 20 nghiên cứu NASA</span>
          </Link>

          {/* 3. 60-Second Guided Tour */}
          <button
            type="button"
            onClick={onToggleTour}
            className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              isAutoTourActive
                ? 'bg-[#D4FC02] text-[#0B2374] border-[#0B2374] shadow-md'
                : 'bg-white text-[#0B2374] border-[#0B2374]/20 hover:bg-slate-50'
            }`}
          >
            {isAutoTourActive ? (
              <>
                <Pause className="w-4 h-4 text-[#0B2374]" />
                <span>Dừng Tour 60 Giây</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[#0B2374]" />
                <span>Tour 60 giây tự động</span>
              </>
            )}
          </button>

          {/* 4. Reset & Re-ignite */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>Bật lại ngọn lửa</span>
          </button>
        </div>

        {/* Scientific Safety & Integrity Notice */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>HỆ THỐNG TUÂN THỦ NGUYÊN TẮC: KHÔNG DỰ ĐOÁN KHI THIẾU DỮ LIỆU THỰC NGHIỆM</span>
        </div>
      </div>
    </section>
  );
};
