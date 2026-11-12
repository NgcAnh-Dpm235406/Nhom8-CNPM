import type {
  AdminCommitteeRecord,
  AdmissionProfile,
  AuthUser,
  DefenseCandidate,
  DefenseEvaluationInput,
  DefenseEvaluationRecord,
  FacultyAdvisorDashboard,
  Lecturer,
  LecturerInput,
  LecturerStudent,
  StudentAdvisor,
  StudentInfo,
  StudentThesisProgress
} from '../types';

const BASE_URL = '/api';

// Helper gửi request kèm Token tự động
async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('agu_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Không đặt Content-Type nếu body là FormData (để browser tự generate boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `API trả về dữ liệu không phải JSON (HTTP ${response.status}). Hãy kiểm tra backend và khởi động lại server.`
    );
  }

  const responseText = await response.text();
  let data: T & { message?: string };
  try {
    data = JSON.parse(responseText) as T & { message?: string };
  } catch {
    throw new Error(`Phản hồi JSON từ API không hợp lệ (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi gọi API!');
  }
  return data;
}

export const api = {
  // 1. Phân hệ Xác thực & Hệ thống
  auth: {
    login: (body: { username: string; password: string }) =>
      request<{ success: boolean; message: string; token: string; user: AuthUser }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    getProfile: () => request('/auth/profile'),
    changePassword: (body: { oldPassword: string; newPassword: string }) =>
      request('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
    getNotifications: () => request('/auth/notifications'),
    markNotificationRead: (id: number | string) =>
      request(`/auth/notifications/${id}/read`, { method: 'PUT' })
  },

  // 2. Phân hệ Tuyển sinh Thạc sĩ
  admission: {
    getCampaigns: () => request('/admission/campaigns'),
    register: (formData: FormData) =>
      request<{
        success: boolean;
        message: string;
        data: { profileId: number; profileCode: string };
      }>('/admission/register', { method: 'POST', body: formData }),
    lookup: (key: string) => request(`/admission/lookup?key=${encodeURIComponent(key)}`),
    getAllProfiles: (params?: { status?: string; admissionStatus?: string; campaignId?: number }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.admissionStatus) query.set('admissionStatus', params.admissionStatus);
      if (params?.campaignId !== undefined) query.set('campaignId', String(params.campaignId));
      const suffix = query.size ? `?${query.toString()}` : '';
      return request<{ success: boolean; count: number; profiles: AdmissionProfile[] }>(`/admission/profiles${suffix}`);
    },
    reviewProfile: (id: number | string, status: string) =>
      request<{ success: boolean; message: string }>(`/admission/profiles/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) }),
    admitCandidate: (id: number | string, curriculumId = 1) =>
      request<{
        success: boolean;
        message: string;
        data: { studentId: number; studentCode: string; username: string; temporaryPassword: string; fullName: string };
      }>(`/admission/profiles/${id}/admit`, { method: 'POST', body: JSON.stringify({ curriculumId }) })
  },

  // 3. Phân hệ Chương trình đào tạo & Giảng viên
  academic: {
    getMajors: () => request('/academic/majors'),
    getCurriculums: (majorId?: number) =>
      request(`/academic/curriculums${majorId ? `?majorId=${majorId}` : ''}`),
    getCurriculumCourses: (curriculumId: number | string) =>
      request(`/academic/curriculums/${curriculumId}/courses`),
    getLecturers: () => request<{ success: boolean; lecturers: Lecturer[] }>('/academic/lecturers'),
    getSemesters: () => request('/academic/semesters'),
    getClasses: (semesterId?: number) =>
      request(`/academic/classes${semesterId ? `?semesterId=${semesterId}` : ''}`)
  },

  admin: {
    getLecturers: () => request<{ success: boolean; lecturers: Lecturer[] }>('/admin/lecturers'),
    getLecturerStudents: (lecturerId: number) =>
      request<{ success: boolean; students: LecturerStudent[] }>(`/admin/lecturers/${lecturerId}/students`),
    getCommittees: () => request<{ success: boolean; committees: AdminCommitteeRecord[] }>('/admin/committees'),
    getDefenseCandidates: () =>
      request<{ success: boolean; candidates: DefenseCandidate[] }>('/admin/defense-candidates'),
    getDefenseEvaluations: (scheduleId: number) =>
      request<{ success: boolean; evaluations: DefenseEvaluationRecord[] }>(
        `/admin/defense-schedules/${scheduleId}/evaluations`
      ),
    saveDefenseEvaluations: (scheduleId: number, evaluations: DefenseEvaluationInput[]) =>
      request<{
        success: boolean;
        message: string;
        data: { average_score: number | null; result: string | null; evaluation_count: number };
      }>(`/admin/defense-schedules/${scheduleId}/evaluations`, {
        method: 'POST',
        body: JSON.stringify({ evaluations })
      }),
    createLecturer: (body: LecturerInput) =>
      request<{ success: boolean; message: string; lecturerId: number }>(
        '/admin/lecturers',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    updateLecturer: (id: number, body: LecturerInput) =>
      request<{ success: boolean; message: string }>(
        `/admin/lecturers/${id}`,
        { method: 'PUT', body: JSON.stringify(body) }
      ),
    deleteLecturer: (id: number) =>
      request<{ success: boolean; message: string }>(`/admin/lecturers/${id}`, { method: 'DELETE' })
  },

  // 4. Phân hệ Học viên & Điểm số
  student: {
    getMyInfo: () => request<{ success: boolean; student: StudentInfo }>('/students/me'),
    updateMyInfo: (body: { email: string; phone: string; address: string }) =>
      request<{ success: boolean; message: string }>('/students/me', {
        method: 'PUT',
        body: JSON.stringify(body)
      }),
    getTuition: (studentId?: number | string) =>
      request(`/students/tuition${studentId ? `?studentId=${studentId}` : ''}`),
    payTuition: (tuitionId: number | string, amount: number) =>
      request('/students/tuition/pay', { method: 'POST', body: JSON.stringify({ tuitionId, amount }) }),
    registerCourse: (classId: number) =>
      request('/students/register-course', { method: 'POST', body: JSON.stringify({ classId }) }),
    getSchedule: () => request('/students/schedule'),
    getGrades: (studentId?: number | string) =>
      request(`/students/grades${studentId ? `?studentId=${studentId}` : ''}`),
    enterGrades: (body: { gradeId: number | string; processGrade?: number; examGrade?: number }) =>
      request('/students/enter-grades', { method: 'PUT', body: JSON.stringify(body) })
  },

  // 5. Phân hệ Luận văn, GVHD & Tiến độ 5 mốc
  thesis: {
    registerAdvisor: (body: { lecturerId: number; role?: string }) =>
      request<{ success: boolean; message: string }>('/thesis/register-advisor', { method: 'POST', body: JSON.stringify(body) }),
    getFacultyAdvisingRequests: (lecturerId?: number) =>
      request<{ success: boolean } & FacultyAdvisorDashboard>(
        `/thesis/faculty/advising-requests${lecturerId ? `?lecturerId=${lecturerId}` : ''}`
      ),
    respondAdvisingRequest: (id: number | string, action: 'accept' | 'reject') =>
      request<{ success: boolean; message: string }>(
        `/thesis/faculty/advising-requests/${id}`,
        { method: 'PUT', body: JSON.stringify({ action }) }
      ),
    registerTopic: (thesisTitle: string) =>
      request('/thesis/register-topic', { method: 'POST', body: JSON.stringify({ thesisTitle }) }),
    getMyProgress: (studentId?: number | string) =>
      request<{
        success: boolean;
        thesis: StudentThesisProgress | null;
        advisor: StudentAdvisor | null;
      }>(`/thesis/my-progress${studentId ? `?studentId=${studentId}` : ''}`),
    submitReport: (formData: FormData) =>
      request('/thesis/submit-report', { method: 'POST', body: formData }),
    submitTurnitin: (formData: FormData) =>
      request('/thesis/submit-turnitin', { method: 'POST', body: formData }),
    submitPublication: (formData: FormData) =>
      request('/thesis/submit-publication', { method: 'POST', body: formData }),
    submitCertificate: (formData: FormData) =>
      request('/thesis/submit-certificate', { method: 'POST', body: formData }),
    evaluateSubmission: (id: number | string, body: { feedback?: string; status: 'Đạt' | 'Cần sửa đổi' }) =>
      request(`/thesis/evaluate-submission/${id}`, { method: 'PUT', body: JSON.stringify(body) })
  },

  // 6. Phân hệ Hội đồng & Gatekeeper
  committee: {
    checkGatekeeper: (studentId?: number | string) =>
      request(`/committee/gatekeeper-check${studentId ? `/${studentId}` : ''}`),
    createCommittee: (body: {
      committeeName: string;
      defenseDate: string;
      defenseRoom: string;
      presidentId: number;
      reviewer1Id: number;
      reviewer2Id: number;
      secretaryId: number;
      memberId: number;
      thesisId?: number;
      defenseOrder?: number;
      startTime?: string;
    }) =>
      request<{ success: boolean; message: string; committeeId: number; defenseScheduleId: number | null }>(
        '/committee/create',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    scheduleDefense: (body: { thesisId: number; committeeId: number; defenseOrder?: number; startTime?: string }) =>
      request<{ success: boolean; message: string; defenseScheduleId: number }>(
        '/committee/schedule',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    getSchedules: () => request('/committee/schedules'),
    evaluateDefense: (body: {
      defenseScheduleId: number;
      lecturerId?: number;
      roleInCommittee: string;
      contentScore: number;
      presentationScore: number;
      qaScore: number;
      feedback?: string;
    }) => request('/committee/evaluate', { method: 'POST', body: JSON.stringify(body) }),
    calculateGrade: (scheduleId: number | string) =>
      request<{ success: boolean; message: string; data: { average_score: number | null; result: string | null } }>(
        `/committee/calculate-grade/${scheduleId}`,
        { method: 'POST' }
      )
  },

  // 7. Phân hệ Khảo sát chất lượng (QA)
  survey: {
    getActiveSurveys: () => request('/surveys/active'),
    getQuestions: (campaignId: number | string) => request(`/surveys/${campaignId}/questions`),
    submitResponse: (body: { campaignId: number; answers: { questionId: number; ratingScore: number }[] }) =>
      request('/surveys/submit', { method: 'POST', body: JSON.stringify(body) }),
    getStatistics: (campaignId: number | string) => request(`/surveys/statistics/${campaignId}`)
  }
};
