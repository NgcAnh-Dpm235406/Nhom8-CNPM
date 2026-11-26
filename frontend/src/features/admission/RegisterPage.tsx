import React, { useEffect, useState } from 'react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { FileUploadZone } from '../../components/common/FileUploadZone';
import { api } from '../../services/api';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';
import type { AdmissionCampaign, Major } from '../../types';

interface Props {
  initialMajorCode?: string;
  onNavigateToLookup: (profileCode: string) => void;
}

interface SubmissionConfirmation {
  profileCode: string;
  fullName: string;
  campaignName: string;
  majorName: string;
  message: string;
}

const formatDate = (value: string) => {
  const date = value.slice(0, 10);
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN');
};

const emptyForm = {
  fullName: '',
  dob: '',
  idCardNumber: '',
  email: '',
  phone: '',
  address: '',
  campaignId: '',
  majorId: ''
};

export const RegisterPage: React.FC<Props> = ({
  initialMajorCode = '8480201',
  onNavigateToLookup
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [campaigns, setCampaigns] = useState<AdmissionCampaign[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [uploadKey, setUploadKey] = useState(0);
  const [confirmation, setConfirmation] = useState<SubmissionConfirmation | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  useBrowserAlert(optionsError, setOptionsError);
  useBrowserAlert(submitError, setSubmitError);

  useEffect(() => {
    let isCurrent = true;
    void Promise.all([api.admission.getCampaigns(), api.academic.getMajors()])
      .then(([campaignResult, majorResult]) => {
        if (!campaignResult.success || !majorResult.success) {
          throw new Error('Không thể tải đợt tuyển sinh và danh sách ngành.');
        }
        if (!isCurrent) return;

        setCampaigns(campaignResult.campaigns);
        setMajors(majorResult.majors);
        setFormData(current => ({
          ...current,
          campaignId: campaignResult.campaigns[0]
            ? String(campaignResult.campaigns[0].campaign_id)
            : '',
          majorId: String(
            majorResult.majors.find(major => major.major_code === initialMajorCode)?.major_id
              ?? majorResult.majors[0]?.major_id
              ?? ''
          )
        }));
      })
      .catch(error => {
        if (isCurrent) {
          setOptionsError(error instanceof Error ? error.message : 'Không thể tải dữ liệu tuyển sinh.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOptions(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [initialMajorCode]);

  const selectedCampaign = campaigns.find(
    campaign => String(campaign.campaign_id) === formData.campaignId
  );
  const selectedMajor = majors.find(major => String(major.major_id) === formData.majorId);
  const canSubmit = !isLoadingOptions && campaigns.length > 0 && majors.length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setSubmitError('Vui lòng tải lên file hồ sơ minh chứng (≤ 25MB)!');
      return;
    }
    if (!selectedCampaign || !selectedMajor) {
      setSubmitError('Vui lòng chọn đợt tuyển sinh đang mở và ngành dự tuyển.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const requestData = new FormData();
      requestData.append('fullName', formData.fullName.trim());
      requestData.append('dob', formData.dob);
      requestData.append('idCardNumber', formData.idCardNumber.trim());
      requestData.append('email', formData.email.trim());
      requestData.append('phone', formData.phone.trim());
      requestData.append('address', formData.address.trim());
      requestData.append('campaignId', formData.campaignId);
      requestData.append('majorId', formData.majorId);
      requestData.append('degree_file', selectedFile);

      const result = await api.admission.register(requestData);
      if (!result.success) throw new Error(result.message || 'Không thể nộp hồ sơ.');

      setConfirmation({
        profileCode: result.data.profileCode,
        fullName: formData.fullName.trim(),
        campaignName: selectedCampaign.campaign_name,
        majorName: selectedMajor.major_name,
        message: result.message
      });
      setIsConfirmationOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể nộp hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      campaignId: selectedCampaign ? String(selectedCampaign.campaign_id) : '',
      majorId: selectedMajor ? String(selectedMajor.major_id) : ''
    });
    setSelectedFile(null);
    setConfirmation(null);
    setIsConfirmationOpen(false);
    setUploadKey(key => key + 1);
  };

  const renderConfirmationDetails = (profile: SubmissionConfirmation) => (
    <dl className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-left text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <dt className="text-slate-500">Mã hồ sơ</dt>
        <dd className="font-mono font-bold text-sky-700">{profile.profileCode}</dd>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <dt className="text-slate-500">Thí sinh</dt>
        <dd className="font-semibold text-slate-800">{profile.fullName}</dd>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <dt className="text-slate-500">Đợt tuyển sinh</dt>
        <dd className="font-semibold text-slate-800">{profile.campaignName}</dd>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <dt className="text-slate-500">Ngành dự tuyển</dt>
        <dd className="font-semibold text-slate-800">{profile.majorName}</dd>
      </div>
    </dl>
  );

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-sky-700 to-indigo-800 p-8 text-white shadow-lg">
        <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          Tuyển sinh Sau Đại học ĐHAG
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Đăng ký dự tuyển trình độ Thạc sĩ</h1>
        {isLoadingOptions ? (
          <p className="mt-3 text-sm text-sky-100">Đang tải thông tin tuyển sinh...</p>
        ) : selectedCampaign ? (
          <div className="mt-3 space-y-1 text-sm text-sky-100">
            <p className="font-semibold text-white">
              {selectedCampaign.campaign_name} · Năm học {selectedCampaign.academic_year}
            </p>
            <p>Hạn chót nhận hồ sơ: {formatDate(selectedCampaign.end_date)}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-100">Hiện chưa có đợt tuyển sinh nào đang mở.</p>
        )}
        {majors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Danh sách ngành đào tạo">
            {majors.map(major => (
              <span key={major.major_id} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white">
                {major.major_name}
              </span>
            ))}
          </div>
        )}
      </section>

      {confirmation && (
        <section className="mb-6 rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900">Hồ sơ đã được tiếp nhận</h2>
          <p className="mt-1 text-sm text-slate-600">{confirmation.message}</p>
          {renderConfirmationDetails(confirmation)}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateToLookup(confirmation.profileCode)}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Tra cứu kết quả
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Nộp hồ sơ khác
            </button>
          </div>
        </section>
      )}

      {!confirmation && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <fieldset disabled={!canSubmit || isSubmitting} className="space-y-6 disabled:opacity-70">
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">1. Thông tin cá nhân</h2>
                <p className="mt-1 text-sm text-slate-500">Điền thông tin liên hệ chính xác để nhà trường phản hồi hồ sơ.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Họ và tên *
                  <input
                    type="text"
                    required
                    maxLength={150}
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={event => setFormData({ ...formData, fullName: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Ngày sinh *
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={event => setFormData({ ...formData, dob: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Số CCCD *
                  <input
                    type="text"
                    required
                    maxLength={20}
                    autoComplete="off"
                    value={formData.idCardNumber}
                    onChange={event => setFormData({ ...formData, idCardNumber: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Nhập số CCCD"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Email liên hệ *
                  <input
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="email@example.com"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Số điện thoại *
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={event => setFormData({ ...formData, phone: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0912 345 678"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
                  Địa chỉ liên hệ *
                  <textarea
                    required
                    maxLength={500}
                    rows={3}
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={event => setFormData({ ...formData, address: event.target.value })}
                    className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. Thông tin dự tuyển & minh chứng</h2>
                <p className="mt-1 text-sm text-slate-500">Chọn đợt tuyển sinh, ngành đào tạo và tải hồ sơ minh chứng.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Đợt tuyển sinh *
                  <select
                    required
                    value={formData.campaignId}
                    onChange={event => setFormData({ ...formData, campaignId: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign.campaign_id} value={campaign.campaign_id}>
                        {campaign.campaign_name} ({campaign.academic_year})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-semibold text-slate-700">
                  Ngành dự tuyển *
                  <select
                    required
                    value={formData.majorId}
                    onChange={event => setFormData({ ...formData, majorId: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {majors.map(major => (
                      <option key={major.major_id} value={major.major_id}>
                        {major.major_name} ({major.major_code})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <FileUploadZone
                key={uploadKey}
                onFileSelect={setSelectedFile}
                maxSizeMB={25}
              />
            </section>
          </fieldset>

          {!isLoadingOptions && campaigns.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Chưa có đợt tuyển sinh đang mở. Hiện tại hệ thống chưa thể tiếp nhận hồ sơ.
            </p>
          )}
          {!isLoadingOptions && majors.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Chưa có ngành đào tạo để đăng ký. Vui lòng liên hệ Phòng Sau Đại học.
            </p>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Đang gửi hồ sơ...' : 'Nộp hồ sơ'}</span>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {isConfirmationOpen && confirmation && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsConfirmationOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admission-confirmation-title"
            className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsConfirmationOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng xác nhận"
            >
              <X className="h-5 w-5" />
            </button>
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
            <h2 id="admission-confirmation-title" className="text-center text-2xl font-bold text-slate-900">
              Hồ sơ đã được tiếp nhận
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">{confirmation.message}</p>
            {renderConfirmationDetails(confirmation)}
            <button
              type="button"
              onClick={() => onNavigateToLookup(confirmation.profileCode)}
              className="mt-5 w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Chuyển đến Tra cứu kết quả
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
