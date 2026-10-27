import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, User, FileText } from 'lucide-react';
import { api } from '../../services/api';
import type { Lecturer, StudentAdvisor, StudentInfo, StudentThesisProgress } from '../../types';

export const StudentDashboard = () => {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [thesis, setThesis] = useState<StudentThesisProgress | null>(null);
  const [advisor, setAdvisor] = useState<StudentAdvisor | null>(null);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
      setLecturers(lecturerResult.lecturers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu học viên.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const hasActiveAdvisor = advisor?.status === 'Đang hướng dẫn';
  const hasPendingAdvisor = advisor?.status === 'Chờ GVHD duyệt';
  const availableLecturers = lecturers.filter(lecturer => lecturer.slots_left > 0);

  const handleAdvisorRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lecturerId = Number(selectedLecturerId);
    if (!Number.isSafeInteger(lecturerId) || lecturerId <= 0) {
      setError('Vui lòng chọn giảng viên hướng dẫn.');
      return;
    }

    setError('');
    setNotice('');
    setIsLoading(true);
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

  if (isLoading && !student) {
    return <p className="mx-auto my-12 max-w-5xl px-4 text-center text-slate-500">Đang tải thông tin học viên...</p>;
  }

  return (
    <div className="mx-auto my-8 max-w-5xl space-y-6 px-4">
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setError('');
              setIsLoading(true);
              void loadDashboard();
            }}
            className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100 disabled:opacity-50"
          >
            Thử tải lại
          </button>
        </div>
      )}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      {student && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row">
          <div className="flex items-center space-x-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Học viên: {student.full_name}
                <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
                  MSHV: {student.student_code}
                </span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">{student.major_name} · Khóa {student.cohort}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700">Giảng viên hướng dẫn</p>
              {advisor ? (
                <>
                  <p>{advisor.degree} {advisor.lecturer_name}</p>
                  <p className={`text-xs ${hasActiveAdvisor ? 'text-emerald-700' : 'text-amber-700'}`}>{advisor.status}</p>
                </>
              ) : (
                <p className="text-slate-500">Chưa đăng ký</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!hasActiveAdvisor && !hasPendingAdvisor && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">Đăng ký giảng viên hướng dẫn</h3>
          <p className="mt-1 text-sm text-slate-600">Chọn giảng viên còn slot. Yêu cầu sẽ được gửi đến giảng viên để phê duyệt.</p>
          {advisor?.status === 'Từ chối' && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Yêu cầu trước đã bị từ chối. Bạn có thể chọn giảng viên khác để gửi yêu cầu mới.
            </p>
          )}
          <form onSubmit={handleAdvisorRequest} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedLecturerId}
              onChange={event => setSelectedLecturerId(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              required
              disabled={availableLecturers.length === 0 || isSubmitting}
            >
              <option value="">Chọn giảng viên hướng dẫn</option>
              {availableLecturers.map(lecturer => (
                <option key={lecturer.lecturer_id} value={lecturer.lecturer_id}>
                  {lecturer.degree} {lecturer.full_name} · Còn {lecturer.slots_left} slot
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedLecturerId || isSubmitting || availableLecturers.length === 0}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
          {availableLecturers.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">Hiện chưa có giảng viên còn slot hướng dẫn.</p>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <FileText className="h-5 w-5 text-sky-600" />
          {thesis ? 'Thông tin đề tài luận văn' : 'Đăng ký đề tài luận văn'}
        </h3>
        {hasActiveAdvisor ? (
          <form onSubmit={handleThesisSubmit} className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              {thesis
                ? 'Bạn có thể cập nhật tên đề tài; thay đổi sẽ cần giảng viên hướng dẫn xem xét.'
                : 'Nhập tên đề tài dự kiến (ít nhất 10 ký tự). Đề tài sẽ được gửi để giảng viên hướng dẫn xem xét.'}
            </p>
            <textarea
              required
              minLength={10}
              maxLength={500}
              rows={3}
              value={thesisTitle}
              onChange={event => setThesisTitle(event.target.value)}
              placeholder="Nhập tên đề tài luận văn dự kiến..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {thesis && (
                <p className="text-xs text-slate-500">
                  Trạng thái: <span className="font-semibold text-amber-700">{thesis.status}</span>
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || thesisTitle.trim().length < 10}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
              >
                {isSubmitting ? 'Đang gửi...' : thesis ? 'Cập nhật đề tài' : 'Đăng ký đề tài'}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            {hasPendingAdvisor
              ? 'Đề tài có thể đăng ký sau khi giảng viên hướng dẫn chấp nhận yêu cầu của bạn.'
              : 'Bạn cần có giảng viên hướng dẫn trước khi đăng ký đề tài luận văn.'}
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
          <BookOpen className="h-5 w-5 text-sky-600" /> Tiến độ luận văn
        </h3>
        {thesis ? (
          <div className="space-y-3">
            <p className="font-semibold text-slate-800">{thesis.thesis_title}</p>
            <p className="text-sm text-slate-600">Giai đoạn: {thesis.current_stage}</p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-600"
                style={{ width: `${Math.min(100, Math.max(0, thesis.progress_percent || 0))}%` }}
              />
            </div>
            <p className="text-right text-xs text-slate-500">{thesis.progress_percent || 0}% · {thesis.status}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có đề tài luận văn được ghi nhận.</p>
        )}
      </section>
    </div>
  );
};
