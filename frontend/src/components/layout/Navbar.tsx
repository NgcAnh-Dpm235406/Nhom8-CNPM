import React from 'react';
import { GraduationCap, LogOut } from 'lucide-react';
import type { AuthUser, TabType } from '../../types';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const links: { tab: TabType; label: string }[] = user
    ? [
        { tab: 'home', label: 'Trang Chủ' },
        ...(user.roleCode === 'STUDENT'
          ? [
              { tab: 'student' as const, label: 'Dashboard Học Viên' },
              { tab: 'student-profile' as const, label: 'Thông tin cá nhân' }
            ]
          : []),
        ...(user.roleCode === 'LECTURER' ? [{ tab: 'faculty' as const, label: 'Cổng Giảng Viên' }] : []),
        ...(user.roleCode === 'ADMIN'
          ? [
              { tab: 'admin-admissions' as const, label: 'Quản lý tuyển sinh' },
              { tab: 'admin-committees' as const, label: 'Thành lập hội đồng' },
              { tab: 'admin-lecturers' as const, label: 'Quản lý giảng viên' }
            ]
          : [])
      ]
    : [
        { tab: 'home', label: 'Trang Chủ' },
        { tab: 'login', label: 'Đăng Nhập' },
        { tab: 'register', label: 'Nộp Hồ Sơ Tuyển Sinh' },
        { tab: 'lookup', label: 'Tra Cứu Kết Quả' }
      ];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto min-h-16 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">AGU PostGrad</span>
            <span className="text-[11px] text-slate-400 font-medium">Hệ Thống Quản Lý Đào Tạo Thạc Sĩ</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <nav aria-label="Menu chính" className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold overflow-x-auto">
            {links.map(({ tab, label }) => (
              <button
                key={tab}
                type="button"
                aria-current={activeTab === tab ? 'page' : undefined}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-2 rounded-xl transition ${activeTab === tab ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </nav>
          {user && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-right">
                <span className="block font-semibold text-slate-800">{user.displayName || user.username}</span>
                <span className="block text-slate-500">{user.roleName}</span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 rounded-xl px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};