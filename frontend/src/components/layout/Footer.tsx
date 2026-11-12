import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Phòng Sau Đại Học • Trường Đại học An Giang (ĐHQG-HCM)</p>
        <p className="text-slate-400">Đồ án môn Công nghệ mới trong phát triển phần mềm</p>
      </div>
    </footer>
  );
};