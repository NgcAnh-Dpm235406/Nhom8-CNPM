export type AdminSection = 'overview' | 'students' | 'admissions' | 'committees' | 'lecturers' | 'academics' | 'tuition';
export type TabType =
  | 'home'
  | 'register'
  | 'lookup'
  | 'student'
  | 'student-profile'
  | 'faculty'
  | 'admin-overview'
  | 'admin-students'
  | 'admin-admissions'
  | 'admin-committees'
  | 'admin-lecturers'
  | 'admin-academics'
  | 'admin-tuition'
  | 'login';

export type RoleCode = 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface AuthUser {
  userId: number | string;
  roleId: number;
  username: string;
  email: string;
  roleCode: RoleCode;
  roleName: string;
  displayName: string;
}

export interface AdmissionProfile {
  profile_id: number | string;
  full_name: string;
  dob: string;
  id_card_number: string;
  phone: string;
  email: string;
  undergrad_degree_file: string | null;
  status: string;
  admission_status: string;
  created_at: string;
  campaign_name: string;
  student_code: string | null;
}

export interface AdmissionCampaign {
  campaign_id: number;
  campaign_name: string;
  academic_year: number;
  start_date: string;
  end_date: string;
}

export interface Major {
  major_id: number;
  major_code: string;
  major_name: string;
}

export interface AdmissionLookupResult {
  id: string;
  profileId: number;
  name: string;
  idCard: string;
  phone: string;
  email: string;
  campaign: string;
  reviewStatus: string;
  admissionStatus: string;
  studentCode: string | null;
  note: string;
}

export interface Lecturer {
  lecturer_id: number;
  user_id?: number;
  username?: string;
  account_status?: string;
  lecturer_code: string;
  full_name: string;
  degree: string;
  max_slots: number;
  email: string;
  phone: string | null;
  current_assigned: number;
  slots_left: number;
}

export interface LecturerStudent {
  student_id: number;
  student_code: string;
  full_name: string;
  email: string;
  phone: string;
  topic_title: string | null;
  assignment_status: string;
}

export interface StudentInfo {
  student_id: number;
  student_code: string;
  curriculum_id?: number;
  academic_status: string;
  enrollment_date: string;
  full_name: string;
  dob: string;
  id_card_number: string;
  email: string;
  phone: string;
  address: string | null;
  cohort: string;
  orientation: string;
  total_credits: number;
  major_code: string;
  major_name: string;
}

export interface StudentThesisProgress {
  thesis_id: number;
  thesis_title: string;
  current_stage: string;
  progress_percent: number;
  status: string;
}

export interface StudentAdvisor {
  advisor_assignment_id: number;
  lecturer_id: number;
  role: string;
  status: string;
  lecturer_name: string;
  degree: string;
  email: string;
  phone: string | null;
}

export interface FacultyAdvisorRequest {
  advisor_assignment_id: number;
  role: string;
  assigned_date: string;
  status: string;
  student_id: number;
  student_code: string;
  student_name: string;
  email: string;
  phone: string;
  thesis_title: string | null;
  current_stage: string | null;
  progress_percent: number | null;
}

export interface FacultyAdvisorDashboard {
  quota: {
    maxSlots: number;
    assignedCount: number;
    slotsLeft: number;
  };
  requests: FacultyAdvisorRequest[];
}

export interface LecturerInput {
  username: string;
  lecturerCode: string;
  fullName: string;
  degree: string;
  email: string;
  phone: string;
  maxSlots: number;
  password?: string;
}

export interface AdminCommitteeRecord {
  committee_id: number;
  committee_name: string;
  defense_date: string;
  defense_room: string;
  president_id: number;
  reviewer_1_id: number;
  reviewer_2_id: number;
  secretary_id: number;
  member_id: number;
  president_name: string;
  reviewer1_name: string;
  reviewer2_name: string;
  secretary_name: string;
  member_name: string;
  defense_schedule_id: number | null;
  thesis_id: number | null;
  defense_order: number | null;
  start_time: string | null;
  average_score: number | null;
  defense_result: string | null;
  evaluation_count: number;
  thesis_title: string | null;
  student_code: string | null;
  student_name: string | null;
}

export interface DefenseEvaluationInput {
  lecturerId: number;
  contentScore: number;
  presentationScore: number;
  qaScore: number;
  feedback?: string;
}

export interface DefenseEvaluationRecord extends DefenseEvaluationInput {
  roleInCommittee: string;
}

