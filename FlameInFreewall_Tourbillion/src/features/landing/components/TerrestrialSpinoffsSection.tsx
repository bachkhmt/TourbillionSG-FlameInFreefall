'use client';

/**
 * TerrestrialSpinoffsSection Component
 * Highlights the translation of NASA microgravity combustion research into life-saving
 * next-generation safety systems and commercial spinoff technologies on Earth:
 * 1. Zero-Leak High-Pressure Water Mist Valves (EV Battery vaults & Data Centers)
 * 2. Early Optical Smoke Sensors (Low-convection underground mines & secure storage)
 * 3. Next-Gen Firefighter Breathing Apparatus & Thermal Textiles (Urban & wildland first responders)
 */

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Droplets,
  Eye,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Activity,
} from 'lucide-react';

interface TerrestrialSpinoff {
  id: string;
  number: string;
  category: string;
  title: string;
  englishTitle: string;
  heritageSource: string;
  environment: string;
  description: string;
  primaryMetric: { value: string; label: string };
  secondaryMetric: { value: string; label: string };
  features: string[];
}

const SPINOFFS: TerrestrialSpinoff[] = [
  {
    id: 'water-mist',
    number: '01',
    category: 'PCCC Pin Lithium & Trung Tâm Dữ Liệu',
    title: 'Van Phun Sương Áp Suất Cao Không Dẫn Điện',
    englishTitle: 'Zero-Leak High-Pressure Water Mist Extinguishing Valve',
    heritageSource: 'NASA CIR / FLEX Droplet Extinction Research',
    environment: 'Kho lưu trữ pin xe điện (EV Lithium-ion), Tàu ngầm & Data Centers',
    description:
      'Nghiên cứu dập lửa giọt chất lỏng trong vi trọng lực đã chứng minh kích thước giọt nước < 50 micron có khả năng hấp thụ nhiệt gấp 7 lần so với vòi phun thông thường. Công nghệ van áp suất cao tạo màn sương vi mô bốc hơi tức thì, dập tắt quá trình thoát nhiệt (thermal runaway) của pin lithium mà không gây ngập nước hay chập cháy linh kiện máy chủ.',
    primaryMetric: { value: '-90%', label: 'Lượng nước tiêu thụ' },
    secondaryMetric: { value: '0.00%', label: 'Rủi ro rò rỉ dẫn điện' },
    features: [
      'Dập tắt đám cháy pin lithium dưới 45 giây',
      'An toàn tuyệt đối cho thiết bị điện hạ thế và cao thế',
      'Được kiểm chuẩn cho không gian kín áp suất cao',
    ],
  },
  {
    id: 'smoke-sensor',
    number: '02',
    category: 'Cảm Biến Khói Không Đối Lưu',
    title: 'Cảm Biến Khói Quang Học Phát Hiện Hạt Muội Sớm',
    englishTitle: 'Early Optical Smoke Detection for Low-Convection Regimes',
    heritageSource: 'NASA SAME (Spacecraft Atmosphere Monitor Experiments)',
    environment: 'Hầm mỏ ngầm sâu, Kho vật liệu hạt nhân, Phòng máy bay kín',
    description:
      'Trên mặt đất, cảm biến khói thông thường phụ thuộc vào luồng khí nóng đối lưu bốc lên trần nhà. Trong hầm mỏ sâu hoặc phòng kín thiếu gió, khói âm ỉ lan tỏa chậm và không chạm tới cảm biến trần. Cảm biến quang phổ đa bước sóng kế thừa từ NASA SAME đo trực tiếp mật độ hạt muội nano lơ lửng trong không khí tĩnh, cảnh báo sớm hơn 3 phút trước khi bùng phát lửa hở.',
    primaryMetric: { value: '+180s', label: 'Cảnh báo sớm hơn' },
    secondaryMetric: { value: '99.4%', label: 'Triệt tiêu báo động giả' },
    features: [
      'Phát hiện khói âm ỉ (smoldering) trong môi trường đối lưu chết',
      'Phân biệt hạt bụi than/độ ẩm với hạt muội cháy thực tế',
      'Độ bền cảm biến trên 10 năm trong môi trường khắc nghiệt',
    ],
  },
  {
    id: 'firefighter-gear',
    number: '03',
    category: 'Thiết Bị Cứu Hỏa Thế Hệ Mới',
    title: 'Bình Dưỡng Khí & Trang Phục Chống Flashover Thế Hệ Mới',
    englishTitle: 'Next-Gen Lightweight SCBA & Flashover Resistant Textiles',
    heritageSource: 'NASA SoFIE-GEL & Material Flammability Standards',
    environment: 'Lực lượng Cứu hỏa Đô thị, Chữa cháy Rừng & Cứu nạn Không gian hẹp',
    description:
      'Các đợt thử nghiệm giới hạn dập tắt (GEL) của sợi dệt trên trạm ISS cung cấp dữ liệu chính xác về nhiệt độ phân hủy polymer dưới các dải áp suất khác nhau. Ứng dụng vật liệu composite sợi carbon tiên tiến và van điều áp không gian giúp chế tạo bình dưỡng khí (SCBA) siêu nhẹ, giảm tải trọng gù lưng và bảo vệ lính cứu hỏa trước hiện tượng bùng cháy toàn diện (flashover).',
    primaryMetric: { value: '-40%', label: 'Trọng lượng bình khí thở' },
    secondaryMetric: { value: '+35%', label: 'Thời gian sống sót an toàn' },
    features: [
      'Vỏ bình sợi carbon chịu áp suất 300 bar siêu nhẹ',
      'Vải dệt chống cháy chịu nhiệt bức xạ cực đoan đến 1,100°C',
      'Tích hợp màn hình HUD hiển thị áp suất khí thở thời gian thực',
    ],
  },
];

