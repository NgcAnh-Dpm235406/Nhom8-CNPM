import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Eye,
  X,
  BookOpen,
  FileCheck,
  Award,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { AdminDashboardModel } from './useDuLieuQuanTri';
import type { AdminStudent, PublicationRecord, LanguageCertRecord } from '../../types';

interface MucHocVienProps {
  dashboard: AdminDashboardModel;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '---';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dateStr;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Đang học':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Bảo lưu':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Đã tốt nghiệp':
    case 'Tốt nghiệp':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Buộc thôi học':
    case 'Thôi học':
    case 'Đình chỉ':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const MucHocVien = ({ dashboard }: MucHocVienProps) => {
  const {
    students,
    isLoadingStudents,
    studentsError,
    loadStudents,
    handleUpdateStudentAcademicStatus,
    handleToggleStudentAccountStatus,
    handleResetStudentPassword
  } = dashboard;

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('ALL');
  const [filterAcademicStatus, setFilterAcademicStatus] = useState('ALL');
  const [filterAccountStatus, setFilterAccountStatus] = useState('ALL');

  // Modal Detail State
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null);

  // Chuẩn đầu ra (Bài báo KH & Chứng chỉ Ngoại ngữ) trong Modal
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [languageCerts, setLanguageCerts] = useState<LanguageCertRecord[]>([]);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(false);
  const [isReviewingOutput, setIsReviewingOutput] = useState(false);