export interface DefenseCandidate {
  thesis_id: number;
  thesis_title: string;
  current_stage: string;
  thesis_status: string;
  student_id: number;
  student_code: string;
  student_name: string;
}

export interface AdmissionFormData {
  fullName: string;
  email: string;
  phone: string;
  idCardNumber: string;
  majorCode: string;
  admissionType: 'thi_tuyen' | 'xet_tuyen';
}

export type ProgressLevel = 'green' | 'yellow' | 'red';

export interface Milestone {
  id: string;
  title: string;
  deadline: string;
  status: 'completed' | 'in_progress' | 'pending';
  alertLevel: ProgressLevel;
  note?: string;
}

export interface ThesisMilestoneSubmission {
  submission_id: number;
  stage_name: string;
  report_file_url: string;
  deadline: string;
  submitted_at: string | null;
  lecturer_feedback: string | null;
  color_warning: 'green' | 'yellow' | 'red';
  status: 'Chờ đánh giá' | 'Đạt' | 'Cần sửa đổi';
}

export interface TurnitinCheckRecord {
  check_id: number;
  file_url: string;
  similarity_score: number;
  status: 'Đạt' | 'Cảnh báo' | 'Không đạt';
  checked_at: string;
}

export interface PublicationRecord {
  publication_id: number;
  paper_title: string;
  journal_name: string;
  issn_isbn: string | null;
  paper_url: string | null;
  ranking: string;
  points: number;
  evidence_file: string;
  status: string;
  admin_note: string | null;
}

export interface LanguageCertRecord {
  cert_id: number;
  cert_type: string;
  score_achieved: string;
  issue_date: string;
  expiry_date: string | null;
  certificate_file_url: string;
  status: string;
}

export interface GatekeeperCheckResult {
  success: boolean;
  studentId: number;
  isEligible: boolean;
  message: string;
  statusBadge: string;
}

export interface CourseClassRecord {
  class_id: number;
  class_name: string;
  max_students: number;
  status: string;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
  registered_count: number;
  semester_id?: number;
  schedule_id?: number | null;
  lecturer_id?: number | null;
  room_name?: string | null;
  day_of_week?: number | null;
  start_shift?: number | null;
  end_shift?: number | null;
  lecturer_name?: string | null;
}

export interface CourseRecord {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  prerequisite_course_id: number | null;
  prerequisite_code: string | null;
  prerequisite_name: string | null;
}

export interface LecturerClassRecord {
  class_id: number;
  class_name: string;
  status: string;
  max_students: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester_id: number;
  semester_name: string;
  room_name: string | null;
  day_of_week: number | null;
  start_shift: number | null;
  end_shift: number | null;
  registered_count: number;
}

export interface LecturerClassStudent {
  registration_id: number;
  student_id: number;
  student_code: string;
  full_name: string;
  email: string;
  grade_id: number | null;
  process_grade: number | null;
  exam_grade: number | null;
  final_grade: number | null;
  is_locked: boolean;
}

export interface AdminTuitionRecord {
  tuition_id: number;
  student_id: number;
  semester_id: number;
  base_amount: number;
  due_date: string;
  paid_amount: number;
  late_penalty_fee: number;
  outstanding_balance: number;
  status: string;
  payment_slip_file: string | null;
  payment_slip_status: 'Chờ xác nhận' | 'Đã xác nhận' | 'Từ chối' | null;
  payment_slip_submitted_at: string | null;
  payment_slip_note: string | null;
  student_code: string;
  student_name: string;
  semester_name: string;
}

export interface StudentRegisteredCourse {
  registration_id: number;
  registered_at: string;
  class_name: string;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
  room_name: string | null;
  day_of_week: number | null;
  start_shift: number | null;
  end_shift: number | null;
  lecturer_name: string | null;
}

export interface StudentGradeRecord {
  grade_id: number;
  process_grade: number | null;
  exam_grade: number | null;
  final_grade: number | null;
  is_locked: boolean;
  course_code: string;
  course_name: string;
  credits: number;
  semester_name: string;
}

export interface StudentTuitionRecord {
  tuition_id: number;
  base_amount: number;
  due_date: string;
  paid_amount: number;
  late_penalty_fee: number;
  outstanding_balance: number;
  status: string;
  semester_name: string;
  payment_slip_file: string | null;
  payment_slip_status: 'Chờ xác nhận' | 'Đã xác nhận' | 'Từ chối' | null;
  payment_slip_submitted_at: string | null;
  payment_slip_note: string | null;
}

