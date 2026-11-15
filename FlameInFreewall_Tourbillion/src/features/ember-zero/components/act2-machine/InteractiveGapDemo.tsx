'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Flame,
  Wind,
  Gauge,
  Thermometer,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

export type EnvironmentId = 'earth' | 'iss' | 'moon' | 'mars';

export interface EnvironmentConfig {
  id: EnvironmentId;
  name: string;
  gravityLabel: string;
  gravityValue: number;
  pressure: string;
  o2Pct: string;
  flowVelocity: string;
  status: 'VERIFIED' | 'MATCH' | 'CRITICAL GAP' | 'PARTIAL';
  statusLabel: string;
  isGap: boolean;
  explanation: string;
  dimensions: {
    dimension: string;
    icon: string;
    value: string;
    status: 'MATCH' | 'PARTIAL' | 'GAP';
    dataset: string;
  }[];
}

const ENVIRONMENTS: Record<EnvironmentId, EnvironmentConfig> = {
  earth: {
    id: 'earth',
    name: 'Trái Đất (1.00g)',
    gravityLabel: '1.00g',
    gravityValue: 1.0,
    pressure: '101.3 kPa (14.7 psia)',
    o2Pct: '20.9% O₂',
    flowVelocity: '0.05 - 1.2 m/s (Đối lưu tự nhiên)',
    status: 'VERIFIED',
    statusLabel: 'DỮ LIỆU ĐÃ KIỂM CHỨNG',
    isGap: false,
    explanation: 'Hơn 50+ năm nghiên cứu tiêu chuẩn NFPA/NASA mặt đất. Dữ liệu đối lưu hoàn chỉnh và độ tin cậy thực nghiệm 100%.',
    dimensions: [
      { dimension: 'Trọng lực (Gravity)', icon: 'globe', value: '1.00g', status: 'MATCH', dataset: 'NASA STD-6001B / ASTM' },
      { dimension: 'Áp suất (Pressure)', icon: 'gauge', value: '101.3 kPa', status: 'MATCH', dataset: 'Sea Level Baseline' },
      { dimension: 'Nồng độ O₂ (Oxygen)', icon: 'flame', value: '20.9%', status: 'MATCH', dataset: 'Ambient Atmospheric' },
      { dimension: 'Vận tốc dòng khí (Flow Velocity)', icon: 'wind', value: 'Buoyant Chimney', status: 'MATCH', dataset: 'Natural Convection' },
      { dimension: 'Nhiệt độ buồng (Chamber Temp)', icon: 'thermometer', value: '298 K (25°C)', status: 'MATCH', dataset: 'Standard Ambient' },
      { dimension: 'Vật liệu (Material)', icon: 'layers', value: 'PMMA / Nomex / Cotton', status: 'MATCH', dataset: 'Comprehensive Library' },
    ],
  },
  iss: {
    id: 'iss',
    name: 'ISS (0.00g)',
    gravityLabel: '0.00g',
    gravityValue: 0.0,
    pressure: '101.3 kPa (14.7 psia)',
    o2Pct: '21.0% O₂',
    flowVelocity: '0.0 - 0.2 m/s (Ventilation)',
    status: 'MATCH',
    statusLabel: 'DỮ LIỆU ĐÃ KIỂM CHỨNG (MATCH)',
    isGap: false,
    explanation: 'NASA PSI Database với hơn 1,200+ lượt thử nghiệm thực tế từ BASS-II, CIR/FLEX, SoFIE trên Trạm Vũ trụ Quốc tế.',
    dimensions: [
      { dimension: 'Trọng lực (Gravity)', icon: 'globe', value: '0.00g (Microgravity)', status: 'MATCH', dataset: 'NASA CIR / BASS-II / SoFIE' },
      { dimension: 'Áp suất (Pressure)', icon: 'gauge', value: '101.3 kPa', status: 'MATCH', dataset: 'ISS Cabin Atmosphere' },
      { dimension: 'Nồng độ O₂ (Oxygen)', icon: 'flame', value: '21.0%', status: 'MATCH', dataset: 'ISS Life Support ECLS' },
      { dimension: 'Vận tốc dòng khí (Flow Velocity)', icon: 'wind', value: '0.00 - 0.15 m/s', status: 'MATCH', dataset: 'Forced Quiescent Flow' },
      { dimension: 'Nhiệt độ buồng (Chamber Temp)', icon: 'thermometer', value: '295 - 305 K', status: 'MATCH', dataset: 'CIR Combustion Chamber' },
      { dimension: 'Vật liệu (Material)', icon: 'layers', value: 'Cotton-Fiberglass / PMMA', status: 'MATCH', dataset: 'BASS-II / MIST Samples' },
    ],
  },
  moon: {
    id: 'moon',
    name: 'Mặt Trăng (0.16g)',
    gravityLabel: '0.16g',
    gravityValue: 0.16,
    pressure: '56.0 kPa (8.2 psia)',
    o2Pct: '34.0% O₂',
    flowVelocity: '0.05 m/s (Exploration Habitat)',
    status: 'CRITICAL GAP',
    statusLabel: 'LỖ HỔNG THỰC NGHIỆM ĐỎ (CRITICAL GAP)',
    isGap: true,
    explanation: 'CẢNH BÁO: NASA chưa có lượt đốt thực nghiệm trực tiếp trên bề mặt Mặt Trăng (no direct Lunar surface burn runs in PSI dataset). Dữ liệu 0.16g hoàn toàn vắng bóng trong kho mẫu vi trọng lực.',
    dimensions: [
      { dimension: 'Trọng lực (Gravity)', icon: 'globe', value: '0.16g (Lunar Gravity)', status: 'GAP', dataset: 'NO DIRECT NASA DATA (CRITICAL GAP)' },
      { dimension: 'Áp suất (Pressure)', icon: 'gauge', value: '56.0 kPa (8.2 psia)', status: 'PARTIAL', dataset: 'Analogous Ground Chambers Only' },
      { dimension: 'Nồng độ O₂ (Oxygen)', icon: 'flame', value: '34.0% O₂ (Normoxic)', status: 'PARTIAL', dataset: 'Exploration Atmosphere Tests' },
      { dimension: 'Vận tốc dòng khí (Flow Velocity)', icon: 'wind', value: '0.05 m/s habitat fan', status: 'GAP', dataset: 'Estimated / Unverified 0.16g' },
      { dimension: 'Nhiệt độ buồng (Chamber Temp)', icon: 'thermometer', value: '293 K', status: 'MATCH', dataset: 'Habitat Thermal Control Target' },
      { dimension: 'Vật liệu (Material)', icon: 'layers', value: 'Artemis Spacesuit Fabrics', status: 'PARTIAL', dataset: 'SoFIE-MIST Baseline Match' },
    ],
  },
  mars: {
    id: 'mars',
    name: 'Sao Hỏa (0.38g)',
    gravityLabel: '0.38g',
    gravityValue: 0.38,
    pressure: '56.0 kPa (8.2 psia)',
    o2Pct: '32.0% O₂',
    flowVelocity: '0.10 m/s',
    status: 'CRITICAL GAP',
    statusLabel: 'LỖ HỔNG THỰC NGHIỆM ĐỎ (CRITICAL GAP)',
    isGap: true,
    explanation: 'CẢNH BÁO: Không có dữ liệu đốt thực nghiệm 0.38g sao Hỏa trong hệ cơ sở dữ liệu NASA PSI. Mọi mô hình lan truyền lửa đều chỉ là giả thuyết ngoại suy.',
    dimensions: [
      { dimension: 'Trọng lực (Gravity)', icon: 'globe', value: '0.38g (Martian Gravity)', status: 'GAP', dataset: 'NO DIRECT NASA DATA (CRITICAL GAP)' },
      { dimension: 'Áp suất (Pressure)', icon: 'gauge', value: '56.0 kPa (Habitat)', status: 'PARTIAL', dataset: 'Exploration Standards' },
      { dimension: 'Nồng độ O₂ (Oxygen)', icon: 'flame', value: '32.0%', status: 'PARTIAL', dataset: 'Habitat Gas Blend' },
      { dimension: 'Vận tốc dòng khí (Flow Velocity)', icon: 'wind', value: '0.10 m/s', status: 'GAP', dataset: 'Simulated Only' },
      { dimension: 'Nhiệt độ buồng (Chamber Temp)', icon: 'thermometer', value: '295 K', status: 'MATCH', dataset: 'Life Support Controlled' },
      { dimension: 'Vật liệu (Material)', icon: 'layers', value: 'Mars Mission Composites', status: 'PARTIAL', dataset: 'Terrestrial Testing Only' },
    ],
  },
};

