import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  Search,
  FileText,
  Users,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Laptop,
  TrendingUp,
  AlertTriangle,
  Leaf,
  Cpu,
  BookmarkCheck
} from 'lucide-react';
import type { TabType } from '../../types';

interface Props {
  onNavigate: (tab: TabType, majorCode?: string) => void;
}

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  const [selectedMajor, setSelectedMajor] = useState<'cntt' | 'tnmt' | 'qlgd'>('cntt');

  return (
    <div className="space-y-16 pb-12 font-sans antialiased text-slate-800">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Institution Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/60 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-sky-200 shadow-inner mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH &bull; TRƯỜNG ĐẠI HỌC AN GIANG</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Hệ Thống Quản Lý Đào Tạo{' '}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
              Thạc Sĩ Trường Đại Học An Giang
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Nền tảng số hóa toàn diện quản lý tuyển sinh, học phần tín chỉ, giám sát tiến độ luận văn bằng cảnh báo màu và tổ chức hội đồng bảo vệ chuẩn ĐHQG-HCM.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Nộp hồ sơ dự tuyển trực tuyến</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('lookup')}
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-white/20 hover:border-white/30"
            >
              <Search className="h-4 w-4 text-sky-400" />
              <span>Tra cứu kết quả xét tuyển</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('forms')}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Tải biểu mẫu SĐH</span>
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-sky-400 mb-1">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] uppercase font-bold text-sky-300/70">Chuyên ngành SĐH</span>
              </div>
              <p className="text-2xl font-black text-white">13 Ngành</p>
              <p className="text-xs text-slate-400 mt-1">08 ngành chính quy & 05 dự kiến</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <Laptop className="h-5 w-5" />
                <span className="text-[10px] uppercase font-bold text-emerald-300/70">Số hóa 100%</span>
              </div>
              <p className="text-2xl font-black text-white">&le; 25 MB</p>
              <p className="text-xs text-slate-400 mt-1">Nộp hồ sơ xét tuyển online</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <Users className="h-5 w-5" />
                <span className="text-[10px] uppercase font-bold text-amber-300/70">Đội ngũ GVHD</span>
              </div>
              <p className="text-2xl font-black text-white">Realtime</p>
              <p className="text-xs text-slate-400 mt-1">Điều phối slot hướng dẫn minh bạch</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-indigo-400 mb-1">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[10px] uppercase font-bold text-indigo-300/70">Chuẩn đầu ra</span>
              </div>
              <p className="text-2xl font-black text-white">Gatekeeper</p>
              <p className="text-xs text-slate-400 mt-1">Turnitin &le; 20% & Báo cáo tiến độ</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHƯƠNG TRÌNH TUYỂN SINH THẠC SĨ AGU NĂM 2026 */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-800">
            Chương trình đào tạo sau đại học
          </span>
          <h2 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Các Chuyên Ngành Tuyển Sinh Trọng Điểm Năm 2026
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Lịch học linh hoạt vào các buổi tối và Thứ Bảy, Chủ Nhật, phù hợp tối đa cho người đi làm và cán bộ nghiên cứu.
          </p>
        </div>

        {/* Major selector tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedMajor('cntt')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedMajor === 'cntt'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Công nghệ thông tin
          </button>
          <button
            type="button"
            onClick={() => setSelectedMajor('tnmt')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedMajor === 'tnmt'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Quản lý tài nguyên và môi trường
          </button>
          <button
            type="button"
            onClick={() => setSelectedMajor('qlgd')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedMajor === 'qlgd'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Quản lý giáo dục
          </button>
        </div>

        {/* 3 Major Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: CÔNG NGHỆ THÔNG TIN */}
          <div className={`rounded-3xl border p-6 transition-all duration-200 flex flex-col justify-between ${
            selectedMajor === 'cntt'
              ? 'border-sky-500 bg-white ring-2 ring-sky-500/20 shadow-xl'
              : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 uppercase font-mono">
                  Mã ngành: 8480201
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Đang mở xét tuyển
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-sky-600" />
                Công Nghệ Thông Tin
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Đào tạo chuyên sâu về Trí tuệ nhân tạo (AI), Khoa học dữ liệu, Kiến trúc hệ thống phân tán & Cloud Computing, An ninh mạng và Kỹ thuật phần mềm hiện đại.
              </p>

              <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian đào tạo:</span>
                  <strong className="text-slate-800">1.5 &ndash; 2.0 Năm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Văn bằng tốt nghiệp:</span>
                  <strong className="text-slate-800">Thạc sĩ Công nghệ Thông tin</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học phí tín chỉ:</span>
                  <strong className="text-sky-700 font-bold">750.000 VNĐ / TC</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức học:</span>
                  <strong className="text-slate-800">Cuối tuần (T7 & CN)</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('register', '8480201')}
              className="mt-6 w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-700/20 transition"
            >
              <span>Nộp hồ sơ ngành CNTT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: QUẢN LÝ TÀI NGUYÊN VÀ MÔI TRƯỜNG */}
          <div className={`rounded-3xl border p-6 transition-all duration-200 flex flex-col justify-between ${
            selectedMajor === 'tnmt'
              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xl'
              : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase font-mono">
                  Mã ngành: 8850101
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Đang mở xét tuyển
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-4 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-emerald-600" />
                Quản Lý Tài Nguyên & Môi Trường
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Nghiên cứu quản trị bền vững tài nguyên nước, đất đai, sinh thái Đồng bằng sông Cửu Long, đánh giá tác động môi trường (ĐTM), kinh tế tuần hoàn và biến đổi khí hậu.
              </p>

              <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian đào tạo:</span>
                  <strong className="text-slate-800">1.5 &ndash; 2.0 Năm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Văn bằng tốt nghiệp:</span>
                  <strong className="text-slate-800">Thạc sĩ Quản lý TN&MT</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học phí tín chỉ:</span>
                  <strong className="text-emerald-700 font-bold">750.000 VNĐ / TC</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức học:</span>
                  <strong className="text-slate-800">Cuối tuần (T7 & CN)</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('register', '8850101')}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 transition"
            >
              <span>Nộp hồ sơ ngành TN&MT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: QUẢN LÝ GIÁO DỤC */}
          <div className={`rounded-3xl border p-6 transition-all duration-200 flex flex-col justify-between ${
            selectedMajor === 'qlgd'
              ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xl'
              : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 uppercase font-mono">
                  Mã ngành: 8140114
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Đang mở xét tuyển
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                Quản Lý Giáo Dục
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Đào tạo đội ngũ cán bộ lãnh đạo, hiệu trưởng, chuyên viên sở/phòng GD&ĐT về quản trị nhà trường hiện đại, chuyển đổi số giáo dục, kiểm định chất lượng và chính sách sư phạm.
              </p>

              <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian đào tạo:</span>
                  <strong className="text-slate-800">1.5 &ndash; 2.0 Năm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Văn bằng tốt nghiệp:</span>
                  <strong className="text-slate-800">Thạc sĩ Quản lý Giáo dục</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học phí tín chỉ:</span>
                  <strong className="text-indigo-700 font-bold">750.000 VNĐ / TC</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức học:</span>
                  <strong className="text-slate-800">Cuối tuần (T7 & CN)</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('register', '8140114')}
              className="mt-6 w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-700/20 transition"
            >
              <span>Nộp hồ sơ ngành QLGD</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SHOWCASE TOÀN BỘ CHUYÊN NGÀNH THEO BANNER TRƯỜNG ĐẠI HỌC AN GIANG */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-800">
                <BookmarkCheck className="h-4 w-4 text-sky-600" />
                Danh mục đào tạo Thạc sĩ Trường Đại học An Giang
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Toàn Bộ 13 Chuyên Ngành Đào Tạo Sau Đại Học
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
            >
              <span>Nộp hồ sơ ngay</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột 1: Chuyên ngành chính quy đang tuyển sinh */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-900 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Chuyên ngành đang tuyển sinh & đào tạo
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'QUẢN LÝ GIÁO DỤC', code: '8140114', tag: 'Chính quy' },
                  { name: 'QUẢN LÝ TÀI NGUYÊN VÀ MÔI TRƯỜNG', code: '8850101', tag: 'Chính quy' },
                  { name: 'CHĂN NUÔI', code: '8620105', tag: 'Chính quy' },
                  { name: 'KHOA HỌC CÂY TRỒNG', code: '8620110', tag: 'Chính quy' },
                  { name: 'CÔNG NGHỆ SINH HỌC', code: '8420201', tag: 'Chính quy' },
                  { name: 'CÔNG NGHỆ THỰC PHẨM', code: '8540101', tag: 'Chính quy' },
                  { name: 'CÔNG NGHỆ THÔNG TIN', code: '8480201', tag: 'Chính quy' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigate('register', item.code)}
                    className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-rose-600 font-bold text-sm">&bull;</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-sky-800 transition">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{item.code}</span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Vật lý & Dự kiến mở mới */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Vật lý chuyên sâu & Chuyên ngành dự kiến
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'VẬT LÝ LÝ THUYẾT VÀ VẬT LÝ TOÁN', code: '8440102', tag: 'Chính quy', isPlanned: false },
                  { name: 'LÝ LUẬN VÀ PHƯƠNG PHÁP DẠY HỌC', code: 'Dự kiến', tag: 'Dự kiến mở', isPlanned: true },
                  { name: 'LÝ LUẬN VÀ PPDH BỘ MÔN TIẾNG ANH', code: 'Dự kiến', tag: 'Dự kiến mở', isPlanned: true },
                  { name: 'TRIẾT HỌC', code: 'Dự kiến', tag: 'Dự kiến mở', isPlanned: true },
                  { name: 'KỸ THUẬT MÔI TRƯỜNG', code: 'Dự kiến', tag: 'Dự kiến mở', isPlanned: true },
                  { name: 'NUÔI TRỒNG THỦY SẢN', code: 'Dự kiến', tag: 'Dự kiến mở', isPlanned: true }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-rose-600 font-bold text-sm">&bull;</span>
                      <span className="text-xs font-bold text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        item.isPlanned
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LỘ TRÌNH 5 BƯỚC ĐÀO TẠO THẠC SĨ AGU */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Quy trình đào tạo chuẩn mực</span>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">Lộ Trình 5 Bước Hoàn Thành Luận Văn Thạc Sĩ</h3>
                <p className="text-xs text-slate-400 mt-1">Chu trình khép kín đảm bảo chất lượng học thuật và tiến độ nghiên cứu của học viên</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('forms')}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-sky-200 hover:underline"
              >
                <span>Xem biểu mẫu quy định</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 relative">
                <span className="inline-block rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400 font-mono mb-2">
                  Bước 01
                </span>
                <h4 className="font-bold text-sm text-slate-100">Đăng ký GVHD</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Lựa chọn giảng viên theo định hướng đề tài, kiểm tra slot hướng dẫn còn trống realtime.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 relative">
                <span className="inline-block rounded-lg bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-400 font-mono mb-2">
                  Bước 02
                </span>
                <h4 className="font-bold text-sm text-slate-100">Bảo vệ Đề cương</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Trình bày trước Tiểu ban chuyên môn, hoàn thiện theo phiếu góp ý BM-SĐH-01.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 relative">
                <span className="inline-block rounded-lg bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-400 font-mono mb-2">
                  Bước 03
                </span>
                <h4 className="font-bold text-sm text-slate-100">Báo cáo Tiến độ</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Báo cáo định kỳ lần 1 và 2 với hệ thống giám sát deadline tự động Xanh/Vàng/Đỏ.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 relative">
                <span className="inline-block rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 font-mono mb-2">
                  Bước 04
                </span>
                <h4 className="font-bold text-sm text-slate-100">Bản thảo & Turnitin</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Nộp bản thảo hoàn chỉnh, kiểm duyệt đạo văn Turnitin &le; 20% và xác nhận của GVHD.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-white/5 p-4 relative">
                <span className="inline-block rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 font-mono mb-2">
                  Bước 05
                </span>
                <h4 className="font-bold text-sm text-slate-100">Hội đồng Bảo vệ</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Bảo vệ trước Hội đồng 5 thành viên chuẩn ĐHQG-HCM, giải trình chỉnh sửa và cấp bằng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TÍNH NĂNG ĐỘT PHÁ CỦA NỀN TẢNG SỐ HÓA */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Công nghệ & Tính năng
          </span>
          <h2 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Điểm Khác Biệt Của Nền Tảng AGU PostGrad
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Cơ chế Gatekeeper Tự Động</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Hệ thống tự động rà soát điều kiện bảo vệ: tích lũy đủ số tín chỉ, đạt chuẩn ngoại ngữ B2/VSTEP và có bài báo khoa học xuất bản trên tạp chí chuyên ngành.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Cảnh Báo Hạn Nộp 3 Mã Màu</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mã màu thông minh trực quan: Xanh (an toàn), Vàng (còn 15 ngày) và Đỏ (sắp trễ hạn), kèm tự động thông báo để học viên và GVHD phối hợp kịp thời.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Tính Học Phí Theo Tín Chỉ</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Đồng bộ trực tiếp với số môn đăng ký (750.000 VNĐ/TC), tích hợp quét mã QR chuyển khoản và nộp minh chứng trực tuyến, xét duyệt biên lai số tức thì.
            </p>
          </div>
        </div>
      </section>

      {/* 5. LIÊN HỆ & THÔNG TIN HỖ TRỢ */}
      <footer className="border-t border-slate-200 bg-slate-50 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-600">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sky-800 text-white flex items-center justify-center font-black text-sm">
                AGU
              </div>
              <span className="font-bold text-slate-900 text-sm">Phòng Sau Đại học &bull; Đại học An Giang</span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-md">
              Cơ quan thường trực quản lý và tổ chức đào tạo các chương trình Thạc sĩ, Tiến sĩ tại Trường Đại học An Giang - Đại học Quốc gia Thành phố Hồ Chí Minh.
            </p>
            <div className="space-y-1.5 pt-2 text-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-700 shrink-0" />
                <span>Số 18 Ung Văn Khiêm, Phường Đông Xuyên, TP. Long Xuyên, Tỉnh An Giang</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-700 shrink-0" />
                <span>Hotline Sau Đại học: (0296) 6256565 (Số nội bộ: 1042)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-700 shrink-0" />
                <span>Email tiếp nhận: sdh@agu.edu.vn</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-3">Lối tắt người dùng</h5>
            <ul className="space-y-2">
              <li>
                <button type="button" onClick={() => onNavigate('register')} className="hover:text-sky-700 hover:underline">
                  Đăng ký tuyển sinh trực tuyến
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('lookup')} className="hover:text-sky-700 hover:underline">
                  Tra cứu kết quả xét tuyển
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('forms')} className="hover:text-sky-700 hover:underline">
                  Kho biểu mẫu đề cương & luận văn
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('student')} className="hover:text-sky-700 hover:underline">
                  Cổng thông tin học viên Cao học
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('faculty')} className="hover:text-sky-700 hover:underline">
                  Cổng giảng viên hướng dẫn
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-3">Liên kết chính thức</h5>
            <ul className="space-y-2 text-slate-500">
              <li>
                <a href="https://www.agu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-sky-700 hover:underline">
                  Cổng thông tin AGU (agu.edu.vn)
                </a>
              </li>
              <li>
                <a href="https://vnuhcm.edu.vn" target="_blank" rel="noreferrer" className="hover:text-sky-700 hover:underline">
                  Đại học Quốc gia TP. Hồ Chí Minh
                </a>
              </li>
              <li>
                <a href="https://lib.agu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-sky-700 hover:underline">
                  Thư viện điện tử AGU
                </a>
              </li>
              <li>
                <a href="https://sj.agu.edu.vn" target="_blank" rel="noreferrer" className="hover:text-sky-700 hover:underline">
                  Tạp chí Khoa học AGU
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Trường Đại học An Giang - ĐHQG-HCM. Bản quyền thuộc về Phòng Sau Đại học. Hệ thống Quản trị Đào tạo Thạc sĩ AGU PostGrad v1.0.
        </div>
      </footer>
    </div>
  );
};
