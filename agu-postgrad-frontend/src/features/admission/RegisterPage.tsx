import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { FileUploadZone } from '../../components/common/FileUploadZone';

interface Props {
  initialMajorCode?: string;
}

export const RegisterPage: React.FC<Props> = ({ initialMajorCode = 'KTPM' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    idCardNumber: '',
    majorCode: initialMajorCode,
    admissionType: 'xet_tuyen'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Vui lòng tải lên file hồ sơ minh chứng (≤ 25MB)!');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-gradient-to-r from-sky-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg mb-8">
        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
          Tuyển sinh Sau Đại học ĐHAG
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Đăng Ký Dự Tuyển Trình Độ Thạc Sĩ</h1>
        <p className="mt-2 text-sky-100 text-sm">Hệ thống tiếp nhận hồ sơ trực tuyến các ngành Kỹ thuật Phần mềm, Khoa học Máy tính.</p>
      </div>

      {isSubmitted ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center border border-slate-200">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Nộp Hồ Sơ Thành Công!</h2>
          <p className="text-slate-600 mt-2">Mã hồ sơ: <span className="font-mono font-bold text-sky-600">THS-2026-0892</span></p>
          <button onClick={() => setIsSubmitted(false)} className="mt-6 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium">
            Nộp hồ sơ khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên thí sinh *</label>
              <input 
                type="text" required placeholder="Nguyễn Văn A" 
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Số CCCD *</label>
              <input 
                type="text" required placeholder="12 chữ số CCCD" 
                value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email liên hệ *</label>
              <input 
                type="email" required placeholder="email@example.com" 
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại *</label>
              <input 
                type="tel" required placeholder="0912 345 678" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <FileUploadZone onFileSelect={setSelectedFile} maxSizeMB={25} />

          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center space-x-2 px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow transition">
              <span>Nộp Hồ Sơ</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};