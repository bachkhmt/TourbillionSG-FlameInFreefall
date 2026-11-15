'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmberStore } from '../../store/useEmberStore';
import type { SceneId } from '../../types';

export type StoryScene = SceneId | 'prologue' | 'strike' | 'drop' | 'atmosphere';

export interface EmberStoryOverlayProps {
  scene?: StoryScene;
  className?: string;
}

interface NarrativeContent {
  eyebrow: string;
  title: string;
  lead: string;
  body?: string;
  telemetryTags: string[];
}

function resolveSceneKey(scene: StoryScene): string {
  switch (scene) {
    case 'prologue':
    case 'scene0-dark':
      return 'prologue';
    case 'strike':
    case 'scene1-weight':
      return 'strike';
    case 'drop':
    case 'scene2-drop':
      return 'drop';
    case 'atmosphere':
    case 'scene3-quiet':
    case 'scene4-oxygen':
      return 'atmosphere';
    case 'scene5-lights':
      return 'extinction';
    case 'scene6-value':
      return 'value';
    case 'scene7-call':
      return 'call';
    default:
      return 'prologue';
  }
}

const NARRATIVES: Record<string, NarrativeContent> = {
  prologue: {
    eyebrow: 'ACT 01 // KHỞI ĐỘNG BUỒNG THỬ NGHIỆM',
    title: 'Trước khi có trọng lực',
    lead: 'Chạm để đánh lửa — Khởi động buồng đốt thử nghiệm ở trạng thái ban đầu.',
    body: 'Trên Trái Đất, ngọn lửa quen thuộc luôn bốc thẳng lên cao nhờ đối lưu khí quyển. Nhưng trong trạng thái rơi tự do, điều gì sẽ xảy ra?',
    telemetryTags: ['GRAVITY: 1.00G', 'CHAMBER: SEALED', 'ATMOSPHERE: 21% O₂', 'IGNITION: STANDBY'],
  },
  strike: {
    eyebrow: 'PHASE 01 // KHÍ QUYỂN MẶT ĐẤT',
    title: 'Ngọn Lửa Trái Đất',
    lead: 'Khí nóng nhẹ hơn dâng lên tạo hiệu ứng ống khói đối lưu. Ngọn lửa giọt nước 1.00g đặc trưng.',
    body: 'Các hạt bồ hóng carbon bị cuốn theo dòng khí đối lưu nóng bỏng, phát ra ánh sáng vàng chói lọi.',
    telemetryTags: ['BUOYANCY: ACTIVE', 'REGIME: CONVECTIVE CHIMNEY', 'GRAVITY: 1.00G', 'SOOT: LUMINESCENT YELLOW'],
  },
  drop: {
    eyebrow: 'PHASE 02 // THÁP RƠI TỰ DO 2.2S',
    title: 'Lực nổi biến mất — Rơi tự do',
    lead: 'Đối lưu sụp đổ hoàn toàn. Ngọn lửa co tròn thành khối cầu xanh thuần khiết.',
    body: 'Khi không còn luồng gió nâng, oxy chỉ có thể khuếch tán chậm rãi theo mọi hướng đẳng hướng.',
    telemetryTags: ['BUOYANCY: 0.00g', 'DIFFUSION-LIMITED', 'REGIME: MICROGRAVITY SPHERICAL', 'SOOT: 0.0 PPM'],
  },
  atmosphere: {
    eyebrow: 'PHASE 03 // NGHỊCH LÝ KHÁM PHÁ VŨ TRỤ',
    title: 'Nghịch Lý Khí Quyển',
    lead: 'Bạn thở vẫn thấy ổn. Ngọn lửa thì không.',
    body: 'Trong môi trường Exploration Atmosphere (34% O₂ ở 56 kPa), áp suất riêng phần O₂ giữ mức normoxic 19 kPa để bảo vệ phổi, nhưng nồng độ O₂ cao đẩy vận tốc lan truyền ngọn lửa vượt xa ngưỡng an toàn.',
    telemetryTags: ['DIFFUSION-LIMITED', 'ppO₂: 19.0 kPa (NORMOXIC)', 'O₂ CONC: 34%', 'FLAMMABILITY: CRITICAL'],
  },
  extinction: {
    eyebrow: 'PHASE 04 // GIỚI HẠN TUYỆT DIỆT',
    title: 'Tuyệt Diệt & Tàn Nhiệt Hồng Ngoại',
    lead: 'Ngọn lửa mắt thường nhìn thấy lịm dần, nhưng vùng phản ứng vô hình vẫn âm ỉ tỏa nhiệt trong không gian hẹp.',
    body: 'Bức xạ làm lạnh và nghẽn khuếch tán oxy khiến ngọn lửa tắt về mặt quang học, song đám mây khí nóng vẫn là mối đe dọa cháy âm thầm.',
    telemetryTags: ['VISUAL: EXTINCT', 'IR SIGNATURE: RESIDUAL', 'COOLING: RADIATIVE', 'DETECTION: CRITICAL'],
  },
  value: {
    eyebrow: 'ACT 02 // TRÍ TUỆ BẢO VỆ SINH MẠNG',
    title: 'Hệ Trí Tuệ Phòng Vệ Lửa Vũ Trụ',
    lead: 'FlameGuard AI chuyển hóa vật lý rơi tự do thành hệ thống bảo vệ sinh mạng quỹ đạo thời gian thực.',
    body: 'Phân tích đa bước sóng, dự đoán vùng lan truyền vi trọng lực và tự động điều phối hệ thống chữa cháy trạm không gian.',
    telemetryTags: ['AI CORE: ONLINE', 'DROP TOWER DATA: 100%', 'PREDICTION: ACTIVE', 'SAFETY: 99.98%'],
  },
  call: {
    eyebrow: 'ACT 03 // PHÒNG ĐIỀU HÀNH SỨ MỆNH',
    title: 'Khởi Kích Buồng Điều Khiển',
    lead: 'Bước vào trung tâm telemetry và mô phỏng cháy vi trọng lực cùng FlameGuard AI.',
    body: 'Khám phá các bộ dữ liệu NASA Space Apps Challenge và cấu hình buồng khí thở thông minh ngay hôm nay.',
    telemetryTags: ['TELEMETRY: LIVE', 'MISSION: EMBER ZERO', 'STATUS: NOMINAL', 'READY TO LAUNCH'],
  },
};

