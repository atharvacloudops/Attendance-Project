import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AttendancePage from './pages/AttendancePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Timetable Components ✅
import TimetableManager from './components/admin/TimetableManager';
import StudentTimetable from './components/student/StudentTimetable';

// New Teacher Components
import TeacherStudentsList from './components/teacher/TeacherStudentsList';
import TeacherDefaulters from './components/teacher/TeacherDefaulters';
import TeacherAbsentees from './components/teacher/TeacherAbsentees';
import TeacherStudyMaterial from './components/teacher/TeacherStudyMaterial';
import TeacherTimetableManager from './components/teacher/TeacherTimetableManager';

// New Student Components
import StudentClasses from './components/student/StudentClasses';
import StudentStudyMaterial from './components/student/StudentStudyMaterial';

// Shared
import LoadingScreen from './components/shared/LoadingScreen';
import Chatbot from './components/chat/Chatbot';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// ─── App Router ───────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* Protected routes */}
    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
    <Route path="/admin"     element={<PrivateRoute roles={['admin']}><AdminPage /></PrivateRoute>} />

     {/* ✅ Timetable Routes */}
    <Route 
      path="/timetable" 
      element={
        <PrivateRoute roles={['student', 'teacher']}>
          <TimetableRouter />
        </PrivateRoute>
      } 
    />

    {/* New Teacher Routes */}
    <Route path="/teacher/students" element={<PrivateRoute roles={['teacher']}><TeacherStudentsList /></PrivateRoute>} />
    <Route path="/teacher/defaulters" element={<PrivateRoute roles={['teacher']}><TeacherDefaulters /></PrivateRoute>} />
    <Route path="/teacher/absentees" element={<PrivateRoute roles={['teacher']}><TeacherAbsentees /></PrivateRoute>} />
    <Route path="/teacher/materials" element={<PrivateRoute roles={['teacher']}><TeacherStudyMaterial /></PrivateRoute>} />

    {/* New Student Routes */}
    <Route path="/student/classes" element={<PrivateRoute roles={['student']}><StudentClasses /></PrivateRoute>} />
    <Route path="/student/materials" element={<PrivateRoute roles={['student']}><StudentStudyMaterial /></PrivateRoute>} />

    <Route 
      path="/admin/timetable" 
      element={
        <PrivateRoute roles={['admin']}>
          <TimetableManager />
        </PrivateRoute>
      } 
    />

    {/* Redirects */}
    <Route path="/"    element={<Navigate to="/dashboard" replace />} />
    <Route path="*"    element={<NotFoundPage />} />
  </Routes>
);

// ─── Timetable Router (Role Based) ────────────────────────────────────────────
const TimetableRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <TeacherTimetableManager />;
  return <StudentTimetable />;
};

const GlobalChatbot = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <Chatbot />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
      <GlobalChatbot />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f1f5f9',
            border: '1px solid #1e293b',
            fontFamily: "'Space Grotesk', sans-serif",
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
        }}
      />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
