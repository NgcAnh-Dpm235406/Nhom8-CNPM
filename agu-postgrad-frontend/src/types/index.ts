export type AdminSection = 'admissions' | 'committees' | 'lecturers';
export type TabType =
  | 'home'
  | 'register'
  | 'lookup'
  | 'student'
  | 'faculty'
  | 'admin-admissions'
  | 'admin-committees'
  | 'admin-lecturers'
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