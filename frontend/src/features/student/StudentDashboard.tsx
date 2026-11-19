import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BookOpen,
  User,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  GraduationCap,
  CreditCard,
  FileCheck,
  Award,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Landmark,
  ReceiptText,
  Upload,
  X,
  FileDown
} from 'lucide-react';
import { api } from '../../services/api';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';
import { StudentSupportSection, ThesisRoadmap } from './StudentRoadmapAndSupport';
import type {
  CourseClassRecord,
  CurriculumCourseItem,
  GatekeeperCheckResult,
  LanguageCertRecord,
  Lecturer,
  PublicationRecord,
  StudentAdvisor,
  StudentDefenseResult,
  StudentGradeRecord,
  StudentInfo,
  StudentPaymentInfo,
  StudentRegisteredCourse,
  StudentThesisProgress,
  StudentTuitionRecord,
  ThesisMilestoneSubmission,
  TurnitinCheckRecord
} from '../../types';

type DashboardTab = 'thesis' | 'gatekeeper' | 'courses' | 'grades-tuition' | 'forms' | 'defense';

const getSavedDashboardTab = (): DashboardTab => {
  const savedTab = sessionStorage.getItem('agu_student_subtab');
  if (
    savedTab === 'thesis' ||
    savedTab === 'gatekeeper' ||
    savedTab === 'courses' ||
    savedTab === 'grades-tuition' ||
    savedTab === 'forms' ||
    savedTab === 'defense'
  ) {
    return savedTab;
  }
  if (savedTab === 'resources-defense') return 'defense';
  return 'thesis';
};

