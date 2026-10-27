import { useState, useMemo } from 'react';
import type { AdminDashboardModel, ReviewStatus } from './useAdminDashboard';

export const AdmissionsSection = ({ dashboard }: { dashboard: AdminDashboardModel }) => {
  const {
    profiles,
    filterStatus,
    setFilterStatus,
    isLoading,
    filteredProfiles,
    busyProfileId,
    handleReview,
    handleAdmit,
    formatDate
  } = dashboard;

  // State cục bộ cho thanh tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc thêm dựa trên từ khóa tìm kiếm (Tên, CCCD, Email)
  const displayProfiles = useMemo(() => {
    if (!searchTerm.trim()) return filteredProfiles;
    const lowerTerm = searchTerm.toLowerCase();
    return filteredProfiles.filter(p => 
      p.full_name.toLowerCase().includes(lowerTerm) ||
      p.id_card_number.includes(lowerTerm) ||
      p.email.toLowerCase().includes(lowerTerm)
    );
  }, [filteredProfiles, searchTerm]);

  // Hàm hỗ trợ chọn màu cho Badge trạng thái
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Đạt yêu cầu': return 'bg-emerald-100 text-emerald-800';
      case 'Chờ xét duyệt': return 'bg-amber-100 text-amber-800';
      case 'Cần bổ sung': return 'bg-sky-100 text-sky-800';
      case 'Không đạt': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. THẺ THỐNG KÊ (METRIC CARDS) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Thẻ: Tổng hồ sơ */}
        <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-sky-600">Tổng hồ sơ</p>
            <p className="mt-1 text-3xl font-bold text-sky-900">{profiles.length}</p>
          </div>
          <div className="rounded-full bg-sky-100 p-3 text-sky-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        </div>

        {/* Thẻ: Chờ xét duyệt */}
        <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-amber-600">Chờ xét duyệt</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">
              {profiles.filter(profile => profile.status === 'Chờ xét duyệt').length}
            </p>
          </div>
          <div className="rounded-full bg-amber-100 p-3 text-amber-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Thẻ: Đã nhập học */}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-emerald-600">Đã nhập học</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">
              {profiles.filter(profile => profile.admission_status === 'Đã nhập học').length}
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. BẢNG DANH SÁCH & CÔNG CỤ TÌM KIẾM */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        
        {/* Thanh công cụ (Header của bảng) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">Danh sách hồ sơ dự tuyển</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Thanh tìm kiếm */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên, CCCD, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-w-[200px] rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-sky-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Bộ lọc trạng thái */}
            <select
              value={filterStatus}
              onChange={event => setFilterStatus(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option>Tất cả trạng thái</option>
              <option>Chờ xét duyệt</option>
              <option>Đạt yêu cầu</option>
              <option>Cần bổ sung</option>
              <option>Không đạt</option>
            </select>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        {isLoading ? (
          <p className="p-10 text-center text-slate-500">Đang tải hồ sơ...</p>
        ) : displayProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-slate-500">
            <svg className="mb-2 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Không tìm thấy hồ sơ phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Thí sinh</th>
                  <th className="px-5 py-4">Liên hệ</th>
                  <th className="px-5 py-4">Đợt tuyển sinh</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4">Kết quả</th>
                  <th className="px-5 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayProfiles.map(profile => {
                  const isBusy = busyProfileId === String(profile.profile_id);
                  const alreadyAdmitted = profile.admission_status === 'Đã nhập học' || Boolean(profile.student_code);
                  
                  // Lấy chữ cái đầu của tên để làm Avatar
                  const initials = profile.full_name.charAt(0).toUpperCase();

                  return (
                    <tr key={profile.profile_id} className="align-middle hover:bg-slate-50/50">
                      
                      {/* Cột Thí Sinh (Có Avatar) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{profile.full_name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">CCCD: {profile.id_card_number}</p>
                            <p className="text-xs text-slate-500">Nộp: {formatDate(profile.created_at)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cột Liên Hệ */}
                      <td className="px-5 py-4 text-slate-600">
                        <p className="font-medium text-slate-800">{profile.phone}</p>
                        <p className="text-xs">{profile.email}</p>
                      </td>

                      {/* Cột Đợt Tuyển Sinh */}
                      <td className="px-5 py-4 text-slate-600">
                        <p className="line-clamp-2 max-w-[200px] text-xs leading-snug">{profile.campaign_name}</p>
                      </td>

                      {/* Cột Trạng Thái (Có màu sắc) */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(profile.status)}`}>
                          {profile.status}
                        </span>
                      </td>

                      {/* Cột Kết Quả */}
                      <td className="px-5 py-4 text-slate-600">
                        <p className="text-xs font-medium">{profile.admission_status}</p>
                        {profile.student_code && (
                          <span className="mt-1 inline-flex rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                            MSSV: {profile.student_code}
                          </span>
                        )}
                      </td>

                      {/* Cột Thao Tác */}
                      <td className="min-w-[280px] px-5 py-4">
                        {alreadyAdmitted ? (
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Đã hoàn tất nhập học
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Nhóm Nút Xét Duyệt */}
                            <div className="flex divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-300 bg-white">
                              {(['Đạt yêu cầu', 'Cần bổ sung', 'Không đạt'] as ReviewStatus[]).map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleReview(profile, status)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                                >
                                  {status}
                                </button>
                              ))}
                            </div>

                            {/* Nút Nhập Học (Nổi bật) */}
                            {profile.status === 'Đạt yêu cầu' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleAdmit(profile)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isBusy ? 'Đang xử lý...' : 'Công nhận trúng tuyển'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};