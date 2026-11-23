import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useBrowserAlert } from '../../hooks/useBrowserAlert';
import type { AdminTuitionRecord, AdminStudent, CourseClassRecord, CourseRecord, Lecturer } from '../../types';

interface Props {
  mode: 'academics' | 'tuition';
  students: AdminStudent[];
  lecturers: Lecturer[];
}

export const AcademicAndTuitionSection = ({ mode, students, lecturers }: Props) => {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [classes, setClasses] = useState<CourseClassRecord[]>([]);
  const [semesters, setSemesters] = useState<{ semester_id: number; semester_name: string }[]>([]);
  const [tuitionList, setTuitionList] = useState<AdminTuitionRecord[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useBrowserAlert(error, setError);
  useBrowserAlert(notice, setNotice);
  const [courseForm, setCourseForm] = useState({ courseCode: '', courseName: '', credits: 3, prerequisiteCourseId: '' });
  const [semesterForm, setSemesterForm] = useState({ semesterName: '', startDate: '', endDate: '' });
  const [classForm, setClassForm] = useState({ courseId: '', semesterId: '', className: '', maxStudents: 35, status: 'Mở đăng ký' });
  const [scheduleForm, setScheduleForm] = useState<Record<number, { lecturerId: string; roomName: string; dayOfWeek: number; startShift: number; endShift: number }>>({});
  const [tuitionForm, setTuitionForm] = useState({ studentId: '', semesterId: '', baseAmount: '', dueDate: '', paidAmount: 0, latePenaltyFee: 0 });

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

  const createCourse = async () => {
    try {
      const result = await api.academic.createCourse({
        courseCode: courseForm.courseCode,
        courseName: courseForm.courseName,
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

  const createSemester = async () => {
    try {
      const result = await api.academic.createSemester({
        semesterName: semesterForm.semesterName,
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
    try {
      const result = await api.academic.createClass({
        courseId: Number(classForm.courseId),
        semesterId: Number(classForm.semesterId),
        className: classForm.className,
        maxStudents: classForm.maxStudents,
        status: classForm.status
      });
      setNotice(result.message);
      await loadAcademic();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo lớp học phần.');
    }
  };

  const saveSchedule = async (classId: number) => {
    const draft = scheduleForm[classId];
    if (!draft?.lecturerId || !draft.roomName) {
      setError('Vui lòng chọn giảng viên và nhập phòng học.');
      return;
    }
    try {
      const result = await api.academic.saveClassSchedule(classId, {
        lecturerId: Number(draft.lecturerId),
        roomName: draft.roomName,
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

  const createTuition = async () => {
    try {
      const result = await api.admin.createTuition({
        studentId: Number(tuitionForm.studentId),
        semesterId: Number(tuitionForm.semesterId),
        baseAmount: Number(tuitionForm.baseAmount),
        dueDate: tuitionForm.dueDate,
        paidAmount: tuitionForm.paidAmount,
        latePenaltyFee: tuitionForm.latePenaltyFee
      });
      setNotice(result.message);
      await loadTuition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo học phí.');
    }
  };

  const reviewSlip = async (tuition: AdminTuitionRecord, decision: 'Đã xác nhận' | 'Từ chối') => {
    const note = decision === 'Từ chối' ? window.prompt('Nhập lý do từ chối:', '') || '' : '';
    if (decision === 'Từ chối' && !note.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    const paidAmount = decision === 'Đã xác nhận'
      ? Number(window.prompt('Số tiền xác nhận thanh toán:', String(tuition.outstanding_balance)) || tuition.outstanding_balance)
      : undefined;
    try {
      const result = await api.admin.reviewTuitionPaymentSlip(tuition.tuition_id, { decision, note, paidAmount });
      setNotice(result.message);
      await loadTuition();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xử lý biên lai.');
    }
  };

  if (mode === 'tuition') {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-bold">Tạo khoản học phí</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select className="rounded-xl border p-3" value={tuitionForm.studentId} onChange={e => setTuitionForm({ ...tuitionForm, studentId: e.target.value })}>
              <option value="">Chọn học viên</option>
              {students.map(student => <option key={student.student_id} value={student.student_id}>{student.student_code} - {student.full_name}</option>)}
            </select>
            <select className="rounded-xl border p-3" value={tuitionForm.semesterId} onChange={e => setTuitionForm({ ...tuitionForm, semesterId: e.target.value })}>
              <option value="">Chọn học kỳ</option>
              {semesters.map(semester => <option key={semester.semester_id} value={semester.semester_id}>{semester.semester_name}</option>)}
            </select>
            <input type="date" className="rounded-xl border p-3" value={tuitionForm.dueDate} onChange={e => setTuitionForm({ ...tuitionForm, dueDate: e.target.value })} />
            <input type="number" placeholder="Học phí gốc" className="rounded-xl border p-3" value={tuitionForm.baseAmount} onChange={e => setTuitionForm({ ...tuitionForm, baseAmount: e.target.value })} />
            <input type="number" placeholder="Đã thanh toán" className="rounded-xl border p-3" value={tuitionForm.paidAmount} onChange={e => setTuitionForm({ ...tuitionForm, paidAmount: Number(e.target.value) })} />
            <input type="number" placeholder="Phạt trễ" className="rounded-xl border p-3" value={tuitionForm.latePenaltyFee} onChange={e => setTuitionForm({ ...tuitionForm, latePenaltyFee: Number(e.target.value) })} />
          </div>
          <button type="button" onClick={() => void createTuition()} className="mt-4 rounded-xl bg-sky-600 px-4 py-2 font-bold text-white">Tạo học phí</button>
        </section>
        <section className="rounded-3xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">Danh sách học phí & biên lai</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50"><tr><th className="p-3">Học viên</th><th className="p-3">Học kỳ</th><th className="p-3">Còn nợ</th><th className="p-3">Trạng thái</th><th className="p-3">Biên lai</th><th className="p-3 text-right">Xử lý</th></tr></thead>
              <tbody className="divide-y">{tuitionList.map(t => (
                <tr key={t.tuition_id}><td className="p-3"><b>{t.student_code}</b><br />{t.student_name}</td><td className="p-3">{t.semester_name}</td><td className="p-3 font-bold text-amber-800">{Number(t.outstanding_balance).toLocaleString('vi-VN')} VNĐ</td><td className="p-3">{t.status}</td><td className="p-3">{t.payment_slip_file ? <><a className="text-sky-700 underline" href={t.payment_slip_file} target="_blank">Xem</a><div>{t.payment_slip_status}</div></> : 'Chưa gửi'}</td><td className="p-3 text-right">{t.payment_slip_status === 'Chờ xác nhận' ? <><button type="button" onClick={() => void reviewSlip(t, 'Đã xác nhận')} className="mr-2 rounded bg-emerald-600 px-2 py-1 text-white">Duyệt</button><button type="button" onClick={() => void reviewSlip(t, 'Từ chối')} className="rounded bg-rose-600 px-2 py-1 text-white">Từ chối</button></> : '—'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="font-bold">Tạo học kỳ</h2>
          <input className="mt-3 w-full rounded-xl border p-3" placeholder="Tên học kỳ" value={semesterForm.semesterName} onChange={e => setSemesterForm({ ...semesterForm, semesterName: e.target.value })} />
          <div className="mt-3 grid grid-cols-2 gap-2"><input type="date" className="rounded-xl border p-3" value={semesterForm.startDate} onChange={e => setSemesterForm({ ...semesterForm, startDate: e.target.value })} /><input type="date" className="rounded-xl border p-3" value={semesterForm.endDate} onChange={e => setSemesterForm({ ...semesterForm, endDate: e.target.value })} /></div>
          <button type="button" onClick={() => void createSemester()} className="mt-3 rounded-xl bg-sky-600 px-4 py-2 font-bold text-white">Tạo học kỳ</button>
        </div>
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="font-bold">Tạo học phần</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Mã học phần
              <input aria-label="Mã học phần" className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="Ví dụ: CNTT801" value={courseForm.courseCode} onChange={e => setCourseForm({ ...courseForm, courseCode: e.target.value })} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Số tín chỉ
              <input aria-label="Số tín chỉ" type="number" min="1" className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="Nhập số tín chỉ" value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: Number(e.target.value) })} />
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Tên học phần
              <input aria-label="Tên học phần" className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="Nhập tên học phần" value={courseForm.courseName} onChange={e => setCourseForm({ ...courseForm, courseName: e.target.value })} />
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-600">
              Học phần tiên quyết
            <select className="col-span-2 rounded-xl border p-3" value={courseForm.prerequisiteCourseId} onChange={e => setCourseForm({ ...courseForm, prerequisiteCourseId: e.target.value })}>
              <option value="">Không có tiên quyết</option>{courses.map(course => <option key={course.course_id} value={course.course_id}>{course.course_code} - {course.course_name}</option>)}
            </select>
            </label>
          </div>
          <button type="button" onClick={() => void createCourse()} className="mt-3 rounded-xl bg-sky-600 px-4 py-2 font-bold text-white">Tạo học phần</button>
        </div>
      </section>
      <section className="rounded-3xl border bg-white p-6">
        <h2 className="font-bold">Mở lớp học phần</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-5 md:items-end">
          <label className="text-xs font-semibold text-slate-600">
            Học phần
            <select aria-label="Học phần" className="mt-1 w-full rounded-xl border p-3 text-sm" value={classForm.courseId} onChange={e => setClassForm({ ...classForm, courseId: e.target.value })}><option value="">Chọn học phần</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>)}</select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Học kỳ
            <select aria-label="Học kỳ" className="mt-1 w-full rounded-xl border p-3 text-sm" value={classForm.semesterId} onChange={e => setClassForm({ ...classForm, semesterId: e.target.value })}><option value="">Chọn học kỳ</option>{semesters.map(s => <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>)}</select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Tên lớp
            <input aria-label="Tên lớp" className="mt-1 w-full rounded-xl border p-3 text-sm" placeholder="Ví dụ: Lớp sáng" value={classForm.className} onChange={e => setClassForm({ ...classForm, className: e.target.value })} />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Sĩ số tối đa
            <input aria-label="Sĩ số tối đa" type="number" min="1" className="mt-1 w-full rounded-xl border p-3 text-sm" value={classForm.maxStudents} onChange={e => setClassForm({ ...classForm, maxStudents: Number(e.target.value) })} />
          </label>
          <button type="button" onClick={() => void createClass()} className="h-[46px] rounded-xl bg-emerald-600 px-4 font-bold text-white">Mở lớp</button>
        </div>
      </section>
      <section className="rounded-3xl border bg-white p-6">
        <h2 className="mb-4 font-bold">Lớp & lịch giảng dạy</h2>
        <div className="space-y-3">{classes.map(item => {
          const draft = scheduleForm[item.class_id] || { lecturerId: '', roomName: '', dayOfWeek: 7, startShift: 1, endShift: 4 };
          return <div key={item.class_id} className="grid gap-3 rounded-2xl border p-3 md:grid-cols-[1.2fr_1fr_1fr_80px_80px_80px_auto] md:items-end">
            <div><b>{item.course_code}</b><div className="text-xs">{item.class_name}</div></div>
            <label className="text-xs font-semibold text-slate-600">
              Giảng viên
              <select aria-label="Giảng viên" className="mt-1 w-full rounded border p-2 text-sm" value={draft.lecturerId} onChange={e => setScheduleForm({ ...scheduleForm, [item.class_id]: { ...draft, lecturerId: e.target.value } })}><option value="">Chọn giảng viên</option>{lecturers.map(l => <option key={l.lecturer_id} value={l.lecturer_id}>{l.full_name}</option>)}</select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Phòng học
              <input aria-label="Phòng học" className="mt-1 w-full rounded border p-2 text-sm" placeholder="Ví dụ: A210" value={draft.roomName} onChange={e => setScheduleForm({ ...scheduleForm, [item.class_id]: { ...draft, roomName: e.target.value } })} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Thứ
              <select aria-label="Thứ học" className="mt-1 w-full rounded border p-2 text-sm" value={draft.dayOfWeek} onChange={e => setScheduleForm({ ...scheduleForm, [item.class_id]: { ...draft, dayOfWeek: Number(e.target.value) } })}>{[2,3,4,5,6,7,8].map(d => <option key={d} value={d}>Thứ {d}</option>)}</select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tiết bắt đầu
              <input aria-label="Tiết bắt đầu" type="number" min="1" max="15" className="mt-1 w-full rounded border p-2 text-sm" value={draft.startShift} onChange={e => setScheduleForm({ ...scheduleForm, [item.class_id]: { ...draft, startShift: Number(e.target.value) } })} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tiết kết thúc
              <input aria-label="Tiết kết thúc" type="number" min="1" max="15" className="mt-1 w-full rounded border p-2 text-sm" value={draft.endShift} onChange={e => setScheduleForm({ ...scheduleForm, [item.class_id]: { ...draft, endShift: Number(e.target.value) } })} />
            </label>
            <button type="button" onClick={() => void saveSchedule(item.class_id)} className="h-[38px] rounded-lg bg-sky-600 px-3 font-bold text-white">Lưu</button>
          </div>;
        })}</div>
      </section>
    </div>
  );
};
