export type TabType = 'home' | 'register' | 'lookup' | 'student' | 'faculty' | 'login' ;

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