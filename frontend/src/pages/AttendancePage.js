import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import StudentAttendance from '../components/student/StudentAttendance';
import TeacherAttendance from '../components/teacher/TeacherAttendance';

const AttendancePage = () => {
  const { user } = useAuth();

  return (
    <Layout title="Attendance">
      {user?.role === 'student' && <StudentAttendance />}
      {(user?.role === 'teacher' || user?.role === 'admin') && <TeacherAttendance />}
    </Layout>
  );
};

export default AttendancePage;
