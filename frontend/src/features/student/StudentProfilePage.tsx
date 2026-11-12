import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../services/api';
import type { StudentInfo } from '../../types';

export const StudentProfilePage = () => {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const result = await api.student.getMyInfo();
      if (!result.success) throw new Error('Không thể tải thông tin cá nhân.');
      setStudent(result.student);
      setEmail(result.student.email);
      setPhone(result.student.phone);
      setAddress(result.student.address ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải thông tin cá nhân.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    void Promise.resolve().then(() => {
      if (isCurrent) return loadProfile();
      return undefined;
    });
    return () => {
      isCurrent = false;
    };
  }, [loadProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const result = await api.student.updateMyInfo({ email, phone, address });
      if (!result.success) throw new Error(result.message || 'Không thể cập nhật thông tin cá nhân.');
      setNotice(result.message);
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể cập nhật thông tin cá nhân.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto my-8 max-w-3xl space-y-5 px-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Học viên</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Thông tin cá nhân</h1>
        <p className="mt-2 text-slate-600">Cập nhật email liên hệ, số điện thoại và địa chỉ của bạn.</p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      {isLoading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải thông tin cá nhân...</p>
      ) : student ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Họ và tên
              <input value={student.full_name} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Mã học viên
              <input value={student.student_code} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              CCCD
              <input value={student.id_card_number} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Ngày sinh
              <input value={student.dob?.slice(0, 10) ?? ''} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Email liên hệ *
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Số điện thoại *
              <input
                type="tel"
                required
                minLength={8}
                maxLength={15}
                value={phone}
                onChange={event => setPhone(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            Địa chỉ
            <textarea
              rows={3}
              maxLength={500}
              value={address}
              onChange={event => setAddress(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Không tìm thấy hồ sơ học viên.</p>
      )}
    </section>
  );
};
