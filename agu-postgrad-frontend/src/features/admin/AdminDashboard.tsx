import { AdmissionsSection } from './AdmissionsSection';
import { CommitteesSection } from './CommitteesSection';
import { LecturersSection } from './LecturersSection';
import { useAdminDashboard } from './useAdminDashboard';
import type { AdminSection } from '../../types';

export const AdminDashboard = ({ section }: { section: AdminSection }) => {
  const dashboard = useAdminDashboard();
  const { loadError, actionError, notice, issuedAccount } = dashboard;
  const sectionTitle = section === 'admissions'
    ? 'Quản lý tuyển sinh'
    : section === 'committees'
      ? 'Thành lập hội đồng'
      : 'Quản lý giảng viên';

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

      {(loadError || actionError || notice) && (
        <div className="space-y-2" aria-live="polite">
          {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p>}
          {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{actionError}</p>}
          {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
          {issuedAccount && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
              <p className="font-bold">Thông tin cấp cho {issuedAccount.fullName}</p>
              <p>Mã học viên: <strong>{issuedAccount.studentCode}</strong></p>
              <p>Tên đăng nhập: <strong>{issuedAccount.username}</strong></p>
              <p>Mật khẩu tạm thời: <strong>{issuedAccount.temporaryPassword}</strong></p>
              <p className="mt-2 text-xs">Hãy chuyển thông tin này cho học viên một cách an toàn.</p>
            </div>
          )}
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