export const TerrestrialSpinoffsSection: React.FC = () => {
  return (
    <section
      id="terrestrial-spinoffs"
      className="py-16 md:py-24 relative w-full overflow-hidden bg-[#F8F9FA] border-t border-gray-200/80"
      data-testid="terrestrial-spinoffs-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0B2374] shadow-2xs mb-4">
            <Globe className="w-3.5 h-3.5 text-[#0B2374]" />
            <span>Earth Spinoff Heritage</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FC02]" />
            <span>NASA Technology Transfer</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight mb-5 leading-tight">
            From Orbit to Earth:{' '}
            <span className="text-[#0B2374]">Next-Gen Terrestrial Safety</span>
          </h2>

          <p className="text-zinc-600 text-sm sm:text-base md:text-lg leading-relaxed">
            Khi ngọn lửa được bóc trần khỏi lực đẩy Archimedes trong vi trọng lực, chúng ta thấu hiểu
            bản chất nhiệt động lực học và hóa học tinh khiết nhất của sự cháy. Những nguyên lý này
            không chỉ giữ an toàn trên quỹ đạo mà đang bảo vệ hàng triệu công trình và sinh mạng nơi mặt đất.
          </p>
        </div>

        {/* 3 Spinoff Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-14">
          {SPINOFFS.map((spinoff, index) => {
            const Icon =
              index === 0 ? Droplets : index === 1 ? Eye : ShieldCheck;

            return (
              <div
                key={spinoff.id}
                data-testid={`spinoff-card-${spinoff.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-3xl p-7 sm:p-8 border border-gray-200/80 shadow-2xs hover:shadow-md hover:border-[#0B2374]/30 transition-all duration-300"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                      {spinoff.category}
                    </span>
                    <span className="font-serif text-2xl font-bold text-gray-300 group-hover:text-[#0B2374] transition-colors">
                      {spinoff.number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-5 group-hover:bg-[#D4FC02]/20 group-hover:border-lime-300 transition-all">
                    <Icon className="w-6 h-6 text-[#0B2374]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374] mb-2 leading-snug">
                    {spinoff.title}
                  </h3>
                  <div className="text-xs font-mono text-zinc-500 mb-4 line-clamp-1">
                    {spinoff.englishTitle}
                  </div>

                  {/* Heritage Source Tag */}
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-zinc-700 font-mono text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                    <span className="font-semibold text-zinc-900">Di sản NASA:</span>
                    <span>{spinoff.heritageSource}</span>
                  </div>

                  {/* Target Environment */}
                  <div className="text-xs font-sans text-[#0B2374] font-medium mb-4 bg-blue-50/60 p-3 rounded-xl border border-blue-200/70">
                    <span className="font-bold">Ứng dụng mục tiêu:</span> {spinoff.environment}
                  </div>

                  <p className="text-sm text-zinc-600 font-sans leading-relaxed mb-6">
                    {spinoff.description}
                  </p>
                </div>

                <div>
                  {/* Two Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-5 border-t border-gray-100 mb-6">
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-black text-[#0B2374]">
                        {spinoff.primaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.primaryMetric.label}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-black text-[#0B2374]">
                        {spinoff.secondaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5 leading-tight">
                        {spinoff.secondaryMetric.label}
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2">
                    {spinoff.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-zinc-700 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technology Transfer Impact Banner */}
        <div
          className="rounded-3xl border border-[#0B2374]/20 bg-gradient-to-r from-[#0B2374] to-[#1E3A8A] text-white p-8 sm:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-6"
          data-testid="spinoff-impact-banner"
        >
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4FC02] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NASA Technology Transfer Initiative</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              &quot;The safest fire on Earth is the one understood in the stillness of space.&quot;
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              FlameGuard AI cung cấp bộ công cụ mô phỏng để các viện nghiên cứu PCCC và doanh nghiệp
              mặt đất trực tiếp tra cứu thông số nhiệt động học từ 20 đề tài vũ trụ.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D4FC02] hover:bg-[#c3e802] text-zinc-950 font-bold text-sm shadow-xs transition-all"
            >
              <Activity className="w-4 h-4 text-zinc-950" />
              <span>Xem Dữ Liệu Thực Nghiệm</span>
            </Link>
            <Link
              href="/explorer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
            >
              <span>Khám Phá 20 Nghiên Cứu</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
