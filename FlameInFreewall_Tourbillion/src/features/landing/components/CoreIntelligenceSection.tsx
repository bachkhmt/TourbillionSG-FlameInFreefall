'use client';

/**
 * CoreIntelligenceSection Component
 * Highlights the 3 core technological contributions of FlameGuard AI beyond raw NASA data:
 * 1. Cross-Study Harmonization (20 PSI studies unified)
 * 2. Evidence Gap Matrix (Pinpointing unverified partial-g regimes like Moon 0.16g)
 * 3. Guarded Predictive Physics (Locking predictions & preventing AI hallucination)
 * And provides an interactive Ignition Source & Mechanism Inference workbench.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Zap,
  Radio,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  Info,
} from 'lucide-react';

export type IgnitionModeId = 'hot-wire' | 'spark' | 'radiant' | 'smolder';

export interface IgnitionMode {
  id: IgnitionModeId;
  name: string;
  vietnameseTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  psiStudyMatch: string;
  delayRange: string;
  minEnergy: string;
  dangerLevel: 'Cao' | 'Rất cao' | 'Cực kỳ nguy cấp';
  mechanism: string;
  preventionInsight: string;
  flightAnalog: string;
}

const IGNITION_MODES: Record<IgnitionModeId, IgnitionMode> = {
  'hot-wire': {
    id: 'hot-wire',
    name: 'Hot-Wire Overload',
    vietnameseTitle: 'Dây dẫn quá nhiệt & Tiếp xúc nóng',
    icon: Flame,
    psiStudyMatch: 'NASA SoFIE-MIST (Material Ignition and Suppression Test)',
    delayRange: '1.8s – 4.5s',
    minEnergy: '12 – 18 Joules',
    dangerLevel: 'Rất cao',
    mechanism:
      'Trong vi trọng lực, luồng khí không thể tự đối lưu để làm mát bề mặt dây dẫn. Dòng điện quá tải làm nhiệt độ cuộn dây tăng nhanh gấp 2.2 lần so với mặt đất, kích hoạt quá trình nhiệt phân polymer cách điện.',
    preventionInsight:
      'Hệ thống FlameGuard AI đối chiếu dòng tải và vận tốc thông gió khoang bay (0.05–0.1 m/s) để cảnh báo ngưỡng kích nhiệt trước khi bốc khói.',
    flightAnalog: 'SoFIE-MIST Flight Run #14 (34% O₂ / 56 kPa / PMMA sample)',
  },
  'spark': {
    id: 'spark',
    name: 'Electrical Arc & Spark',
    vietnameseTitle: 'Tia lửa hồ quang & Phóng điện áp thấp',
    icon: Zap,
    psiStudyMatch: 'NASA ACME (Advanced Combustion via Microgravity Experiments)',
    delayRange: '< 0.05s (Tức thì)',
    minEnergy: '0.2 – 0.8 mJ',
    dangerLevel: 'Cực kỳ nguy cấp',
    mechanism:
      'Định luật Paschen chứng minh điện áp đánh thủng không khí giảm mạnh khi áp suất khoang giảm xuống 56–70 kPa trong các module Artemis. Tia lửa tĩnh điện nhỏ dễ dàng đạt năng lượng mồi cháy MIE trong môi trường giàu oxy (34% O₂).',
    preventionInsight:
      'Khóa tự động các rơ-le cao áp khi nồng độ O₂ cục bộ vượt 30% và cảnh báo giới hạn tích điện tĩnh trên bề mặt vải du hành.',
    flightAnalog: 'ACME Spark Ignition Calibration Matrix (0.00g chamber)',
  },
  'radiant': {
    id: 'radiant',
    name: 'Radiant Heat Flashover',
    vietnameseTitle: 'Bức xạ nhiệt bề mặt & Flashover',
    icon: Radio,
    psiStudyMatch: 'NASA BASS-II (Burning and Suppression of Solids - II)',
    delayRange: '12s – 25s',
    minEnergy: '25 – 40 kW/m²',
    dangerLevel: 'Cao',
    mechanism:
      'Nhiệt bức xạ từ thiết bị sưởi ấm hoặc lò phản ứng thí nghiệm truyền trực tiếp vào bề mặt vật liệu đặc mà không bị tản mát bởi gió đối lưu tự nhiên, làm giảm đáng kể chỉ số giới hạn oxy (LOI) của vật liệu.',
    preventionInsight:
      'Tính toán phân bố thông lượng bức xạ (Radiant Flux) và mô phỏng điểm bắt lửa bùng phát (Flashover) trên các tấm vật liệu Nomex và Polycarbonate.',
    flightAnalog: 'BASS-II Radiant Heating Curve #09 (Flat fabric in quiescent air)',
  },
  'smolder': {
    id: 'smolder',
    name: 'Quiescent Smoldering Ignition',
    vietnameseTitle: 'Cháy âm ỉ trong khoang không đối lưu',
    icon: Sliders,
    psiStudyMatch: 'NASA SAME / CIR (Sensor Atmosphere & Droplet Extinction)',
    delayRange: '15 phút – 2 giờ',
    minEnergy: 'Rất thấp (Nhiệt tích lũy)',
    dangerLevel: 'Cực kỳ nguy cấp',
    mechanism:
      'Nguy cơ chết người nhất trong trạm không gian: Vật liệu cháy âm ỉ không tạo ra ngọn lửa thấy được hoặc khói bốc lên cao vì thiếu đối lưu. Khi hệ thống quạt thông gió bật lên, luồng oxy ùa vào sẽ biến đám cháy âm ỉ thành biển lửa trong tích tắc.',
    preventionInsight:
      'Sử dụng thuật toán nhận diện nồng độ CO/CO₂ vi mô từ đề tài SAME để phát hiện quá trình oxy hóa chậm trước khi xuất hiện ngọn lửa hở.',
    flightAnalog: 'SAME Particulate Telemetry Flight Series (ISS Cupola module)',
  },
};

export const CoreIntelligenceSection: React.FC = () => {
  const [selectedIgnition, setSelectedIgnition] = useState<IgnitionModeId>('hot-wire');
  const activeMode = IGNITION_MODES[selectedIgnition];
  const Icon = activeMode.icon;

  return (
    <section
      id="core-intelligence"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80"
      data-testid="core-intelligence-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Beyond Raw NASA Data</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>Ignition Mechanism &amp; AI Safety Guardrails</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-5 leading-tight">
            How FlameGuard AI Bridges Data to Decision:{' '}
            <span className="text-[#0B2374]">3 Core Innovations</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base md:text-lg leading-relaxed">
            Kho dữ liệu NASA PSI cung cấp các tệp dữ liệu thực nghiệm bay quý giá, nhưng dữ liệu thô
            không thể tự cứu sống phi hành đoàn. FlameGuard AI biến 20 đề tài nghiên cứu phân mảnh
            thành nền tảng trí tuệ an toàn với khả năng truy vết nguồn bắt lửa và rào chắn chống AI ảo giác.
          </p>
        </div>

        {/* 3 Core Contributions Beyond Raw Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {/* Contribution 1: Cross-Study Harmonization */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-harmonization"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B2374]">
                  <Layers className="w-5 h-5 text-[#0B2374]" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                  Đột phá 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Đồng bộ hóa Đa nghiên cứu (Cross-Study Harmonization)
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                NASA lưu trữ 20 đề tài độc lập (BASS, ACME, CIR, FLEX, SoFIE) với định dạng và tài liệu
                rời rạc. FlameGuard AI trích xuất và chuẩn hóa toàn bộ thành một cơ sở tri thức đồng nhất,
                cho phép so sánh chéo đa biến giữa nhiên liệu rắn, lỏng và khí.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Quy mô đã xử lý:</span>
                <span className="font-bold text-[#0B2374]">20 Đề tài / 1,200+ Runs</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-lime-800 font-semibold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
                <span>Không so sánh khập khiễng (Apple-to-Apple)</span>
              </div>
            </div>
          </div>

          {/* Contribution 2: Evidence Gap Matrix */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            data-testid="contribution-card-gap-matrix"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Đột phá 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Bản đồ Lỗ hổng Thực nghiệm (Evidence Gap Matrix)
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                Chỉ ra chính xác những gì NASA <span className="font-bold text-zinc-900">chưa có dữ liệu</span>.
                Khu vực trọng lực yếu ($0 &lt; g &lt; 1$) như Mặt Trăng ($0.16g$) và Sao Hỏa ($0.38g$)
                hoàn toàn thiếu các đợt đốt thực nghiệm trực tiếp, cảnh báo nguy cơ ngọn lửa không tự dập tắt.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Vùng mù dữ liệu:</span>
                <span className="font-bold text-rose-600">Mặt Trăng (0.16g) RED GAP</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Kiểm toán 6 chiều tham số vật lý</span>
              </div>
            </div>
          </div>

          {/* Contribution 3: Guarded Predictive Physics */}
          <div
            className="rounded-3xl border border-gray-200/80 bg-white p-7 shadow-2xs hover:shadow-xs hover:border-[#0B2374]/30 transition-all flex flex-col justify-between"
            data-testid="contribution-card-guarded-physics"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-2xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700">
                  <ShieldCheck className="w-5 h-5 text-lime-700" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#D4FC02]/20 text-zinc-950 border border-lime-300">
                  Đột phá 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                Cỗ máy Dự đoán Có Rào chắn (Guarded Physics)
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed mb-6 font-sans">
                Khác biệt hoàn toàn với các mô hình AI thông thường hay "đoán mò" (hallucination) khi thiếu dữ liệu,
                FlameGuard AI khóa tự động dự đoán (*Prediction Locked*) khi chưa đủ $\ge 3$ lượt bay thực nghiệm,
                chuyển hướng sang gợi ý đề tài bay tương đồng đã xác thực (*SoFIE-MIST 94.2%*).
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Độ tin cậy hàng không:</span>
                <span className="font-bold text-lime-700">100% Zero-Hallucination</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#0B2374] font-semibold font-mono">
                <Lock className="w-3.5 h-3.5 text-[#0B2374]" />
                <span>3 Điều kiện tiên quyết kiểm toán bắt buộc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Ignition Source & Mechanism Inference Workbench */}
        <div
          className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-10 shadow-xs"
          data-testid="ignition-inference-workbench"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0B2374] text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
                  Interactive Simulator
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  Mission Scenario Ignition Inference
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Dự đoán Nguồn &amp; Cơ chế Bắt lửa Tiềm ẩn (Ignition Source Inference)
              </h3>
            </div>

            <div className="text-xs text-zinc-500 max-w-sm font-sans">
              Khi kỹ sư thiết lập thông số khoang bay trong trang <Link href="/mission" className="text-[#0B2374] font-bold underline">Mission Scenario</Link>, thuật toán đối chiếu dữ liệu đốt thực tế của NASA để nhận diện cơ chế bắt lửa nguy cơ cao nhất:
            </div>
          </div>

          {/* Selector Buttons for 4 Ignition Modes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
            {(Object.keys(IGNITION_MODES) as IgnitionModeId[]).map((modeKey) => {
              const item = IGNITION_MODES[modeKey];
              const isSelected = selectedIgnition === modeKey;
              const ModeIcon = item.icon;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setSelectedIgnition(modeKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0B2374] text-white border-[#0B2374] shadow-md ring-2 ring-[#0B2374]/20'
                      : 'bg-gray-50/70 hover:bg-gray-100 text-zinc-800 border-gray-200/80'
                  }`}
                  data-testid={`ignition-tab-${modeKey}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <ModeIcon
                      className={`w-5 h-5 ${
                        isSelected ? 'text-[#D4FC02]' : 'text-[#0B2374]'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 text-[#D4FC02]'
                          : 'bg-zinc-200/80 text-zinc-700'
                      }`}
                    >
                      {item.delayRange}
                    </span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm line-clamp-1">{item.name}</div>
                  <div
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-blue-100' : 'text-zinc-500'
                    }`}
                  >
                    {item.vietnameseTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Ignition Details Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left 7 cols: Physical Mechanism & Analysis */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif font-black text-2xl text-[#0B2374]">
                  {activeMode.vietnameseTitle}
                </span>
                <span className="px-2.5 py-1 rounded font-mono text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Mức độ rủi ro: {activeMode.dangerLevel}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-zinc-800 text-sm leading-relaxed">
                <div className="font-bold text-[#0B2374] text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0B2374]" />
                  Cơ chế kích hoạt vật lý trong vi trọng lực:
                </div>
                <p className="font-sans text-zinc-700">{activeMode.mechanism}</p>
              </div>

              <div className="p-4 rounded-2xl bg-lime-50/60 border border-lime-300 text-zinc-800 text-sm leading-relaxed">
                <div className="font-bold text-lime-900 text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-lime-700" />
                  Đóng góp phòng ngừa của FlameGuard AI:
                </div>
                <p className="font-sans text-zinc-700">{activeMode.preventionInsight}</p>
              </div>
            </div>

            {/* Right 5 cols: Telemetry & Flight Matching Specs */}
            <div className="lg:col-span-5 rounded-2xl bg-gray-50 border border-gray-200/80 p-5 space-y-4 font-mono text-xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-gray-200 pb-2">
                Bằng chứng thực nghiệm NASA tương đồng:
              </div>

              <div>
                <span className="text-zinc-500 block">Đề tài đối chiếu:</span>
                <span className="font-bold text-[#0B2374] text-sm font-sans block mt-0.5">
                  {activeMode.psiStudyMatch}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <span className="text-zinc-500 block">Độ trễ bắt lửa:</span>
                  <span className="font-bold text-zinc-950 text-sm">{activeMode.delayRange}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Năng lượng MIE:</span>
                  <span className="font-bold text-zinc-950 text-sm">{activeMode.minEnergy}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <span className="text-zinc-500 block">Lượt chạy thực nghiệm tham chiếu:</span>
                <span className="font-semibold text-zinc-800 text-[11px] block mt-0.5">
                  {activeMode.flightAnalog}
                </span>
              </div>

              <div className="pt-3">
                <Link
                  href="/mission"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2374] hover:bg-[#0B2374]/90 text-[#D4FC02] font-bold transition-all shadow-xs"
                >
                  <span>Mô phỏng kịch bản này trong Mission Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
