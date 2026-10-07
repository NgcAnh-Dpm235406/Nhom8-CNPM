import React, { useState } from 'react';
import { Users, Check } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const [facultySlots, setFacultySlots] = useState({ max: 5, assigned: 4 });

  return (
    <div className="max-w-5xl mx-auto my-8 px-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-400 font-semibold uppercase">Định Mức Tối Đa</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{facultySlots.max} <span className="text-sm font-normal text-slate-500">học viên</span></p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-400 font-semibold uppercase">Đang Hướng Dẫn</p>
          <p className="text-3xl font-extrabold text-sky-600 mt-1">{facultySlots.assigned} <span className="text-sm font-normal text-slate-500">học viên</span></p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl">
          <p className="text-xs text-slate-500 font-semibold uppercase">Slot Còn Lại</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{facultySlots.max - facultySlots.assigned}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" /> Danh Sách Yêu Cầu Hướng Dẫn Chờ Duyệt
        </h3>
        <div className="p-4 bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="font-semibold text-slate-800">Lê Văn Hiếu (26M402008)</p>
            <p className="text-xs text-slate-500 mt-0.5">Đề tài: Nghiên cứu Kiến trúc Event-Driven trong Quản lý Đào tạo</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFacultySlots(prev => ({ ...prev, assigned: Math.min(prev.max, prev.assigned + 1) }))}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Nhận hướng dẫn
            </button>
            <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-rose-100 hover:text-rose-600">
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};