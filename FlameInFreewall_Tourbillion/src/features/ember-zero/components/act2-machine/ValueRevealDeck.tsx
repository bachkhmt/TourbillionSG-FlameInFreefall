'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Download,
  Database,
  GitCompare,
  ShieldCheck,
  Globe2,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Scale,
} from 'lucide-react';
import { InteractiveGapDemo } from './InteractiveGapDemo';
import { LockedPredictiveDemo } from './LockedPredictiveDemo';
import type { ValueBeat } from '../../types';

export const VALUE_BEATS: ValueBeat[] = [
  {
    id: 'beat-1',
    stepNumber: 1,
    title: '01 Tro tàn -> Kho tàng',
    subtitle: 'Từ đống tro tàn dữ liệu rời rạc đến kho tàng tri thức có cấu trúc',
    problem: 'Hàng ngàn giờ thí nghiệm cháy vi trọng lực của NASA bị phân mảnh qua nhiều thập kỷ trong các báo cáo PDF tĩnh và video lưu trữ cũ.',
    solution: 'FlameGuard AI số hóa, chuẩn hóa và lập chỉ mục toàn bộ 20 nghiên cứu NASA Physical Science Informatics (PSI) với hơn 1,200+ lượt thử nghiệm.',
    verifiedBenefit: 'Truy xuất tham số cháy vi trọng lực với độ trễ <2s thay vì mất nhiều tuần tra cứu tài liệu thủ công.',
    tag: 'DIGITAL ARCHIVE',
  },
  {
    id: 'beat-2',
    stepNumber: 2,
    title: '02 Chòm sao so sánh',
    subtitle: 'So sánh đa nghiên cứu trực quan — Không bao giờ so táo với cam',
    problem: 'Các thí nghiệm vũ trụ có điều kiện biên hoàn toàn khác nhau (áp suất, oxy, vận tốc khí). So sánh sai lệch dẫn đến kết luận thảm họa.',
    solution: 'Comparison Dock thông minh đánh giá Comparability Assessment, tự động cảnh báo khi hai nghiên cứu lệch điều kiện biên vật lý.',
    verifiedBenefit: 'Đối chiếu chéo 3 nghiên cứu cùng lúc với biểu đồ chuẩn hóa và cảnh báo tính tương thích tự động.',
    tag: 'COMPARISON DOCK',
  },
  {
    id: 'beat-3',
    stepNumber: 3,
    title: '03 Bản đồ lỗ hổng',
    subtitle: 'Ma trận khoảng trống 6 chiều — Nhìn rõ điều nhân loại chưa biết',
    problem: 'Nhiều hệ thống AI tự tin dự đoán sự lan truyền ngọn lửa trên Mặt Trăng mà không hề biết rằng nhân loại chưa từng đốt mẫu ở 0.16g.',
    solution: 'Evidence Gap Matrix quét 6 chiều tham số: Trọng lực, Áp suất, Nồng độ O₂, Dòng khí, Nhiệt độ, Vật liệu để gắn cờ đỏ những vùng trắng dữ liệu.',
    verifiedBenefit: 'Cảnh báo đỏ tức thời trước bất kỳ kịch bản nào chưa có dữ liệu thực nghiệm kiểm chứng.',
    tag: 'GAP MATRIX',
  },
  {
    id: 'beat-4',
    stepNumber: 4,
    title: '04 So khớp SoFIE-MIST',
    subtitle: 'Tìm kiếm thí nghiệm tương đồng gần nhất thay vì suy đoán liều',
    problem: 'Khi đối mặt với kịch bản mới (như Lunar Habitat), phi hành đoàn cần cơ sở khoa học đáng tin cậy chứ không phải con số ảo sinh bởi LLM.',
    solution: 'Thuật toán So khớp Tương đồng tìm ra nghiên cứu SoFIE-MIST (94.2% độ tương quan) với cơ chế mồi nhiệt bức xạ và dây nhiệt tương tự.',
    verifiedBenefit: 'Cung cấp số đo thực nghiệm có trích dẫn nguồn, kèm khuyến cáo rõ ràng không đánh đồng tương đồng với đồng nhất.',
    tag: 'ANALOGOUS MATCH',
  },
  {
    id: 'beat-5',
    stepNumber: 5,
    title: '05 Cỗ máy trung thực',
    subtitle: 'Bộ khóa dự đoán — Dũng cảm nói "Tôi không biết" khi thiếu dữ liệu',
    problem: 'AI thông thường luôn cố đưa ra câu trả lời dù không có dữ liệu, tạo ra ảo giác an toàn chết người trong môi trường không gian.',
    solution: 'Cơ chế Guarded Prediction kích hoạt ổ khóa đỏ khi không thỏa mãn đủ 3 điều kiện tiên quyết: bảo toàn vật lý, dữ liệu tương đồng, biên sai số.',
    verifiedBenefit: 'Một hệ thống AI trung thực bảo vệ sinh mạng phi hành gia: DỮ LIỆU CHƯA ĐỦ ĐỂ ĐOÁN LIỀU.',
    tag: 'GUARDED PREDICTION',
  },
  {
    id: 'beat-6',
    stepNumber: 6,
    title: '06 Về Trái Đất',
    subtitle: 'Ứng dụng sinh mạng mặt đất từ di sản an toàn hỏa hoạn vũ trụ',
    problem: 'Công nghệ an toàn không gian thường bị xem là xa vời và không áp dụng được vào đời sống thực tế thường nhật.',
    solution: 'Chuyển giao tri thức vi trọng lực: van chống rò bình sương nước cao áp, cảm biến khói nano SAME cho tàu ngầm, và thiết bị thở cho lính cứu hỏa.',
    verifiedBenefit: 'Bảo vệ hàng triệu người lao động và lực lượng cứu hộ trên Trái Đất từ các phát minh buồng đốt vũ trụ.',
    tag: 'EARTH SPINOFFS',
  },
];

