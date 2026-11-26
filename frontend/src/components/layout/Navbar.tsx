import { useState, useEffect, useCallback } from 'react';
import type { FC, FormEvent } from 'react';
import { LogOut, Bell, KeyRound, X, CheckCheck } from 'lucide-react';
import { api } from '../../services/api';
import type { AuthUser, TabType } from '../../types';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

interface NotificationItem {
  notification_id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'Vừa xong';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const Navbar: FC<Props> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // State cho Modal Đổi mật khẩu
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const res = (await api.auth.getNotifications()) as {
        success?: boolean;
        notifications?: NotificationItem[];
        data?: NotificationItem[];
      };
      const list = res.notifications || res.data || [];
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch {
      // Bỏ qua lỗi ngầm
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // Bấm vào thông báo -> Đánh dấu đã đọc & Chuyển thẳng tới trang/tab tương ứng
  const handleSelectNotification = async (item: NotificationItem) => {
    setIsNotifOpen(false);

    if (!item.is_read) {
      try {
        await api.auth.markNotificationRead(item.notification_id);
        setNotifications(prev =>
          prev.map(n => (n.notification_id === item.notification_id ? { ...n, is_read: true } : n))
        );
      } catch {
        // Bỏ qua nếu lỗi mạng
      }
    }

    if (!user) return;

    const text = `${item.title} ${item.content}`.toLowerCase();

    if (user.roleCode === 'STUDENT') {
      let subTab: 'thesis' | 'gatekeeper' | 'courses' | 'grades-tuition' = 'thesis';
      if (text.includes('turnitin') || text.includes('chuẩn đầu ra') || text.includes('bài báo') || text.includes('vstep') || text.includes('ngoại ngữ') || text.includes('gatekeeper')) {
        subTab = 'gatekeeper';
      } else if (text.includes('học phí') || text.includes('điểm') || text.includes('thanh toán')) {
        subTab = 'grades-tuition';
      } else if (text.includes('đăng ký môn') || text.includes('học phần') || text.includes('thời khóa biểu') || text.includes('lịch học')) {
        subTab = 'courses';
      } else {
        subTab = 'thesis';
      }

      sessionStorage.setItem('agu_student_subtab', subTab);
      setActiveTab('student');
      window.dispatchEvent(new CustomEvent('agu:student-tab', { detail: subTab }));
    } else if (user.roleCode === 'LECTURER') {
      setActiveTab('faculty');
    } else if (user.roleCode === 'ADMIN') {
      if (text.includes('tuyển sinh') || text.includes('hồ sơ')) {
        setActiveTab('admin-admissions');
      } else if (text.includes('hội đồng') || text.includes('bảo vệ')) {
        setActiveTab('admin-committees');
      } else if (text.includes('giảng viên')) {
        setActiveTab('admin-lecturers');
      } else {
        setActiveTab('admin-students');
      }
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);

    if (!oldPassword || !newPassword) {
      setPwdMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsSubmittingPwd(true);
    try {
      const res = (await api.auth.changePassword({ oldPassword, newPassword })) as {
        success?: boolean;
        message?: string;
      };
      setPwdMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPwdModalOpen(false);
        setPwdMessage(null);
      }, 1200);
    } catch (err) {
      setPwdMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu.'
      });
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const links: { tab: TabType; label: string }[] = user
    ? [
        { tab: 'home', label: 'Trang Chủ' },
        { tab: 'forms' as const, label: 'Biểu mẫu SĐH' },
        ...(user.roleCode === 'STUDENT'
          ? [
              { tab: 'student' as const, label: 'Dashboard Học Viên' },
              { tab: 'student-profile' as const, label: 'Thông tin cá nhân' }
            ]
          : []),
        ...(user.roleCode === 'LECTURER' ? [{ tab: 'faculty' as const, label: 'Cổng Giảng Viên' }] : []),
        ...(user.roleCode === 'ADMIN'
          ? [
              { tab: 'admin-overview' as const, label: 'Tổng quan' },
              { tab: 'admin-students' as const, label: 'Quản lý học viên' },
              { tab: 'admin-admissions' as const, label: 'Quản lý tuyển sinh' },
              { tab: 'admin-committees' as const, label: 'Thành lập hội đồng' },
              { tab: 'admin-lecturers' as const, label: 'Quản lý giảng viên' },
              { tab: 'admin-academics' as const, label: 'Học phần & Lịch' },
              { tab: 'admin-tuition' as const, label: 'Quản lý học phí' }
            ]
          : [])
      ]
    : [
        { tab: 'home', label: 'Trang Chủ' },
        { tab: 'forms' as const, label: 'Biểu mẫu SĐH' },
        { tab: 'login', label: 'Đăng Nhập' },
        { tab: 'register', label: 'Nộp Hồ Sơ Tuyển Sinh' },
        { tab: 'lookup', label: 'Tra Cứu Kết Quả' }
      ];

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto min-h-16 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img
              src="/agu_logo.png"
              alt="Logo Trường Đại học An Giang"
              className="w-10 h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">AGU PostGrad</span>
              <span className="text-[11px] text-slate-500 font-medium">Trường Đại học An Giang &bull; ĐHQG-HCM</span>
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
                {/* Chuông thông báo */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(prev => !prev)}
                    className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-sky-700 transition"
                    title="Thông báo hệ thống"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 text-xs">Thông báo ({notifications.length})</span>
                        <button
                          type="button"
                          onClick={() => setIsNotifOpen(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-1">
                        {notifications.length === 0 ? (
                          <p className="py-6 text-center text-slate-400 italic">Chưa có thông báo nào.</p>
                        ) : (
                          notifications.map(item => (
                            <button
                              key={item.notification_id}
                              type="button"
                              onClick={() => void handleSelectNotification(item)}
                              className={`w-full text-left p-2.5 rounded-xl transition border ${
                                item.is_read
                                  ? 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                  : 'bg-sky-50/80 border-sky-100 text-slate-900 hover:bg-sky-100/70'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs ${item.is_read ? 'font-semibold text-slate-800' : 'font-bold text-sky-900'}`}>
                                  {item.title}
                                </p>
                                {!item.is_read ? (
                                  <span className="shrink-0 rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    Mới
                                  </span>
                                ) : (
                                  <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                )}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed">{item.content}</p>
                              <p className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                                <span>{formatDateTime(item.created_at)}</span>
                                <span className="text-sky-600 font-semibold">Mở trang liên quan →</span>
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Thông tin user */}
                <span className="text-right hidden sm:inline-block">
                  <span className="block font-semibold text-slate-800">{user.displayName || user.username}</span>
                  <span className="block text-slate-500">{user.roleName}</span>
                </span>

                {/* Nút Đổi mật khẩu */}
                <button
                  type="button"
                  onClick={() => {
                    setPwdMessage(null);
                    setIsPwdModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 font-semibold text-slate-700 hover:bg-slate-100 transition"
                  title="Đổi mật khẩu"
                >
                  <KeyRound className="h-4 w-4 text-sky-600" />
                  <span className="hidden md:inline">Đổi MK</span>
                </button>

                {/* Nút Đăng xuất */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Đổi mật khẩu */}
      {isPwdModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsPwdModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-sky-600" />
                Đổi mật khẩu tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setIsPwdModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                  placeholder="Nhập mật khẩu đang dùng..."
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                  placeholder="Nhập mật khẩu mới..."
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                />
              </div>

              {pwdMessage && (
                <p
                  className={`rounded-xl p-2.5 font-semibold ${
                    pwdMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {pwdMessage.text}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPwdModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPwd}
                  className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmittingPwd ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};