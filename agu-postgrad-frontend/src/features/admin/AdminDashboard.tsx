import { useEffect } from 'react';
import { useState } from 'react';
import { Check, CheckCircle2, Clipboard, X } from 'lucide-react';
import { AdmissionsSection } from './AdmissionsSection';
import { CommitteesSection } from './CommitteesSection';
import { LecturersSection } from './LecturersSection';
import { useAdminDashboard } from './useAdminDashboard';
import type { AdminSection } from '../../types';

export const AdminDashboard = ({ section }: { section: AdminSection }) => {
  const dashboard = useAdminDashboard();
  const { loadError, actionError, notice, setNotice, issuedAccount, setIssuedAccount } = dashboard;
  const [copyError, setCopyError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notice, setNotice]);

  const sectionTitle = section === 'admissions'
    ? 'Quản lý tuyển sinh'
    : section === 'committees'
      ? 'Thành lập hội đồng'
      : 'Quản lý giảng viên';

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
      setCopyError('');
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError('Không thể sao chép tự động. Vui lòng chọn và sao chép thông tin trong hộp thoại.');
    }
  };

  return (
    <section className="mx-auto my-8 max-w-7xl space-y-6 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Phòng Sau Đại học</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{sectionTitle}</h1>
            <p className="mt-2 text-slate-600">
              {section === 'admissions'
                ? 'Xem, xét duyệt hồ sơ dự tuyển và công nhận trúng tuyển.'
                : section === 'committees'
                  ? 'Thành lập hội đồng bảo vệ luận văn với 5 giảng viên.'
                  : 'Xem thông tin, thêm mới, cập nhật và xóa tài khoản giảng viên.'}
            </p>
          </div>
        </div>
      </div>

      {(loadError || actionError) && (
        <div className="space-y-2" aria-live="polite">
          {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p>}
          {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{actionError}</p>}
        </div>
      )}

      {notice && (
        <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6" aria-live="polite">
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-lg"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
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
            {copyError && <p role="alert" className="mt-3 text-sm text-rose-700">{copyError}</p>}
            {copied && <p role="status" className="mt-3 text-sm text-emerald-700">Đã sao chép thông tin tài khoản.</p>}

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

      {section === 'admissions' ? (
        <AdmissionsSection dashboard={dashboard} />
      ) : section === 'committees' ? (
        <CommitteesSection dashboard={dashboard} />
      ) : (
        <LecturersSection dashboard={dashboard} />
      )}
    </section>
  );
};
