'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  FileSearch,
  Scale,
} from 'lucide-react';

export interface LockedPredictiveDemoProps {
  className?: string;
  defaultEnvironment?: 'earth' | 'iss' | 'moon';
  onModeChange?: (mode: 'locked' | 'analogous') => void;
}

export const LockedPredictiveDemo: React.FC<LockedPredictiveDemoProps> = ({
  className = '',
  defaultEnvironment = 'moon',
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'locked' | 'analogous'>('locked');
  const [selectedEnv, setSelectedEnv] = useState<'earth' | 'iss' | 'moon'>(defaultEnvironment);

  const isMoonLocked = selectedEnv === 'moon';

  const handleTabSwitch = (mode: 'locked' | 'analogous') => {
    setActiveTab(mode);
    onModeChange?.(mode);
  };

  return (
    <div
      data-testid="locked-predictive-demo"
      className={`w-full rounded-xl border border-[#0B2374]/20 bg-[#F8F9FA] text-[#0B2374] p-4 sm:p-6 shadow-sm font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#0B2374]/15 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[#0B2374]/70">
            <Scale className="w-3.5 h-3.5 text-[#0B2374]" />
            MODULE 05 // GUARDED PREDICTIVE SIMULATOR
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374] mt-0.5">
            Cỗ Máy Trung Thực — Bộ Khóa Dự Đoán
          </h3>
        </div>

        {/* Lock Status Badge */}
        <div
          data-testid="prediction-lock-badge"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider ${
            isMoonLocked && activeTab === 'locked'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}
        >
          {isMoonLocked && activeTab === 'locked' ? (
            <>
              <Lock className="w-4 h-4 text-rose-600" />
              <span>PREDICTION LOCKED // KHÓA DỰ ĐOÁN</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 text-emerald-600" />
              <span>SOFIE-MIST MATCH // 94.2% SIMILARITY</span>
            </>
          )}
        </div>
      </div>

      {/* Mode Switchers */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabSwitch('locked')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'locked'
                ? 'bg-[#0B2374] text-white border-[#0B2374]'
                : 'bg-white text-[#0B2374] border-[#0B2374]/20 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Kiểm tra điều kiện khóa
          </button>
          <button
            type="button"
            role="button"
            onClick={() => handleTabSwitch('analogous')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analogous'
                ? 'bg-[#0B2374] text-[#D4FC02] border-[#0B2374]'
                : 'bg-white text-[#0B2374] border-[#0B2374]/20 hover:bg-slate-100'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            Chế độ tương đồng SoFIE-MIST (Analogous Match)
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500">
          KỊCH BẢN: <span className="font-bold text-[#0B2374]">Lunar Habitat (0.16g, 34% O₂)</span>
        </div>
      </div>

      {/* View Section */}
      <div className="mt-5">
        {activeTab === 'locked' ? (
          <div className="space-y-4">
            {/* The Honesty Punchline Callout */}
            <div className="p-4 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-950">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-base text-rose-900">
                    Một hệ thống AI trung thực — DỮ LIỆU CHƯA ĐỦ ĐỂ ĐOÁN LIỀU
                  </h4>
                  <p className="mt-1 text-sm font-sans text-rose-800 leading-relaxed">
                    "Điều dũng cảm nhất một trí tuệ nhân tạo có thể nói là: tôi không biết." 
                    Khi chưa có dữ liệu buồng đốt ở 0.16g, thuật toán FlameGuard AI từ chối suy đoán mạo hiểm tính mạng phi hành đoàn.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Prerequisites Checklist */}
            <div className="p-4 rounded-lg bg-white border border-[#0B2374]/15">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B2374]/70 mb-3">
                KIỂM ĐỊNH 3 ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI CHẠY DỰ ĐOÁN (3-PREREQUISITES AUDIT)
              </h5>
              
              <div className="space-y-3">
                {/* Condition 1 */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-[#0B2374]">1. Định luật bảo toàn (Conservation Laws):</span>
                    <span className="text-slate-700 ml-1">
                      Bảo toàn năng lượng, bảo toàn khối lượng và phương trình Navier-Stokes trong môi trường khí quyển kín.
                    </span>
                    <span className="block text-[11px] font-mono text-emerald-700 mt-0.5">
                      ✓ ĐÃ ĐÁP ỨNG — Mô hình hóa vật lý bảo toàn đầy đủ.
                    </span>
                  </div>
                </div>

                {/* Condition 2 */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-rose-50/50 border border-rose-200">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-rose-950">2. Dữ liệu thực nghiệm tương đồng &gt;= 3 runs:</span>
                    <span className="text-slate-700 ml-1">
                      Yêu cầu tối thiểu 3 lượt đốt thực nghiệm trong cùng dải trọng lực 0.16g để hiệu chuẩn sai số.
                    </span>
                    <span className="block text-[11px] font-mono text-rose-700 mt-0.5">
                      ✗ THẤT BẠI — NASA PSI hiện có 0 lượt chạy ở 0.16g bề mặt Mặt Trăng.
                    </span>
                  </div>
                </div>

                {/* Condition 3 */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50/50 border border-amber-200">
                  <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-amber-950">3. Cảnh báo sai số (Uncertainty Margin Warning):</span>
                    <span className="text-slate-700 ml-1">
                      Mức độ tin cậy biên sai số toán học vượt quá ngưỡng cho phép (&gt;45% độ lệch chuẩn).
                    </span>
                    <span className="block text-[11px] font-mono text-amber-800 mt-0.5">
                      ⚠ CẢNH BÁO SAI SỐ — Khóa quyền đưa ra khuyến nghị an toàn dứt khoát.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Analogous SoFIE-MIST Match Card */}
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-300 text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-emerald-900 tracking-wider">
                  THÍ NGHIỆM GẦN NHẤT ĐƯỢC XÁC THỰC
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0B2374] text-[#D4FC02] font-mono text-xs font-bold">
                  94.2% TƯƠNG ĐỒNG SOFIE-MIST
                </span>
              </div>
              <h4 className="mt-2 font-serif font-bold text-lg text-[#0B2374]">
                NASA SoFIE-MIST (Material Ignition and Suppression Test)
              </h4>
              <p className="mt-1 text-sm font-sans text-slate-700 leading-relaxed">
                Thay vì dự đoán bừa bãi, hệ thống tự động tìm và trích xuất nghiên cứu vật lý gần nhất trong kho 20 đề tài NASA PSI để làm đối trọng so sánh khoa học.
              </p>
            </div>

            {/* Scientific Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-lg border border-[#0B2374]/15 bg-white">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase">CƠ CHẾ BẮT LỬA KHẢO SÁT</div>
                <div className="font-semibold text-[#0B2374] mt-1 font-serif">
                  Lò sưởi bức xạ cộng dây nhiệt dẫn lửa
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Khảo sát sự mồi cháy của mẫu vật dưới bức xạ nhiệt điều khiển và dây nhiệt dẫn lửa cục bộ.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-[#0B2374]/15 bg-white">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase">THỨ NGHIÊN CỨU ĐO LƯỜNG</div>
                <div className="font-semibold text-[#0B2374] mt-1 font-serif">
                  Thời gian trễ bắt lửa &amp; Giới hạn tuyệt diệt
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Đo lường thời gian trễ bắt lửa (ignition delay time) và tốc độ thoái lui của ngọn lửa ở các nồng độ oxy.
                </p>
              </div>
            </div>

            {/* Strict Scientific Disclaimer */}
            <div className="p-3 rounded-md bg-slate-100 border border-slate-300 text-xs font-mono text-slate-700 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>GHI CHÚ KHOA HỌC:</strong> Đây là điều đã được nghiên cứu trên buồng đốt CIR/SoFIE, không phải dự đoán cho kịch bản của bạn. Mọi quyết định thiết kế module Mặt Trăng cần dữ liệu kiểm chứng độc lập.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
