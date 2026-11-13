import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Users,
  X,
  BookOpen,
  Award,
  FileText,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import type {
  FacultyAdvisorDashboard,
  FacultySubmissionRecord,
  LecturerCommitteeRecord
} from '../../types';

type FacultyTab = 'advising' | 'submissions' | 'committees';

export const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState<FacultyTab>('advising');
  const [dashboard, setDashboard] = useState<FacultyAdvisorDashboard | null>(null);
  const [submissions, setSubmissions] = useState<FacultySubmissionRecord[]>([]);
  const [committees, setCommittees] = useState<LecturerCommitteeRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [evaluatingSubId, setEvaluatingSubId] = useState<number | null>(null);
  const [evaluatingScheduleId, setEvaluatingScheduleId] = useState<number | null>(null);

  // Form states cho đánh giá bài nộp mốc
  const [subFeedback, setSubFeedback] = useState<Record<number, string>>({});
  const [subStatus, setSubStatus] = useState<Record<number, 'Đạt' | 'Cần sửa đổi'>>({});

  // Form states cho chấm điểm Hội đồng
  const [evalScores, setEvalScores] = useState<Record<number, {
    contentScore: string;
    presentationScore: string;
    qaScore: string;
    feedback: string;
  }>>({});

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // 1. Tải dữ liệu Yêu cầu & Quota
  const loadRequests = useCallback(async () => {
    try {
      const result = await api.thesis.getFacultyAdvisingRequests();
      if (!result.success) throw new Error('Không thể tải danh sách yêu cầu hướng dẫn.');
      setDashboard({ quota: result.quota, requests: result.requests });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu giảng viên.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Tải danh sách bài nộp của học viên cần đánh giá
  const loadSubmissions = useCallback(async () => {
    try {
      const result = await api.thesis.getFacultySubmissions();
      if (result.success) {
        setSubmissions(result.submissions);
        // Khởi tạo state nhận xét ban đầu
        const initFeedback: Record<number, string> = {};
        const initStatus: Record<number, 'Đạt' | 'Cần sửa đổi'> = {};
        result.submissions.forEach(sub => {
          initFeedback[sub.submission_id] = sub.lecturer_feedback || '';
          initStatus[sub.submission_id] = sub.submission_status === 'Cần sửa đổi' ? 'Cần sửa đổi' : 'Đạt';
        });
        setSubFeedback(initFeedback);
        setSubStatus(initStatus);
      }
    } catch (err) {
      console.error('Lỗi tải bài nộp:', err);
      setError(err instanceof Error ? `Lỗi tải bài nộp mốc tiến độ: ${err.message}` : 'Không thể tải danh sách bài nộp.');
    }
  }, []);

  // 3. Tải danh sách Hội đồng mà Giảng viên tham gia
  const loadCommittees = useCallback(async () => {
    try {
      const result = await api.committee.getMyCommittees();
      if (result.success) {
        setCommittees(result.committees);
        // Khởi tạo state chấm điểm
        const initScores: Record<number, { contentScore: string; presentationScore: string; qaScore: string; feedback: string }> = {};
        result.committees.forEach(c => {
          initScores[c.defense_schedule_id] = {
            contentScore: c.content_score !== null ? String(c.content_score) : '',
            presentationScore: c.presentation_score !== null ? String(c.presentation_score) : '',
            qaScore: c.qa_score !== null ? String(c.qa_score) : '',
            feedback: c.my_feedback || ''
          };
        });
        setEvalScores(initScores);
      }
    } catch (err) {
      console.error('Lỗi tải hội đồng:', err);
      setError(err instanceof Error ? `Lỗi tải danh sách hội đồng: ${err.message}` : 'Không thể tải danh sách hội đồng.');
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve().then(() => {
      if (isCurrent) {
        void loadRequests();
        void loadSubmissions();
        void loadCommittees();
      }
      return undefined;
    });
    return () => {
      isCurrent = false;
    };
  }, [loadRequests, loadSubmissions, loadCommittees]);

  // Phê duyệt / Từ chối yêu cầu hướng dẫn
  const handleRespond = async (requestId: number, action: 'accept' | 'reject') => {
    setBusyRequestId(requestId);
    setError('');
    setNotice('');
    try {
      const result = await api.thesis.respondAdvisingRequest(requestId, action);
      if (!result.success) throw new Error(result.message || 'Không thể cập nhật yêu cầu.');
      setNotice(result.message);
      await loadRequests();
      await loadSubmissions();
    } catch (respondError) {
      setError(respondError instanceof Error ? respondError.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setBusyRequestId(null);
    }
  };

  // Giảng viên đánh giá mốc nộp bài của học viên
  const handleEvaluateSubmission = async (submissionId: number) => {
    setEvaluatingSubId(submissionId);
    setError('');
    setNotice('');
    try {
      const feedback = subFeedback[submissionId] || '';
      const status = subStatus[submissionId] || 'Đạt';
      const res = await api.thesis.evaluateSubmission(submissionId, { feedback, status });
      if (!res.success) throw new Error(res.message);
      setNotice(res.message);
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu nhận xét đánh giá.');
    } finally {
      setEvaluatingSubId(null);
    }
  };

  // Giảng viên chấm điểm độc lập khi là thành viên Hội đồng
  const handleEvaluateDefense = async (schedule: LecturerCommitteeRecord) => {
    setEvaluatingScheduleId(schedule.defense_schedule_id);
    setError('');
    setNotice('');
    try {
      const draft = evalScores[schedule.defense_schedule_id];
      if (!draft) return;
      const cScore = parseFloat(draft.contentScore);
      const pScore = parseFloat(draft.presentationScore);
      const qScore = parseFloat(draft.qaScore);

      if (isNaN(cScore) || cScore < 0 || cScore > 5.0 ||
          isNaN(pScore) || pScore < 0 || pScore > 2.5 ||
          isNaN(qScore) || qScore < 0 || qScore > 2.5) {
        throw new Error('Điểm không hợp lệ! Chuẩn AGU: Nội dung [0-5.0], Trình bày [0-2.5], Trả lời câu hỏi [0-2.5].');
      }

      const res = await api.committee.evaluateDefense({
        defenseScheduleId: schedule.defense_schedule_id,
        roleInCommittee: schedule.my_role,
        contentScore: cScore,
        presentationScore: pScore,
        qaScore: qScore,
        feedback: draft.feedback
      });

      if (!res.success) throw new Error(res.message);
      setNotice(res.message);
      await loadCommittees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu điểm hội đồng.');
    } finally {
      setEvaluatingScheduleId(null);
    }
  };

  if (isLoading && !dashboard) {
    return <p className="mx-auto my-12 max-w-5xl px-4 text-center text-slate-500">Đang tải dữ liệu giảng viên...</p>;
  }

  const quota = dashboard?.quota ?? { maxSlots: 0, assignedCount: 0, slotsLeft: 0 };

  return (
    <div className="mx-auto my-8 max-w-6xl space-y-6 px-4">
      {/* Thông báo lỗi / thành công */}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={() => { setError(''); void loadRequests(); void loadSubmissions(); void loadCommittees(); }}
            className="rounded-lg border border-rose-300 px-3 py-1 font-semibold hover:bg-rose-100"
          >
            Đóng
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </p>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Ẩn
          </button>
        </div>
      )}

      {/* 3 Thẻ Quota slot của Giảng viên */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Định mức tối đa (Quy chế AGU)</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            {quota.maxSlots} <span className="text-sm font-normal text-slate-500">học viên / đợt</span>
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Đang chính thức hướng dẫn</p>
          <p className="mt-1 text-3xl font-extrabold text-sky-600">
            {quota.assignedCount} <span className="text-sm font-normal text-slate-500">học viên</span>
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Slot còn trống khả dụng</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">{quota.slotsLeft}</p>
        </div>
      </div>

      {/* Điều hướng 3 Tab chức năng của Giảng viên */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('advising')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'advising'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>1. Yêu cầu & Học viên hướng dẫn</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'submissions'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>2. Đánh giá tiến độ luận văn ({submissions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('committees')}
          className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
            activeTab === 'committees'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>3. Hội đồng của tôi ({committees.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: YÊU CẦU & DANH SÁCH HỌC VIÊN HƯỚNG DẪN                  */}
      {/* ============================================================== */}
      {activeTab === 'advising' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Danh sách yêu cầu đăng ký hướng dẫn</h3>
              <p className="text-xs text-slate-500">Phê duyệt hoặc từ chối các yêu cầu từ học viên Thạc sĩ.</p>
            </div>
            <button
              type="button"
              onClick={() => { setError(''); setIsLoading(true); void loadRequests(); }}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
          </div>

          {dashboard?.requests.length ? (
            <div className="space-y-3">
              {dashboard.requests.map(request => {
                const isPending = request.status === 'Chờ GVHD duyệt';
                const isBusy = busyRequestId === request.advisor_assignment_id;
                return (
                  <article
                    key={request.advisor_assignment_id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-base">{request.student_name}</p>
                        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-800">
                          {request.student_code}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          request.status === 'Đang hướng dẫn'
                            ? 'bg-emerald-100 text-emerald-800'
                            : request.status === 'Từ chối'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">Email: {request.email} · SĐT: {request.phone}</p>
                      <p className="mt-2 text-sm text-slate-800">
                        Đề tài luận văn: <strong className="text-sky-900">{request.thesis_title || 'Chưa đăng ký đề tài'}</strong>
                      </p>
                      {request.current_stage && (
                        <p className="mt-1 text-xs text-slate-500">
                          Giai đoạn hiện tại: <span className="font-semibold text-slate-700">{request.current_stage}</span> ({request.progress_percent || 0}%)
                        </p>
                      )}
                    </div>
                    {isPending && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={isBusy || quota.slotsLeft <= 0}
                          onClick={() => void handleRespond(request.advisor_assignment_id, 'accept')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {isBusy ? 'Đang xử lý...' : 'Đồng ý nhận'}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleRespond(request.advisor_assignment_id, 'reject')}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
              Hiện chưa có học viên nào gửi yêu cầu đăng ký hướng dẫn.
            </p>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ĐÁNH GIÁ TIẾN ĐỘ LUẬN VĂN (MỐC BÁO CÁO CỦA HỌC VIÊN)    */}
      {/* ============================================================== */}
      {activeTab === 'submissions' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Đánh giá báo cáo tiến độ luận văn của Học viên
              </h3>
              <p className="text-xs text-slate-500">
                Xem file báo cáo đính kèm (≤ 25MB), cho lời dặn nhận xét và phê duyệt `Đạt` hoặc `Cần sửa đổi`.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setError(''); void loadSubmissions(); }}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>

          {submissions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              Chưa có học viên nào nộp bài báo cáo tiến độ cần đánh giá.
            </p>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => {
                const isBusy = evaluatingSubId === sub.submission_id;
                return (
                  <div
                    key={sub.submission_id}
                    className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-base">{sub.student_name}</p>
                          <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                            {sub.student_code}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            sub.submission_status === 'Đạt'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.submission_status === 'Cần sửa đổi'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sub.submission_status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Đề tài: <strong className="text-slate-800">{sub.thesis_title}</strong></p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl block">
                          Mốc: {sub.stage_name}
                        </span>
                        <p className="text-slate-400 mt-1">Nộp lúc: {sub.submitted_at?.slice(0, 10) || 'Chưa nộp'}</p>
                      </div>
                    </div>

                    {/* File báo cáo đính kèm */}
                    <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-3.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText className="h-5 w-5 text-sky-600" />
                        <span>File báo cáo tiến độ đính kèm:</span>
                        <strong className="text-slate-900">{sub.report_file_url?.split('/').pop()}</strong>
                      </div>
                      <a
                        href={sub.report_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-sky-50 px-3 py-1.5 font-bold text-sky-700 hover:bg-sky-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Tải về xem chi tiết
                      </a>
                    </div>

                    {/* Khu vực nhập nhận xét & đánh giá */}
                    <div className="space-y-3 pt-1 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Lời dặn / Nhận xét của Giảng viên hướng dẫn:
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Nhập nhận xét chi tiết, nhắc nhở hoặc yêu cầu chỉnh sửa cho học viên..."
                          value={subFeedback[sub.submission_id] ?? ''}
                          onChange={e => setSubFeedback(prev => ({ ...prev, [sub.submission_id]: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-slate-700">Kết luận đánh giá:</label>
                          <select
                            value={subStatus[sub.submission_id] ?? 'Đạt'}
                            onChange={e => setSubStatus(prev => ({ ...prev, [sub.submission_id]: e.target.value as 'Đạt' | 'Cần sửa đổi' }))}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold"
                          >
                            <option value="Đạt">✅ Đạt yêu cầu</option>
                            <option value="Cần sửa đổi">⚠️ Cần sửa đổi & nộp lại</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleEvaluateSubmission(sub.submission_id)}
                          className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 font-bold text-white shadow hover:bg-sky-700 disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isBusy ? 'Đang lưu...' : 'Lưu đánh giá mốc'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: HỘI ĐỒNG CỦA TÔI (CHẤM ĐIỂM BẢO VỆ LUẬN VĂN ĐỘC LẬP)     */}
      {/* ============================================================== */}
      {activeTab === 'committees' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Hội đồng Bảo vệ Luận văn Thạc sĩ của tôi
              </h3>
              <p className="text-xs text-slate-500">
                Thầy/Cô chấm điểm độc lập cho từng học viên bảo vệ theo chuẩn AGU: Nội dung [0-5.0], Trình bày [0-2.5], Trả lời câu hỏi [0-2.5].
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setError(''); void loadCommittees(); }}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>

          {committees.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              Thầy/Cô hiện chưa được phân công vào Hội đồng bảo vệ luận văn nào.
            </p>
          ) : (
            <div className="space-y-6">
              {committees.map(c => {
                const draft = evalScores[c.defense_schedule_id] || {
                  contentScore: '',
                  presentationScore: '',
                  qaScore: '',
                  feedback: ''
                };
                const totalScore = (
                  parseFloat(draft.contentScore || '0') +
                  parseFloat(draft.presentationScore || '0') +
                  parseFloat(draft.qaScore || '0')
                ).toFixed(2);
                const isBusy = evaluatingScheduleId === c.defense_schedule_id;

                return (
                  <div
                    key={c.defense_schedule_id}
                    className="rounded-3xl border-2 border-slate-200 bg-slate-50/40 p-6 space-y-4"
                  >
                    {/* Thông tin Hội đồng & Thí sinh */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-800">
                          {c.committee_name}
                        </span>
                        <h4 className="mt-2 text-xl font-black text-slate-900">{c.student_name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          MSHV: <strong className="text-slate-800">{c.student_code}</strong> · Lượt bảo vệ: #{c.defense_order} ({c.start_time?.slice(0, 5)})
                        </p>
                        <p className="text-xs text-slate-600 mt-1">Đề tài: <strong className="text-sky-900">{c.thesis_title}</strong></p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="inline-block rounded-2xl bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-900">
                          Vai trò của tôi: {c.my_role}
                        </div>
                        <p className="text-xs text-slate-500">Phòng: <strong>{c.defense_room}</strong></p>
                        <p className="text-xs text-slate-500">Ngày bảo vệ: <strong>{c.defense_date?.slice(0, 10)}</strong></p>
                        {c.average_score !== null && (
                          <p className="text-xs font-bold text-emerald-700">
                            Điểm TB Hội đồng: {c.average_score} ({c.defense_result})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phiếu chấm điểm độc lập của Thầy/Cô */}
                    <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                          Phiếu chấm điểm độc lập của Thầy/Cô ({c.my_role})
                        </h5>
                        <div className="rounded-xl bg-slate-100 px-3 py-1 font-bold text-slate-800">
                          Tổng điểm: <span className="text-base text-sky-700">{totalScore}</span> / 10.0
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            1. Nội dung luận văn (Tối đa 5.0đ) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5.0"
                            placeholder="0.0 - 5.0"
                            value={draft.contentScore}
                            onChange={e => {
                              const val = e.target.value;
                              setEvalScores(prev => ({
                                ...prev,
                                [c.defense_schedule_id]: { ...draft, contentScore: val }
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            2. Trình bày & Slide (Tối đa 2.5đ) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2.5"
                            placeholder="0.0 - 2.5"
                            value={draft.presentationScore}
                            onChange={e => {
                              const val = e.target.value;
                              setEvalScores(prev => ({
                                ...prev,
                                [c.defense_schedule_id]: { ...draft, presentationScore: val }
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            3. Trả lời câu hỏi (Tối đa 2.5đ) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2.5"
                            placeholder="0.0 - 2.5"
                            value={draft.qaScore}
                            onChange={e => {
                              const val = e.target.value;
                              setEvalScores(prev => ({
                                ...prev,
                                [c.defense_schedule_id]: { ...draft, qaScore: val }
                              }));
                            }}
                            className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nhận xét, câu hỏi chất vấn & Lời dặn cho luận văn:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ý kiến đánh giá chuyên môn, ưu khuyết điểm của đề tài..."
                          value={draft.feedback}
                          onChange={e => {
                            const val = e.target.value;
                            setEvalScores(prev => ({
                              ...prev,
                              [c.defense_schedule_id]: { ...draft, feedback: val }
                            }));
                          }}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={isBusy || !draft.contentScore || !draft.presentationScore || !draft.qaScore}
                          onClick={() => handleEvaluateDefense(c)}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isBusy ? 'Đang lưu điểm...' : 'Xác nhận nộp phiếu chấm điểm'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