export const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(getSavedDashboardTab);

  useEffect(() => {
    sessionStorage.removeItem('agu_student_subtab');
    const handleSubTabNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardTab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('agu:student-tab', handleSubTabNavigate);
    return () => window.removeEventListener('agu:student-tab', handleSubTabNavigate);
  }, []);
  // Dữ liệu học viên & Luận văn
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [thesis, setThesis] = useState<StudentThesisProgress | null>(null);
  const [advisor, setAdvisor] = useState<StudentAdvisor | null>(null);
  const [defense, setDefense] = useState<StudentDefenseResult | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<StudentPaymentInfo | null>(null);
  const [milestones, setMilestones] = useState<ThesisMilestoneSubmission[]>([]);
  const [turnitin, setTurnitin] = useState<TurnitinCheckRecord | null>(null);
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [languageCerts, setLanguageCerts] = useState<LanguageCertRecord[]>([]);

  // Dữ liệu Giảng viên
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [thesisTitle, setThesisTitle] = useState('');

  // Dữ liệu Gatekeeper
  const [gatekeeperResult, setGatekeeperResult] = useState<GatekeeperCheckResult | null>(null);
  const [isCheckingGatekeeper, setIsCheckingGatekeeper] = useState(false);

  // Dữ liệu Đào tạo, Đăng ký môn & TKB
  const [semesters, setSemesters] = useState<{ semester_id: number; semester_name: string }[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | undefined>(undefined);
  const [availableClasses, setAvailableClasses] = useState<CourseClassRecord[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<StudentRegisteredCourse[]>([]);
  const [curriculumCourses, setCurriculumCourses] = useState<CurriculumCourseItem[]>([]);

  // Dữ liệu Bảng điểm & Học phí
  const [grades, setGrades] = useState<StudentGradeRecord[]>([]);
  const [tuitionList, setTuitionList] = useState<StudentTuitionRecord[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [selectedTuition, setSelectedTuition] = useState<StudentTuitionRecord | null>(null);
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);

  // Modal / Form state cho các hành động nộp minh chứng
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStageName, setReportStageName] = useState('Bảo vệ đề cương');
  const [reportDeadline, setReportDeadline] = useState('2026-12-31');
  const [reportFile, setReportFile] = useState<File | null>(null);

  const [isTurnitinModalOpen, setIsTurnitinModalOpen] = useState(false);
  const [turnitinScore, setTurnitinScore] = useState('');
  const [turnitinFile, setTurnitinFile] = useState<File | null>(null);

  const [isPubModalOpen, setIsPubModalOpen] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubJournal, setPubJournal] = useState('');
  const [pubIssn, setPubIssn] = useState('');
  const [pubUrl, setPubUrl] = useState('');
  const [pubRanking, setPubRanking] = useState('Tạp chí KH ĐH An Giang');
  const [pubFile, setPubFile] = useState<File | null>(null);

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [langType, setLangType] = useState('VSTEP Bậc 4 (B2 ĐHQG-HCM)');
  const [langScore, setLangScore] = useState('Bậc 4 (6.5/10)');
  const [langIssueDate, setLangIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [langFile, setLangFile] = useState<File | null>(null);

  // Trạng thái chung
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useBrowserAlert(error, setError);
  useBrowserAlert(notice, setNotice);

  // 1. Tải dữ liệu toàn diện
  const loadDashboard = useCallback(async () => {
    try {
      const [studentResult, progressResult, lecturerResult] = await Promise.all([
        api.student.getMyInfo(),
        api.thesis.getMyProgress(),
        api.academic.getLecturers()
      ]);

      if (!studentResult.success || !progressResult.success || !lecturerResult.success) {
        throw new Error('Không thể tải đầy đủ thông tin học viên.');
      }

      setStudent(studentResult.student);
      setThesis(progressResult.thesis);
      setThesisTitle(progressResult.thesis?.thesis_title ?? '');
      setAdvisor(progressResult.advisor);
      setMilestones(progressResult.milestones || []);
      setTurnitin(progressResult.turnitin || null);
      setPublications(progressResult.publications || []);
      setLanguageCerts(progressResult.languageCerts || []);
      setLecturers(lecturerResult.lecturers);

      // Tải song song danh sách kỳ học và thời khóa biểu
      const [semRes, schedRes, gradeRes, tuitionRes, defenseRes, paymentInfoRes] = await Promise.all([
        api.academic.getSemesters(),
        api.student.getSchedule(),
        api.student.getGrades(),
        api.student.getTuition(),
        api.student.getDefenseResult(),
        api.student.getPaymentInfo()
      ]);

      if (semRes.success && semRes.semesters.length > 0) {
        setSemesters(semRes.semesters);
        if (!selectedSemesterId) {
          setSelectedSemesterId(semRes.semesters[0].semester_id);
        }
      }
      if (schedRes.success) setRegisteredCourses(schedRes.courses);
      if (gradeRes.success) setGrades(gradeRes.grades);
      if (tuitionRes.success) {
        setTuitionList(tuitionRes.tuitionList);
        setTotalDebt(tuitionRes.totalDebt);
      }
      if (defenseRes.success) setDefense(defenseRes.defense);
      if (paymentInfoRes.success) setPaymentInfo(paymentInfoRes.paymentInfo);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu học viên.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemesterId]);

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve().then(() => {
      if (isCurrent) return loadDashboard();
      return undefined;
    });
    return () => {
      isCurrent = false;
    };
  }, [loadDashboard]);

  // Tải danh sách lớp khi đổi kỳ học
  useEffect(() => {
    if (!selectedSemesterId) return;
    let isMounted = true;
    api.academic.getClasses(selectedSemesterId).then(res => {
      if (isMounted && res.success) {
        setAvailableClasses(res.classes);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [selectedSemesterId]);

  // Tải CTĐT khung 60 tín chỉ theo đúng ngành của học viên
  useEffect(() => {
    const curriculumId = student?.curriculum_id || 1;
    let isMounted = true;
    api.academic.getCurriculumCourses(curriculumId).then(res => {
      if (isMounted && res.success) {
        setCurriculumCourses(res.courses);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [student?.curriculum_id]);

  // Kiểm tra Gatekeeper
  const handleRunGatekeeper = async () => {
    setIsCheckingGatekeeper(true);
    try {
      const res = await api.committee.checkGatekeeper();
      if (res.success) {
        setGatekeeperResult(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi khi kiểm tra điều kiện bảo vệ.');
    } finally {
      setIsCheckingGatekeeper(false);
    }
  };

  // Đăng ký GVHD
  const handleAdvisorRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lecturerId = Number(selectedLecturerId);
    if (!Number.isSafeInteger(lecturerId) || lecturerId <= 0) {
      setError('Vui lòng chọn giảng viên hướng dẫn.');
      return;
    }

    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      const result = await api.thesis.registerAdvisor({ lecturerId });
      if (!result.success) throw new Error(result.message || 'Không thể gửi yêu cầu hướng dẫn.');
      setNotice(result.message);
      setSelectedLecturerId('');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu hướng dẫn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAdvisorRequest = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await api.thesis.cancelAdvisorRequest();
      if (!result.success) throw new Error(result.message || 'Không thể hủy yêu cầu GVHD.');
      setNotice(result.message);
      await loadDashboard();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Không thể hủy yêu cầu GVHD.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đăng ký đề tài
  const handleThesisSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      const result = await api.thesis.registerTopic(thesisTitle.trim());
      if (!result.success) throw new Error(result.message || 'Không thể đăng ký đề tài luận văn.');
      setNotice(result.message);
      await loadDashboard();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể đăng ký đề tài luận văn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nộp báo cáo mốc tiến độ
  const handleSubmitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportFile) {
      setError('Vui lòng chọn file báo cáo tiến độ (≤ 25MB, định dạng PDF/DOC/DOCX)!');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('stageName', reportStageName);
      fd.append('deadline', reportDeadline);
      fd.append('report_file', reportFile);
      const res = await api.thesis.submitReport(fd);
      if (!res.success) throw new Error(res.message);
      window.alert(res.message);
      setIsReportModalOpen(false);
      setReportFile(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nộp báo cáo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nộp Turnitin
  const handleSubmitTurnitin = async (e: FormEvent) => {
    e.preventDefault();
    if (!turnitinFile || !turnitinScore) {
      setError('Vui lòng nhập tỷ lệ trùng lặp (%) và đính kèm file kết quả Turnitin!');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('similarityScore', turnitinScore);
      fd.append('turnitin_file', turnitinFile);
      const res = await api.thesis.submitTurnitin(fd);
      if (!res.success) throw new Error(res.message);
      window.alert(res.message);
      setIsTurnitinModalOpen(false);
      setTurnitinFile(null);
      setTurnitinScore('');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nộp Turnitin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nộp bài báo KH
  const handleSubmitPub = async (e: FormEvent) => {
    e.preventDefault();
    if (!pubFile || !pubTitle || !pubJournal) {
      setError('Vui lòng điền đủ tên bài báo, tên tạp chí và đính kèm file toàn văn!');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('paperTitle', pubTitle);
      fd.append('journalName', pubJournal);
      fd.append('issnIsbn', pubIssn);
      fd.append('paperUrl', pubUrl);
      fd.append('ranking', pubRanking);
      fd.append('evidence_file', pubFile);
      const res = await api.thesis.submitPublication(fd);
      if (!res.success) throw new Error(res.message);
      window.alert(res.message);
      setIsPubModalOpen(false);
      setPubFile(null);
      setPubTitle('');
      setPubJournal('');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nộp bài báo khoa học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nộp chứng chỉ tiếng Anh
  const handleSubmitLang = async (e: FormEvent) => {
    e.preventDefault();
    if (!langFile || !langScore) {
      setError('Vui lòng điền điểm/bậc và đính kèm bản scan chứng chỉ ngoại ngữ!');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('certType', langType);
      fd.append('scoreAchieved', langScore);
      fd.append('issueDate', langIssueDate);
      fd.append('certificate_file', langFile);
      const res = await api.thesis.submitCertificate(fd);
      if (!res.success) throw new Error(res.message);
      window.alert(res.message);
      setIsLangModalOpen(false);
      setLangFile(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi nộp chứng chỉ ngoại ngữ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đăng ký môn học
  const handleRegisterCourse = async (classId: number) => {
    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const res = await api.student.registerCourse(classId);
      if (!res.success) throw new Error(res.message);
      setNotice(res.message);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng ký môn học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaymentSlip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTuition || !paymentSlipFile) {
      setError('Vui lòng chọn ảnh biên lai chuyển khoản.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('payment_slip', paymentSlipFile);
      const res = await api.student.submitPaymentSlip(selectedTuition.tuition_id, formData);
      if (!res.success) throw new Error(res.message);
      setNotice(res.message);
      setSelectedTuition(null);
      setPaymentSlipFile(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi biên lai học phí.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveAdvisor = advisor?.status === 'Đang hướng dẫn';
  const hasPendingAdvisor = advisor?.status === 'Chờ GVHD duyệt';
  const availableLecturers = lecturers.filter(lecturer => lecturer.slots_left > 0);

  if (isLoading && !student) {
    return <p className="mx-auto my-12 max-w-5xl px-4 text-center text-slate-500">Đang tải thông tin học viên...</p>;
  }

  return (
    <div className="mx-auto my-8 max-w-6xl space-y-6 px-4">
      {/* Thẻ Header Học viên */}
      {student && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-2xl font-black text-white shadow-md">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.full_name}</h2>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-800">
                  MSHV: {student.student_code}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  {student.academic_status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Chuyên ngành: <strong className="text-slate-700">{student.major_name}</strong> · Khóa: {student.cohort} · {student.orientation}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-sm">
            <User className="h-5 w-5 text-sky-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Giảng viên hướng dẫn</p>
              {advisor ? (
                <>
                  <p className="font-bold text-slate-800">{advisor.degree} {advisor.lecturer_name}</p>
                  <p className={`text-xs font-medium ${hasActiveAdvisor ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Trạng thái: {advisor.status}
                  </p>
                </>
              ) : (
                <p className="font-semibold text-slate-500">Chưa có GVHD</p>
              )}

            </div>
          </div>
        </div>
      )}

      {hasPendingAdvisor && advisor && (
        <section className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-amber-900">Yêu cầu GVHD đang chờ phản hồi</p>
            <p className="mt-1 text-sm text-amber-800">
              {advisor.degree} {advisor.lecturer_name}. Bạn có thể hủy yêu cầu để chọn giảng viên khác.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCancelAdvisorRequest()}
            disabled={isSubmitting}
            className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang hủy...' : 'Hủy yêu cầu / Đổi GVHD'}
          </button>
        </section>
      )}

      {/* Thanh điều hướng 6 khu vực chức năng */}
      <div className="flex flex-wrap gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('thesis')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'thesis'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>1. Luận văn & Mốc tiến độ</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('gatekeeper');
            if (!gatekeeperResult) void handleRunGatekeeper();
          }}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'gatekeeper'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>2. Chuẩn đầu ra & Gatekeeper</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'courses'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>3. Đăng ký học phần & TKB</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('grades-tuition')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'grades-tuition'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>4. Bảng điểm & Học phí</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'forms'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileDown className="h-4 w-4" />
          <span>5. Biểu mẫu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('defense')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'defense'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>6. Hội đồng</span>
        </button>
      </div>

      {(activeTab === 'forms' || activeTab === 'defense') && (
        <StudentSupportSection
          section={activeTab}
          defense={defense}
          defenseLoading={isLoading}
        />
      )}

      {/* ============================================================== */}
      {/* TAB 1: LUẬN VĂN & MỐC TIẾN ĐỘ 5 BƯỚC                            */}
      {/* ============================================================== */}
      {activeTab === 'thesis' && (
        <div className="space-y-6">
          <ThesisRoadmap
            advisor={advisor}
            thesis={thesis}
            milestones={milestones}
            turnitin={turnitin}
            defense={defense}
          />
          {/* Đăng ký GVHD nếu chưa có */}
          {!hasActiveAdvisor && !hasPendingAdvisor && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Đăng ký Giảng viên Hướng dẫn</h3>
              <p className="mt-1 text-sm text-slate-600">
                Theo quy chế SĐH AGU, giảng viên hướng dẫn Thạc sĩ bắt buộc có học vị Tiến sĩ trở lên và còn hạn mức (Slot).
              </p>
              <form onSubmit={handleAdvisorRequest} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedLecturerId}
                  onChange={e => setSelectedLecturerId(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">-- Chọn Giảng viên hướng dẫn còn slot --</option>
                  {availableLecturers.map(l => (
                    <option key={l.lecturer_id} value={l.lecturer_id}>
                      {l.degree} {l.full_name} · Còn {l.slots_left} slot (Tối đa: {l.max_slots})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedLecturerId || isSubmitting}
                  className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </form>
            </section>
          )}

          {/* Đăng ký đề tài */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 text-sky-600" />
              {thesis ? 'Thông tin đề tài luận văn Thạc sĩ' : 'Đăng ký đề tài luận văn'}
            </h3>
            {hasActiveAdvisor ? (
              <form onSubmit={handleThesisSubmit} className="mt-4 space-y-3">
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  rows={2}
                  value={thesisTitle}
                  onChange={e => setThesisTitle(e.target.value)}
                  placeholder="Nhập tên đề tài luận văn dự kiến..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <div className="flex items-center justify-between">
                  {thesis && (
                    <span className="text-xs text-slate-500">
                      Giai đoạn: <strong className="text-sky-700">{thesis.current_stage}</strong> · Trạng thái: <strong className="text-amber-700">{thesis.status}</strong>
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || thesisTitle.trim().length < 10}
                    className="ml-auto rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang gửi...' : thesis ? 'Cập nhật đề tài' : 'Đăng ký đề tài'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">
                Bạn cần được Giảng viên hướng dẫn chấp nhận trước khi đăng ký tên đề tài.
              </p>
            )}
          </section>

          {/* Tiến độ tổng quan */}
          {thesis && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{thesis.thesis_title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Mốc hiện tại: <span className="font-semibold text-sky-700">{thesis.current_stage}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nộp báo cáo mốc
                </button>
              </div>
              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, thesis.progress_percent || 0))}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                  <span>Tiến độ tổng thể</span>
                  <span className="font-bold text-sky-700">{thesis.progress_percent || 0}%</span>
                </div>
              </div>
            </section>
          )}

          {/* Bảng danh sách các bài nộp theo từng mốc & Cảnh báo Xanh/Vàng/Đỏ */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              Bảng theo dõi các mốc nộp bài & Đánh giá của GVHD
            </h3>
            {milestones.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">
                Chưa có bài nộp báo cáo tiến độ nào. Hãy bấm "Nộp báo cáo mốc" để tải lên file đề cương / tiến độ.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mốc tiến độ</th>
                      <th className="p-3">Hạn chót</th>
                      <th className="p-3">Ngày nộp</th>
                      <th className="p-3">Cảnh báo deadline</th>
                      <th className="p-3">Tài liệu nộp</th>
                      <th className="p-3">Đánh giá của GVHD</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {milestones.map(m => {
                      const warningBadge = m.color_warning === 'red' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-800">
                          🔴 Quá hạn deadline
                        </span>
                      ) : m.color_warning === 'yellow' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                          🟡 Còn ≤ 7 ngày
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                          🟢 Đúng hạn
                        </span>
                      );

                      return (
                        <tr key={m.submission_id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-800">{m.stage_name}</td>
                          <td className="p-3 text-slate-600">{m.deadline?.slice(0, 10)}</td>
                          <td className="p-3 text-slate-600">{m.submitted_at?.slice(0, 10) || 'Chưa nộp'}</td>
                          <td className="p-3">{warningBadge}</td>
                          <td className="p-3">
                            {m.report_file_url ? (
                              <a
                                href={m.report_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> File báo cáo
                              </a>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs">
                            {m.lecturer_feedback || <span className="italic text-slate-400">Chưa có phản hồi</span>}
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-0.5 font-bold text-[11px] ${
                              m.status === 'Đạt'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.status === 'Cần sửa đổi'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CHUẨN ĐẦU RA & CHỐT CHẶN GATEKEEPER                      */}
      {/* ============================================================== */}
      {activeTab === 'gatekeeper' && (
        <div className="space-y-6">
          {/* KHỐI GATEKEEPER KIỂM TRA 4 ĐIỀU KIỆN BẢO VỆ */}
          <section className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/40 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4">
              <div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
                  Quy chế Sau Đại học AGU
                </span>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  Chốt chặn Gatekeeper: Kiểm tra Điều kiện Bảo vệ Luận văn Thạc sĩ
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRunGatekeeper}
                disabled={isCheckingGatekeeper}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isCheckingGatekeeper ? 'animate-spin' : ''}`} />
                {isCheckingGatekeeper ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
              </button>
            </div>

            {gatekeeperResult && (
              <div className="mt-5 space-y-4">
                <div className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold ${
                  gatekeeperResult.isEligible ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                }`}>
                  {gatekeeperResult.isEligible ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-rose-700 shrink-0" />
                  )}
                  <div>
                    <p className="text-base font-bold">{gatekeeperResult.statusBadge}</p>
                    <p className="text-xs font-normal mt-0.5">{gatekeeperResult.message}</p>
                  </div>
                </div>

                {/* 4 Tiêu chuẩn chi tiết */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-400 font-semibold">1. Học phí Sau Đại học</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {totalDebt === 0 ? '✅ Đã hoàn tất học phí (Nợ: 0 VNĐ)' : `❌ Còn nợ: ${totalDebt.toLocaleString('vi-VN')} VNĐ`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-400 font-semibold">2. Tỷ lệ Đạo văn Turnitin (≤ 20%)</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {turnitin ? (
                        turnitin.similarity_score <= 20
                          ? `✅ Đạt: ${turnitin.similarity_score}%`
                          : `❌ Vượt mức: ${turnitin.similarity_score}%`
                      ) : (
                        '❌ Chưa nộp kiểm tra Turnitin'
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-400 font-semibold">3. Bài báo Khoa học (≥ 1 bài Đạt)</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {publications.filter(p => p.status === 'Đạt').length >= 1
                        ? `✅ Đạt yêu cầu (${publications.filter(p => p.status === 'Đạt').length} bài)`
                        : `❌ Chưa đạt (Hiện có: ${publications.filter(p => p.status === 'Đạt').length} bài Đạt)`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-400 font-semibold">4. Ngoại ngữ Chuẩn đầu ra (VSTEP B2 / IELTS 5.5+)</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {languageCerts.some(c => c.status === 'Đạt yêu cầu')
                        ? '✅ Đạt chuẩn ngoại ngữ'
                        : '❌ Chưa có chứng chỉ được phê duyệt'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 3 KHỐI NỘP MINH CHỨNG: TURNITIN, BÀI BÁO, NGOẠI NGỮ */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Cột 1: Turnitin */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                  <FileCheck className="h-4 w-4 text-sky-600" />
                  Kiểm tra Turnitin
                </h4>
                <button
                  type="button"
                  onClick={() => setIsTurnitinModalOpen(true)}
                  className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100"
                >
                  Nộp kết quả
                </button>
              </div>
              {turnitin ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                  <p>Tỷ lệ trùng lặp: <strong className="text-lg text-slate-900">{turnitin.similarity_score}%</strong></p>
                  <p>Kết luận: <span className={`font-bold ${turnitin.status === 'Đạt' ? 'text-emerald-700' : 'text-rose-700'}`}>{turnitin.status}</span></p>
                  <p className="text-slate-400">Kiểm tra lúc: {turnitin.checked_at?.slice(0, 10)}</p>
                  <a href={turnitin.file_url} target="_blank" rel="noreferrer" className="text-sky-600 font-medium underline block pt-1">
                    Xem file báo cáo Turnitin
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa nộp kết quả Turnitin.</p>
              )}
            </div>

            {/* Cột 2: Bài báo khoa học */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Award className="h-4 w-4 text-indigo-600" />
                  Bài báo Khoa học
                </h4>
                <button
                  type="button"
                  onClick={() => setIsPubModalOpen(true)}
                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                >
                  Nộp minh chứng
                </button>
              </div>
              {publications.length > 0 ? (
                <div className="space-y-2">
                  {publications.map(p => (
                    <div key={p.publication_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <p className="font-bold text-slate-800 line-clamp-2">{p.paper_title}</p>
                      <p className="text-slate-500 mt-0.5">{p.journal_name} ({p.ranking})</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 font-bold text-[10px] ${
                        p.status === 'Đạt' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa có bài báo khoa học.</p>
              )}
            </div>

            {/* Cột 3: Ngoại ngữ */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                  <GraduationCap className="h-4 w-4 text-teal-600" />
                  Chứng chỉ Ngoại ngữ
                </h4>
                <button
                  type="button"
                  onClick={() => setIsLangModalOpen(true)}
                  className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
                >
                  Nộp chứng chỉ
                </button>
              </div>
              {languageCerts.length > 0 ? (
                <div className="space-y-2">
                  {languageCerts.map(c => (
                    <div key={c.cert_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <p className="font-bold text-slate-800">{c.cert_type}</p>
                      <p className="text-slate-500 mt-0.5">Điểm/Bậc: <strong>{c.score_achieved}</strong></p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 font-bold text-[10px] ${
                        c.status === 'Đạt yêu cầu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa nộp chứng chỉ tiếng Anh.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ĐĂNG KÝ HỌC PHẦN & THỜI KHÓA BIỂU                         */}
      {/* ============================================================== */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Lớp học phần mở đăng ký */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đăng ký lớp học phần</h3>
                <p className="text-xs text-slate-500">Chọn học kỳ để xem các lớp học phần đang mở đăng ký.</p>
              </div>
              <select
                value={selectedSemesterId}
                onChange={e => setSelectedSemesterId(Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
              >
                {semesters.map(s => (
                  <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>
                ))}
              </select>
            </div>

            {availableClasses.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Không có lớp học phần nào đang mở cho học kỳ này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã học phần</th>
                      <th className="p-3">Tên môn học</th>
                      <th className="p-3">Số tín chỉ</th>
                      <th className="p-3">Tên lớp</th>
                      <th className="p-3">Sĩ số</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableClasses.map(cls => {
                      const isAlreadyRegistered = registeredCourses.some(rc => rc.course_code === cls.course_code);
                      return (
                        <tr key={cls.class_id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-700">{cls.course_code}</td>
                          <td className="p-3 font-semibold text-slate-800">{cls.course_name}</td>
                          <td className="p-3 text-slate-600">{cls.credits} TC</td>
                          <td className="p-3 text-slate-600">{cls.class_name}</td>
                          <td className="p-3 text-slate-600">{cls.registered_count} / {cls.max_students}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              {cls.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isAlreadyRegistered ? (
                              <span className="text-xs font-semibold text-slate-400">Đã đăng ký</span>
                            ) : (
                              <button
                                type="button"
                                disabled={isSubmitting || cls.registered_count >= cls.max_students}
                                onClick={() => handleRegisterCourse(cls.class_id)}
                                className="rounded-lg bg-sky-600 px-3 py-1.5 font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                              >
                                Đăng ký
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Danh sách môn đã đăng ký & Thời khóa biểu */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Thời khóa biểu & Các môn đã đăng ký</h3>
            {registeredCourses.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Bạn chưa đăng ký môn học nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã HP</th>
                      <th className="p-3">Tên môn học</th>
                      <th className="p-3">Số TC</th>
                      <th className="p-3">Học kỳ</th>
                      <th className="p-3">Phòng học</th>
                      <th className="p-3">Lịch học</th>
                      <th className="p-3">Giảng viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registeredCourses.map(rc => (
                      <tr key={rc.registration_id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{rc.course_code}</td>
                        <td className="p-3 font-semibold text-slate-800">{rc.course_name}</td>
                        <td className="p-3 text-slate-600">{rc.credits} TC</td>
                        <td className="p-3 text-slate-600">{rc.semester_name}</td>
                        <td className="p-3 font-semibold text-sky-700">{rc.room_name || 'Đang xếp'}</td>
                        <td className="p-3 text-slate-600">
                          {rc.day_of_week ? `Thứ ${rc.day_of_week} (Tiết ${rc.start_shift}-${rc.end_shift})` : 'Chưa xếp'}
                        </td>
                        <td className="p-3 text-slate-800 font-medium">{rc.lecturer_name || 'Chưa phân công'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Khung chương trình đào tạo 60 tín chỉ */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Khung chương trình đào tạo Thạc sĩ (60 Tín chỉ)</h3>
            <p className="text-xs text-slate-500 mb-4">Các môn học phân bổ theo khuyến nghị các học kỳ của ngành {student?.major_name}.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Học kỳ KN</th>
                    <th className="p-3">Mã HP</th>
                    <th className="p-3">Tên học phần</th>
                    <th className="p-3">Số TC</th>
                    <th className="p-3">Loại HP</th>
                    <th className="p-3">Học phần tiên quyết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {curriculumCourses.map(cc => (
                    <tr key={cc.curriculum_course_id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-700">HK {cc.recommended_semester}</td>
                      <td className="p-3 font-mono font-bold text-sky-700">{cc.course_code}</td>
                      <td className="p-3 font-semibold text-slate-800">{cc.course_name}</td>
                      <td className="p-3 text-slate-600">{cc.credits} TC</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          cc.course_type === 'Bắt buộc' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cc.course_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {cc.prerequisite_code ? `${cc.prerequisite_code} - ${cc.prerequisite_name}` : 'Không'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BẢNG ĐIỂM & HỌC PHÍ                                      */}
      {/* ============================================================== */}
      {activeTab === 'grades-tuition' && (
        <div className="space-y-6">
          {/* Bảng điểm cá nhân */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Bảng điểm kết quả học tập</h3>
            {grades.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Chưa có bản ghi điểm nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Mã HP</th>
                      <th className="p-3">Tên học phần</th>
                      <th className="p-3">Số TC</th>
                      <th className="p-3">Học kỳ</th>
                      <th className="p-3">Điểm QT (40%)</th>
                      <th className="p-3">Điểm Thi (60%)</th>
                      <th className="p-3">Tổng kết (Hệ 10)</th>
                      <th className="p-3">Khóa điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grades.map(g => (
                      <tr key={g.grade_id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{g.course_code}</td>
                        <td className="p-3 font-semibold text-slate-800">{g.course_name}</td>
                        <td className="p-3 text-slate-600">{g.credits}</td>
                        <td className="p-3 text-slate-600">{g.semester_name}</td>
                        <td className="p-3 font-medium text-slate-800">{g.process_grade ?? '--'}</td>
                        <td className="p-3 font-medium text-slate-800">{g.exam_grade ?? '--'}</td>
                        <td className="p-3 font-bold text-sky-700 text-sm">{g.final_grade ?? '--'}</td>
                        <td className="p-3">
                          {g.is_locked ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">Đã chốt</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Chưa chốt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quản lý học phí */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quản lý Học phí Sau Đại học</h3>
                <p className="text-xs text-slate-500">Học phí Thạc sĩ quy định đóng theo từng học kỳ trước ngày hết hạn.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-right">
                <p className="text-xs text-amber-800">Tổng công nợ hiện tại</p>
                <p className="text-xl font-black text-amber-950">{totalDebt.toLocaleString('vi-VN')} VNĐ</p>
              </div>
            </div>

            {tuitionList.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Chưa có thông tin học phí.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Học kỳ</th>
                      <th className="p-3">Học phí gốc</th>
                      <th className="p-3">Hạn nộp</th>
                      <th className="p-3">Đã thanh toán</th>
                      <th className="p-3">Phạt trễ</th>
                      <th className="p-3">Còn nợ</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Biên lai</th>
                      <th className="p-3 text-right">Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tuitionList.map(t => (
                      <tr key={t.tuition_id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{t.semester_name}</td>
                        <td className="p-3 text-slate-700">{Number(t.base_amount).toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-3 text-slate-600">{t.due_date?.slice(0, 10)}</td>
                        <td className="p-3 font-medium text-emerald-700">{Number(t.paid_amount).toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-3 text-rose-600">{Number(t.late_penalty_fee).toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-3 font-bold text-amber-900">{Number(t.outstanding_balance).toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            t.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
                                className="font-semibold text-sky-700 hover:underline"
                              >
                                Xem ảnh
                              </a>
                              <p className={`text-[10px] font-semibold ${
                                t.payment_slip_status === 'Đã xác nhận'
                                  ? 'text-emerald-700'
                                  : t.payment_slip_status === 'Từ chối'
                                    ? 'text-rose-700'
                                    : 'text-amber-700'
                              }`}>
                                {t.payment_slip_status}
                              </p>
                              {t.payment_slip_note && <p className="max-w-40 text-[10px] text-rose-700">{t.payment_slip_note}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa gửi</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {Number(t.outstanding_balance) > 0 ? (
                            <button
                              type="button"
                              disabled={isSubmitting || t.payment_slip_status === 'Chờ xác nhận'}
                              onClick={() => {
                                setPaymentSlipFile(null);
                                setSelectedTuition(t);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <ReceiptText className="h-3.5 w-3.5" />
                              {t.payment_slip_status === 'Chờ xác nhận' ? 'Đang xác nhận' : 'Gửi biên lai'}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">Đã xong</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {selectedTuition && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-slip-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Thanh toán học phí</p>
                <h2 id="payment-slip-title" className="mt-1 text-xl font-bold text-slate-900">Chuyển khoản và gửi biên lai</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedTuition.semester_name} · Số tiền còn nợ: <strong>{Number(selectedTuition.outstanding_balance).toLocaleString('vi-VN')} VNĐ</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTuition(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng hộp thoại nộp biên lai"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentInfo?.bankName && paymentInfo.accountName && paymentInfo.accountNumber ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="mb-3 flex items-center gap-2 font-bold text-sky-900">
                    <Landmark className="h-5 w-5" />
                    Tài khoản nhận học phí
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Ngân hàng</dt><dd className="text-right font-semibold">{paymentInfo.bankName}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Chủ tài khoản</dt><dd className="text-right font-semibold">{paymentInfo.accountName}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-600">Số tài khoản</dt><dd className="text-right font-mono font-bold">{paymentInfo.accountNumber}</dd></div>
                    {paymentInfo.branch && <div className="flex justify-between gap-4"><dt className="text-slate-600">Chi nhánh</dt><dd className="text-right font-semibold">{paymentInfo.branch}</dd></div>}
                    <div className="border-t border-sky-200 pt-2">
                      <dt className="text-slate-600">Nội dung chuyển khoản</dt>
                      <dd className="mt-1 font-mono font-bold text-sky-900">HP {student?.student_code} HK {selectedTuition.semester_name}</dd>
                    </div>
                  </dl>
                </div>
                {paymentInfo.qrImageUrl && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 p-3">
                    <img src={paymentInfo.qrImageUrl} alt="Mã QR thanh toán học phí" className="h-40 w-40 object-contain" />
                    <span className="text-xs font-medium text-slate-600">Quét mã để chuyển khoản</span>
                  </div>
                )}
              </div>
            ) : (
              <p role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Nhà trường chưa cấu hình thông tin tài khoản nhận học phí. Vui lòng liên hệ Phòng Sau Đại học trước khi chuyển khoản.
              </p>
            )}

            <form onSubmit={handleSubmitPaymentSlip} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Ảnh chụp biên lai giao dịch (JPG, PNG, WEBP; tối đa 5 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={event => setPaymentSlipFile(event.target.files?.[0] || null)}
                  className="mt-2 block w-full rounded-xl border border-slate-300 p-3 text-sm"
                  required
                />
              </label>
              <p className="text-xs leading-relaxed text-slate-500">
                Gửi ảnh biên lai không tự động xác nhận thanh toán. Phòng Sau Đại học sẽ đối chiếu giao dịch và cập nhật trạng thái học phí.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTuition(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !paymentSlipFile}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {isSubmitting ? 'Đang gửi...' : 'Gửi biên lai'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS NỘP BÁO CÁO / MINH CHỨNG                                 */}
      {/* ============================================================== */}

      {/* Modal 1: Nộp báo cáo mốc tiến độ */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Nộp Báo cáo Tiến độ Luận văn</h3>
            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mốc tiến độ *</label>
                <select
                  value={reportStageName}
                  onChange={e => setReportStageName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                >
                  <option value="Bảo vệ đề cương">1. Bảo vệ đề cương luận văn</option>
                  <option value="Báo cáo tiến độ lần 1">2. Báo cáo tiến độ lần 1</option>
                  <option value="Báo cáo tiến độ lần 2">3. Báo cáo tiến độ lần 2</option>
                  <option value="Nộp bản thảo">4. Nộp bản thảo luận văn</option>
                  <option value="Bảo vệ chính thức">5. Bảo vệ chính thức trước Hội đồng</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hạn chót dự kiến *</label>
                <input
                  type="date"
                  value={reportDeadline}
                  onChange={e => setReportDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">File báo cáo luận văn (PDF ≤ 25MB) *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => setReportFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-sky-600 px-5 py-2 font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nộp Turnitin */}
      {isTurnitinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Nộp Kết quả Kiểm tra Đạo văn Turnitin</h3>
            <p className="text-xs text-slate-500">Theo quy định ĐHAG, tỷ lệ trùng lặp cho phép là ≤ 20.0%.</p>
            <form onSubmit={handleSubmitTurnitin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tỷ lệ trùng lặp (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Ví dụ: 12.5"
                  value={turnitinScore}
                  onChange={e => setTurnitinScore(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">File báo cáo kết quả Turnitin (PDF) *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setTurnitinFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTurnitinModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-sky-600 px-5 py-2 font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nộp bài báo KH */}
      {isPubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Nộp Minh chứng Bài báo Khoa học</h3>
            <p className="text-xs text-slate-500">Chuẩn đầu ra: Tối thiểu 01 bài báo tại Tạp chí KH ĐH An Giang hoặc HĐGSNN / Scopus.</p>
            <form onSubmit={handleSubmitPub} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài báo *</label>
                <input
                  type="text"
                  placeholder="Tên toàn văn bài báo khoa học..."
                  value={pubTitle}
                  onChange={e => setPubTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên tạp chí xuất bản *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tạp chí Khoa học Trường Đại học An Giang..."
                  value={pubJournal}
                  onChange={e => setPubJournal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chỉ số ISSN/ISBN</label>
                  <input
                    type="text"
                    placeholder="0866-8086"
                    value={pubIssn}
                    onChange={e => setPubIssn(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xếp loại tạp chí</label>
                  <select
                    value={pubRanking}
                    onChange={e => setPubRanking(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5"
                  >
                    <option value="Tạp chí KH ĐH An Giang">Tạp chí KH ĐH An Giang</option>
                    <option value="HĐGSNN">Hội đồng Giáo sư Nhà nước</option>
                    <option value="Scopus/WoS">Scopus / Web of Science</option>
                    <option value="Hội nghị SĐH">Hội nghị Sau Đại học</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link bài báo trực tuyến</label>
                <input
                  type="url"
                  placeholder="https://sj.agu.edu.vn/article/..."
                  value={pubUrl}
                  onChange={e => setPubUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">File bài báo toàn văn (PDF) *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => setPubFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPubModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Nộp bài báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Nộp chứng chỉ tiếng Anh */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Nộp Chứng chỉ Ngoại ngữ Chuẩn đầu ra</h3>
            <p className="text-xs text-slate-500">Chuẩn Thạc sĩ: VSTEP Bậc 4 (B2 ĐHQG-HCM), IELTS 5.5+, TOEFL iBT 46+.</p>
            <form onSubmit={handleSubmitLang} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại chứng chỉ *</label>
                <select
                  value={langType}
                  onChange={e => setLangType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                >
                  <option value="VSTEP Bậc 4 (B2 ĐHQG-HCM)">VSTEP Bậc 4 (B2 ĐHQG-HCM)</option>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEFL iBT">TOEFL iBT</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm / Bậc đạt được *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bậc 4 (6.5/10), 6.0..."
                  value={langScore}
                  onChange={e => setLangScore(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày cấp chứng chỉ *</label>
                <input
                  type="date"
                  value={langIssueDate}
                  onChange={e => setLangIssueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bản scan chứng chỉ (PDF/Ảnh) *</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setLangFile(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLangModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Nộp chứng chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