export const EmberStoryOverlay: React.FC<EmberStoryOverlayProps> = ({ scene, className = '' }) => {
  const activeScene = useEmberStore((state) => state.activeScene);
  const resolvedScene = scene ?? activeScene;
  const activeSceneKey = resolveSceneKey(resolvedScene);
  const currentNarrative = NARRATIVES[activeSceneKey] || NARRATIVES.prologue;

  return (
    <div
      data-testid="ember-story-overlay"
      className={`pointer-events-none relative z-10 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col justify-end min-h-[220px] md:min-h-[280px] text-white ${className}`}
    >
      <AnimatePresence>
        <motion.div
          key={activeSceneKey}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col gap-3"
        >
          {/* Eyebrow / Meta tag */}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4FC02] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#D4FC02] drop-shadow-[0_0_8px_rgba(212,252,2,0.4)]">
              {currentNarrative.eyebrow}
            </span>
          </div>

          {/* Heading with editorial serif */}
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight drop-shadow-md">
            {currentNarrative.title}
          </h2>

          {/* Lead subtitle */}
          <p className="font-sans text-base md:text-xl text-slate-200 font-light leading-relaxed max-w-2xl drop-shadow">
            {currentNarrative.lead}
          </p>

          {/* Optional editorial body context */}
          {currentNarrative.body && (
            <p className="font-sans text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl">
              {currentNarrative.body}
            </p>
          )}

          {/* Monospace Telemetry Metadata Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {currentNarrative.telemetryTags.map((tag, idx) => (
              <span
                key={idx}
                data-testid="telemetry-tag"
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 font-mono text-[11px] md:text-xs uppercase tracking-widest text-[#D4FC02] shadow-sm backdrop-blur-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
