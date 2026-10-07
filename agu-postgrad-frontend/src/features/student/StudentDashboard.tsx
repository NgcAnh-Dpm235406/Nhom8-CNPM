import React from 'react';
import { BookOpen, User } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto my-8 px-4 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">HV</div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Học viên: Nguyễn Thị Ngân Huệ <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full ml-2">MSHV: 26M402001</span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Đề tài: Ứng dụng Microservices & AI trong Quản trị Đào tạo Sau Đại học</p>
          </div>
        </div>
        <div className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span>GVHD: <strong>TS. Trần Văn B</strong></span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-600" /> Tiến Độ Thực Hiện Luận Văn (Cảnh Báo Màu)
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">1. Thuyết minh đề cương luận văn</h4>
              <p className="text-xs text-slate-500">Hạn: 15/03/2026 • Đã hoàn thành và thông qua hội đồng</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">● Xanh - Đúng hạn</span>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">2. Báo cáo tiến độ luận văn & Kiểm tra Turnitin</h4>
              <p className="text-xs text-slate-500">Hạn: 20/10/2026 • Còn 13 ngày đến hạn nộp báo cáo</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full animate-pulse">● Vàng - Sắp đến hạn</span>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">3. Nộp chứng chỉ Tiếng Anh chuẩn đầu ra (VSTEP B2)</h4>
              <p className="text-xs text-slate-500">Hạn chót: 01/10/2026 • Chưa ghi nhận chứng chỉ trên hệ thống</p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">● Đỏ - Quá hạn</span>
          </div>
        </div>
      </div>
    </div>
  );
};