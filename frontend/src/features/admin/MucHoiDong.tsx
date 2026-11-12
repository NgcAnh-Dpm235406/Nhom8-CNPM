import { useState, useMemo } from 'react';
import type { AdminDashboardModel } from './useDuLieuQuanTri';

export const CommitteesSection = ({ dashboard }: { dashboard: AdminDashboardModel }) => {
  const {
    showCommitteeForm,
    setShowCommitteeForm,
    setActionError,
    setNotice,
    actionError,
    lecturers,
    isLoading,
    committeeForm,
    setCommitteeForm,
    defenseCandidates,
    committeeCandidate,
    setCommitteeCandidate,
    committeeDefenseOrder,
    setCommitteeDefenseOrder,
    committeeStartTime,
    setCommitteeStartTime,
    committeeRoles,
    committeeMembers,
    setCommitteeMembers,
    committeeScheduleDrafts,
    setCommitteeScheduleDrafts,
    isCreatingCommittee,
    handleSaveCommittee,
    handleCloseCommitteeForm,
    editingCommitteeId,
    handleStartEditCommittee,
    handleDeleteCommittee,
    handleAddStudentToCommittee,
    isAddingSchedule,
    committees,
    formatDate,
    formatTime,
    activeScoreScheduleId,
    toggleScoreForm,
    handleSaveScores,
    scoreDrafts,
    setScoreDrafts,
    scoreFormError,
    busyScoreScheduleId,
    evaluationRoles,
    emptyScoreDraft
  } = dashboard;

  // --- State cho Tìm kiếm và Lọc ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'has_students', 'empty'
  const [scheduleCommitteeId, setScheduleCommitteeId] = useState<number | null>(null);
  const [scheduleCandidate, setScheduleCandidate] = useState('');
  const [scheduleOrder, setScheduleOrder] = useState(1);
  const [scheduleTime, setScheduleTime] = useState('08:00');

  const submitSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scheduleCommitteeId === null || !scheduleCandidate) {
      setActionError('Vui lòng chọn học viên cần xếp lịch.');
      return;
    }

    const saved = await handleAddStudentToCommittee(scheduleCommitteeId, {
      thesisId: Number(scheduleCandidate),
      defenseOrder: scheduleOrder,
      startTime: scheduleTime
    });

    if (saved) {
      setScheduleCommitteeId(null);
      setScheduleCandidate('');
      setScheduleOrder(1);
      setScheduleTime('08:00');
    }
  };

  // --- Thống kê & Lọc dữ liệu ---
  const { filteredCommittees, stats } = useMemo(() => {
    const totalStudents = committees.reduce((total, { schedules }) => total + schedules.length, 0);
    const scheduledCommittees = committees.filter(({ schedules }) => schedules.length > 0).length;

    const filtered = committees.filter(({ committee, schedules }) => {
      const matchesSearch = 
        committee.committee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        committee.defense_room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        committee.president_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'has_students' && schedules.length > 0) ||
        (filterStatus === 'empty' && schedules.length === 0);

      return matchesSearch && matchesStatus;
    });

    return {
      filteredCommittees: filtered,
      stats: {
        total: committees.length,
        scheduled: scheduledCommittees,
        empty: committees.length - scheduledCommittees,
        students: totalStudents
      }
    };
  }, [committees, searchTerm, filterStatus]);

  const handleExportExcel = async () => {
    if (filteredCommittees.length === 0) {
      alert('Không có hội đồng nào phù hợp để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Mã hội đồng',
      'Tên hội đồng',
      'Ngày bảo vệ',
      'Phòng bảo vệ',
      'Chủ tịch',
      'Phản biện 1',
      'Phản biện 2',
      'Thư ký',
      'Ủy viên',
      'Mã học viên',
      'Họ tên học viên',
      'Tên đề tài',
      'Lượt bảo vệ',
      'Giờ bảo vệ',
      'Điểm trung bình',
      'Kết quả',
      'Số phiếu chấm'
    ];

    const rows = filteredCommittees.flatMap(({ committee, schedules }) => {
      const entries = schedules.length > 0 ? schedules : [null];
      return entries.map(schedule => [
        null,
        committee.committee_id,
        committee.committee_name,
        formatDate(committee.defense_date),
        committee.defense_room,
        committee.president_name,
        committee.reviewer1_name,
        committee.reviewer2_name,
        committee.secretary_name,
        committee.member_name,
        schedule?.student_code ?? null,
        schedule?.student_name ?? null,
        schedule?.thesis_title ?? null,
        schedule?.defense_order ?? null,
        schedule?.start_time ? formatTime(schedule.start_time) : null,
        schedule?.average_score ?? null,
        schedule?.defense_result ?? null,
        schedule?.evaluation_count ?? null
      ]);
    });

    rows.forEach((row, index) => { row[0] = index + 1; });

    const dateStamp = new Date().toISOString().slice(0, 10);
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AGU PostGrad';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Danh sách hội đồng', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });
      worksheet.columns = headers.map((header, index) => ({
        header,
        key: `column${index + 1}`,
        width: [8, 14, 24, 16, 24, 24, 24, 24, 24, 24, 18, 24, 50, 14, 14, 18, 18, 16][index]
      }));
      worksheet.addRows(rows);
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: rows.length + 1, column: headers.length }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0369A1' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
      worksheet.getRow(1).height = 30;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `danh-sach-hoi-dong-${dateStamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Không thể xuất tệp Excel: ${error instanceof Error ? error.message : 'Lỗi không xác định.'}`);
    }
  };

  return (
      <div className="space-y-5 relative">
        
        {/* Header & Nút thao tác chính */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Danh sách hội đồng đã thành lập</h2>
            <p className="mt-1 text-sm text-slate-600">Theo dõi thành viên, lịch bảo vệ và kết quả của từng học viên.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Xuất Excel
            </button>
            <button
              type="button"
              onClick={() => {
                handleCloseCommitteeForm();
                setShowCommitteeForm(true);
                setActionError('');
                setNotice('');
              }}
              className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Thành lập thêm
            </button>
          </div>
        </div>

        {/* Dashboard Thống kê nhanh */}
        {!isLoading && committees.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Tổng số hội đồng</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Đã xếp lịch học viên</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.scheduled}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Chưa xếp lịch</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.empty}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Tổng lượt bảo vệ</p>
              <p className="mt-1 text-2xl font-bold text-sky-600">{stats.students}</p>
            </div>
          </div>
        )}

        {/* Thanh Tìm kiếm & Lọc */}
        {!isLoading && committees.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <input 
              type="text" 
              placeholder="Tìm tên hội đồng, phòng, chủ tịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[250px] flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="has_students">Đã có học viên</option>
              <option value="empty">Chưa xếp lịch</option>
            </select>
          </div>
        )}

        {/* --- FORM THÀNH LẬP HỘI ĐỒNG (DẠNG MODAL NỔI) --- */}
        {showCommitteeForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
              <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingCommitteeId === null ? 'Thành lập hội đồng bảo vệ' : 'Chỉnh sửa hội đồng'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">Chọn đủ 5 giảng viên khác nhau theo từng chức danh trong hội đồng.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCommitteeForm}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  title="Đóng biểu mẫu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {actionError && (
                <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {actionError}
                </p>
              )}
              {editingCommitteeId !== null && committeeScheduleDrafts.some(schedule => schedule.evaluationCount > 0) && (
                <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Hội đồng đã có phiếu chấm. Có thể sửa tên, ngày, phòng và giờ/lượt bảo vệ, nhưng không thể đổi giảng viên hoặc học viên đã được chấm.
                </p>
              )}

              {lecturers.length < 5 && !isLoading && (
                <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Danh sách hiện có {lecturers.length} giảng viên; cần ít nhất 5 giảng viên để lập hội đồng.
                </p>
              )}

              <form onSubmit={handleSaveCommittee} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium text-slate-700">
                    Tên hội đồng
                    <input
                      required
                      maxLength={150}
                      value={committeeForm.committeeName}
                      onChange={event => setCommitteeForm(current => ({ ...current, committeeName: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                      placeholder="Ví dụ: Hội đồng bảo vệ đợt 1"
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">
                    Ngày bảo vệ
                    <input
                      required
                      type="date"
                      value={committeeForm.defenseDate}
                      onChange={event => setCommitteeForm(current => ({ ...current, defenseDate: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
                    Phòng bảo vệ
                    <input
                      required
                      maxLength={100}
                      value={committeeForm.defenseRoom}
                      onChange={event => setCommitteeForm(current => ({ ...current, defenseRoom: event.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                      placeholder="Ví dụ: Phòng họp A"
                    />
                  </label>
                  {editingCommitteeId === null && (
                    <>
                      <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
                        Học viên / đề tài cần xếp lịch (không bắt buộc)
                        <select
                          value={committeeCandidate}
                          onChange={event => setCommitteeCandidate(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                        >
                          <option value="">Chỉ thành lập hội đồng, chưa xếp lịch học viên</option>
                          {defenseCandidates.map(candidate => (
                            <option key={candidate.thesis_id} value={candidate.thesis_id}>
                              {candidate.student_name} ({candidate.student_code}) — {candidate.thesis_title}
                            </option>
                          ))}
                        </select>
                        {committeeCandidate && (
                          <span className="block pt-2 text-xs font-normal text-slate-500">
                            Lượt và giờ bảo vệ sẽ được lưu cùng hội đồng.
                          </span>
                        )}
                      </label>
                      {committeeCandidate && (
                        <>
                          <label className="space-y-1 text-sm font-medium text-slate-700">
                            Lượt bảo vệ
                            <input
                              required
                              type="number"
                              min={1}
                              step={1}
                              value={committeeDefenseOrder}
                              onChange={event => setCommitteeDefenseOrder(Number(event.target.value))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                            />
                          </label>
                          <label className="space-y-1 text-sm font-medium text-slate-700">
                            Giờ bảo vệ
                            <input
                              required
                              type="time"
                              value={committeeStartTime}
                              onChange={event => setCommitteeStartTime(event.target.value)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                            />
                          </label>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {committeeRoles.map(role => (
                    <label key={role.field} className="space-y-1 text-sm font-medium text-slate-700">
                      {role.label}
                      <select
                        required
                        value={committeeMembers[role.field]}
                        onChange={event => setCommitteeMembers(current => ({ ...current, [role.field]: event.target.value }))}
                        disabled={committeeScheduleDrafts.some(schedule => schedule.evaluationCount > 0)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 disabled:bg-slate-100"
                      >
                        <option value="">Chọn giảng viên</option>
                        {lecturers.map(lecturer => {
                          const chosenForAnotherRole = committeeRoles.some(
                            other => other.field !== role.field && committeeMembers[other.field] === String(lecturer.lecturer_id)
                          );
                          return (
                            <option key={lecturer.lecturer_id} value={lecturer.lecturer_id} disabled={chosenForAnotherRole}>
                              {lecturer.full_name} — {lecturer.degree} ({lecturer.lecturer_code})
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ))}
                </div>

                {editingCommitteeId !== null && committeeScheduleDrafts.length > 0 && (
                  <section className="space-y-4 border-t border-slate-100 pt-5">
                    <div>
                      <h3 className="font-semibold text-slate-900">Học viên và lịch bảo vệ</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Có thể cập nhật học viên, lượt và giờ bảo vệ. Học viên đã có phiếu chấm sẽ được khóa để bảo toàn kết quả.
                      </p>
                    </div>
                    {committeeScheduleDrafts.map((schedule, index) => {
                      const currentCandidateIsAvailable = defenseCandidates.some(
                        candidate => candidate.thesis_id === schedule.thesisId
                      );
                      return (
                        <div key={schedule.scheduleId} className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-3">
                          <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-3">
                            Học viên / đề tài — lịch {index + 1}
                            <select
                              value={schedule.thesisId}
                              disabled={schedule.evaluationCount > 0}
                              onChange={event => {
                                const thesisId = Number(event.target.value);
                                const candidate = defenseCandidates.find(item => item.thesis_id === thesisId);
                                setCommitteeScheduleDrafts(current => current.map(item =>
                                  item.scheduleId === schedule.scheduleId
                                    ? {
                                        ...item,
                                        thesisId,
                                        studentName: candidate?.student_name ?? item.studentName,
                                        studentCode: candidate?.student_code ?? item.studentCode,
                                        thesisTitle: candidate?.thesis_title ?? item.thesisTitle
                                      }
                                    : item
                                ));
                              }}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 disabled:bg-slate-100"
                            >
                              {!currentCandidateIsAvailable && (
                                <option value={schedule.thesisId}>
                                  {schedule.studentName || 'Học viên hiện tại'}
                                  {schedule.studentCode ? ` (${schedule.studentCode})` : ''}
                                  {schedule.thesisTitle ? ` — ${schedule.thesisTitle}` : ''}
                                </option>
                              )}
                              {defenseCandidates.map(candidate => (
                                <option key={candidate.thesis_id} value={candidate.thesis_id}>
                                  {candidate.student_name} ({candidate.student_code}) — {candidate.thesis_title}
                                </option>
                              ))}
                            </select>
                            {schedule.evaluationCount > 0 && (
                              <span className="block text-xs font-normal text-amber-700">
                                Đã có {schedule.evaluationCount} phiếu chấm; không thể đổi học viên.
                              </span>
                            )}
                          </label>
                          <label className="space-y-1 text-sm font-medium text-slate-700">
                            Lượt bảo vệ
                            <input
                              required
                              type="number"
                              min={1}
                              step={1}
                              value={schedule.defenseOrder}
                              onChange={event => setCommitteeScheduleDrafts(current => current.map(item =>
                                item.scheduleId === schedule.scheduleId
                                  ? { ...item, defenseOrder: Number(event.target.value) }
                                  : item
                              ))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                            />
                          </label>
                          <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
                            Giờ bảo vệ
                            <input
                              required
                              type="time"
                              value={schedule.startTime}
                              onChange={event => setCommitteeScheduleDrafts(current => current.map(item =>
                                item.scheduleId === schedule.scheduleId
                                  ? { ...item, startTime: event.target.value }
                                  : item
                              ))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </section>
                )}

                <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleCloseCommitteeForm}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCommittee || isLoading || (editingCommitteeId === null && lecturers.length < 5)}
                    className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreatingCommittee
                      ? 'Đang lưu...'
                      : editingCommitteeId === null
                        ? 'Lưu hội đồng'
                        : 'Cập nhật hội đồng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {scheduleCommitteeId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <form
              onSubmit={submitSchedule}
              className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-900">Thêm học viên vào hội đồng</h2>

              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Học viên / đề tài
                <select
                  required
                  value={scheduleCandidate}
                  onChange={event => setScheduleCandidate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="">Chọn học viên</option>
                  {defenseCandidates.map(candidate => (
                    <option key={candidate.thesis_id} value={candidate.thesis_id}>
                      {candidate.student_name} ({candidate.student_code}) — {candidate.thesis_title}
                    </option>
                  ))}
                </select>
              </label>

              {defenseCandidates.length === 0 && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Không còn học viên chưa được xếp lịch bảo vệ.
                </p>
              )}

              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Lượt bảo vệ
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={scheduleOrder}
                  onChange={event => setScheduleOrder(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <label className="block space-y-1 text-sm font-medium text-slate-700">
                Giờ bảo vệ
                <input
                  required
                  type="time"
                  value={scheduleTime}
                  onChange={event => setScheduleTime(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleCommitteeId(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAddingSchedule || defenseCandidates.length === 0}
                  className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isAddingSchedule ? 'Đang xếp lịch...' : 'Xếp lịch'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Danh sách Hội Đồng */}
        {isLoading ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải danh sách hội đồng...</p>
        ) : committees.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Chưa có hội đồng nào được thành lập. Nhấn <strong>Thành lập thêm</strong> để tạo hội đồng đầu tiên.
          </div>
        ) : filteredCommittees.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Không tìm thấy hội đồng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCommittees.map(({ committee, schedules }) => (
              <article key={committee.committee_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Hội đồng #{committee.committee_id}</p>
                      {schedules.length > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Đã xếp lịch</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">Chờ xếp lịch</span>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{committee.committee_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {schedules.length} học viên
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEditCommittee(committee, schedules)}
                      className="text-slate-400 hover:text-sky-600"
                      title="Chỉnh sửa hội đồng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCommittee(committee)}
                      disabled={schedules.length > 0}
                      className="text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      title={schedules.length > 0 ? 'Không thể xóa hội đồng đã có lịch bảo vệ' : 'Xóa hội đồng'}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Ngày bảo vệ:</strong> {formatDate(committee.defense_date)}</p>
                    <p><strong>Phòng:</strong> {committee.defense_room}</p>
                    <p><strong>Chủ tịch:</strong> {committee.president_name}</p>
                    <p><strong>Phản biện 1:</strong> {committee.reviewer1_name}</p>
                    <p><strong>Phản biện 2:</strong> {committee.reviewer2_name}</p>
                    <p><strong>Thư ký:</strong> {committee.secretary_name}</p>
                    <p><strong>Ủy viên:</strong> {committee.member_name}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">Lịch và kết quả bảo vệ</h4>
                      {/* NÚT THÊM HỌC VIÊN */}
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleCommitteeId(committee.committee_id);
                        setScheduleCandidate('');
                        setScheduleOrder(schedules.length + 1);
                        setScheduleTime('08:00');
                        setActionError('');
                        setNotice('');
                      }}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800 transition-colors"
                    >
                      + Thêm học viên
                    </button>
                    </div>
                    {schedules.length === 0 ? (
                      <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        Chưa xếp lịch học viên vào hội đồng này.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {schedules.map(schedule => (
                          <div key={schedule.defense_schedule_id} className="rounded-xl border border-slate-200 p-3 text-sm">
                            <p className="font-semibold text-slate-900">
                              {schedule.student_name || 'Chưa có tên học viên'} {schedule.student_code ? `(${schedule.student_code})` : ''}
                            </p>
                            <p className="mt-1 text-slate-600">{schedule.thesis_title || 'Chưa có tên đề tài'}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span>Lượt bảo vệ: {schedule.defense_order}</span>
                              <span>Giờ: {formatTime(schedule.start_time)}</span>
                              <span>Kết quả: <strong>{schedule.defense_result || 'Chưa có kết quả'}</strong></span>
                              <span>Điểm: <strong>{schedule.average_score ?? 'Chưa chấm'}</strong></span>
                              <span>Phiếu chấm: <strong>{schedule.evaluation_count}/5</strong></span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (schedule.defense_schedule_id !== null) {
                                    void toggleScoreForm(schedule.defense_schedule_id, committee);
                                  }
                                }}
                                className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                              >
                                {activeScoreScheduleId === schedule.defense_schedule_id
                                  ? 'Đóng biểu mẫu'
                                  : schedule.evaluation_count > 0 ? 'Sửa' : 'Nhập điểm'}
                              </button>
                            </div>
                            {activeScoreScheduleId === schedule.defense_schedule_id && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                                <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-lg font-bold text-slate-900">
                                      Nhập điểm - {schedule.student_name}
                                    </h3>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (schedule.defense_schedule_id !== null) {
                                          void toggleScoreForm(schedule.defense_schedule_id, committee);
                                        }
                                      }}
                                      className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                      title="Đóng biểu mẫu"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>

                                  <form
                                    onKeyDown={event => {
                                      if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement) ||
                                          !event.target.hasAttribute('data-score-input')) return;
                                      event.preventDefault();
                                      const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('[data-score-input]'));
                                      const currentIndex = inputs.indexOf(event.target);
                                      const nextEmpty = inputs.slice(currentIndex + 1).find(input => input.value.trim() === '')
                                        ?? inputs.slice(0, currentIndex).find(input => input.value.trim() === '');
                                      if (nextEmpty) nextEmpty.focus();
                                      else event.currentTarget.querySelector<HTMLButtonElement>('[data-score-submit]')?.focus();
                                    }}
                                    onSubmit={event => {
                                      if (schedule.defense_schedule_id !== null) {
                                        void handleSaveScores(event, schedule.defense_schedule_id, committee);
                                      }
                                    }}
                                    className="space-y-4"
                                  >
                                    {scoreFormError && (
                                      <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                                        {scoreFormError}
                                      </p>
                                    )}
                                    <p className="text-sm text-slate-600">
                                      Nhập điểm theo từng thành viên hội đồng: nội dung tối đa 5, trình bày tối đa 2.5, hỏi đáp tối đa 2.5. Cần ít nhất 3 phiếu để cập nhật kết quả.
                                    </p>

                                    {evaluationRoles.map(role => {
                                      const scheduleId = schedule.defense_schedule_id!;
                                      const draft = scoreDrafts[scheduleId]?.[role.key] ?? emptyScoreDraft();
                                      return (
                                        <fieldset key={role.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                          <legend className="px-2 text-sm font-bold text-slate-800">
                                            {role.label} — {role.lecturerName(committee)}
                                          </legend>
                                          <div className="grid gap-4 sm:grid-cols-3">
                                            {([
                                              ['contentScore', 'Nội dung (0–5)', 5],
                                              ['presentationScore', 'Trình bày (0–2.5)', 2.5],
                                              ['qaScore', 'Hỏi đáp (0–2.5)', 2.5]
                                            ] as const).map(([field, label, max]) => (
                                              <label key={field} className="text-sm font-medium text-slate-700">
                                                {label}
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={max}
                                                  step={0.01}
                                                  data-score-input
                                                  value={draft[field]}
                                                  onChange={event => setScoreDrafts(current => ({
                                                    ...current,
                                                    [scheduleId]: {
                                                      ...current[scheduleId],
                                                      [role.key]: {
                                                        ...(current[scheduleId]?.[role.key] ?? emptyScoreDraft()),
                                                        [field]: event.target.value
                                                      }
                                                    }
                                                  }))}
                                                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                                                />
                                              </label>
                                            ))}
                                          </div>
                                          <label className="mt-3 block text-sm font-medium text-slate-700">
                                            Nhận xét
                                            <input
                                              type="text"
                                              maxLength={4000}
                                              value={draft.feedback}
                                              onChange={event => setScoreDrafts(current => ({
                                                ...current,
                                                [scheduleId]: {
                                                  ...current[scheduleId],
                                                  [role.key]: {
                                                    ...(current[scheduleId]?.[role.key] ?? emptyScoreDraft()),
                                                    feedback: event.target.value
                                                  }
                                                }
                                              }))}
                                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                                            />
                                          </label>
                                        </fieldset>
                                      );
                                    })}
                                    
                                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (schedule.defense_schedule_id !== null) {
                                            void toggleScoreForm(schedule.defense_schedule_id, committee);
                                          }
                                        }}
                                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="submit"
                                        data-score-submit
                                        disabled={busyScoreScheduleId === schedule.defense_schedule_id}
                                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                      >
                                        {busyScoreScheduleId === schedule.defense_schedule_id ? 'Đang lưu...' : 'Lưu phiếu và cập nhật kết quả'}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
  );
};