import { LoginPage } from './features/auth/LoginPage';
import { useState } from 'react';
import type { AuthUser, RoleCode, TabType } from './types';
import type { AdminSection } from './types';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './features/home/HomePage';
import { RegisterPage } from './features/admission/RegisterPage';
import { ResultLookupPage } from './features/lookup/ResultLookupPage';
import { StudentDashboard } from './features/student/StudentDashboard';
import { StudentProfilePage } from './features/student/StudentProfilePage';
import { FacultyDashboard } from './features/faculty/FacultyDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';

interface AuthSession {
  token: string;
  user: AuthUser;
}

const isRoleCode = (value: unknown): value is RoleCode =>
  value === 'STUDENT' || value === 'LECTURER' || value === 'ADMIN';

const adminSections: Partial<Record<TabType, AdminSection>> = {
  'admin-admissions': 'admissions',
  'admin-committees': 'committees',
  'admin-lecturers': 'lecturers'
};

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === 'object' &&
  value !== null &&
  'userId' in value &&
  (typeof value.userId === 'number' || typeof value.userId === 'string') &&
  'roleId' in value &&
  typeof value.roleId === 'number' &&
  'username' in value &&
  typeof value.username === 'string' &&
  'email' in value &&
  typeof value.email === 'string' &&
  'roleCode' in value &&
  isRoleCode(value.roleCode) &&
  'roleName' in value &&
  typeof value.roleName === 'string' &&
  'displayName' in value &&
  typeof value.displayName === 'string';

const readSession = (): AuthSession | null => {
  const token = localStorage.getItem('agu_token');
  const savedUser = localStorage.getItem('agu_user');
  if (!token || !savedUser) return null;

  try {
    const user: unknown = JSON.parse(savedUser);
    if (!isAuthUser(user)) {
      localStorage.removeItem('agu_token');
      localStorage.removeItem('agu_user');
      return null;
    }
    return { token, user };
  } catch {
    localStorage.removeItem('agu_token');
    localStorage.removeItem('agu_user');
    return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedMajor, setSelectedMajor] = useState<string>('KTPM');
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const activeAdminSection = adminSections[activeTab];

  const allowedTabs: TabType[] = session
    ? session.user.roleCode === 'STUDENT'
      ? ['home', 'student', 'student-profile']
      : session.user.roleCode === 'LECTURER'
        ? ['home', 'faculty']
        : ['home', 'admin-admissions', 'admin-committees', 'admin-lecturers']
    : ['home', 'register', 'lookup', 'login'];

  const handleNavigate = (tab: TabType, majorCode?: string) => {
    if (!allowedTabs.includes(tab)) return;
    if (majorCode) {
      setSelectedMajor(majorCode);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticated = (token: string, user: AuthUser) => {
    localStorage.setItem('agu_token', token);
    localStorage.setItem('agu_user', JSON.stringify(user));
    setSession({ token, user });
    setActiveTab(user.roleCode === 'STUDENT' ? 'student' : user.roleCode === 'LECTURER' ? 'faculty' : 'admin-admissions');
  };

  const handleLogout = () => {
    localStorage.removeItem('agu_token');
    localStorage.removeItem('agu_user');
    setSession(null);
    setActiveTab('home');
  };

  const navigate = (tab: TabType) => handleNavigate(tab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={navigate} user={session?.user ?? null} onLogout={handleLogout} />

      <main className="flex-1 pb-16">
        {activeTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {activeTab === 'register' && allowedTabs.includes('register') && <RegisterPage initialMajorCode={selectedMajor} />}
        {activeTab === 'lookup' && allowedTabs.includes('lookup') && <ResultLookupPage />}
        {activeTab === 'student' && allowedTabs.includes('student') && <StudentDashboard />}
        {activeTab === 'student-profile' && allowedTabs.includes('student-profile') && <StudentProfilePage />}
        {activeTab === 'faculty' && allowedTabs.includes('faculty') && <FacultyDashboard />}
        {activeAdminSection && allowedTabs.includes(activeTab) && (
          <AdminDashboard
            key={activeTab}
            section={activeAdminSection}
          />
        )}
        {activeTab === 'login' && allowedTabs.includes('login') && (
          <LoginPage
            onAuthenticated={handleAuthenticated}
            onNavigateToRegister={() => handleNavigate('register')}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}