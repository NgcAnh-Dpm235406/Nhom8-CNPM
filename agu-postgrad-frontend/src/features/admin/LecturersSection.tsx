import { useState } from 'react';
import type { AdminDashboardModel } from './useAdminDashboard';

export const LecturersSection = ({ dashboard }: { dashboard: AdminDashboardModel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    lecturers,
    isLoading,
    editingLecturerId,
    setEditingLecturerId,
    lecturerForm,
    setLecturerForm,
    emptyLecturerForm,
    setActionError,
    setNotice,
    isSavingLecturer,
    handleSaveLecturer,
    handleCancelLecturerEdit,
    handleEditLecturer,
    handleDeleteLecturer
  } = dashboard;

  return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Danh sách giảng viên</h2>
            <p className="mt-1 text-sm text-slate-600">Tài khoản giảng viên được tạo cùng hồ sơ và dùng để đăng nhập hệ thống.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingLecturerId(null);
              setLecturerForm(emptyLecturerForm);
              setActionError('');
              setNotice('');
              setIsModalOpen(true);
            }}
            className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Thêm giảng viên
          </button>
        </div>

        {isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
      
      {/* Tiêu đề và Nút tắt Modal */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-900">
          {editingLecturerId ? 'Cập nhật thông tin giảng viên' : 'Thêm giảng viên mới'}
        </h3>
        <button
          type="button"
          onClick={() => {
            setIsModalOpen(false);
            if (editingLecturerId) handleCancelLecturerEdit();
          }}
          className="text-2xl font-bold text-slate-400 hover:text-slate-700"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      <form 
        onSubmit={async (e) => {
          await handleSaveLecturer(e);
          setIsModalOpen(false); // Đóng modal sau khi lưu thành công
        }} 
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Họ và tên
            <input required maxLength={150} value={lecturerForm.fullName} onChange={event => setLecturerForm(form => ({ ...form, fullName: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Mã giảng viên
            <input required maxLength={20} value={lecturerForm.lecturerCode} onChange={event => setLecturerForm(form => ({ ...form, lecturerCode: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Tên đăng nhập
            <input required maxLength={100} value={lecturerForm.username} onChange={event => setLecturerForm(form => ({ ...form, username: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Email
            <input required type="email" maxLength={100} value={lecturerForm.email} onChange={event => setLecturerForm(form => ({ ...form, email: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Số điện thoại
            <input maxLength={15} value={lecturerForm.phone} onChange={event => setLecturerForm(form => ({ ...form, phone: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Học vị
            <select required value={lecturerForm.degree} onChange={event => setLecturerForm(form => ({ ...form, degree: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
              <option>Tiến sĩ</option>
              <option>Phó Giáo sư</option>
              <option>Giáo sư</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            Số học viên hướng dẫn tối đa
            <input required type="number" min={1} step={1} value={lecturerForm.maxSlots} onChange={event => setLecturerForm(form => ({ ...form, maxSlots: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">
            {editingLecturerId ? 'Đặt mật khẩu mới (không bắt buộc)' : 'Mật khẩu ban đầu'}
            <input
              required={!editingLecturerId}
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={lecturerForm.password ?? ''}
              onChange={event => setLecturerForm(form => ({ ...form, password: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </label>
        </div>
        
        {/* Nhóm nút Hủy / Lưu ở góc dưới cùng */}
        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button 
            type="button" 
            onClick={() => {
              setIsModalOpen(false);
              if (editingLecturerId) handleCancelLecturerEdit();
            }} 
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            disabled={isSavingLecturer} 
            className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {isSavingLecturer ? 'Đang lưu...' : editingLecturerId ? 'Lưu thay đổi' : 'Tạo tài khoản giảng viên'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <p className="p-8 text-center text-slate-500">Đang tải danh sách giảng viên...</p>
          ) : lecturers.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Chưa có giảng viên nào.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Giảng viên</th>
                  <th className="px-4 py-3">Tài khoản</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Học vị</th>
                  <th className="px-4 py-3">Slot hướng dẫn</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lecturers.map(lecturer => (
                  <tr key={lecturer.lecturer_id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{lecturer.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{lecturer.lecturer_code}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{lecturer.username}</td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{lecturer.email}</p>
                      <p>{lecturer.phone || 'Chưa có số điện thoại'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{lecturer.degree}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {lecturer.current_assigned}/{lecturer.max_slots} đang hướng dẫn
                      <p className="mt-1 text-xs text-slate-500">Còn {lecturer.slots_left} slot</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => {
                          handleEditLecturer(lecturer);
                          setIsModalOpen(true);
                        }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                          Sửa
                        </button>
                        <button type="button" onClick={() => void handleDeleteLecturer(lecturer)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
};
