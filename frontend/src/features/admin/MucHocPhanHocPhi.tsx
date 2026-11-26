import { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  School,
  Clock,
  DollarSign,
  Search,
  Filter,
  Plus,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  X,
  CreditCard
} from 'lucide-react';
import { api } from '../../services/api';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';
import type { AdminTuitionRecord, AdminStudent, CourseClassRecord, CourseRecord, Lecturer } from '../../types';

interface Props {
  mode: 'academics' | 'tuition';
  students: AdminStudent[];
  lecturers: Lecturer[];
}

interface SemesterItem {
  semester_id: number;
  semester_name: string;
  start_date?: string;
  end_date?: string;
  is_grade_locked?: boolean;
}

export const AcademicAndTuitionSection = ({ mode, students, lecturers }: Props) => {
  // Navigation sub-tabs for academics
  const [academicTab, setAcademicTab] = useState<'semesters' | 'courses' | 'classes' | 'schedules'>('semesters');

  // Academic states
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [classes, setClasses] = useState<CourseClassRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [classSemesterFilter, setClassSemesterFilter] = useState('');

  // Tuition states
  const [tuitionList, setTuitionList] = useState<AdminTuitionRecord[]>([]);
  const [tuitionSearch, setTuitionSearch] = useState('');
  const [tuitionSemesterFilter, setTuitionSemesterFilter] = useState('');
  const [tuitionStatusFilter, setTuitionStatusFilter] = useState<string>('all');

  // Alerts
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useBrowserAlert(error, setError);
  useBrowserAlert(notice, setNotice);

  // Forms
  const [courseForm, setCourseForm] = useState({ courseCode: '', courseName: '', credits: 3, prerequisiteCourseId: '' });
  const [semesterForm, setSemesterForm] = useState({ semesterName: '', startDate: '', endDate: '' });
  const [classForm, setClassForm] = useState({ courseId: '', semesterId: '', className: '', maxStudents: 35, status: 'Mở đăng ký' });
  const [scheduleForm, setScheduleForm] = useState<Record<number, { lecturerId: string; roomName: string; dayOfWeek: number; startShift: number; endShift: number }>>({});

  // Tuition forms & Credit lookup
  const [tuitionForm, setTuitionForm] = useState({ studentId: '', semesterId: '', baseAmount: '', dueDate: '', paidAmount: 0, latePenaltyFee: 0 });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [studentCreditInfo, setStudentCreditInfo] = useState<{ totalCredits: number; creditPrice: number; calculatedTuition: number; courses: { course_code: string; course_name: string; credits: number; class_name: string }[] } | null>(null);

  // Batch tuition generation form
  const [batchSemesterId, setBatchSemesterId] = useState('');
  const [batchDueDate, setBatchDueDate] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Slip Review Modal state
  const [reviewModalTuition, setReviewModalTuition] = useState<AdminTuitionRecord | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'Đã xác nhận' | 'Từ chối'>('Đã xác nhận');
  const [reviewPaidAmount, setReviewPaidAmount] = useState<number>(0);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Loading data
  const loadAcademic = async () => {
    try {
      const [courseRes, semesterRes, classRes] = await Promise.all([
        api.academic.getCourses(),
        api.academic.getSemesters(),
        api.academic.getClasses()
      ]);
      setCourses(courseRes.courses || []);
      setSemesters(semesterRes.semesters || []);
      setClasses(classRes.classes || []);
      const drafts: typeof scheduleForm = {};
      (classRes.classes || []).forEach(item => {
        drafts[item.class_id] = {
          lecturerId: item.lecturer_id ? String(item.lecturer_id) : '',
          roomName: item.room_name || '',
          dayOfWeek: item.day_of_week || 7,
          startShift: item.start_shift || 1,
          endShift: item.end_shift || 4
        };
      });
      setScheduleForm(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu đào tạo.');
    }
  };

  const loadTuition = async () => {
    try {
      const [result, semesterRes] = await Promise.all([
        api.admin.getTuition(),
        api.academic.getSemesters()
      ]);
      setTuitionList(result.tuitionList || []);
      setSemesters(semesterRes.semesters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu học phí.');
    }
  };

  useEffect(() => {
    if (mode === 'academics') void loadAcademic();
    else void loadTuition();
  }, [mode]);

  // Handle student + semester change in Tuition Form -> Lookup credits
  useEffect(() => {
    if (tuitionForm.studentId && tuitionForm.semesterId) {
      setLookupLoading(true);
      api.admin.getStudentCredits(Number(tuitionForm.studentId), Number(tuitionForm.semesterId))
        .then(res => {
          setStudentCreditInfo(res);
          if (!tuitionForm.baseAmount && res.calculatedTuition > 0) {
            setTuitionForm(prev => ({ ...prev, baseAmount: String(res.calculatedTuition) }));
          }
        })
        .catch(() => {
          setStudentCreditInfo(null);
        })
        .finally(() => {
          setLookupLoading(false);
        });
    } else {
      setStudentCreditInfo(null);
    }
  }, [tuitionForm.studentId, tuitionForm.semesterId]);

  // Actions for Academics
  const createCourse = async () => {
    if (!courseForm.courseCode.trim() || !courseForm.courseName.trim()) {
      setError('Vui lòng nhập mã học phần và tên học phần.');
      return;
    }
    if (courseForm.credits <= 0) {
      setError('Số tín chỉ phải lớn hơn 0.');
      return;
    }
    try {
      const result = await api.academic.createCourse({
        courseCode: courseForm.courseCode.trim().toUpperCase(),
        courseName: courseForm.courseName.trim(),
        credits: courseForm.credits,
        prerequisiteCourseId: courseForm.prerequisiteCourseId ? Number(courseForm.prerequisiteCourseId) : null
      });
      setNotice(result.message);
      setCourseForm({ courseCode: '', courseName: '', credits: 3, prerequisiteCourseId: '' });
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo học phần.');
    }
  };

  const deleteCourse = async (courseId: number, courseCode: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa học phần ${courseCode}?`)) return;
    try {
      const result = await api.academic.deleteCourse(courseId);
      setNotice(result.message);
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa học phần.');
    }
  };

  const createSemester = async () => {
    if (!semesterForm.semesterName.trim() || !semesterForm.startDate || !semesterForm.endDate) {
      setError('Vui lòng nhập đầy đủ tên học kỳ, ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (new Date(semesterForm.endDate) <= new Date(semesterForm.startDate)) {
      setError('Ngày kết thúc phải diễn ra sau ngày bắt đầu học kỳ.');
      return;
    }
    try {
      const result = await api.academic.createSemester({
        semesterName: semesterForm.semesterName.trim(),
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate
      });
      setNotice(result.message);
      setSemesterForm({ semesterName: '', startDate: '', endDate: '' });
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo học kỳ.');
    }
  };

  const createClass = async () => {
    if (!classForm.courseId || !classForm.semesterId || !classForm.className.trim()) {
      setError('Vui lòng chọn học phần, học kỳ và nhập tên lớp.');
      return;
    }
    try {
      const result = await api.academic.createClass({
        courseId: Number(classForm.courseId),
        semesterId: Number(classForm.semesterId),
        className: classForm.className.trim(),
        maxStudents: classForm.maxStudents,
        status: classForm.status
      });
      setNotice(result.message);
      setClassForm({ courseId: '', semesterId: '', className: '', maxStudents: 35, status: 'Mở đăng ký' });
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo lớp học phần.');
    }
  };

  const deleteClass = async (classId: number, className: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lớp ${className}?`)) return;
    try {
      const result = await api.academic.deleteClass(classId);
      setNotice(result.message);
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa lớp học phần.');
    }
  };

  const saveSchedule = async (classId: number) => {
    const draft = scheduleForm[classId];
    if (!draft?.lecturerId || !draft.roomName.trim()) {
      setError('Vui lòng chọn giảng viên và nhập phòng học.');
      return;
    }
    if (draft.startShift > draft.endShift) {
      setError('Tiết bắt đầu không thể lớn hơn tiết kết thúc.');
      return;
    }
    try {
      const result = await api.academic.saveClassSchedule(classId, {
        lecturerId: Number(draft.lecturerId),
        roomName: draft.roomName.trim(),
        dayOfWeek: draft.dayOfWeek,
        startShift: draft.startShift,
        endShift: draft.endShift
      });
      setNotice(result.message);
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu lịch học.');
    }
  };

  // Actions for Tuition
  const createTuition = async () => {
    if (!tuitionForm.studentId || !tuitionForm.semesterId || !tuitionForm.dueDate || !tuitionForm.baseAmount) {
      setError('Vui lòng điền đầy đủ học viên, học kỳ, hạn nộp và học phí gốc.');
      return;
    }
    const base = Number(tuitionForm.baseAmount);
    if (isNaN(base) || base < 0) {
      setError('Học phí gốc không hợp lệ.');
      return;
    }
    try {
      const result = await api.admin.createTuition({
        studentId: Number(tuitionForm.studentId),
        semesterId: Number(tuitionForm.semesterId),
        baseAmount: base,
        dueDate: tuitionForm.dueDate,
        paidAmount: tuitionForm.paidAmount || 0,
        latePenaltyFee: tuitionForm.latePenaltyFee || 0
      });
      setNotice(result.message);
      setTuitionForm({ studentId: '', semesterId: '', baseAmount: '', dueDate: '', paidAmount: 0, latePenaltyFee: 0 });
      setStudentCreditInfo(null);
      await loadTuition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo học phí.');
    }
  };

  const handleAutoGenerateTuition = async () => {
    if (!batchSemesterId || !batchDueDate) {
      setError('Vui lòng chọn học kỳ và hạn nộp để tạo học phí tự động.');
      return;
    }
    if (!window.confirm('Hệ thống sẽ quét toàn bộ học viên đã đăng ký học phần trong kỳ này và tự động tạo công nợ theo công thức (Tín chỉ x 750.000 VNĐ). Tiếp tục?')) {
      return;
    }
    setBatchLoading(true);
    try {
      const res = await api.admin.autoGenerateTuition({
        semesterId: Number(batchSemesterId),
        dueDate: batchDueDate
      });
      setNotice(res.message);
      await loadTuition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo công nợ tự động.');
    } finally {
      setBatchLoading(false);
    }
  };

  const openReviewModal = (tuition: AdminTuitionRecord) => {
    setReviewModalTuition(tuition);
    setReviewDecision('Đã xác nhận');
    setReviewPaidAmount(Number(tuition.outstanding_balance) > 0 ? Number(tuition.outstanding_balance) : Number(tuition.base_amount));
    setReviewNote('');
  };

  const submitReviewSlip = async () => {
    if (!reviewModalTuition) return;
    if (reviewDecision === 'Từ chối' && !reviewNote.trim()) {
      setError('Vui lòng nhập lý do từ chối biên lai để học viên biết.');
      return;
    }
    if (reviewDecision === 'Đã xác nhận' && (reviewPaidAmount <= 0 || isNaN(reviewPaidAmount))) {
      setError('Vui lòng nhập số tiền xác nhận hợp lệ.');
      return;
    }
    setReviewLoading(true);
    try {
      const result = await api.admin.reviewTuitionPaymentSlip(reviewModalTuition.tuition_id, {
        decision: reviewDecision,
        note: reviewNote.trim(),
        paidAmount: reviewDecision === 'Đã xác nhận' ? reviewPaidAmount : undefined
      });
      setNotice(result.message);
      setReviewModalTuition(null);
      await loadTuition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xử lý biên lai.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Filtered lists
  const filteredCourses = useMemo(() => {
    return courses.filter(c =>
      c.course_code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.course_name.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, courseSearch]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchSemester = !classSemesterFilter || String(c.semester_id) === classSemesterFilter;
      return matchSemester;
    });
  }, [classes, classSemesterFilter]);

  const filteredTuition = useMemo(() => {
    return tuitionList.filter(t => {
      const matchSearch =
        t.student_code.toLowerCase().includes(tuitionSearch.toLowerCase()) ||
        t.student_name.toLowerCase().includes(tuitionSearch.toLowerCase());
      const matchSemester = !tuitionSemesterFilter || String(t.semester_id) === tuitionSemesterFilter;
      const matchStatus =
        tuitionStatusFilter === 'all'
          ? true
          : tuitionStatusFilter === 'pending_slip'
            ? t.payment_slip_status === 'Chờ xác nhận'
            : tuitionStatusFilter === 'debt'
              ? Number(t.outstanding_balance) > 0
              : tuitionStatusFilter === 'completed'
                ? Number(t.outstanding_balance) <= 0
                : true;
      return matchSearch && matchSemester && matchStatus;
    });
  }, [tuitionList, tuitionSearch, tuitionSemesterFilter, tuitionStatusFilter]);

  // Tuition stats
  const tuitionStats = useMemo(() => {
    const totalBase = tuitionList.reduce((sum, item) => sum + Number(item.base_amount || 0), 0);
    const totalPaid = tuitionList.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
    const totalDebt = tuitionList.reduce((sum, item) => sum + Number(item.outstanding_balance || 0), 0);
    const pendingSlips = tuitionList.filter(item => item.payment_slip_status === 'Chờ xác nhận').length;
    return { totalBase, totalPaid, totalDebt, pendingSlips };
  }, [tuitionList]);

  // Helper for day of week label
  const getDayLabel = (d: number) => {
    switch (d) {
      case 2: return 'Thứ Hai';
      case 3: return 'Thứ Ba';
      case 4: return 'Thứ Tư';
      case 5: return 'Thứ Năm';
      case 6: return 'Thứ Sáu';
      case 7: return 'Thứ Bảy';
      case 8: return 'Chủ Nhật';
      default: return `Thứ ${d}`;
    }
  };

  // -------------------------------------------------------------
  // MODE 1: ACADEMICS (HỌC KỲ, HỌC PHẦN, LỚP VÀ LỊCH GIẢNG DẠY)
  // -------------------------------------------------------------
  if (mode === 'academics') {
    return (
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setAcademicTab('semesters')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${academicTab === 'semesters' ? 'bg-sky-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Calendar className="h-4 w-4" />
            1. Quản lý Học kỳ ({semesters.length})
          </button>
          <button
            type="button"
            onClick={() => setAcademicTab('courses')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${academicTab === 'courses' ? 'bg-sky-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <BookOpen className="h-4 w-4" />
            2. Học phần & Môn học ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setAcademicTab('classes')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${academicTab === 'classes' ? 'bg-sky-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <School className="h-4 w-4" />
            3. Mở lớp học phần ({classes.length})
          </button>
          <button
            type="button"
            onClick={() => setAcademicTab('schedules')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${academicTab === 'schedules' ? 'bg-sky-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Clock className="h-4 w-4" />
            4. Xếp lịch & Giảng viên
          </button>
        </div>

        {/* SUBTAB 1: SEMESTERS */}
        {academicTab === 'semesters' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Plus className="h-5 w-5 text-sky-600" />
                Tạo học kỳ mới
              </h2>
              <p className="mt-1 text-xs text-slate-500">Thiết lập học kỳ đào tạo sau đại học và khung thời gian.</p>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Tên học kỳ <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Ví dụ: Học kỳ 1 (2025-2026)"
                    value={semesterForm.semesterName}
                    onChange={e => setSemesterForm({ ...semesterForm, semesterName: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Ngày bắt đầu <span className="text-rose-500">*</span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={semesterForm.startDate}
                      onChange={e => setSemesterForm({ ...semesterForm, startDate: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Ngày kết thúc <span className="text-rose-500">*</span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={semesterForm.endDate}
                      onChange={e => setSemesterForm({ ...semesterForm, endDate: e.target.value })}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void createSemester()}
                  className="mt-2 w-full rounded-xl bg-sky-700 py-3 font-bold text-white shadow transition-colors hover:bg-sky-800"
                >
                  Tạo học kỳ
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Danh sách các học kỳ</h2>
                  <p className="text-xs text-slate-500">Toàn bộ học kỳ đã được tạo trong hệ thống AGU</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAcademic()}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  title="Tải lại"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã HK</th>
                      <th className="p-3">Tên học kỳ</th>
                      <th className="p-3">Thời gian diễn ra</th>
                      <th className="p-3">Trạng thái khóa điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {semesters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">Chưa có học kỳ nào. Hãy tạo học kỳ đầu tiên bên trái.</td>
                      </tr>
                    ) : (
                      semesters.map(s => (
                        <tr key={s.semester_id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-500">#{s.semester_id}</td>
                          <td className="p-3 font-bold text-slate-900">{s.semester_name}</td>
                          <td className="p-3 text-slate-600">
                            {s.start_date ? new Date(s.start_date).toLocaleDateString('vi-VN') : '—'} &rarr;{' '}
                            {s.end_date ? new Date(s.end_date).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td className="p-3">
                            {s.is_grade_locked ? (
                              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">Đã khóa điểm</span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Đang mở nhập điểm</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: COURSES */}
        {academicTab === 'courses' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Plus className="h-5 w-5 text-sky-600" />
                Tạo học phần mới
              </h2>
              <p className="mt-1 text-xs text-slate-500">Môn học đào tạo Thạc sĩ theo khung chương trình.</p>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã học phần <span className="text-rose-500">*</span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm uppercase focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      placeholder="Ví dụ: CNTT801"
                      value={courseForm.courseCode}
                      onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Số tín chỉ <span className="text-rose-500">*</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={courseForm.credits}
                      onChange={e => setCourseForm({ ...courseForm, credits: Number(e.target.value) })}
                    />
                  </label>
                </div>

                <label className="block text-xs font-semibold text-slate-700">
                  Tên học phần <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Ví dụ: Phương pháp nghiên cứu khoa học"
                    value={courseForm.courseName}
                    onChange={e => setCourseForm({ ...courseForm, courseName: e.target.value })}
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Học phần tiên quyết (nếu có)
                  <select
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={courseForm.prerequisiteCourseId}
                    onChange={e => setCourseForm({ ...courseForm, prerequisiteCourseId: e.target.value })}
                  >
                    <option value="">Không có tiên quyết</option>
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} - {c.course_name} ({c.credits} TC)
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => void createCourse()}
                  className="mt-2 w-full rounded-xl bg-sky-700 py-3 font-bold text-white shadow transition-colors hover:bg-sky-800"
                >
                  Tạo học phần
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Danh mục học phần ({courses.length})</h2>
                  <p className="text-xs text-slate-500">Môn học trong hệ thống đào tạo thạc sĩ AGU</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã hoặc tên môn..."
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã HP</th>
                      <th className="p-3">Tên học phần</th>
                      <th className="p-3">Tín chỉ</th>
                      <th className="p-3">Tiên quyết</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">Không tìm thấy học phần nào.</td>
                      </tr>
                    ) : (
                      filteredCourses.map(c => (
                        <tr key={c.course_id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-sky-800">{c.course_code}</td>
                          <td className="p-3 font-semibold text-slate-900">{c.course_name}</td>
                          <td className="p-3">
                            <span className="rounded-lg bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">
                              {c.credits} TC
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {c.prerequisite_code ? (
                              <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                                {c.prerequisite_code} - {c.prerequisite_name}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => void deleteCourse(c.course_id, c.course_code)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Xóa học phần"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: CLASSES */}
        {academicTab === 'classes' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Plus className="h-5 w-5 text-emerald-600" />
                Mở lớp học phần mới
              </h2>
              <p className="mt-1 text-xs text-slate-500">Mở lớp cho học kỳ cụ thể để học viên đăng ký tín chỉ.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-5 md:items-end">
                <label className="text-xs font-semibold text-slate-700">
                  Học phần <span className="text-rose-500">*</span>
                  <select
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                    value={classForm.courseId}
                    onChange={e => setClassForm({ ...classForm, courseId: e.target.value })}
                  >
                    <option value="">Chọn học phần</option>
                    {courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.course_code} - {c.course_name} ({c.credits} TC)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Học kỳ <span className="text-rose-500">*</span>
                  <select
                    className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                    value={classForm.semesterId}
                    onChange={e => setClassForm({ ...classForm, semesterId: e.target.value })}
                  >
                    <option value="">Chọn học kỳ</option>
                    {semesters.map(s => (
                      <option key={s.semester_id} value={s.semester_id}>
                        {s.semester_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Tên lớp / Mã lớp <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                    placeholder="Ví dụ: CH24_KTPM_01"
                    value={classForm.className}
                    onChange={e => setClassForm({ ...classForm, className: e.target.value })}
                  />
                </label>

                <label className="text-xs font-semibold text-slate-700">
                  Sĩ số tối đa
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                    value={classForm.maxStudents}
                    onChange={e => setClassForm({ ...classForm, maxStudents: Number(e.target.value) })}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void createClass()}
                  className="h-[42px] rounded-xl bg-emerald-700 px-4 font-bold text-white shadow transition-colors hover:bg-emerald-800"
                >
                  Mở lớp
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Danh sách lớp học phần ({classes.length})</h2>
                  <p className="text-xs text-slate-500">Các lớp đã mở và trạng thái đăng ký của học viên</p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
                    value={classSemesterFilter}
                    onChange={e => setClassSemesterFilter(e.target.value)}
                  >
                    <option value="">Tất cả học kỳ</option>
                    {semesters.map(s => (
                      <option key={s.semester_id} value={s.semester_id}>
                        {s.semester_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã & Tên lớp</th>
                      <th className="p-3">Học phần</th>
                      <th className="p-3">Học kỳ</th>
                      <th className="p-3">Sĩ số đăng ký</th>
                      <th className="p-3">Giảng viên / Phòng học</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">Chưa có lớp học phần nào.</td>
                      </tr>
                    ) : (
                      filteredClasses.map(c => (
                        <tr key={c.class_id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{c.class_name}</td>
                          <td className="p-3">
                            <span className="font-mono font-semibold text-sky-800">{c.course_code}</span> - {c.course_name}
                          </td>
                          <td className="p-3 text-slate-600">{c.semester_name}</td>
                          <td className="p-3">
                            <span className={`font-semibold ${c.registered_count >= c.max_students ? 'text-rose-600' : 'text-slate-700'}`}>
                              {c.registered_count} / {c.max_students}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {c.lecturer_name ? (
                              <div>
                                <span className="font-semibold text-slate-800">{c.lecturer_name}</span>
                                {c.room_name && <span className="ml-1 text-slate-500">({c.room_name})</span>}
                              </div>
                            ) : (
                              <span className="text-amber-700">Chưa xếp lịch</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${c.status === 'Mở đăng ký'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'Đã chốt'
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => void deleteClass(c.class_id, c.class_name)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Xóa lớp"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: SCHEDULES */}
        {academicTab === 'schedules' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Xếp lịch giảng dạy & Phân công Giảng viên</h2>
                <p className="text-xs text-slate-500">Thiết lập phòng học, thứ trong tuần, tiết bắt đầu - kết thúc cho từng lớp</p>
              </div>
              <button
                type="button"
                onClick={() => void loadAcademic()}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                title="Tải lại"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {classes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Chưa có lớp học phần nào để xếp lịch. Hãy mở lớp ở tab 3 trước.</div>
              ) : (
                classes.map(item => {
                  const draft = scheduleForm[item.class_id] || { lecturerId: '', roomName: '', dayOfWeek: 7, startShift: 1, endShift: 4 };
                  return (
                    <div
                      key={item.class_id}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-sky-300 md:grid-cols-[1.5fr_1.5fr_1fr_110px_80px_80px_auto] md:items-end"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-sky-800">{item.course_code}</div>
                        <div className="font-bold text-slate-900">{item.class_name}</div>
                        <div className="text-xs text-slate-500">{item.course_name} &bull; {item.semester_name}</div>
                      </div>

                      <label className="text-xs font-semibold text-slate-700">
                        Giảng viên phụ trách <span className="text-rose-500">*</span>
                        <select
                          className="mt-1 block w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-sky-500 focus:outline-none"
                          value={draft.lecturerId}
                          onChange={e => setScheduleForm({
                            ...scheduleForm,
                            [item.class_id]: { ...draft, lecturerId: e.target.value }
                          })}
                        >
                          <option value="">-- Chọn giảng viên --</option>
                          {lecturers.map(l => (
                            <option key={l.lecturer_id} value={l.lecturer_id}>
                              {l.degree} {l.full_name} ({l.lecturer_code})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-slate-700">
                        Phòng học <span className="text-rose-500">*</span>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-sky-500 focus:outline-none"
                          placeholder="VD: A205"
                          value={draft.roomName}
                          onChange={e => setScheduleForm({
                            ...scheduleForm,
                            [item.class_id]: { ...draft, roomName: e.target.value }
                          })}
                        />
                      </label>

                      <label className="text-xs font-semibold text-slate-700">
                        Thứ học
                        <select
                          className="mt-1 block w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-sky-500 focus:outline-none"
                          value={draft.dayOfWeek}
                          onChange={e => setScheduleForm({
                            ...scheduleForm,
                            [item.class_id]: { ...draft, dayOfWeek: Number(e.target.value) }
                          })}
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map(d => (
                            <option key={d} value={d}>{getDayLabel(d)}</option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs font-semibold text-slate-700">
                        Tiết BĐ
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs text-center focus:border-sky-500 focus:outline-none"
                          value={draft.startShift}
                          onChange={e => setScheduleForm({
                            ...scheduleForm,
                            [item.class_id]: { ...draft, startShift: Number(e.target.value) }
                          })}
                        />
                      </label>

                      <label className="text-xs font-semibold text-slate-700">
                        Tiết KT
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs text-center focus:border-sky-500 focus:outline-none"
                          value={draft.endShift}
                          onChange={e => setScheduleForm({
                            ...scheduleForm,
                            [item.class_id]: { ...draft, endShift: Number(e.target.value) }
                          })}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void saveSchedule(item.class_id)}
                        className="h-[38px] rounded-xl bg-sky-700 px-4 text-xs font-bold text-white shadow hover:bg-sky-800"
                      >
                        Lưu lịch
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2: TUITION (QUẢN LÝ THU HỌC PHÍ VÀ XÁC NHẬN BIÊN LAI)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 4 Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng công nợ</span>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">
            {tuitionStats.totalDebt.toLocaleString('vi-VN')} <span className="text-sm font-bold">VNĐ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Số tiền học viên còn nợ trên toàn hệ thống</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã thực thu</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {tuitionStats.totalPaid.toLocaleString('vi-VN')} <span className="text-sm font-bold">VNĐ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Tổng số tiền học phí đã xác nhận thu</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Học phí phát sinh</span>
            <CreditCard className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {tuitionStats.totalBase.toLocaleString('vi-VN')} <span className="text-sm font-bold">VNĐ</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Tổng giá trị gốc theo các học kỳ</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Biên lai chờ duyệt</span>
            <AlertCircle className={`h-5 w-5 ${tuitionStats.pendingSlips > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className={`mt-2 text-2xl font-black ${tuitionStats.pendingSlips > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
            {tuitionStats.pendingSlips} <span className="text-sm font-semibold">yêu cầu</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Biên lai chuyển khoản học viên đã nộp</p>
        </div>
      </div>

      {/* Creation Sections: Single & Batch */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: Single Tuition Creation with Credit-Based Lookup */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Plus className="h-5 w-5 text-sky-600" />
            Tạo khoản học phí theo học viên & học kỳ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Học phí Thạc sĩ AGU tính theo công thức: <b>Số tín chỉ đăng ký &times; 750.000 VNĐ</b>.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Chọn học viên <span className="text-rose-500">*</span>
              <select
                className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                value={tuitionForm.studentId}
                onChange={e => setTuitionForm({ ...tuitionForm, studentId: e.target.value })}
              >
                <option value="">-- Chọn học viên --</option>
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_code} - {s.full_name} ({s.major_name})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Chọn học kỳ <span className="text-rose-500">*</span>
              <select
                className="mt-1 block w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                value={tuitionForm.semesterId}
                onChange={e => setTuitionForm({ ...tuitionForm, semesterId: e.target.value })}
              >
                <option value="">-- Chọn học kỳ --</option>
                {semesters.map(s => (
                  <option key={s.semester_id} value={s.semester_id}>
                    {s.semester_name}
                  </option>
                ))}
              </select>
            </label>

            {/* Credit Info Badge / Calculation Preview */}
            <div className="sm:col-span-2">
              {lookupLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Đang tra cứu số tín chỉ đăng ký của học viên...
                </div>
              ) : studentCreditInfo ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      Học viên đã đăng ký: <b>{studentCreditInfo.totalCredits} tín chỉ</b> ({studentCreditInfo.courses.length} môn học) &bull; Đơn giá: <b>750.000 đ/TC</b>
                      <div className="mt-0.5 text-sky-700">
                        Thành tiền chuẩn: <b>{studentCreditInfo.calculatedTuition.toLocaleString('vi-VN')} VNĐ</b>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTuitionForm(prev => ({ ...prev, baseAmount: String(studentCreditInfo.calculatedTuition) }))}
                      className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700"
                    >
                      <Sparkles className="h-3 w-3" />
                      Điền {studentCreditInfo.calculatedTuition.toLocaleString('vi-VN')} đ
                    </button>
                  </div>
                  {studentCreditInfo.courses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-sky-200 pt-2 text-[11px] text-slate-600">
                      {studentCreditInfo.courses.map(c => (
                        <span key={c.course_code} className="rounded bg-white px-1.5 py-0.5 font-medium border border-sky-100">
                          {c.course_code}: {c.course_name} ({c.credits} TC)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : tuitionForm.studentId && tuitionForm.semesterId ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                  Học viên chưa đăng ký môn học nào trong học kỳ này (0 tín chỉ). Bạn có thể nhập học phí định mức bằng tay.
                </div>
              ) : null}
            </div>

            <label className="text-xs font-semibold text-slate-700">
              Hạn nộp học phí <span className="text-rose-500">*</span>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                value={tuitionForm.dueDate}
                onChange={e => setTuitionForm({ ...tuitionForm, dueDate: e.target.value })}
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Học phí gốc (VNĐ) <span className="text-rose-500">*</span>
              <input
                type="number"
                min="0"
                step="50000"
                placeholder="VD: 4500000"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold focus:border-sky-500 focus:outline-none"
                value={tuitionForm.baseAmount}
                onChange={e => setTuitionForm({ ...tuitionForm, baseAmount: e.target.value })}
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Đã thanh toán trước (nếu có)
              <input
                type="number"
                min="0"
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                value={tuitionForm.paidAmount}
                onChange={e => setTuitionForm({ ...tuitionForm, paidAmount: Number(e.target.value) })}
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Tiền phạt trễ hạn (VNĐ)
              <input
                type="number"
                min="0"
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-sky-500 focus:outline-none"
                value={tuitionForm.latePenaltyFee}
                onChange={e => setTuitionForm({ ...tuitionForm, latePenaltyFee: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void createTuition()}
              className="rounded-xl bg-sky-700 px-6 py-2.5 font-bold text-white shadow transition-colors hover:bg-sky-800"
            >
              Tạo khoản học phí
            </button>
          </div>
        </div>

        {/* Card 2: Batch Generation */}
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              Tạo tự động hàng loạt
            </h2>
            <p className="mt-1 text-xs text-emerald-800">
              Quét toàn bộ học viên đã đăng ký học phần trong kỳ và tự động tạo công nợ theo số tín chỉ (750.000 VNĐ / TC).
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Học kỳ áp dụng <span className="text-rose-500">*</span>
                <select
                  className="mt-1 block w-full rounded-xl border border-emerald-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={batchSemesterId}
                  onChange={e => setBatchSemesterId(e.target.value)}
                >
                  <option value="">-- Chọn học kỳ --</option>
                  {semesters.map(s => (
                    <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Hạn nộp chung <span className="text-rose-500">*</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-emerald-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  value={batchDueDate}
                  onChange={e => setBatchDueDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={batchLoading}
              onClick={() => void handleAutoGenerateTuition()}
              className="w-full rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow transition-colors hover:bg-emerald-800 disabled:opacity-50"
            >
              {batchLoading ? 'Đang tạo công nợ...' : '⚡ Tạo công nợ tự động'}
            </button>
          </div>
        </div>
      </div>

      {/* Tuition List Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách học phí & biên lai thanh toán</h2>
            <p className="text-xs text-slate-500">Theo dõi chi tiết công nợ, tiến độ đóng tiền và phê duyệt biên lai</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên học viên..."
                className="w-56 rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
                value={tuitionSearch}
                onChange={e => setTuitionSearch(e.target.value)}
              />
            </div>

            {/* Semester Filter */}
            <select
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
              value={tuitionSemesterFilter}
              onChange={e => setTuitionSemesterFilter(e.target.value)}
            >
              <option value="">Tất cả học kỳ</option>
              {semesters.map(s => (
                <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none"
              value={tuitionStatusFilter}
              onChange={e => setTuitionStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending_slip">Chờ xác nhận biên lai</option>
              <option value="debt">Còn nợ</option>
              <option value="completed">Đã hoàn thành (0đ nợ)</option>
            </select>

            <button
              type="button"
              onClick={() => void loadTuition()}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
              title="Tải lại danh sách"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Học viên</th>
                <th className="p-3">Học kỳ</th>
                <th className="p-3">Số TC đăng ký</th>
                <th className="p-3">Học phí gốc</th>
                <th className="p-3">Đã thanh toán</th>
                <th className="p-3">Còn nợ</th>
                <th className="p-3">Hạn nộp</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Biên lai</th>
                <th className="p-3 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTuition.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Không có khoản học phí nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredTuition.map(t => {
                  const debt = Number(t.outstanding_balance);
                  const isPaidFull = debt <= 0;
                  return (
                    <tr key={t.tuition_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-sky-800">{t.student_code}</div>
                        <div className="font-semibold text-slate-900">{t.student_name}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{t.semester_name}</td>
                      <td className="p-3">
                        {t.registered_credits && t.registered_credits > 0 ? (
                          <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 border border-sky-100">
                            {t.registered_credits} TC (750k/TC)
                          </span>
                        ) : (
                          <span className="text-slate-400">0 TC</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {Number(t.base_amount).toLocaleString('vi-VN')} đ
                        {Number(t.late_penalty_fee) > 0 && (
                          <div className="text-[10px] text-rose-600 font-normal">
                            +Phạt: {Number(t.late_penalty_fee).toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">
                        {Number(t.paid_amount).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${isPaidFull ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {debt.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t.status === 'Hoàn thành'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'Đã thanh toán một phần'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {t.payment_slip_file ? (
                          <div className="space-y-1">
                            <a
                              href={t.payment_slip_file}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Xem minh chứng
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <div>
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${t.payment_slip_status === 'Chờ xác nhận'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : t.payment_slip_status === 'Đã xác nhận'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                {t.payment_slip_status}
                              </span>
                            </div>
                          </div>
                        ) : isPaidFull ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                            Đã thu (Ngân hàng/Kế toán)
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa gửi</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {t.payment_slip_status === 'Chờ xác nhận' ? (
                          <button
                            type="button"
                            onClick={() => openReviewModal(t)}
                            className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-sky-800"
                          >
                            Xử lý biên lai
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Payment Slip Modal */}
      {reviewModalTuition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Xử lý biên lai học phí</h3>
              <button
                type="button"
                onClick={() => setReviewModalTuition(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Học viên:</span>
                  <span className="font-bold text-slate-900">{reviewModalTuition.student_name} ({reviewModalTuition.student_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học kỳ:</span>
                  <span className="font-semibold text-slate-800">{reviewModalTuition.semester_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền còn nợ:</span>
                  <span className="font-bold text-rose-700">{Number(reviewModalTuition.outstanding_balance).toLocaleString('vi-VN')} VNĐ</span>
                </div>
                {reviewModalTuition.payment_slip_file && (
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Tệp minh chứng chuyển khoản:</span>
                    <a
                      href={reviewModalTuition.payment_slip_file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                    >
                      Mở file biên lai <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Decision selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Quyết định phê duyệt:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('Đã xác nhận')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition-all ${reviewDecision === 'Đã xác nhận'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Duyệt biên lai & Thu tiền
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('Từ chối')}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition-all ${reviewDecision === 'Từ chối'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Từ chối biên lai
                  </button>
                </div>
              </div>

              {reviewDecision === 'Đã xác nhận' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Số tiền xác nhận đã nhận (VNĐ) <span className="text-rose-500">*</span>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                      value={reviewPaidAmount}
                      onChange={e => setReviewPaidAmount(Number(e.target.value))}
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500">Mặc định bằng số tiền còn nợ của học viên.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Lý do từ chối biên lai <span className="text-rose-500">*</span>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none"
                      placeholder="Ví dụ: Ảnh chụp mờ không rõ số tài khoản chuyển, số tiền không khớp..."
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setReviewModalTuition(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={reviewLoading}
                onClick={() => void submitReviewSlip()}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow transition-colors ${reviewDecision === 'Đã xác nhận'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-rose-700 hover:bg-rose-800'
                  }`}
              >
                {reviewLoading ? 'Đang xử lý...' : reviewDecision === 'Đã xác nhận' ? 'Xác nhận thu tiền' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
