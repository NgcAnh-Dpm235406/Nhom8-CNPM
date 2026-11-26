import React from 'react';
import { FileText, Download, BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';

interface FormItem {
  id: string;
  title: string;
  code: string;
  description: string;
  fileName: string;
  fileSize: string;
  category: 'Đề cương' | 'Bảo vệ' | 'Hậu bảo vệ';
  instruction: string;
}

const formList: FormItem[] = [
  {
    id: 'mau-de-cuong',
    title: 'Mẫu đề cương luận văn Thạc sĩ',
    code: 'BM-SĐH-01',
    description: 'Bản thuyết minh đề cương nghiên cứu luận văn thạc sĩ theo quy định chuẩn của Trường Đại học An Giang.',
    fileName: '/forms/mau-de-cuong-luan-van.rtf',
    fileSize: '2.6 KB (RTF)',
    category: 'Đề cương',
    instruction: 'Học viên hoàn thành dưới sự hướng dẫn của GVHD, xin chữ ký xác nhận của GVHD và nộp về Bộ môn/Khoa để thành lập hội đồng xét duyệt đề cương.'
  },
  {
    id: 'don-xin-bao-ve',
    title: 'Mẫu đơn xin bảo vệ luận văn Thạc sĩ',
    code: 'BM-SĐH-02',
    description: 'Đơn đăng ký bảo vệ chính thức trước Hội đồng đánh giá luận văn Thạc sĩ cấp Trường/Khoa.',
    fileName: '/forms/mau-don-xin-bao-ve.rtf',
    fileSize: '2.5 KB (RTF)',
    category: 'Bảo vệ',
    instruction: 'Nộp kèm bản thảo luận văn, kết quả kiểm tra trùng lặp Turnitin (≤ 20%), minh chứng bài báo khoa học đã đăng và chứng chỉ ngoại ngữ chuẩn đầu ra.'
  },
  {
    id: 'phieu-giai-trinh',
    title: 'Mẫu phiếu giải trình chỉnh sửa luận văn',
    code: 'BM-SĐH-03',
    description: 'Bản giải trình tiếp thu và chỉnh sửa luận văn theo ý kiến kết luận của Hội đồng bảo vệ.',
    fileName: '/forms/phieu-giai-trinh-chinh-sua-luan-van.rtf',
    fileSize: '2.5 KB (RTF)',
    category: 'Hậu bảo vệ',
    instruction: 'Hoàn thành trong vòng 30 ngày sau buổi bảo vệ chính thức, có xác nhận của Chủ tịch Hội đồng và Người phản biện trước khi nộp bản lưu chiểu tại Thư viện.'
  }
];

export const FormsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-800 p-8 text-white shadow-xl sm:p-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <BookOpen className="h-4 w-4" />
            Hệ thống Văn bản & Biểu mẫu AGU
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
            Kho Biểu Mẫu & Quy Định Đào Tạo Thạc Sĩ
          </h1>
          <p className="mt-3 text-sm text-sky-100 sm:text-base">
            Cung cấp đầy đủ các mẫu đơn, bản thuyết minh đề cương và phiếu đánh giá chuẩn áp dụng cho Học viên Cao học và Giảng viên hướng dẫn tại Trường Đại học An Giang (ĐHQG-HCM).
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Grid Biểu Mẫu */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Danh mục Biểu mẫu Hành chính & Luận văn</h2>
            <p className="text-sm text-slate-500">Tải về máy để chỉnh sửa trên Microsoft Word, LibreOffice hoặc Google Docs</p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            {formList.length} biểu mẫu chuẩn
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formList.map(form => (
            <div
              key={form.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                    {form.code}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {form.category}
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-snug">{form.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{form.description}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
                  <p className="font-semibold text-slate-800">Hướng dẫn sử dụng:</p>
                  <p className="mt-1 text-[11px] text-slate-600 leading-normal">{form.instruction}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{form.fileSize}</span>
                <a
                  href={form.fileName}
                  download
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Tải biểu mẫu
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thông tin Quy định & Lưu ý */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <ShieldCheck className="h-5 w-5 text-amber-700" />
            Lưu ý bắt buộc đối với Học viên Cao học
          </div>
          <ul className="mt-3 space-y-2 text-xs text-amber-800 leading-relaxed list-disc list-inside">
            <li>Tất cả biểu mẫu phải được điền đầy đủ thông tin, in trên giấy A4 trắng, rõ ràng.</li>
            <li>Trước khi nộp hồ sơ bảo vệ, học viên phải hoàn thành nghĩa vụ học phí và đáp ứng chốt chặn 4 điều kiện Gatekeeper (Turnitin ≤ 20%, 01 bài báo khoa học Đạt, chứng chỉ VSTEP B2/IELTS 5.5+ Đạt).</li>
            <li>Mọi chữ ký của Cán bộ hướng dẫn và Thành viên Hội đồng phải là chữ ký tay trực tiếp hoặc chữ ký số hợp lệ.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <HelpCircle className="h-5 w-5 text-sky-600" />
            Liên hệ Hỗ trợ Sau Đại học (AGU)
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
            <p><strong>Cơ quan tiếp nhận:</strong> Phòng Đào tạo & Quản lý Sau Đại học - Trường Đại học An Giang</p>
            <p><strong>Địa chỉ:</strong> Số 18 Ung Văn Khiêm, P. Đông Xuyên, TP. Long Xuyên, Tỉnh An Giang</p>
            <p><strong>Email chuyên môn:</strong> <span className="font-mono text-sky-700">sdh@agu.edu.vn</span></p>
            <p><strong>Thời gian làm việc:</strong> Thứ Hai – Thứ Sáu (Sáng: 07:00 – 11:00, Chiều: 13:00 – 17:00)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