export interface ValueRevealDeckProps {
  className?: string;
  defaultBeat?: number; // 0 to 5
}

export const ValueRevealDeck: React.FC<ValueRevealDeckProps> = ({
  className = '',
  defaultBeat = 0,
}) => {
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(defaultBeat);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currentBeat = VALUE_BEATS[activeBeatIndex];

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  };

  return (
    <section
      data-testid="value-reveal-deck"
      className={`w-full max-w-7xl mx-auto px-4 py-12 sm:py-20 font-sans text-[#0B2374] ${className}`}
    >
      {/* Deck Header & System Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#0B2374]/15">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0B2374]/10 text-xs font-mono font-bold uppercase tracking-widest text-[#0B2374]">
            <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
            ACT 02 // 6 VALUE BEATS
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#0B2374] mt-2">
            Hệ Trí Tuệ Phòng Vệ Lửa Vi Trọng Lực
          </h2>
          <p className="mt-2 text-base text-slate-600 max-w-2xl font-sans">
            Sáu trụ cột chuyển hóa vật lý rơi tự do thành hệ thống an toàn quỹ đạo chuẩn mực khoa học.
          </p>
        </div>

        {/* Master Metrics Counter Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-[#0B2374]/20 shadow-sm">
          <div className="pr-3 sm:pr-4 border-r border-[#0B2374]/15">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2374]">20</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Nghiên cứu NASA PSI
            </div>
          </div>

          <div className="pr-3 sm:pr-4 border-r border-[#0B2374]/15">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2374]">1,200+</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Lượt thử nghiệm thực tế
            </div>
          </div>

          <div className="pr-3 sm:pr-4 border-r border-[#0B2374]/15">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2374]">&lt;2s</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Độ trễ truy xuất tri thức
            </div>
          </div>

          {/* CSV Export Button Preview */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B2374] text-[#D4FC02] font-mono text-xs font-semibold uppercase tracking-wider hover:bg-[#0B2374]/90 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất CSV'}</span>
          </button>
        </div>
      </div>

      {/* 6 Beats Horizontal Navigation Tabs */}
      <div
        role="tablist"
        aria-label="6 Value Beats Tabs"
        className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {VALUE_BEATS.map((beat, idx) => {
          const isActive = activeBeatIndex === idx;
          return (
            <button
              key={beat.id}
              role="tab"
              id={`beat-tab-${idx}`}
              aria-selected={isActive}
              aria-controls={`beat-panel-${idx}`}
              type="button"
              onClick={() => setActiveBeatIndex(idx)}
              className={`shrink-0 px-4 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#0B2374] text-white border-[#0B2374] shadow-md ring-2 ring-[#0B2374]/20'
                  : 'bg-white hover:bg-slate-100 text-[#0B2374] border-[#0B2374]/20'
              }`}
            >
              <span>{beat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Beat Content Showcase */}
      <div
        id={`beat-panel-${activeBeatIndex}`}
        role="tabpanel"
        aria-labelledby={`beat-tab-${activeBeatIndex}`}
        className="mt-6"
      >
        <div key={currentBeat.id} className="space-y-6">
          {/* Beat Header Card */}
          <div className="p-6 rounded-xl border border-[#0B2374]/20 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-2.5 py-1 rounded bg-[#0B2374] text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
                BEAT {currentBeat.stepNumber} // {currentBeat.tag}
              </span>
              <span className="text-xs font-mono text-slate-500">
                TIÊU CHUẨN XÁC THỰC: NASA PHYSICAL SCIENCE INFORMATICS
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2374] mt-3">
              {currentBeat.title}: {currentBeat.subtitle}
            </h3>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-4 border-t border-[#0B2374]/15">
              <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200">
                <div className="text-xs font-mono font-bold text-rose-800 uppercase mb-1">THÁCH THỨC VẬT LÝ</div>
                <p className="text-rose-950 text-xs sm:text-sm leading-relaxed">{currentBeat.problem}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/50 border border-blue-200">
                <div className="text-xs font-mono font-bold text-blue-800 uppercase mb-1">GIẢI PHÁP FLAMEGUARD AI</div>
                <p className="text-blue-950 text-xs sm:text-sm leading-relaxed">{currentBeat.solution}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-lime-50/50 border border-lime-200">
                <div className="text-xs font-mono font-bold text-lime-800 uppercase mb-1">LỢI ÍCH ĐÃ KIỂM CHỨNG</div>
                <p className="text-lime-950 text-xs sm:text-sm leading-relaxed">{currentBeat.verifiedBenefit}</p>
              </div>
            </div>
          </div>

          {/* Embedded Live Interactive Demos */}
          {activeBeatIndex === 2 && (
            <div className="mt-6">
              <InteractiveGapDemo />
            </div>
          )}

          {activeBeatIndex === 4 && (
            <div className="mt-6">
              <LockedPredictiveDemo />
            </div>
          )}

          {/* Static Rich Previews for Beats 1, 2, 4, 6 */}
          {activeBeatIndex === 0 && (
            <div className="p-6 rounded-xl border border-[#0B2374]/20 bg-white">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B2374]/70 mb-3">
                KHO BẰNG CHỨNG NASA PSI ĐÃ ĐƯỢC CHUẨN HÓA
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-bold text-[#0B2374]">BASS-II</div>
                  <div className="text-slate-500 mt-1">42 test runs (0.00g)</div>
                  <div className="text-[11px] text-lime-700 mt-1">✓ Đã lập chỉ mục</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-bold text-[#0B2374]">CIR / FLEX</div>
                  <div className="text-slate-500 mt-1">118 droplet burns</div>
                  <div className="text-[11px] text-lime-700 mt-1">✓ Đã lập chỉ mục</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-bold text-[#0B2374]">SoFIE-MIST</div>
                  <div className="text-slate-500 mt-1">36 solid flame tests</div>
                  <div className="text-[11px] text-lime-700 mt-1">✓ Đã lập chỉ mục</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="font-bold text-[#0B2374]">SAME (Sensors)</div>
                  <div className="text-slate-500 mt-1">Particulate telemetry</div>
                  <div className="text-[11px] text-lime-700 mt-1">✓ Đã lập chỉ mục</div>
                </div>
              </div>
            </div>
          )}

          {activeBeatIndex === 1 && (
            <div className="p-6 rounded-xl border border-[#0B2374]/20 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B2374]/70">
                  COMPARISON DOCK // PHÂN TÍCH TƯƠNG ĐỒNG BASS-II vs SoFIE vs CIR
                </h4>
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  CẢNH BÁO: KHÁC ĐIỀU KIỆN ÁP SUẤT
                </span>
              </div>
              <p className="text-sm font-sans text-slate-700 leading-relaxed mb-3">
                "Không so táo với cam." Thuật toán tự động phát hiện khi các bộ dữ liệu có sự sai biệt về dòng khí cưỡng bức hay hình học buồng đốt, ngăn ngừa các kết luận võ đoán.
              </p>
              <div className="text-xs font-mono text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                BASS-II (Flat Sample / Forced 0.1 m/s) ≠ CIR (Spherical Droplet / Quiescent)
              </div>
            </div>
          )}

          {activeBeatIndex === 3 && (
            <div className="p-6 rounded-xl border border-[#0B2374]/20 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B2374]/70">
                  SO KHỚP SOFIE-MIST: 94.2% TƯƠNG ĐỒNG VẬT LÝ
                </h4>
                <span className="text-xs font-mono font-bold text-lime-900 bg-lime-100 px-2 py-0.5 rounded border border-lime-300">
                  XẾP HẠNG 1 TRONG 20 NGHIÊN CỨU
                </span>
              </div>
              <p className="text-sm font-sans text-slate-700 leading-relaxed">
                SoFIE-MIST (Material Ignition and Suppression Test) trên ISS là nghiên cứu gần nhất với điều kiện bắt lửa trong khoang điều áp: sử dụng lò sưởi bức xạ và dây nhiệt dẫn lửa để đo thời gian trễ bắt lửa chính xác.
              </p>
            </div>
          )}

          {activeBeatIndex === 5 && (
            <div className="p-6 rounded-xl border border-[#0B2374]/20 bg-white">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B2374]/70 mb-3">
                DI SẢN TRÁI ĐẤT (EARTH SPINOFFS &amp; RESCUE APPLICATIONS)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-mono font-bold text-[#0B2374]">Van sương nước chống rò</div>
                  <p className="text-slate-600 mt-1">Phát triển cho bình dập cháy sương nước cao áp vi trọng lực, nay ứng dụng trên tàu cao tốc và công nghiệp hóa chất.</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-mono font-bold text-[#0B2374]">Cảm biến khói tàu ngầm SAME</div>
                  <p className="text-slate-600 mt-1">Phát hiện hạt khói kích thước nano trong môi trường tuần hoàn khí kín, chống báo động giả tuyệt đối.</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-mono font-bold text-[#0B2374]">Bình khí &amp; đồ bảo hộ lính cứu hỏa</div>
                  <p className="text-slate-600 mt-1">Di sản vật liệu chịu nhiệt sợi aramid và bình khí composite siêu nhẹ từ chương trình vũ trụ Apollo và Shuttle.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
