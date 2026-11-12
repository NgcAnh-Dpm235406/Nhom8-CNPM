import { useCallback, useEffect, useState } from 'react';
import { Check, Users, X } from 'lucide-react';
import { api } from '../../services/api';
import type { FacultyAdvisorDashboard } from '../../types';

export const FacultyDashboard = () => {
  const [dashboard, setDashboard] = useState<FacultyAdvisorDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve().then(() => {
      if (isCurrent) return loadRequests();
      return undefined;
    });
    return () => {
      isCurrent = false;
    };
  }, [loadRequests]);

  const handleRespond = async (requestId: number, action: 'accept' | 'reject') => {
    setBusyRequestId(requestId);
    setError('');
    setNotice('');
    try {
      const result = await api.thesis.respondAdvisingRequest(requestId, action);
      if (!result.success) throw new Error(result.message || 'Không thể cập nhật yêu cầu.');
      setNotice(result.message);
      await loadRequests();
    } catch (respondError) {
      setError(respondError instanceof Error ? respondError.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (isLoading && !dashboard) {
    return <p className="mx-auto my-12 max-w-5xl px-4 text-center text-slate-500">Đang tải dữ liệu giảng viên...</p>;
  }

  const quota = dashboard?.quota ?? { maxSlots: 0, assignedCount: 0, slotsLeft: 0 };

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
              void loadRequests();
            }}
            className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100 disabled:opacity-50"
          >
            Thử tải lại
          </button>
        </div>
      )}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Định mức tối đa</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">{quota.maxSlots} <span className="text-sm font-normal text-slate-500">học viên</span></p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Đang hướng dẫn</p>
          <p className="mt-1 text-3xl font-extrabold text-sky-600">{quota.assignedCount} <span className="text-sm font-normal text-slate-500">học viên</span></p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-xs font-semibold uppercase text-slate-500">Slot còn lại</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">{quota.slotsLeft}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Users className="h-5 w-5 text-sky-600" /> Yêu cầu hướng dẫn
          </h3>
          <button
            type="button"
            onClick={() => {
              setError('');
              setIsLoading(true);
              void loadRequests();
            }}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>

        {dashboard?.requests.length ? (
          <div className="space-y-3">
            {dashboard.requests.map(request => {
              const isPending = request.status === 'Chờ GVHD duyệt';
              const isBusy = busyRequestId === request.advisor_assignment_id;
              return (
                <article key={request.advisor_assignment_id} className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {request.student_name} <span className="font-normal text-slate-500">({request.student_code})</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{request.email} · {request.phone}</p>
                    <p className="mt-1 text-sm text-slate-700">Đề tài: {request.thesis_title || 'Chưa đăng ký'}</p>
                    <p className="mt-1 text-xs text-slate-500">{request.role} · {request.status}</p>
                  </div>
                  {isPending && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={isBusy || quota.slotsLeft <= 0}
                        onClick={() => void handleRespond(request.advisor_assignment_id, 'accept')}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> {isBusy ? 'Đang xử lý...' : 'Nhận hướng dẫn'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleRespond(request.advisor_assignment_id, 'reject')}
                        className="flex items-center gap-1 rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Từ chối
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
            {isLoading ? 'Đang tải danh sách...' : 'Chưa có yêu cầu hướng dẫn nào.'}
          </p>
        )}
      </section>
    </div>
  );
};
