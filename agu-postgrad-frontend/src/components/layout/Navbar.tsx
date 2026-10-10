import React from 'react';
import { Home as HomeIcon, GraduationCap } from 'lucide-react';
import type { TabType } from '../../types';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">AGU PostGrad</span>
            <span className="text-[11px] text-slate-400 font-medium">Hệ Thống Quản Lý Đào Tạo Thạc Sĩ</span>
          </div>
        </div>

        <nav className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold overflow-x-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition ${activeTab === 'home' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <HomeIcon className="w-4 h-4" />
            <span>Trang Chủ</span>
          </button>


          <button 
            onClick={() => setActiveTab('login')}
             className={`px-3 py-2 rounded-xl transition ${activeTab === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
                Đăng nhập
          </button>

          <button 
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2 rounded-xl transition ${activeTab === 'register' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Nộp Hồ Sơ Tuyển Sinh
          </button>
          <button 
            onClick={() => setActiveTab('lookup')}
            className={`px-3 py-2 rounded-xl transition ${activeTab === 'lookup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tra Cứu Kết Quả
          </button>
          <button 
            onClick={() => setActiveTab('student')}
            className={`px-3 py-2 rounded-xl transition ${activeTab === 'student' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Dashboard Học Viên
          </button>
          <button 
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-2 rounded-xl transition ${activeTab === 'faculty' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Cổng Giảng Viên (Slot)
          </button>
        </nav>
      </div>
    </header>
  );
};