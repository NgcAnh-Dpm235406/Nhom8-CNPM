import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, XCircle, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';
import type { AdmissionLookupResult } from '../../types';

export const ResultLookupPage: React.FC<{ initialSearchKey?: string }> = ({ initialSearchKey = '' }) => {
  const [searchKey, setSearchKey] = useState(initialSearchKey);
  const [searchResult, setSearchResult] = useState<AdmissionLookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  useBrowserAlert(errorMessage, setErrorMessage);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKey.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    setErrorMessage('');
    setSearchResult(null);

    try {
      const response = await api.admission.lookup(searchKey.trim());
      if (response && response.success && response.data) {
        setSearchResult(response.data);
      } else {
        setErrorMessage(response?.message || 'Không tìm thấy hồ sơ dự tuyển phù hợp.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi tra cứu hồ sơ. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const getReviewBadge = (status: string) => {
    switch (status) {
      case 'Đạt yêu cầu':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đạt yêu cầu
          </span>
        );
      case 'Chờ xét duyệt':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Clock className="h-3.5 w-3.5" /> Chờ xét duyệt
          </span>
        );
      case 'Cần bổ sung':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Cần bổ sung hồ sơ
          </span>
        );
      case 'Không đạt':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
            <XCircle className="h-3.5 w-3.5" /> Không đạt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto my-12 max-w-3xl px-4">
      <h1 className="text-center text-3xl font-extrabold text-slate-900">
        Tra Cứu Hồ Sơ & Kết Quả Tuyển Sinh
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        Nhập số CCCD (12 số) hoặc Mã hồ sơ dự tuyển (ví dụ: <code className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-sky-800">089201004123</code>)
      </p>

      <form onSubmit={handleSearch} className="relative my-8">
        <input
          type="text"
          placeholder="Nhập số CCCD hoặc Mã hồ sơ..."
          value={searchKey}
          onChange={e => setSearchKey(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 py-4 pl-5 pr-32 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
          required
        />
        <button
          type="submit"
          disabled={isLoading || !searchKey.trim()}
          className="absolute bottom-2 right-2 top-2 flex items-center space-x-1.5 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          <span>{isLoading ? 'Đang tìm...' : 'Tra cứu'}</span>
        </button>
      </form>

      {hasSearched && searchResult && (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase font-medium text-slate-400">Họ và tên thí sinh</p>
                <h3 className="mt-0.5 text-2xl font-bold text-slate-800">{searchResult.name}</h3>
                <p className="mt-1 text-xs text-slate-500">Đợt xét tuyển: <strong className="text-slate-700">{searchResult.campaign}</strong></p>
              </div>
              <div className="text-right">
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-700">
                  {searchResult.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Số CCCD / ĐDCN</p>
                <p className="font-semibold text-slate-800">{searchResult.idCard}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Số điện thoại / Email</p>
                <p className="font-semibold text-slate-800">{searchResult.phone} · {searchResult.email}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Trạng thái duyệt hồ sơ</p>
                <div className="mt-1">{getReviewBadge(searchResult.reviewStatus)}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Kết quả trúng tuyển</p>
                <p className="mt-1">
                  {searchResult.admissionStatus === 'Đã nhập học' || searchResult.admissionStatus === 'Trúng tuyển' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <UserCheck className="h-3.5 w-3.5" /> {searchResult.admissionStatus}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      {searchResult.admissionStatus}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {searchResult.studentCode && (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 text-emerald-900">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Mã số học viên chính thức (MSHV)</p>
                  <p className="mt-0.5 text-2xl font-black font-mono tracking-wider text-emerald-950">{searchResult.studentCode}</p>
                </div>
                <div className="rounded-xl bg-emerald-200/70 px-3 py-1.5 text-xs font-bold text-emerald-900">
                  Đã công nhận học viên AGU
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-xs text-sky-900">
              <p className="font-semibold text-sky-800">Lời dặn từ Ban Tuyển sinh:</p>
              <p className="mt-1 leading-relaxed text-slate-600">{searchResult.note}</p>
            </div>
          </div>
      )}
    </div>
  );
};