export interface StudentPaymentInfo {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branch: string | null;
  qrImageUrl: string | null;
}

export interface StudentDefenseResult {
  defense_schedule_id: number;
  committee_name: string;
  defense_date: string;
  defense_room: string;
  start_time: string;
  defense_order: number;
  average_score: number | null;
  result: string | null;
  members: { role: string; full_name: string; degree: string }[];
  evaluations: {
    role_in_committee: string;
    full_name: string;
    total_score: number;
    feedback: string | null;
  }[];
}

export interface FacultySubmissionRecord {
  submission_id: number;
  thesis_id: number;
  stage_name: string;
  report_file_url: string;
  deadline: string;
  submitted_at: string | null;
  lecturer_feedback: string | null;
  color_warning: 'green' | 'yellow' | 'red';
  submission_status: 'Chờ đánh giá' | 'Đạt' | 'Cần sửa đổi';
  thesis_title: string;
  student_id: number;
  student_code: string;
  student_name: string;
  student_email: string;
  student_phone: string;
}

export interface LecturerCommitteeRecord {
  committee_id: number;
  committee_name: string;
  defense_date: string;
  defense_room: string;
  my_role: string;
  defense_schedule_id: number;
  defense_order: number;
  start_time: string;
  average_score: number | null;
  defense_result: string | null;
  thesis_id: number;
  thesis_title: string;
  student_code: string;
  student_name: string;
  content_score: number | null;
  presentation_score: number | null;
  qa_score: number | null;
  total_score: number | null;
  my_feedback: string | null;
}

export interface CurriculumCourseItem {
  curriculum_course_id: number;
  course_type: 'Bắt buộc' | 'Tự chọn';
  recommended_semester: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  prerequisite_code: string | null;
  prerequisite_name: string | null;
}

export interface AdminOverviewSummary {
  total_profiles: number;
  pending_profiles: number;
  approved_profiles: number;
  need_supplement_profiles: number;
  rejected_profiles: number;
  admitted_profiles: number;
  total_students: number;
  active_students: number;
  graduated_students: number;
  total_lecturers: number;
  total_capacity: number;
  assigned_slots: number;
  total_committees: number;
  total_defense_schedules: number;
  active_theses: number;
}

export interface AdminOverviewMajor {
  major_id: number;
  major_code: string;
  major_name: string;
  student_count: number;
}

export interface AdminOverviewStatus {
  status: string;
  count: number;
}

export interface AdminOverviewLecturerWorkload {
  lecturer_id: number;
  full_name: string;
  degree: string;
  max_slots: number;
  current_assigned: number;
  slots_left: number;
}

export interface AdminOverviewPendingProfile {
  profile_id: number;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  campaign_name: string | null;
}

export interface AdminOverviewPendingDefenseCandidate {
  thesis_id: number;
  thesis_title: string;
  current_stage: string;
  student_id: number;
  student_code: string;
  student_name: string;
}

export interface AdminOverviewRecentLog {
  log_id: string | number;
  user_id: number;
  action: string;
  table_name: string;
  record_id: number | null;
  created_at: string;
  username: string | null;
  user_display_name: string | null;
}

export interface AdminOverviewData {
  summary: AdminOverviewSummary;
  majors: AdminOverviewMajor[];
  admissionStatuses: AdminOverviewStatus[];
  lecturersWorkload: AdminOverviewLecturerWorkload[];
  pendingProfiles: AdminOverviewPendingProfile[];
  pendingDefenseCandidates: AdminOverviewPendingDefenseCandidate[];
  recentLogs: AdminOverviewRecentLog[];
}

export interface AdminStudent {
  student_id: number | string;
  student_code: string;
  academic_status: 'Đang học' | 'Bảo lưu' | 'Đã tốt nghiệp' | 'Buộc thôi học' | 'Đình chỉ' | string;
  enrollment_date: string | null;
  profile_id: number | string;
  full_name: string;
  dob: string | null;
  id_card_number: string;
  phone: string;
  email: string;
  address: string | null;
  undergrad_degree_file: string | null;
  user_id: number | string;
  username: string;
  account_status: 'Active' | 'Inactive' | string;
  cohort: string;
  orientation: string;
  total_credits: number;
  major_id: number;
  major_code: string;
  major_name: string;
  lecturer_name: string | null;
  lecturer_degree: string | null;
  thesis_id: number | string | null;
  thesis_title: string | null;
  current_stage: string | null;
  progress_percent: number | null;
  thesis_status: string | null;
}