  const loadStudentOutputs = useCallback(async (studentId: number | string) => {
    setIsLoadingOutputs(true);
    try {
      const token = localStorage.getItem('agu_token');
      const response = await fetch(`/api/admin/students/${studentId}/outputs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setPublications(data.publications || []);
        setLanguageCerts(data.languageCerts || []);
      }
    } catch (err) {
      console.error('Lỗi tải chuẩn đầu ra của học viên:', err);
    } finally {
      setIsLoadingOutputs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      void loadStudentOutputs(selectedStudent.student_id);
    } else {
      setPublications([]);
      setLanguageCerts([]);
    }
  }, [selectedStudent, loadStudentOutputs]);

  const handleReviewPublication = async (pubId: number, status: 'Đạt' | 'Không đạt') => {
    if (!selectedStudent) return;
    setIsReviewingOutput(true);
    try {
      const token = localStorage.getItem('agu_token');
      const response = await fetch(`/api/admin/publications/${pubId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái bài báo.');
      }
      await loadStudentOutputs(selectedStudent.student_id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Lỗi khi duyệt bài báo.');
    } finally {
      setIsReviewingOutput(false);
    }
  };

  const handleReviewLanguageCert = async (certId: number, status: 'Đạt yêu cầu' | 'Không hợp lệ') => {
    if (!selectedStudent) return;
    setIsReviewingOutput(true);
    try {
      const token = localStorage.getItem('agu_token');
      const response = await fetch(`/api/admin/language-certs/${certId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái chứng chỉ.');
      }
      await loadStudentOutputs(selectedStudent.student_id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Lỗi khi duyệt chứng chỉ ngoại ngữ.');
    } finally {
      setIsReviewingOutput(false);
    }
  };

  // Distinct majors for filtering
  const distinctMajors = useMemo(() => {
    const map = new Map<number, string>();
    students.forEach(s => {
      if (s.major_id && s.major_name) {
        map.set(s.major_id, s.major_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        !searchTerm.trim() ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.phone.includes(searchTerm.trim()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchMajor = filterMajor === 'ALL' || String(s.major_id) === filterMajor;
      const matchAcademic = filterAcademicStatus === 'ALL' || s.academic_status === filterAcademicStatus;
      const matchAccount = filterAccountStatus === 'ALL' || s.account_status === filterAccountStatus;

      return matchSearch && matchMajor && matchAcademic && matchAccount;
    });
  }, [students, searchTerm, filterMajor, filterAcademicStatus, filterAccountStatus]);

  // Export to Excel
  const handleExportExcel = async () => {
    if (filteredStudents.length === 0) {
      window.alert('Không có học viên nào phù hợp để xuất danh sách.');
      return;
    }

    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách học viên');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã học viên', key: 'student_code', width: 16 },
        { header: 'Họ và tên', key: 'full_name', width: 26 },
        { header: 'Ngày sinh', key: 'dob', width: 14 },
        { header: 'Số CCCD', key: 'id_card_number', width: 16 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Chuyên ngành', key: 'major_name', width: 32 },
        { header: 'Khóa học', key: 'cohort', width: 15 },
        { header: 'Định hướng', key: 'orientation', width: 15 },
        { header: 'Trạng thái học vụ', key: 'academic_status', width: 20 },
        { header: 'Tài khoản đăng nhập', key: 'username', width: 20 },
        { header: 'Trạng thái tài khoản', key: 'account_status', width: 20 },
        { header: 'Giảng viên hướng dẫn', key: 'lecturer_name', width: 25 },
        { header: 'Đề tài luận văn', key: 'thesis_title', width: 40 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0284C7' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 28;

      filteredStudents.forEach((s, idx) => {
        const row = worksheet.addRow({
          stt: idx + 1,
          student_code: s.student_code,
          full_name: s.full_name,
          dob: formatDate(s.dob),
          id_card_number: s.id_card_number,
          email: s.email,
          phone: s.phone,
          major_name: s.major_name,
          cohort: s.cohort,
          orientation: s.orientation,
          academic_status: s.academic_status,
          username: s.username,
          account_status: s.account_status === 'Active' ? 'Hoạt động' : 'Đã khóa',
          lecturer_name: s.lecturer_name ? `${s.lecturer_name} (${s.lecturer_degree || ''})` : 'Chưa phân công',
          thesis_title: s.thesis_title || 'Chưa đăng ký'
        });
        row.alignment = { vertical: 'middle' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Danh_sach_hoc_vien_AGU_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi xuất file Excel:', err);
      window.alert('Không thể xuất file Excel. Vui lòng thử lại sau.');
    }
  };

  // Quick stats
  const activeCount = students.filter(s => s.academic_status === 'Đang học').length;
  const reservedCount = students.filter(s => s.academic_status === 'Bảo lưu').length;
  const graduatedCount = students.filter(s => s.academic_status === 'Đã tốt nghiệp' || s.academic_status === 'Tốt nghiệp').length;
  const lockedCount = students.filter(s => s.account_status !== 'Active').length;
  const statisticsUnavailable = students.length === 0 && (isLoadingStudents || Boolean(studentsError));
  const displayedCount = statisticsUnavailable ? '—' : students.length;
  const displayStatistic = (value: number) => (statisticsUnavailable ? '—' : value);

  return (
    <div className="space-y-6">
      {/* 1. Quick Stats Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số học viên</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{displayedCount}</p>
          <span className="text-xs text-slate-400">Đã đăng ký hồ sơ</span>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang theo học</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{displayStatistic(activeCount)}</p>
          <span className="text-xs text-slate-400">Đang học chính quy</span>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bảo lưu / Chờ</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{displayStatistic(reservedCount)}</p>
          <span className="text-xs text-slate-400">Tạm dừng tiến độ</span>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã tốt nghiệp</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{displayStatistic(graduatedCount)}</p>
          <span className="text-xs text-slate-400">Đã bảo vệ xong</span>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài khoản bị khóa</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{displayStatistic(lockedCount)}</p>
          <span className="text-xs text-slate-400">Tạm khóa truy cập</span>
        </div>
      </div>

      {/* 2. Filter & Action Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MSSV, Họ tên, Email, Số điện thoại, Username..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Xuất Excel ({filteredStudents.length})</span>
            </button>
            <button
              type="button"
              onClick={() => void loadStudents()}
              disabled={isLoadingStudents}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-sky-600 ${isLoadingStudents ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="shrink-0 text-slate-500">Chuyên ngành:</span>
            <select
              value={filterMajor}
              onChange={e => setFilterMajor(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-sky-500 bg-white"
            >
              <option value="ALL">Tất cả chuyên ngành</option>
              {distinctMajors.map(m => (
                <option key={m.id} value={String(m.id)}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="shrink-0 text-slate-500">Học vụ:</span>
            <select
              value={filterAcademicStatus}
              onChange={e => setFilterAcademicStatus(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-sky-500 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Bảo lưu">Bảo lưu</option>
              <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
              <option value="Buộc thôi học">Buộc thôi học</option>
              <option value="Đình chỉ">Đình chỉ</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="shrink-0 text-slate-500">Tài khoản:</span>
            <select
              value={filterAccountStatus}
              onChange={e => setFilterAccountStatus(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-sky-500 bg-white"
            >
              <option value="ALL">Tất cả tài khoản</option>
              <option value="Active">Đang hoạt động</option>
              <option value="Inactive">Đang bị khóa</option>
            </select>
          </label>
        </div>
      </div>

      {studentsError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">Không tải được danh sách học viên.</p>
            <p className="mt-1">{studentsError}</p>
            <p className="mt-1 text-xs">Kiểm tra đăng nhập quyền ADMIN và kết nối backend, rồi thử tải lại.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadStudents()}
            disabled={isLoadingStudents}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStudents ? 'animate-spin' : ''}`} />
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Main Student Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3.5">Học viên</th>
                <th scope="col" className="px-4 py-3.5">Chuyên ngành & Khóa</th>
                <th scope="col" className="px-4 py-3.5">GV Hướng dẫn / Luận văn</th>
                <th scope="col" className="px-4 py-3.5">Trạng thái học vụ</th>
                <th scope="col" className="px-4 py-3.5">Tài khoản</th>
                <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-sky-600 mb-2" />
                    Đang tải danh sách học viên...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    {studentsError
                      ? 'Không có dữ liệu để hiển thị do danh sách chưa tải được.'
                      : 'Không tìm thấy học viên nào phù hợp với bộ lọc tìm kiếm.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id} className="hover:bg-slate-50/80 transition">
                    {/* Cột 1: Mã HV & Họ tên */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 font-bold text-white shadow-sm text-xs">
                          {student.full_name.trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{student.full_name}</p>
                          <p className="font-mono font-semibold text-sky-700 text-xs">{student.student_code}</p>
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Chuyên ngành & Khóa */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{student.major_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {student.cohort} - Định hướng: <span className="font-medium text-slate-700">{student.orientation}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">Tổng tín chỉ: {student.total_credits}</p>
                    </td>

                    {/* Cột 3: GVHD & Luận văn */}
                    <td className="px-4 py-3.5">
                      {student.lecturer_name ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.lecturer_name}
                            {student.lecturer_degree && (
                              <span className="text-[11px] font-normal text-slate-500 ml-1">({student.lecturer_degree})</span>
                            )}
                          </p>
                          {student.thesis_title ? (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs" title={student.thesis_title}>
                              Luận văn: {student.thesis_title}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Chưa đăng ký tên đề tài</p>
                          )}
                          {student.progress_percent !== null && (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${student.progress_percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600">
                                {student.progress_percent}%
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân công GVHD</span>
                      )}
                    </td>

                    {/* Cột 4: Trạng thái học vụ */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                            student.academic_status
                          )}`}
                        >
                          {student.academic_status}
                        </span>
                        <div>
                          <select
                            value={student.academic_status}
                            disabled={isUpdatingStatus === String(student.student_id)}
                            onChange={async e => {
                              const newStatus = e.target.value;
                              setIsUpdatingStatus(String(student.student_id));
                              await handleUpdateStudentAcademicStatus(student.student_id, newStatus);
                              setIsUpdatingStatus(null);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none hover:border-slate-300 focus:border-sky-500"
                            title="Thay đổi trạng thái học vụ"
                          >
                            <option value="Đang học">Đang học</option>
                            <option value="Bảo lưu">Bảo lưu</option>
                            <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                            <option value="Buộc thôi học">Buộc thôi học</option>
                            <option value="Đình chỉ">Đình chỉ</option>
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Cột 5: Tài khoản */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {student.account_status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              Đã khóa
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-slate-500">@{student.username}</p>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              window.confirm(
                                student.account_status === 'Active'
                                  ? `Bạn có chắc muốn tạm khóa tài khoản @${student.username}?`
                                  : `Bạn có muốn mở khóa tài khoản @${student.username}?`
                              )
                            ) {
                              await handleToggleStudentAccountStatus(student.student_id, student.account_status);
                            }
                          }}
                          className={`text-[10px] font-semibold underline ${
                            student.account_status === 'Active'
                              ? 'text-rose-600 hover:text-rose-800'
                              : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                        >
                          {student.account_status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        </button>
                      </div>
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-sky-700 transition"
                          title="Xem chi tiết & Duyệt chuẩn đầu ra"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Chi tiết / Duyệt CĐR</span>
                        </button>
                        <button
                          type="button"
                          disabled={isResettingPassword === String(student.student_id)}
                          onClick={async () => {
                            if (
                              window.confirm(
                                `Xác nhận cấp lại mật khẩu tạm thời cho học viên ${student.full_name} (${student.student_code})?`
                              )
                            ) {
                              setIsResettingPassword(String(student.student_id));
                              await handleResetStudentPassword(student.student_id);
                              setIsResettingPassword(null);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                          title="Đặt lại mật khẩu tạm thời"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                          <span>Reset MK</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Student Detail & Output Approval Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setSelectedStudent(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-lg font-bold text-white shadow-md">
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 id="student-detail-title" className="text-xl font-bold text-slate-900">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    MSSV: <strong className="font-mono text-sky-700">{selectedStudent.student_code}</strong> •{' '}
                    {selectedStudent.major_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs">
              {/* Cột trái: Cá nhân & Liên hệ */}
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-sky-600" />
                  Thông tin cá nhân & Liên hệ
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Họ và tên:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.full_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Ngày sinh:</dt>
                    <dd className="font-semibold text-slate-800">{formatDate(selectedStudent.dob)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Số CCCD:</dt>
                    <dd className="font-mono font-semibold text-slate-800">{selectedStudent.id_card_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Số điện thoại:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Email liên lạc:</dt>
                    <dd className="font-semibold text-slate-800 break-all">{selectedStudent.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Địa chỉ:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.address || 'Chưa cập nhật'}</dd>
                  </div>
                </dl>
              </div>

              {/* Cột phải: Thông tin đào tạo & Học vụ */}
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Chương trình & Tiến độ
                </h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Mã ngành:</dt>
                    <dd className="font-mono font-semibold text-slate-800">{selectedStudent.major_code}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Khóa học:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.cohort}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Định hướng:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.orientation}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tổng tín chỉ:</dt>
                    <dd className="font-semibold text-slate-800">{selectedStudent.total_credits} tín chỉ</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Ngày nhập học:</dt>
                    <dd className="font-semibold text-slate-800">{formatDate(selectedStudent.enrollment_date)}</dd>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <dt className="text-slate-500">Trạng thái học vụ:</dt>
                    <dd>
                      <span className={`rounded-md border px-2 py-0.5 font-bold ${getStatusBadge(selectedStudent.academic_status)}`}>
                        {selectedStudent.academic_status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Thông tin GVHD & Luận văn */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-sky-700" />
                Hướng dẫn khoa học & Luận văn Thạc sĩ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500">Giảng viên hướng dẫn:</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedStudent.lecturer_name
                      ? `${selectedStudent.lecturer_name} (${selectedStudent.lecturer_degree || ''})`
                      : 'Chưa phân công giảng viên hướng dẫn'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Giai đoạn luận văn:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedStudent.current_stage || 'Chưa khởi động'} (
                    {selectedStudent.progress_percent !== null ? `${selectedStudent.progress_percent}%` : '0%'})
                  </p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Tên đề tài luận văn:</p>
                <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">
                  {selectedStudent.thesis_title || 'Chưa đăng ký đề tài'}
                </p>
              </div>
            </div>

            {/* PHẦN BỔ SUNG: DUYỆT CHUẨN ĐẦU RA (BÀI BÁO KH & CHỨNG CHỈ NGOẠI NGỮ) */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-indigo-600" />
                  Thẩm định Chuẩn đầu ra (Điều kiện Gatekeeper bảo vệ Luận văn)
                </h4>
                {isLoadingOutputs && <span className="text-slate-400">Đang tải minh chứng...</span>}
              </div>

              {/* 1. Bài báo khoa học */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5 text-sky-600" />
                  1. Công bố Khoa học ({publications.length})
                </p>
                {publications.length === 0 ? (
                  <p className="italic text-slate-400 pl-5">Học viên chưa nộp bài báo khoa học nào.</p>
                ) : (
                  <div className="space-y-2">
                    {publications.map(pub => (
                      <div
                        key={pub.publication_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{pub.paper_title}</p>
                          <p className="text-slate-500">
                            Tạp chí/Hội nghị: <span className="font-medium text-slate-700">{pub.journal_name}</span> ({pub.ranking})
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                pub.status === 'Đạt'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : pub.status === 'Không đạt'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {pub.status}
                            </span>
                            {pub.evidence_file && (
                              <a
                                href={pub.evidence_file}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Xem file bài báo
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isReviewingOutput || pub.status === 'Đạt'}
                            onClick={() => void handleReviewPublication(pub.publication_id, 'Đạt')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Duyệt Đạt
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingOutput || pub.status === 'Không đạt'}
                            onClick={() => void handleReviewPublication(pub.publication_id, 'Không đạt')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Chứng chỉ ngoại ngữ */}
              <div className="space-y-2 pt-2 border-t border-indigo-100">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-600" />
                  2. Chứng chỉ Ngoại ngữ Chuẩn đầu ra ({languageCerts.length})
                </p>
                {languageCerts.length === 0 ? (
                  <p className="italic text-slate-400 pl-5">Học viên chưa nộp chứng chỉ ngoại ngữ nào.</p>
                ) : (
                  <div className="space-y-2">
                    {languageCerts.map(cert => (
                      <div
                        key={cert.cert_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">
                            {cert.cert_type} — Điểm/Bậc: <span className="text-indigo-700">{cert.score_achieved}</span>
                          </p>
                          <p className="text-slate-500">Ngày cấp: {formatDate(cert.issue_date)}</p>
                          <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                cert.status === 'Đạt yêu cầu'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cert.status === 'Không hợp lệ'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cert.status}
                            </span>
                            {cert.certificate_file_url && (
                              <a
                                href={cert.certificate_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Xem bản scan chứng chỉ
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isReviewingOutput || cert.status === 'Đạt yêu cầu'}
                            onClick={() => void handleReviewLanguageCert(cert.cert_id, 'Đạt yêu cầu')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đạt yêu cầu
                          </button>
                          <button
                            type="button"
                            disabled={isReviewingOutput || cert.status === 'Không hợp lệ'}
                            onClick={() => void handleReviewLanguageCert(cert.cert_id, 'Không hợp lệ')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Không hợp lệ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin tài khoản & Hành động quản trị */}
            <div className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
              <div>
                <p className="text-slate-500">Tài khoản sinh viên:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-slate-900 text-sm">@{selectedStudent.username}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                      selectedStudent.account_status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedStudent.account_status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleToggleStudentAccountStatus(selectedStudent.student_id, selectedStudent.account_status);
                    setSelectedStudent(prev =>
                      prev
                        ? {
                            ...prev,
                            account_status: prev.account_status === 'Active' ? 'Inactive' : 'Active'
                          }
                        : null
                    );
                  }}
                  className={`rounded-xl px-3 py-2 font-semibold transition ${
                    selectedStudent.account_status === 'Active'
                      ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                      : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {selectedStudent.account_status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Xác nhận reset mật khẩu tạm thời cho học viên ${selectedStudent.full_name}?`
                      )
                    ) {
                      await handleResetStudentPassword(selectedStudent.student_id);
                      setSelectedStudent(null);
                    }
                  }}
                  className="rounded-xl bg-amber-600 px-3.5 py-2 font-semibold text-white hover:bg-amber-700 transition"
                >
                  Cấp lại mật khẩu
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};