export interface InteractiveGapDemoProps {
  className?: string;
  defaultEnv?: EnvironmentId;
  onSelectEnv?: (env: EnvironmentId) => void;
}

export const InteractiveGapDemo: React.FC<InteractiveGapDemoProps> = ({
  className = '',
  defaultEnv = 'moon',
  onSelectEnv,
}) => {
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentId>(defaultEnv);
  const current = ENVIRONMENTS[selectedEnv];

  const handleSelect = (env: EnvironmentId) => {
    setSelectedEnv(env);
    onSelectEnv?.(env);
  };

  return (
    <div
      data-testid="interactive-gap-demo"
      className={`w-full rounded-xl border border-[#0B2374]/20 bg-[#F8F9FA] text-[#0B2374] p-4 sm:p-6 shadow-sm font-sans ${className}`}
    >
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#0B2374]/15 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[#0B2374]/70">
            <Database className="w-3.5 h-3.5 text-[#0B2374]" />
            MODULE 02 // EVIDENCE GAP MATRIX
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374] mt-0.5">
            Bản Đồ Lỗ Hổng Thực Nghiệm 6 Chiều
          </h3>
        </div>

        {/* Status Badge */}
        <div
          data-testid="gap-status-badge"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
            current.isGap
              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              : 'bg-lime-100 text-lime-900 border border-lime-300'
          }`}
        >
          {current.isGap ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-lime-700" />
          )}
          <span>{current.statusLabel}</span>
        </div>
      </div>

      {/* Interactive Environment Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(ENVIRONMENTS) as EnvironmentId[]).map((envKey) => {
          const env = ENVIRONMENTS[envKey];
          const isActive = selectedEnv === envKey;
          return (
            <button
              key={envKey}
              type="button"
              onClick={() => handleSelect(envKey)}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#0B2374] text-white border-[#0B2374] shadow-sm ring-2 ring-[#0B2374]/20'
                  : 'bg-white hover:bg-slate-100 text-[#0B2374] border-[#0B2374]/20'
              }`}
            >
              <span>{env.name}</span>
              {env.isGap && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </button>
          );
        })}
      </div>

      {/* Critical Gap Explanation Box */}
      <div
        className={`mt-4 p-4 rounded-lg border text-sm leading-relaxed ${
          current.isGap
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-blue-50/70 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {current.isGap ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-lime-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{current.explanation}</p>
            {current.isGap && (
              <p className="mt-1 text-xs font-mono text-rose-800">
                CRITICAL GAP: Dữ liệu NASA Physical Science Informatics (PSI) ghi nhận 20 nghiên cứu vi trọng lực (0.00g) và mặt đất (1.00g). Mặt Trăng chưa có dữ liệu đốt thực nghiệm trực tiếp.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6-Dimension Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {current.dimensions.map((dim, idx) => {
          const isGapDim = dim.status === 'GAP';
          const isPartialDim = dim.status === 'PARTIAL';
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border bg-white transition-all ${
                isGapDim
                  ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300'
                  : isPartialDim
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-[#0B2374]/15 hover:border-[#0B2374]/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[#0B2374]/80">{dim.dimension}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isGapDim
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isPartialDim
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-lime-100 text-lime-900 border border-lime-300'
                  }`}
                >
                  {dim.status}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold font-serif text-[#0B2374]">
                {dim.value}
              </div>
              <div className="mt-1 text-[11px] font-mono text-slate-500 truncate">
                Nguồn: {dim.dataset}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Tagline */}
      <div className="mt-4 pt-3 border-t border-dashed border-[#0B2374]/15 flex items-center justify-between text-xs font-mono text-[#0B2374]/70">
        <span>KẾT LUẬN KIỂM ĐỊNH: {current.isGap ? 'CẦN THẬN TRỌNG CAO ĐỘ' : 'DỮ LIỆU ĐỦ ĐIỀU KIỆN TRA CỨU'}</span>
        <span className="font-semibold italic font-serif">"Nhiều thứ ta đã biết. Một thứ ta chưa từng thử."</span>
      </div>
    </div>
  );
};
