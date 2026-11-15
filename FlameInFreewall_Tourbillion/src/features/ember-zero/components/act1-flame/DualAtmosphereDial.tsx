'use client';

import React, { useState } from 'react';
import { Wind, Flame, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEmberStore } from '../../store/useEmberStore';

export interface DualAtmosphereDialProps {
  className?: string;
}

export const DualAtmosphereDial: React.FC<DualAtmosphereDialProps> = ({ className = '' }) => {
  const oxygenPct = useEmberStore((state) => state.oxygenPct);
  const setOxygenPct = useEmberStore((state) => state.setOxygenPct);

  // Total pressure in kPa (defaults to Earth sea level 101.3 kPa, or lunar habitat 56.0 kPa)
  const [pressureKpa, setPressureKpa] = useState<number>(101.3);
  const [selectedPreset, setSelectedPreset] = useState<'earth' | 'lunar' | 'custom'>('earth');

  // ppO2 = (totalPressure * O2%) / 100
  const ppO2 = (pressureKpa * oxygenPct) / 100;
  const ppO2Formatted = ppO2.toFixed(1);

  // Breathing state: 18 - 22.5 kPa is normoxic
  const isNormoxic = ppO2 >= 18.0 && ppO2 <= 22.5;
  const isHypoxic = ppO2 < 18.0;
  const isHyperoxic = ppO2 > 22.5;

  // Flammability index:
  // Baseline 21% O2 = 1.0x.
  // Lunar habitat 34% O2 = 2.4x.
  const flammabilityMultiplier =
    oxygenPct <= 21
      ? (1.0).toFixed(1)
      : (1.0 + ((oxygenPct - 21) / 13) * 1.4).toFixed(1);

  const isCriticalFlammability = oxygenPct >= 30;
  const isElevatedFlammability = oxygenPct > 21 && oxygenPct < 30;

  const handleEarthPreset = () => {
    setSelectedPreset('earth');
    setPressureKpa(101.3);
    setOxygenPct(21.0);
  };

  const handleLunarPreset = () => {
    setSelectedPreset('lunar');
    setPressureKpa(56.0);
    setOxygenPct(34.0);
  };

  const handleOxygenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSelectedPreset('custom');
    setOxygenPct(val);
  };

  // SVG Gauge calculations
  // Gauge 1: ppO2 (0 - 30 kPa)
  const ppO2Pct = Math.min(100, Math.max(0, (ppO2 / 30) * 100));
  const ppO2Circumference = 2 * Math.PI * 40;
  const ppO2StrokeDashoffset = ppO2Circumference - (ppO2Pct / 100) * (ppO2Circumference * 0.75);

  // Gauge 2: Flammability (15% - 40% O2)
  const flammabilityPct = Math.min(100, Math.max(0, ((oxygenPct - 15) / 25) * 100));
  const flameCircumference = 2 * Math.PI * 40;
  const flameStrokeDashoffset = flameCircumference - (flammabilityPct / 100) * (flameCircumference * 0.75);

  return (
    <div
      data-testid="dual-atmosphere-dial"
      className={`relative w-full max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-[#090D14]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-slate-100 ${className}`}
    >
      {/* Top Header / Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#D4FC02] uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Atmospheric Paradox Dial
          </div>
          <h3 className="text-xl md:text-2xl font-serif text-white tracking-tight">
            Nghịch Lý Khí Quyển: Thở Bình Thường vs Cháy Dữ Dội
          </h3>
        </div>

        {/* Preset Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEarthPreset}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider transition-all border ${
              selectedPreset === 'earth'
                ? 'bg-lime-500/20 text-lime-300 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            Trái Đất (21% / 101 kPa)
          </button>
          <button
            type="button"
            onClick={handleLunarPreset}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider transition-all border ${
              selectedPreset === 'lunar'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            Habitat Mặt Trăng (34% / 56 kPa)
          </button>
        </div>
      </div>

      {/* Dials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Dial 1: Breathing ppO2 Dial */}
        <div
          data-testid="breathing-dial"
          className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs font-mono text-lime-400 tracking-wider">
            <Wind className="w-4 h-4 text-lime-400" />
            <span>ÁP SUẤT RIÊNG PHẦN</span>
          </div>

          <div className="mt-6 mb-2 relative flex items-center justify-center">
            {/* SVG Circular Arc */}
            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/10"
                strokeDasharray={ppO2Circumference * 0.75}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#limeGradient)"
                strokeWidth="7"
                strokeDasharray={ppO2Circumference * 0.75}
                strokeDashoffset={ppO2StrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="limeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a3e635" />
                  <stop offset="100%" stopColor="#84cc16" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Values */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(163,230,53,0.3)]">
                {ppO2Formatted}
              </span>
              <span className="text-xs font-mono tracking-widest text-slate-400 uppercase mt-1">
                kPa (ppO₂)
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            data-testid="breathing-status-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider ${
              isNormoxic
                ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40 shadow-[0_0_12px_rgba(132,204,22,0.3)]'
                : isHypoxic
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isNormoxic ? 'Normoxic (An toàn / Phổi hoạt động chuẩn)' : isHypoxic ? 'Hypoxic (Thiếu oxy)' : 'Hyperoxic'}</span>
          </div>

          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-sans max-w-xs">
            Dải an toàn hô hấp sinh học: 18.0 – 22.5 kPa. Phi hành gia thở hoàn toàn bình thường, không cảm thấy ngột ngạt.
          </p>
        </div>

        {/* Dial 2: Flammability Index & O2 Concentration Dial */}
        <div
          data-testid="flammability-dial"
          className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs font-mono text-amber-400 tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>CHỈ SỐ BẮT LỬA & NỒNG ĐỘ O₂</span>
          </div>

          <div className="mt-6 mb-2 relative flex items-center justify-center">
            {/* SVG Circular Arc */}
            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/10"
                strokeDasharray={flameCircumference * 0.75}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={isCriticalFlammability ? 'url(#flameCriticalGradient)' : 'url(#flameNormGradient)'}
                strokeWidth="7"
                strokeDasharray={flameCircumference * 0.75}
                strokeDashoffset={flameStrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="flameNormGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="flameCriticalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Values */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                data-testid="flammability-index"
                className={`text-4xl md:text-5xl font-mono font-bold tracking-tight drop-shadow-[0_0_12px_rgba(239,68,68,0.3)] ${
                  isCriticalFlammability
                    ? 'text-rose-400'
                    : isElevatedFlammability
                    ? 'text-amber-400'
                    : 'text-lime-400'
                }`}
              >
                {flammabilityMultiplier}x
              </span>
              <span className="text-xs font-mono tracking-widest text-slate-400 uppercase mt-1">
                {oxygenPct.toFixed(1)}% Nồng độ O₂
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            data-testid="flammability-status-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider ${
              isCriticalFlammability
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                : isElevatedFlammability
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
            }`}
          >
            {isCriticalFlammability ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {isCriticalFlammability
                ? 'CRITICAL / NGUY CƠ CAO (2.4x Tốc độ cháy)'
                : isElevatedFlammability
                ? 'ELEVATED / TĂNG CAO'
                : '1.0x Tiêu chuẩn (Baseline)'}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-sans max-w-xs">
            {isCriticalFlammability
              ? 'Tốc độ lan truyền lửa tăng gấp 2.4 lần so với Trái Đất. Vật liệu khó cháy trên mặt đất có thể tự bốc cháy mãnh liệt.'
              : 'Nồng độ oxy khí quyển tiêu chuẩn mặt đất (21%).'}
          </p>
        </div>
      </div>

      {/* Interactive Slider */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <label
            htmlFor="oxygen-slider"
            className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1"
          >
            Điều chỉnh nồng độ O₂ (% thể tích)
          </label>
          <div className="text-sm font-sans text-slate-300">
            Kéo để thử nghiệm các cấu hình buồng khí thở vũ trụ khác nhau
          </div>
        </div>

        <div className="w-full md:w-72 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">15%</span>
          <input
            id="oxygen-slider"
            type="range"
            min="15"
            max="40"
            step="0.5"
            value={oxygenPct}
            onChange={handleOxygenChange}
            aria-label="Điều chỉnh nồng độ O₂"
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4FC02]"
          />
          <span className="text-xs font-mono text-[#D4FC02] font-bold w-12 text-right">
            {oxygenPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Punchline Quote Card */}
      <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/20 text-center">
        <blockquote className="text-lg md:text-xl font-serif italic text-amber-200 tracking-wide">
          &ldquo;Bạn thở vẫn thấy ổn. Ngọn lửa thì không.&rdquo;
        </blockquote>
        <div className="mt-1 text-xs font-mono tracking-widest uppercase text-slate-400">
          — Exploration Atmosphere Safety Paradox (NASA Exploration Atmosphere Architecture)
        </div>
      </div>
    </div>
  );
};
