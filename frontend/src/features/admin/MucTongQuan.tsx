import React from 'react';
import {
  Users,
  GraduationCap,
  FileText,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  BookOpen
} from 'lucide-react';
import type { AdminDashboardModel } from './useDuLieuQuanTri';
import type { TabType } from '../../types';

interface MucTongQuanProps {
  dashboard: AdminDashboardModel;
  onNavigateTab?: (tab: TabType) => void;
}

const formatActionName = (action: string) => {
  switch (action) {
    case 'USER_LOGIN':
      return 'Đăng nhập hệ thống';
    case 'CREATE_ADMISSION_CAMPAIGN':
      return 'Tạo đợt tuyển sinh mới';
    case 'REVIEW_ADMISSION_PROFILE':
      return 'Xét duyệt hồ sơ dự tuyển';
    case 'ADMIT_CANDIDATE':
      return 'Công nhận trúng tuyển & cấp tài khoản';
    case 'CREATE_LECTURER':
      return 'Thêm tài khoản giảng viên';
    case 'UPDATE_LECTURER':
      return 'Cập nhật giảng viên';
    case 'DELETE_LECTURER':
      return 'Xóa giảng viên';
    case 'CREATE_DEFENSE_COMMITTEE':
      return 'Thành lập hội đồng bảo vệ';
    case 'UPDATE_DEFENSE_COMMITTEE':
      return 'Cập nhật thông tin hội đồng';
    case 'DELETE_DEFENSE_COMMITTEE':
      return 'Xóa hội đồng bảo vệ';
    case 'ADD_DEFENSE_SCHEDULE':
      return 'Xếp lịch bảo vệ luận văn';
    case 'SAVE_DEFENSE_EVALUATIONS':
      return 'Lưu điểm chấm bảo vệ luận văn';
    default:
      return action;
  }
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const MucTongQuan: React.FC<MucTongQuanProps> = ({ dashboard, onNavigateTab }) => {
  const { overviewData, isLoadingOverview, overviewError, loadOverview } = dashboard;
  const summary = overviewData?.summary;

  const totalCapacity = summary?.total_capacity || 0;
  const assignedSlots = summary?.assigned_slots || 0;
  const capacityPercent = totalCapacity > 0 ? Math.min(100, Math.round((assignedSlots / totalCapacity) * 100)) : 0;

  const totalMajorStudents =
    overviewData?.majors.reduce((acc, curr) => acc + (Number(curr.student_count) || 0), 0) || 1;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-5 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-3 py-1 text-xs font-semibold text-sky-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Dữ liệu trực tiếp theo thời gian thực
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo Thống kê & Tổng quan Đào tạo
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Trung tâm kiểm soát số liệu tuyển sinh, học viên, phân bổ giảng viên và hội đồng luận văn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOverview()}
          disabled={isLoadingOverview}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-sky-600 ${isLoadingOverview ? 'animate-spin' : ''}`} />
          <span>{isLoadingOverview ? 'Đang cập nhật...' : 'Làm mới số liệu'}</span>
        </button>
      </div>

      {overviewData ? (
      <>
      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Học viên */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Học viên Cao học</p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {summary?.total_students ?? 0}
              </h3>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span>
              Đang học: <strong className="text-emerald-600">{summary?.active_students ?? 0}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab?.('admin-students')}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Học viên <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Tuyển sinh */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hồ sơ Tuyển sinh</p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {summary?.total_profiles ?? 0}
              </h3>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-600">
              Chờ duyệt:{' '}
              <strong className={Number(summary?.pending_profiles) > 0 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                {summary?.pending_profiles ?? 0}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab?.('admin-admissions')}
              className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-800"
            >
              Xét duyệt <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Giảng viên & Hướng dẫn */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Giảng viên / HD</p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {summary?.total_lecturers ?? 0}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Tải: {assignedSlots}/{totalCapacity} slots</span>
              <span className="font-semibold">{capacityPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPercent > 80 ? 'bg-rose-500' : capacityPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Hội đồng luận văn */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hội đồng Bảo vệ</p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {summary?.total_committees ?? 0}
              </h3>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span>
              Luận văn đang làm: <strong className="text-purple-700">{summary?.active_theses ?? 0}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab?.('admin-committees')}
              className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-800"
            >
              Hội đồng <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Phân tích chi tiết: Ngành đào tạo & Tải giảng viên */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Phân bổ Học viên theo Ngành */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Phân bổ Học viên theo Chuyên ngành</h3>
                <p className="text-xs text-slate-500">Quy mô đào tạo sau đại học theo từng ngành</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {overviewData?.majors && overviewData.majors.length > 0 ? (
              overviewData.majors.map(m => {
                const count = Number(m.student_count) || 0;
                const percent = Math.round((count / totalMajorStudents) * 100);
                return (
                  <div key={m.major_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">
                        {m.major_name}{' '}
                        <span className="text-xs text-slate-400 font-mono">({m.major_code})</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {count} học viên ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">Chưa có dữ liệu phân bổ ngành học.</p>
            )}
          </div>
        </section>

        {/* Tải hướng dẫn của Giảng viên & Tình trạng hồ sơ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Tải Hướng dẫn Luận văn của Giảng viên</h3>
                  <p className="text-xs text-slate-500">Số lượng học viên đang nhận hướng dẫn / Hạn mức</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab?.('admin-lecturers')}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Quản lý GV
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {overviewData?.lecturersWorkload && overviewData.lecturersWorkload.length > 0 ? (
                overviewData.lecturersWorkload.slice(0, 5).map(lec => {
                  const assigned = Number(lec.current_assigned) || 0;
                  const max = Number(lec.max_slots) || 1;
                  const percent = Math.min(100, Math.round((assigned / max) * 100));
                  return (
                    <div key={lec.lecturer_id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{lec.full_name}</p>
                        <p className="text-xs text-slate-400">{lec.degree}</p>
                      </div>
                      <div className="w-36 shrink-0 text-right">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Đang HD:</span>
                          <span className="font-semibold text-slate-800">
                            {assigned} / {max} slots
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">Chưa có dữ liệu giảng viên.</p>
              )}
            </div>
          </div>

          {/* Trạng thái hồ sơ tuyển sinh badge pills */}
          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl">
            <p className="text-xs font-semibold text-slate-600 mb-2">Trạng thái hồ sơ tuyển sinh:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                Đạt yêu cầu: {summary?.approved_profiles ?? 0}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
                Chờ xét duyệt: {summary?.pending_profiles ?? 0}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 font-semibold text-indigo-800">
                Đã trúng tuyển: {summary?.admitted_profiles ?? 0}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1 font-semibold text-rose-800">
                Không đạt: {summary?.rejected_profiles ?? 0}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Action Items & Recent Audit Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Việc cần xử lý ngay */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Việc Cần Xử Lý Ngay</h3>
                <p className="text-xs text-slate-500">Hồ sơ chờ xét duyệt & ứng viên chờ xếp hội đồng</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Kiểm tra hồ sơ chờ duyệt */}
            {overviewData?.pendingProfiles && overviewData.pendingProfiles.length > 0 ? (
              overviewData.pendingProfiles.map(p => (
                <div
                  key={p.profile_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{p.full_name}</p>
                    <p className="text-xs text-slate-500">
                      SĐT: {p.phone} • Đợt: {p.campaign_name || 'Đang mở'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('admin-admissions')}
                    className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                  >
                    Duyệt ngay
                  </button>
                </div>
              ))
            ) : overviewData?.pendingDefenseCandidates && overviewData.pendingDefenseCandidates.length > 0 ? (
              overviewData.pendingDefenseCandidates.map(c => (
                <div
                  key={c.thesis_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{c.student_name} ({c.student_code})</p>
                    <p className="text-xs text-slate-500 truncate">Luận văn: {c.thesis_title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('admin-committees')}
                    className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition"
                  >
                    Lập hội đồng
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-sm font-semibold text-emerald-900">Hiện không có công việc tồn đọng!</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Tất cả hồ sơ tuyển sinh đã được xử lý và các ứng viên bảo vệ đã được sắp xếp hội đồng.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Nhật ký hoạt động gần đây (Audit Logs) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Nhật Ký Hoạt Động Gần Đây</h3>
                <p className="text-xs text-slate-500">Lịch sử thao tác nghiệp vụ trên hệ thống</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {overviewData?.recentLogs && overviewData.recentLogs.length > 0 ? (
              overviewData.recentLogs.map(log => (
                <div key={log.log_id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                  <div className="mt-0.5 rounded-full bg-sky-100 p-1 text-sky-700 shrink-0">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate">
                        {formatActionName(log.action)}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-500 truncate">
                      Thực hiện bởi: <strong className="text-slate-700">{log.user_display_name || log.username || 'Hệ thống'}</strong>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">Chưa có nhật ký hoạt động nào được ghi nhận.</p>
            )}
          </div>
        </section>
      </div>
      </>
      ) : (
        <div
          role={overviewError ? 'alert' : 'status'}
          className={`rounded-2xl border p-6 text-center ${
            overviewError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          <p className="font-semibold">
            {isLoadingOverview
              ? 'Đang tải số liệu tổng quan...'
              : overviewError || 'Chưa có dữ liệu tổng quan để hiển thị.'}
          </p>
          {overviewError && (
            <p className="mt-2 text-sm">
              Kiểm tra kết nối máy chủ, quyền ADMIN hoặc đăng nhập lại rồi nhấn “Làm mới số liệu”.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
