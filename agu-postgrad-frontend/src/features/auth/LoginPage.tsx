import React, { useState } from 'react';

interface LoginPageProps {
  onNavigate?: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý logic gửi dữ liệu đăng nhập tới Backend tại đây
    console.log('Thông tin đăng nhập:', { email, password });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-800">
          Đăng Nhập
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Hệ Thống Quản Lý Đào Tạo Sau Đại Học
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Tên đăng nhập / Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="Nhập tên đăng nhập hoặc email"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
          >
            Đăng nhập
          </button>
        </form>

        {onNavigate && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-semibold text-sky-600 hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        )}
      </div>
    </div>
  );
};