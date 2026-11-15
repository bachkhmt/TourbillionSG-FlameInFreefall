import React from 'react';
import { Droplets, Eye, ShieldCheck, Sparkles, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';

export interface SpinoffItem {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  category: string;
  environment: string;
  heritageSource: string;
  description: string;
  primaryMetric: {
    value: string;
    label: string;
  };
  secondaryMetric: {
    value: string;
    label: string;
  };
  features: string[];
}

export const SPINOFF_APPLICATIONS: SpinoffItem[] = [
  {
    id: 'water-mist-valve',
    number: '01',
    title: 'Van phun sương dập lửa không rò rỉ',
    englishTitle: 'Zero-leak water mist valve for submarines & data centers',
    category: 'CƠ CHẾ PHUN VI HẠT',
    environment: 'Tàu ngầm hải quân & Trung tâm dữ liệu siêu quy mô (Submarines / Hyperscale Data Centers)',
    heritageSource: 'NASA PSI SoFIE-MIST & Microgravity Combustion Chamber',
    description:
      'Công nghệ vòi phun siêu áp chống rò rỉ tuyệt đối kế thừa từ van buồng đốt vi trọng lực NASA. Tạo ra chùm hạt sương nước kích thước micron bốc hơi tức thì để hấp thụ nhiệt cực nhanh mà không gây đọng nước làm chập cháy thiết bị điện tử hoặc tràn khoang kín.',
    primaryMetric: {
      value: '–90%',
      label: 'Lượng nước sử dụng so với vòi phun tiêu chuẩn',
    },
    secondaryMetric: {
      value: '0.00%',
      label: 'Tỷ lệ rò rỉ áp suất dưới rung chấn',
    },
    features: [
      'Bảo vệ an toàn linh kiện máy chủ trong phòng máy chủ đám mây',
      'Được kiểm chứng trong điều kiện khoang kín tàu ngầm hạt nhân',
      'Dập tắt đám cháy bằng cơ chế làm mát và ngạt khí tức thì',
    ],
  },
  {
    id: 'optical-smoke-sensor',
    number: '02',
    title: 'Cảm biến khói quang phổ sớm',
    englishTitle: 'Early optical smoke sensor for mining tunnels & secure storage',
    category: 'QUANG HỌC PHỔ SUB-MICRON',
    environment: 'Hầm mỏ ngầm sâu & Kho lưu trữ nhạy cảm (Mining tunnels & Storage facilities)',
    heritageSource: 'NASA Smoke Aerosol Measurement Experiment (SAME) / ISS Heritage',
    description:
      'Cảm biến quang học đo tán xạ đa bước sóng phát hiện hạt sol khí tiền cháy (pre-combustion aerosols) cực nhỏ trong môi trường đối lưu kém hoặc bụi mịn dày đặc, giải quyết triệt để vấn đề báo động giả trong hầm mỏ.',
    primaryMetric: {
      value: '+180s',
      label: 'Cảnh báo sớm hơn cảm biến nhiệt thông thường',
    },
    secondaryMetric: {
      value: '99.4%',
      label: 'Độ chính xác loại trừ bụi mịn không cháy',
    },
    features: [
      'Hoạt động bền bỉ trong môi trường lưu huỳnh và bụi than hầm mỏ',
      'Thuật toán phân biệt kích thước hạt khói từ di sản SAME trên ISS',
      'Bảo vệ an toàn tài sản kho lưu trữ pin lithium và hóa chất kín',
    ],
  },
  {
    id: 'firefighter-breathing',
    number: '03',
    title: 'Thiết bị dưỡng khí thế hệ mới cho lính cứu hỏa',
    englishTitle: 'Next-gen firefighter breathing apparatus & life-support',
    category: 'ĐIỀU TIẾT DƯỠNG KHÍ THÍCH ỨNG',
    environment: 'Lính cứu hỏa đô thị & Lực lượng cứu nạn cứu hộ (Firefighters & First Responders)',
    heritageSource: 'NASA Extravehicular Activity (EVA) Portable Life Support System',
    description:
      'Hệ thống cấp oxy thích ứng áp suất dương áp dụng mô hình phân bố dòng khí phi trọng lực. Tự động điều tiết lưu lượng oxy theo nhịp tim và tải trọng hô hấp của lính cứu hỏa, giảm thiểu nguy cơ ngộ độc khói độc CO và cyanide.',
    primaryMetric: {
      value: '–40%',
      label: 'Trọng lượng bộ bình dưỡng khí mang vác',
    },
    secondaryMetric: {
      value: '+35%',
      label: 'Thời gian thao tác sinh tồn trong tâm đám cháy',
    },
    features: [
      'Bình hợp kim sợi carbon siêu nhẹ tiêu chuẩn buồng áp suất vũ trụ',
      'Van tiết lưu tự động cân bằng theo nồng độ oxy môi trường xung quanh',
      'Tích hợp cảnh báo mức oxy khả dụng theo thuật toán thời gian thực',
    ],
  },
];

export interface EarthImpactShowcaseProps {
  className?: string;
}

export const EarthImpactShowcase: React.FC<EarthImpactShowcaseProps> = ({ className = '' }) => {
  return (
    <section
      id="earth-impact-showcase"
      data-testid="earth-impact-showcase"
      className={`relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#F8F9FA] text-[#0B2374] border-t border-[#0B2374]/15 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2374]/10 text-[#0B2374] font-mono text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#0B2374]" />
              <span>NASA PSI Heritage • Di sản khoa học vũ trụ cho Trái Đất</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0B2374] tracking-tight">
              Từ Vi Trọng Lực Đến Mặt Đất
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl font-sans">
              Khi ngọn lửa quên đi trọng lực, con người thấu hiểu bản chất trần trụi của sự cháy.
              Những nguyên lý đó không chỉ cứu nguy trên quỹ đạo, mà đang bảo vệ hàng triệu sinh mạng nơi mặt đất.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 bg-white p-3 rounded-lg border border-[#0B2374]/15 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3 Ứng dụng đã chuyển giao công nghệ thành công</span>
          </div>
        </div>

        {/* 3 Spinoff Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {SPINOFF_APPLICATIONS.map((spinoff, index) => {
            const icon =
              index === 0 ? (
                <Droplets className="w-6 h-6 text-[#0B2374]" />
              ) : index === 1 ? (
                <Eye className="w-6 h-6 text-[#0B2374]" />
              ) : (
                <Zap className="w-6 h-6 text-[#0B2374]" />
              );

            return (
              <div
                key={spinoff.id}
                data-testid={`spinoff-card-${spinoff.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-8 border border-[#0B2374]/15 shadow-sm hover:shadow-xl hover:border-[#0B2374]/40 transition-all duration-300"
              >
                <div>
                  {/* Top Badge & Number */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-[#0B2374]/5 text-[#0B2374]">
                      {spinoff.category}
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#0B2374]/30 group-hover:text-[#0B2374] transition-colors">
                      {spinoff.number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] border border-[#0B2374]/15 flex items-center justify-center mb-5 group-hover:bg-[#D4FC02]/20 transition-colors">
                    {icon}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374] mb-2 leading-snug">
                    {spinoff.title}
                  </h3>
                  <div className="text-xs font-mono text-slate-500 mb-4 line-clamp-1">
                    {spinoff.englishTitle}
                  </div>

                  {/* Heritage Tag */}
                  <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-slate-800">Nguồn di sản:</span>
                    <span>{spinoff.heritageSource}</span>
                  </div>

                  {/* Target Environment */}
                  <div className="text-xs font-sans text-[#0B2374] font-medium mb-4 bg-[#0B2374]/5 p-2.5 rounded-lg border border-[#0B2374]/10">
                    <span className="font-bold">Ứng dụng mặt đất:</span> {spinoff.environment}
                  </div>

                  <p className="text-sm text-slate-600 font-sans leading-relaxed mb-6">
                    {spinoff.description}
                  </p>
                </div>

                <div>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-100 mb-6">
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-slate-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374]">
                        {spinoff.primaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 leading-tight">
                        {spinoff.primaryMetric.label}
                      </div>
                    </div>
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-slate-200/80">
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#0B2374]">
                        {spinoff.secondaryMetric.value}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 leading-tight">
                        {spinoff.secondaryMetric.label}
                      </div>
                    </div>
                  </div>

                  {/* Verified features list */}
                  <ul className="space-y-2 mb-2">
                    {spinoff.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-600 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-xs font-mono text-slate-500 tracking-wide">
            DỰA TRÊN CƠ SỞ DỮ LIỆU NASA PHYSICAL SCIENCE INFORMATICS (PSI) • DI SẢN KHOA HỌC KHÔNG GIAN PHỤC VỤ ĐỜI SỐNG MẶT ĐẤT
          </p>
        </div>
      </div>
    </section>
  );
};
