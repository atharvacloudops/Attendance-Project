import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import StudentDashboard from '../components/student/StudentDashboard';
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'student': return <StudentDashboard />;
      case 'teacher': return <TeacherDashboard />;
      case 'admin':   return <AdminDashboard />;
      default:        return <p>Unknown role</p>;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default DashboardPage;
