import { useState } from 'react';
import { Check, CheckCircle2, Clipboard, X } from 'lucide-react';
import { MucTongQuan } from './MucTongQuan';
import { MucHocVien } from './MucHocVien';
import { AdmissionsSection } from './MucTuyenSinh';
import { CommitteesSection } from './MucHoiDong';
import { LecturersSection } from './MucGiangVien';
import { AcademicAndTuitionSection } from './MucHocPhanHocPhi';
import { useAdminDashboard } from './useDuLieuQuanTri';
import type { AdminSection, TabType } from '../../types';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';

interface AdminDashboardProps {
  section: AdminSection;
  onNavigateTab?: (tab: TabType) => void;
}

export const AdminDashboard = ({ section, onNavigateTab }: AdminDashboardProps) => {
  const dashboard = useAdminDashboard();
  const { loadError, actionError, notice, issuedAccount, setIssuedAccount } = dashboard;
  const [copied, setCopied] = useState(false);

  useBrowserAlert(loadError, dashboard.setLoadError);
  useBrowserAlert(actionError, dashboard.setActionError);
  useBrowserAlert(notice, dashboard.setNotice);

  const sectionTitle =
    section === 'overview'
      ? 'Tổng quan hệ thống đào tạo'
      : section === 'students'
        ? 'Quản lý học viên cao học'
        : section === 'admissions'
          ? 'Quản lý tuyển sinh'
          : section === 'committees'
            ? 'Thành lập hội đồng'
            : section === 'lecturers'
              ? 'Quản lý giảng viên'
              : section === 'academics'
                ? 'Quản lý học kỳ, học phần, lớp và lịch giảng dạy'
                : 'Quản lý thu học phí và xác nhận biên lai';

  const sectionDescription =
    section === 'overview'
      ? 'Báo cáo số liệu tổng quan, phân tích tuyển sinh, học viên, giảng viên và các hoạt động sau đại học.'
      : section === 'students'
        ? ''
        : section === 'admissions'
          ? 'Xem, xét duyệt hồ sơ dự tuyển và công nhận trúng tuyển.'
          : section === 'committees'
            ? 'Thành lập hội đồng bảo vệ luận văn với 5 giảng viên.'
            : section === 'lecturers'
              ? 'Xem thông tin, thêm mới, cập nhật và xóa tài khoản giảng viên.'
              : section === 'academics'
                ? 'Tạo học kỳ, học phần, mở lớp, phân công giảng viên và xếp lịch.'
                : 'Tạo khoản học phí, theo dõi công nợ và duyệt biên lai thanh toán.';

  const copyCredentials = async () => {
    if (!issuedAccount) return;
    const credentials = [
      `Học viên: ${issuedAccount.fullName}`,
      `Mã học viên: ${issuedAccount.studentCode}`,
      `Tên đăng nhập: ${issuedAccount.username}`,
      `Mật khẩu tạm thời: ${issuedAccount.temporaryPassword}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      window.alert('Đã sao chép thông tin tài khoản.');
    } catch {
      setCopied(false);
      window.alert('Không thể sao chép tự động. Vui lòng chọn và sao chép thông tin trong hộp thoại.');
    }
  };

  return (
    <section className="mx-auto my-8 max-w-7xl space-y-6 px-4">
      {section !== 'overview' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Phòng Sau Đại học</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">{sectionTitle}</h1>
              {sectionDescription && <p className="mt-2 text-slate-600">{sectionDescription}</p>}
            </div>
          </div>
        </div>
      )}

      {issuedAccount && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIssuedAccount(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="issued-account-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 id="issued-account-title" className="text-xl font-bold text-slate-900">
                  Đã công nhận trúng tuyển
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tài khoản học viên của {issuedAccount.fullName} đã được tạo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssuedAccount(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng thông tin tài khoản"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <dl className="mt-5 space-y-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <dt className="text-slate-600">Mã học viên</dt>
                <dd className="break-all font-bold text-slate-900">{issuedAccount.studentCode}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <dt className="text-slate-600">Tên đăng nhập</dt>
                <dd className="break-all font-bold text-slate-900">{issuedAccount.username}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <dt className="text-slate-600">Mật khẩu tạm thời</dt>
                <dd className="break-all font-mono font-bold text-slate-900">{issuedAccount.temporaryPassword}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-relaxed text-amber-800">
              Hãy chuyển thông tin đăng nhập trực tiếp và an toàn cho học viên. Khuyến nghị đổi mật khẩu sau lần đăng nhập đầu tiên.
            </p>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setIssuedAccount(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void copyCredentials()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Sao chép thông tin
              </button>
            </div>
          </section>
        </div>
      )}

      {section === 'overview' ? (
        <MucTongQuan dashboard={dashboard} onNavigateTab={onNavigateTab} />
      ) : section === 'students' ? (
        <MucHocVien dashboard={dashboard} />
      ) : section === 'admissions' ? (
        <AdmissionsSection dashboard={dashboard} />
      ) : section === 'committees' ? (
        <CommitteesSection dashboard={dashboard} />
      ) : section === 'lecturers' ? (
        <LecturersSection dashboard={dashboard} />
      ) : (
        <AcademicAndTuitionSection
          mode={section === 'academics' ? 'academics' : 'tuition'}
          students={dashboard.students}
          lecturers={dashboard.lecturers}
        />
      )}
    </section>
  );
};
