'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Lightbulb, Compass, ShieldCheck, Grid, Sparkles } from 'lucide-react';
import { useEmberStore } from '../../store/useEmberStore';

export interface LabLightsTransitionProps {
  className?: string;
  defaultLit?: boolean;
  onToggle?: (isLit: boolean) => void;
}

export const LabLightsTransition: React.FC<LabLightsTransitionProps> = ({
  className = '',
  defaultLit = true,
  onToggle,
}) => {
  const [isLit, setIsLit] = useState<boolean>(defaultLit);
  const { progress } = useEmberStore();

  const handleToggle = () => {
    const next = !isLit;
    setIsLit(next);
    onToggle?.(next);
  };

  return (
    <section
      data-testid="lab-lights-transition"
      className={`relative w-full overflow-hidden transition-colors duration-700 select-none ${
        isLit
          ? 'bg-[#F8F9FA] text-[#0B2374]'
          : 'bg-[#07080B] text-[#F2EFE8]'
      } ${className}`}
      style={{
        backgroundImage: isLit
          ? 'radial-gradient(circle at 50% 20%, rgba(11, 35, 116, 0.04) 0%, transparent 60%), linear-gradient(to right, rgba(11, 35, 116, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(11, 35, 116, 0.05) 1px, transparent 1px)'
          : 'radial-gradient(circle at 50% 20%, rgba(212, 252, 2, 0.03) 0%, transparent 60%), linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 32px 32px, 32px 32px',
      }}
    >
      {/* Top Architectural Technical Header */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 border-b border-dashed border-current/15 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0B2374] text-[#D4FC02] font-semibold text-[10px]">
            PHASE 02 // LAB TRANSITION
          </span>
          <span className="opacity-70">COORD: 28.5721° N, 80.6480° W</span>
          <span className="hidden sm:inline-block opacity-40">|</span>
          <span className="hidden sm:inline-block opacity-70">REGIME: STRUCTPAPER BLUEPRINT</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="opacity-70">
            TRẠNG THÁI: {isLit ? 'PHÒNG THÍ NGHIỆM ĐÃ BẬT SÁNG' : 'CHẾ ĐỘ TỐI TIÊU CHUẨN'}
          </span>
          <span className="font-bold px-2 py-0.5 rounded border border-current/20">
            PROG: {(progress * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Main Transition Hero */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24 flex flex-col items-center text-center relative z-10">
        {/* Toggle Switch Pill */}
        <div className="mb-8 flex items-center gap-4 p-1.5 rounded-full border border-current/20 backdrop-blur-md bg-white/10 shadow-sm">
          <span className="pl-3 pr-1 text-xs font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#0B2374]" />
            Bật đèn phòng thí nghiệm
          </span>
          <button
            type="button"
            role="switch"
            aria-label="Bật đèn phòng thí nghiệm"
            aria-checked={isLit}
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-16 cursor-pointer rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0B2374] focus:ring-offset-2 ${
              isLit ? 'bg-[#0B2374]' : 'bg-slate-700'
            }`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full shadow-md ${
                isLit ? 'bg-[#D4FC02] translate-x-8' : 'bg-white translate-x-0'
              }`}
            >
              {isLit ? (
                <Sun className="h-3.5 w-3.5 text-[#0B2374]" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-slate-800" />
              )}
            </motion.span>
          </button>
        </div>

        {/* Narrative Title & Punchline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#0B2374]/30 bg-[#0B2374]/5 text-xs font-mono font-medium uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-[#0B2374]" />
            HỒI II // KIẾN TRÚC STRUCTPAPER
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight leading-tight">
            Từ ngọn lửa vô định hình trong bóng tối... đến hệ thống trí tuệ an toàn hỏa hoạn có cấu trúc
          </h2>

          <p className="text-base sm:text-lg opacity-80 leading-relaxed font-sans max-w-2xl mx-auto pt-2">
            Không còn chỉ là cảm xúc trước cái đẹp ma mị của ngọn lửa hình cầu 0.00g. 
            Giờ là lúc bật toàn bộ dàn đèn phòng thí nghiệm, mở hồ sơ vi trọng lực và nhìn thẳng vào những con số thực nghiệm.
          </p>
        </motion.div>

        {/* Technical Blueprint Metrics Cards */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className={`p-5 rounded-lg border transition-all ${
            isLit ? 'bg-white border-[#0B2374]/15 shadow-sm' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono opacity-70 mb-2">
              <span>HỆ QUY CHIẾU</span>
              <Compass className="w-4 h-4 text-[#0B2374]" />
            </div>
            <div className="text-2xl font-bold font-serif">StructPaper Light</div>
            <p className="text-xs opacity-75 mt-1 font-sans">
              Nền giấy kỹ thuật #F8F9FA, mực xanh hải quân #0B2374, điểm nhấn Electric Lime #D4FC02.
            </p>
          </div>

          <div className={`p-5 rounded-lg border transition-all ${
            isLit ? 'bg-white border-[#0B2374]/15 shadow-sm' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono opacity-70 mb-2">
              <span>TIÊU CHUẨN ĐO LƯỜNG</span>
              <Grid className="w-4 h-4 text-[#0B2374]" />
            </div>
            <div className="text-2xl font-bold font-serif">NASA Physical Science</div>
            <p className="text-xs opacity-75 mt-1 font-sans">
              20 nghiên cứu PSI, 1,200+ lượt thử nghiệm buồng đốt vi trọng lực được số hóa.
            </p>
          </div>

          <div className={`p-5 rounded-lg border transition-all ${
            isLit ? 'bg-white border-[#0B2374]/15 shadow-sm' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono opacity-70 mb-2">
              <span>NGUYÊN TẮC AN TOÀN</span>
              <ShieldCheck className="w-4 h-4 text-[#0B2374]" />
            </div>
            <div className="text-2xl font-bold font-serif">Định Luật Bảo Toàn</div>
            <p className="text-xs opacity-75 mt-1 font-sans">
              Tuyệt đối không ngoại suy tùy tiện ở vùng thiếu dữ liệu. Khoa học trung thực đặt tính mạng lên trên hết.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
