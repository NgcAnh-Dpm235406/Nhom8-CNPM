import React from 'react';
import { Sparkles, ArrowRight, Search, Send, Clock, Users, Layers, ChevronRight } from 'lucide-react';
import type { TabType } from '../../types';

interface Props {
  onNavigate: (tab: TabType, majorCode?: string) => void;
}

export const HomePage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-900 text-white py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),transparent_50%)]" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-sky-300 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Cổng Thông Tin Sau Đại Học • Trường Đại học An Giang</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Hệ Thống Quản Lý <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">Quá Trình Đào Tạo Thạc Sĩ</span>
          </h1>
          
          <p className="mt-5 text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            Nền tảng số hóa toàn diện từ tiếp nhận hồ sơ xét tuyển trực tuyến, giám sát tiến độ luận văn bằng cảnh báo màu, đến điều phối slot giảng viên hướng dẫn.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => onNavigate('register')}
              className="flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 text-sm"
            >
              <span>Nộp Hồ Sơ Dự Tuyển</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onNavigate('lookup')}
              className="flex items-center space-x-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition text-sm"
            >
              <Search className="w-4 h-4" />
              <span>Tra Cứu Kết Quả Tuyển Sinh</span>
            </button>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-black text-sky-400">03</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Chuyên ngành Thạc sĩ</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-black text-emerald-400">≤ 25MB</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Upload hồ sơ số hóa</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-black text-amber-400">Realtime</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Giám sát slot hướng dẫn</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-2xl font-black text-indigo-400">3 Cấp độ</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Cảnh báo tiến độ Xanh/Vàng/Đỏ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách ngành học */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-bold text-sky-600 tracking-wider">Chương trình đào tạo</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">Các Chuyên Ngành Tuyển Sinh Năm 2026</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 uppercase">Mã ngành: KTPM-8480103</span>
              <h3 className="text-xl font-bold text-slate-800 mt-3">Kỹ Thuật Phần Mềm</h3>
              <p className="text-xs text-slate-500 mt-2">Đào tạo kiến trúc sư phần mềm, Microservices, Cloud Native và điều phối dự án lớn.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>Thời gian đào tạo:</span> <strong className="text-slate-800">1.5 - 2.0 Năm</strong></div>
                <div className="flex justify-between"><span>Văn bằng:</span> <strong className="text-slate-800">Thạc sĩ Kỹ thuật</strong></div>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('register', 'KTPM')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <span>Đăng ký ngành này</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 uppercase">Mã ngành: KHMT-8480101</span>
              <h3 className="text-xl font-bold text-slate-800 mt-3">Khoa Học Máy Tính</h3>
              <p className="text-xs text-slate-500 mt-2">Nghiên cứu Trí tuệ nhân tạo (AI), Deep Learning, Big Data và Thị giác máy tính.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>Thời gian đào tạo:</span> <strong className="text-slate-800">1.5 - 2.0 Năm</strong></div>
                <div className="flex justify-between"><span>Văn bằng:</span> <strong className="text-slate-800">Thạc sĩ Khoa học</strong></div>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('register', 'KHMT')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <span>Đăng ký ngành này</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">Mã ngành: QTKD-8340101</span>
              <h3 className="text-xl font-bold text-slate-800 mt-3">Quản Trị Kinh Doanh</h3>
              <p className="text-xs text-slate-500 mt-2">Nhà quản trị chiến lược kỷ nguyên số, hoạch định tài chính và đổi mới sáng tạo.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>Thời gian đào tạo:</span> <strong className="text-slate-800">1.5 - 2.0 Năm</strong></div>
                <div className="flex justify-between"><span>Văn bằng:</span> <strong className="text-slate-800">Thạc sĩ Quản trị (MBA)</strong></div>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('register', 'QTKD')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <span>Đăng ký ngành này</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Lối tắt phân hệ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>Truy Cập Nhanh Các Phân Hệ Quản Lý Đào Tạo</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div onClick={() => onNavigate('register')} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3"><Send className="w-5 h-5" /></div>
              <h4 className="font-bold text-sm">Tuyển Sinh Trực Tuyến</h4>
              <p className="text-xs text-slate-400 mt-1">Đăng ký thông tin và đính kèm hồ sơ minh chứng (≤ 25MB).</p>
            </div>
            <div onClick={() => onNavigate('lookup')} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3"><Search className="w-5 h-5" /></div>
              <h4 className="font-bold text-sm">Tra Cứu Kết Quả</h4>
              <p className="text-xs text-slate-400 mt-1">Kiểm tra kết quả xét tuyển và tải giấy báo nhập học qua CCCD.</p>
            </div>
            <div onClick={() => onNavigate('student')} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3"><Clock className="w-5 h-5" /></div>
              <h4 className="font-bold text-sm">Cảnh Báo Luận Văn</h4>
              <p className="text-xs text-slate-400 mt-1">Theo dõi các mốc bảo vệ theo 3 mã màu Xanh, Vàng, Đỏ.</p>
            </div>
            <div onClick={() => onNavigate('faculty')} className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3"><Users className="w-5 h-5" /></div>
              <h4 className="font-bold text-sm">Cổng Giảng Viên (Slot)</h4>
              <p className="text-xs text-slate-400 mt-1">Quản lý hạn mức nhận hướng dẫn học viên realtime.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};